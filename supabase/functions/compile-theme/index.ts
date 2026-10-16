import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as Babel from "https://esm.sh/@babel/standalone@7.23.10";
import { corsHeaders } from "../_shared/cors.ts";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const SOURCE_FILE = /\.(tsx|ts|jsx|js)$/;
const MAX_FILES = 100;
const MAX_FILE_BYTES = 300_000;
const MAX_TOTAL_BYTES = 2_000_000;

// Keep in sync with src/lib/theme-runtime/modules.ts
const ALLOWED_MODULES = new Set([
  "react", "react-dom", "@ucp/sdk", "@/lib/utils", "framer-motion", "recharts", "date-fns",
  "canvas-confetti", "react-router-dom", "lucide-react",
  ...["accordion", "avatar", "badge", "button", "card", "carousel", "checkbox", "dialog", "input", "label",
    "select", "separator", "skeleton", "slider", "switch", "tabs", "textarea"].map((n) => `@/components/ui/${n}`),
]);

// Reviewer aid, not a sandbox: patterns that deserve a human look before approval.
const RISKY: Array<[RegExp, string]> = [
  [/\beval\s*\(/, "eval()"],
  [/new\s+Function\s*\(/, "new Function()"],
  [/\bdocument\.cookie\b/, "document.cookie"],
  [/\blocalStorage\b|\bsessionStorage\b/, "web storage access"],
  [/\bfetch\s*\(|XMLHttpRequest|navigator\.sendBeacon|new\s+WebSocket/, "network request"],
  [/\bwindow\.(parent|top|opener)\b|\bpostMessage\s*\(/, "cross-window messaging"],
  [/\bimport\s*\(/, "dynamic import"],
  [/\bsupabase\b/i, "direct database access"],
  [/dangerouslySetInnerHTML/, "raw HTML injection"],
  [/\bdocument\.write\b|\.innerHTML\s*=/, "raw DOM writes"],
];

function importsOf(source: string): string[] {
  const out: string[] = [];
  const re = /(?:import|export)\s+(?:type\s+)?(?:[^'"()]*?\sfrom\s+)?['"]([^'"]+)['"]|require\(\s*['"]([^'"]+)['"]\s*\)/g;
  for (const m of source.matchAll(re)) {
    if (/^(import|export)\s+type\s/.test(m[0])) continue; // erased at compile time
    out.push(m[1] ?? m[2]);
  }
  return out;
}

const stripExt = (n: string) => n.replace(/\.(tsx|jsx|ts|js)$/, "");

async function sha256Hex(text: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Stores the bundle at <theme>/<sha256>.json in a public bucket so browsers can cache it forever. Returns null if storage is unavailable. */
async function publishBundle(admin: any, themeId: string, bundle: Record<string, string>): Promise<string | null> {
  try {
    const body = JSON.stringify(bundle);
    const hash = await sha256Hex(body);
    const { error } = await admin.storage
      .from("theme-bundles")
      .upload(`${themeId}/${hash}.json`, new Blob([body], { type: "application/json" }), { contentType: "application/json", cacheControl: "31536000", upsert: true });
    if (error) throw error;
    return hash;
  } catch (error) {
    console.error("publishBundle", error);
    return null;
  }
}

function resolveRelative(from: string, spec: string): string {
  const parts = from.split("/").slice(0, -1);
  for (const seg of spec.split("/")) {
    if (seg === "" || seg === ".") continue;
    if (seg === "..") parts.pop();
    else parts.push(seg);
  }
  return stripExt(parts.join("/"));
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed." }, 405);

  try {
    const token = req.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) return json({ error: "Authentication required." }, 401);

    const admin = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");
    const { data: caller } = await admin.auth.getUser(token);
    if (!caller.user) return json({ error: "Authentication failed." }, 401);

    const { data: profile } = await admin.from("actors").select("id, role").eq("user_id", caller.user.id).maybeSingle();
    if (profile?.role !== "admin") return json({ error: "Permission denied." }, 403);

    const { theme_id, action = "approve", reason, acknowledgeFindings } = await req.json();

    if (action === "backfill") {
      // Give every approved version without a hash its immutable bundle object.
      const { data: rows, error } = await admin
        .from("marketplace_theme_versions")
        .select("id, theme_id, compiled_bundle")
        .eq("status", "approved")
        .is("bundle_hash", null)
        .not("compiled_bundle", "is", null)
        .limit(200);
      if (error) throw error;
      let published = 0;
      for (const row of rows ?? []) {
        const hash = await publishBundle(admin, row.theme_id, row.compiled_bundle);
        if (hash) {
          await admin.from("marketplace_theme_versions").update({ bundle_hash: hash }).eq("id", row.id);
          published++;
        }
      }
      return json({ success: true, published, remaining: (rows?.length ?? 0) - published });
    }

    if (typeof theme_id !== "string" || !["approve", "reject", "analyze"].includes(action)) {
      return json({ error: "Invalid request." }, 400);
    }

    const { data: theme, error: fetchError } = await admin.from("marketplace_themes").select("files, status").eq("id", theme_id).single();
    if (fetchError || !theme) return json({ error: "Theme not found." }, 404);

    // Review the immutable snapshot that was submitted, never the developer's working copy.
    // 42P01/PGRST205 = versions table not migrated yet: fall back to the working copy.
    const { data: pending, error: versionError } = await admin
      .from("marketplace_theme_versions")
      .select("id, version, files")
      .eq("theme_id", theme_id)
      .eq("status", "pending")
      .order("version", { ascending: false })
      .limit(1)
      .maybeSingle();
    const versioned = !["42P01", "PGRST205"].includes(versionError?.code ?? "");
    if (versioned && versionError) throw versionError;
    if (versioned && !pending) return json({ error: "There is no submitted version to review." }, 409);

    if (action === "reject") {
      const stamp = { reviewed_at: new Date().toISOString(), reviewed_by: profile.id };
      const note = String(reason ?? "").slice(0, 1000) || null;
      if (pending) {
        const { error } = await admin.from("marketplace_theme_versions").update({ status: "rejected", rejection_reason: note, ...stamp }).eq("id", pending.id);
        if (error) throw error;
      }
      let { error } = await admin.from("marketplace_themes").update({ status: "rejected", rejection_reason: note, ...stamp }).eq("id", theme_id);
      if (error?.code === "42703") ({ error } = await admin.from("marketplace_themes").update({ status: "rejected" }).eq("id", theme_id));
      if (error) throw error;
      return json({ success: true });
    }

    // --- analyze / approve: validate and compile every source file ---
    const files = ((pending?.files ?? theme.files) ?? {}) as Record<string, string>;
    const names = Object.keys(files).filter((f) => SOURCE_FILE.test(f));
    const problems: string[] = [];
    const findings: string[] = [];

    if (names.length === 0) problems.push("The theme has no source files.");
    if (names.length > MAX_FILES) problems.push(`Too many files (max ${MAX_FILES}).`);
    let total = 0;
    const known = new Set(names.map(stripExt));

    const bundle: Record<string, string> = {};
    for (const name of names) {
      const source = String(files[name] ?? "");
      total += source.length;
      if (source.length > MAX_FILE_BYTES) {
        problems.push(`${name}: file is larger than ${MAX_FILE_BYTES / 1000} KB.`);
        continue;
      }
      for (const spec of importsOf(source)) {
        if (spec.startsWith(".")) {
          if (!known.has(resolveRelative(name, spec))) problems.push(`${name}: cannot resolve "${spec}".`);
        } else if (!ALLOWED_MODULES.has(spec)) {
          problems.push(`${name}: module "${spec}" is not allowed.`);
        }
      }
      for (const [pattern, label] of RISKY) if (pattern.test(source)) findings.push(`${name}: ${label}`);

      try {
        const out = Babel.transform(source, { presets: ["react", "env", "typescript"], filename: name, minified: true });
        if (out?.code) bundle[stripExt(name)] = out.code;
      } catch (error) {
        problems.push(`${name}: ${(error as Error).message}`);
      }
    }
    if (total > MAX_TOTAL_BYTES) problems.push("The theme is larger than 2 MB.");

    const version = pending?.version ?? null;
    if (action === "analyze" || problems.length > 0) {
      return json({ success: problems.length === 0, problems, findings, files: names.length, version });
    }
    if (findings.length > 0 && !acknowledgeFindings) {
      return json({ success: false, needsAcknowledgement: true, findings, problems, version }, 409);
    }

    const stamp = { reviewed_at: new Date().toISOString(), reviewed_by: profile.id };
    const bundleHash = await publishBundle(admin, theme_id, bundle);
    if (pending) {
      const { error } = await admin
        .from("marketplace_theme_versions")
        .update({ status: "approved", compiled_bundle: bundle, bundle_hash: bundleHash, rejection_reason: null, ...stamp })
        .eq("id", pending.id);
      if (error) throw error;
    }

    const update: Record<string, unknown> = { compiled_bundle: bundle, status: "approved", rejection_reason: null, ...stamp };
    if (version !== null) update.published_version = version;
    let { error } = await admin.from("marketplace_themes").update(update).eq("id", theme_id);
    if (error?.code === "42703") ({ error } = await admin.from("marketplace_themes").update({ compiled_bundle: bundle, status: "approved" }).eq("id", theme_id));
    if (error) throw error;

    return json({ success: true, message: "Theme compiled and approved.", files: Object.keys(bundle).length, findings, version });
  } catch (error) {
    console.error("compile-theme", error);
    return json({ error: "Compilation failed." }, 500);
  }
});
