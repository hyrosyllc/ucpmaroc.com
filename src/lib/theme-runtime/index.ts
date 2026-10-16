import { loadBundle, type LoadedBundle } from "./loader";
import { React, resolveThemeModule } from "./modules";
import { normalizeSchema } from "./schema";
import type { ContentField } from "@/features/portfolio-builder/sections/schema";

export { ALLOWED_THEME_MODULES } from "./modules";
export { stripExtension } from "./loader";
export { normalizeSchema, schemaDefaults } from "./schema";
export { sectionTypeForFile, componentKeyForType } from "./sectionTypes";

export interface CompiledTheme extends LoadedBundle {
  /** Normalised design-setting schemas keyed by component name. */
  normalizedSchemas: Record<string, ContentField[]>;
}

/** Evaluates a compiled theme bundle with the platform module allowlist. */
export function loadThemeBundle(bundle: Record<string, string> | null | undefined): CompiledTheme {
  const loaded = loadBundle(bundle ?? {}, resolveThemeModule, React);
  const normalizedSchemas: Record<string, ContentField[]> = {};
  for (const [name, raw] of Object.entries(loaded.schemas)) normalizedSchemas[name] = normalizeSchema(raw);
  return { ...loaded, normalizedSchemas };
}
