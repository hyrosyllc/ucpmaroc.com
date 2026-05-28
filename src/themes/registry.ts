// src/themes/registry.ts

import { PortfolioThemeDefinition } from "./types";
import { ModernTheme } from "./modern";
import { ModernBrightTheme } from "./modern-bright";
import { CinematicTheme } from "./cinematic";
import { CupertinoTheme } from "./cupertino";

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
  header: "Header",
  hero: "Hero",
  about: "About",
  shop: "Shop",
  dynamic_store: "DynamicStore",
  services_showcase: "ServicesShowcase",
  gallery: "Gallery",
  image_slider: "ImageSlider",
  video_slider: "VideoSlider",
  stats: "Stats",
  reviews: "Reviews",
  contact: "Contact",
  team: "Team",
  pricing: "Pricing",
  lead_form: "LeadForm",
  map: "Map",
  Reviews: "Reviews",
  html: "Html",
};

// 3. NEW: Safe Resolver Helper
// This function safely looks up the component and prevents crashes.
export const resolveThemeComponent = (theme: any, sectionType: string) => {
  const componentKey = SECTION_COMPONENT_MAP[sectionType];
  if (!componentKey) return null;
  return theme[componentKey] || null;
};
