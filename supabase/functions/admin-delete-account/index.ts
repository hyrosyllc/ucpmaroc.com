import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

interface RequestBody {
  accountId: string;
  accountType: "actor" | "client";
}

const json = (body: unknown, status: number, origin: string | null) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(origin), "Content-Type": "application/json" },
  });

const removeAccountFiles = async (supabaseAdmin: ReturnType<typeof createClient>, ids: string[]) => {
  for (const bucket of ["avatars", "demos", "recordings", "portfolio-assets", "project-materials"]) {
    for (const prefix of ids) {
      const { data: files, error: listError } = await supabaseAdmin.storage.from(bucket).list(prefix);
      if (listError) {
        if (listError.message.toLowerCase().includes("not found")) continue;
        throw listError;
      }
      if (files?.length) {
        const { error: removeError } = await supabaseAdmin.storage
          .from(bucket)
          .remove(files.map((file) => `${prefix}/${file.name}`));
        if (removeError) throw removeError;
      }
    }
  }
};

serve(async (req) => {
  const origin = req.headers.get("Origin");
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(origin) });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405, origin);

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );
    const token = req.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) return json({ error: "Authentication required" }, 401, origin);

    const { data: callerData, error: callerError } = await supabaseAdmin.auth.getUser(token);
    if (callerError || !callerData.user) return json({ error: "Authentication failed" }, 401, origin);

    const { data: adminProfile, error: adminError } = await supabaseAdmin
      .from("actors")
      .select("role")
      .eq("user_id", callerData.user.id)
      .maybeSingle();
    if (adminError || adminProfile?.role !== "admin") {
      return json({ error: "Permission denied" }, 403, origin);
    }

    const body = (await req.json()) as Partial<RequestBody>;
    if (!body.accountId || !["actor", "client"].includes(body.accountType ?? "")) {
      return json({ error: "accountId and accountType are required" }, 400, origin);
    }

    const table = body.accountType === "actor" ? "actors" : "clients";
    const targetSelect = body.accountType === "actor" ? "id, user_id, role" : "id, user_id";
    const { data: target, error: targetError } = await supabaseAdmin
      .from(table)
      .select(targetSelect)
      .eq("id", body.accountId)
      .maybeSingle();

    if (targetError) throw targetError;
    if (!target) return json({ error: "Account not found" }, 404, origin);
    if (target.user_id === callerData.user.id) return json({ error: "You cannot delete your own admin account" }, 409, origin);
    if (body.accountType === "actor" && target.role === "admin") {
      return json({ error: "Admin accounts cannot be deleted from this action" }, 409, origin);
    }

    await removeAccountFiles(supabaseAdmin, [target.id, target.user_id]);

    const { error: cleanupError } = await supabaseAdmin.rpc("delete_account_data", {
      p_account_id: target.id,
      p_account_type: body.accountType,
      p_auth_user_id: target.user_id,
    });
    if (cleanupError) throw cleanupError;

    const { error: auditError } = await supabaseAdmin.from("account_deletion_audit").insert({
      admin_user_id: callerData.user.id,
      target_account_id: target.id,
      target_auth_user_id: target.user_id,
      account_type: body.accountType,
    });
    if (auditError) throw auditError;

    const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(target.user_id);
    if (authDeleteError) throw authDeleteError;

    return json({ success: true, accountId: target.id, accountType: body.accountType }, 200, origin);
  } catch (error) {
    console.error("admin-delete-account failed", error);
    return json({ error: error instanceof Error ? error.message : "Account deletion failed" }, 500, origin);
  }
});
