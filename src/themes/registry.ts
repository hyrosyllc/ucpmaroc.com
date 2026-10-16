// src/themes/registry.ts

import { PortfolioThemeDefinition } from "./types";
import { ModernTheme } from "./modern";
import { ModernBrightTheme } from "./modern-bright";
import { CinematicTheme } from "./cinematic";
import { CupertinoTheme } from "./cupertino";
import { SECTION_LIST } from "@/features/portfolio-builder/sections/registry";

// 1. Existing Theme Map
export const THEME_REGISTRY: Record<string, PortfolioThemeDefinition> = {
  modern: ModernTheme,
  modern_bright: ModernBrightTheme,
  cinematic: CinematicTheme,
  cupertino: CupertinoTheme,
};

export const DEFAULT_THEME = ModernTheme;

// 2. NEW: AAA+ Explicit Component Map
// This completely replaces the brittle Regex string manipulation.
export const SECTION_COMPONENT_MAP: Record<string, string> = {
  ...Object.fromEntries(SECTION_LIST.map((d) => [d.type, d.componentKey])),
  Reviews: "Reviews", // legacy capitalised type
};

// 3. NEW: Safe Resolver Helper
// This function safely looks up the component and prevents crashes.
export const resolveThemeComponent = (theme: any, sectionType: string) => {
  const componentKey = SECTION_COMPONENT_MAP[sectionType];
  if (!componentKey) return null;
  // A theme without this section falls back to Modern instead of dropping it.
  return theme[componentKey] || (ModernTheme as any)[componentKey] || null;
};
