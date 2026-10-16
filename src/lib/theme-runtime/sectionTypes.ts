import { SECTION_LIST } from "@/features/portfolio-builder/sections/registry";
import { stripExtension } from "./loader";

const baseName = (file: string) => stripExtension(file.split("/").pop() ?? file);

/** "Hero.tsx" -> "hero", "RichText.tsx" -> "rich_text"; unknown names fall back to snake_case. */
export function sectionTypeForFile(file: string): string {
  const name = baseName(file);
  const def = SECTION_LIST.find((d) => d.componentKey === name);
  if (def) return def.type;
  return name.replace(/[A-Z]/g, (c, i) => (i === 0 ? c.toLowerCase() : `_${c.toLowerCase()}`));
}

/** Component name a theme must export for a section type, e.g. "rich_text" -> "RichText". */
export function componentKeyForType(type: string): string | undefined {
  return SECTION_LIST.find((d) => d.type === type)?.componentKey;
}
