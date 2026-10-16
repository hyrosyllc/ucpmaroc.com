import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/supabaseClient";
import { DEFAULT_THEME, THEME_REGISTRY } from "@/themes/registry";
import { loadThemeBundle, type CompiledTheme } from "@/lib/theme-runtime";

export interface ActiveTheme {
  /** Component map in the same shape as a built-in theme; missing sections fall back to Modern. */
  theme: any;
  isCustom: boolean;
  isLoading: boolean;
  /** Load failure or per-file evaluation errors, for builder/Studio diagnostics. */
  error: string | null;
  compiled: CompiledTheme | null;
}

type Bundle = Record<string, string>;

/** Immutable, content-addressed bundle object: cached by the browser/CDN for a year and verified by its hash. */
async function fetchHashed(themeId: string, hash: string): Promise<Bundle | null> {
  try {
    const { data } = supabase.storage.from("theme-bundles").getPublicUrl(`${themeId}/${hash}.json`);
    const response = await fetch(data.publicUrl);
    return response.ok ? ((await response.json()) as Bundle) : null;
  } catch {
    return null;
  }
}

async function fetchBundle(themeId: string, version?: number | null): Promise<{ bundle: Bundle | null; version: string | null }> {
  // A site may pin an approved version; otherwise the published version is served.
  if (version) {
    const pinned = await supabase.from("marketplace_theme_versions_public").select("bundle_hash").eq("theme_id", themeId).eq("version", version).maybeSingle();
    if (!pinned.error && pinned.data?.bundle_hash) {
      const bundle = await fetchHashed(themeId, pinned.data.bundle_hash);
      if (bundle) return { bundle, version: pinned.data.bundle_hash };
    }
    const inline = await supabase.from("marketplace_theme_versions_public").select("compiled_bundle").eq("theme_id", themeId).eq("version", version).maybeSingle();
    if (!inline.error && inline.data?.compiled_bundle) return { bundle: inline.data.compiled_bundle, version: `v${version}` };
  }

  // Published version: try the hashed object first (small metadata query, then a cacheable file).
  const meta = await supabase.from("marketplace_themes_public").select("bundle_hash, updated_at").eq("id", themeId).maybeSingle();
  if (!meta.error && meta.data?.bundle_hash) {
    const bundle = await fetchHashed(themeId, meta.data.bundle_hash);
    if (bundle) return { bundle, version: meta.data.bundle_hash };
  }

  // Fallback: inline bundle (themes approved before hashing, or storage unavailable).
  const view = await supabase.from("marketplace_themes_public").select("compiled_bundle, updated_at").eq("id", themeId).maybeSingle();
  if (!view.error) return { bundle: view.data?.compiled_bundle ?? null, version: view.data?.updated_at ?? null };

  const table = await supabase.from("marketplace_themes").select("compiled_bundle, updated_at").eq("id", themeId).maybeSingle();
  if (table.error) throw table.error;
  return { bundle: table.data?.compiled_bundle ?? null, version: table.data?.updated_at ?? null };
}

/**
 * Resolves a theme id to a renderable theme: built-in registry entry, or an approved marketplace theme
 * whose precompiled bundle is evaluated once and cached.
 */
export function useActiveTheme(themeId?: string | null, pinnedVersion?: number | null): ActiveTheme {
  const builtIn = themeId ? THEME_REGISTRY[themeId] : undefined;
  const isCustom = !!themeId && !builtIn;

  const query = useQuery({
    queryKey: ["themeBundle", themeId, pinnedVersion ?? null],
    queryFn: () => fetchBundle(themeId!, pinnedVersion),
    enabled: isCustom,
    staleTime: 5 * 60_000,
  });

  const compiled = useMemo(
    () => (isCustom && query.data?.bundle ? loadThemeBundle(query.data.bundle) : null),
    [isCustom, query.data?.bundle, query.data?.version]
  );

  const theme = useMemo(() => {
    if (builtIn) return builtIn;
    if (!compiled) return DEFAULT_THEME;
    return { ...compiled.components, schemas: compiled.normalizedSchemas };
  }, [builtIn, compiled]);

  const errors = compiled ? Object.entries(compiled.errors) : [];
  const error = query.error
    ? (query.error as Error).message
    : isCustom && !query.isLoading && !query.data?.bundle
      ? "This theme has no published version."
      : errors.length
        ? errors.map(([file, message]) => `${file}: ${message}`).join("\n")
        : null;

  return { theme, isCustom, isLoading: isCustom && query.isLoading, error, compiled };
}
