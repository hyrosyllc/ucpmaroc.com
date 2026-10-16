import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";
import type { ContentSchema } from "./schema";

/** Layout controls shared by every section, stored flat in `section.settings`. */
export const COMMON_SETTINGS_SCHEMA: ContentSchema = [
  { id: "common_paddingTop", label: "Top spacing (px)", type: "slider", min: 0, max: 240, step: 8 },
  { id: "common_paddingBottom", label: "Bottom spacing (px)", type: "slider", min: 0, max: 240, step: 8 },
  { id: "common_background", label: "Background colour", type: "color" },
  {
    id: "common_width",
    label: "Content width",
    type: "select",
    defaultValue: "full",
    options: [
      { value: "full", label: "Full width" },
      { value: "wide", label: "Wide" },
      { value: "narrow", label: "Narrow" },
    ],
  },
  { id: "common_hideMobile", label: "Hide on mobile", type: "toggle" },
  { id: "common_hideDesktop", label: "Hide on desktop", type: "toggle" },
  {
    id: "common_animation",
    label: "Entrance animation",
    type: "select",
    defaultValue: "none",
    options: [
      { value: "none", label: "None" },
      { value: "fade", label: "Fade in" },
      { value: "slide-up", label: "Slide up" },
    ],
  },
  { id: "common_anchor", label: "Anchor ID", type: "text", placeholder: "pricing", help: "Link to this section with #anchor." },
];

const WIDTH_CLASS: Record<string, string> = {
  wide: "mx-auto w-full max-w-6xl",
  narrow: "mx-auto w-full max-w-3xl",
};

const ANIMATION_CLASS: Record<string, string> = {
  fade: "animate-in fade-in duration-700",
  "slide-up": "animate-in fade-in slide-in-from-bottom-4 duration-700",
};

/** Class names and inline style that apply the shared controls to a section wrapper. */
export function getSectionFrame(settings?: Record<string, any>): { className: string; style: CSSProperties } {
  const s = settings || {};
  const style: CSSProperties = {};
  if (typeof s.common_paddingTop === "number") style.paddingTop = s.common_paddingTop;
  if (typeof s.common_paddingBottom === "number") style.paddingBottom = s.common_paddingBottom;
  if (s.common_background) style.backgroundColor = s.common_background;

  return {
    className: cn(
      WIDTH_CLASS[s.common_width],
      ANIMATION_CLASS[s.common_animation],
      s.common_hideMobile && "hidden md:block",
      s.common_hideDesktop && "md:hidden"
    ),
    style,
  };
}

/** Sanitised anchor id, or undefined when unset or invalid. */
export function getSectionAnchor(settings?: Record<string, any>): string | undefined {
  const raw = settings?.common_anchor;
  return typeof raw === "string" && /^[A-Za-z][\w-]*$/.test(raw) ? raw : undefined;
}
