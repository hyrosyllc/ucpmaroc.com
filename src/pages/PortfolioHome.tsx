// src/pages/PortfolioHome.tsx

import React from "react";
import { useOutletContext } from "react-router-dom";
import { PortfolioSection } from "../types/portfolio";
import { cn, hexToHSL } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  THEME_REGISTRY,
  DEFAULT_THEME,
  resolveThemeComponent,
} from "../themes/registry";

// 🚀 THE NEW CUSTOM LOADER SYSTEM
export const CustomLoader = ({ themeConfig, type = "page" }: { themeConfig?: any, type?: "page" | "block" }) => {
  const style = themeConfig?.loaderStyle || 'skeleton';
  const text = themeConfig?.loaderText || '';

  if (style === 'spinner') {
    return (
      <div className={cn("flex flex-col items-center justify-center gap-4 w-full", type === "page" ? "min-h-screen" : "py-24")}>
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        {text && <p className="text-sm text-muted-foreground font-medium animate-pulse">{text}</p>}
      </div>
    );
  }

  if (style === 'pulse') {
    return (
      <div className={cn("flex flex-col items-center justify-center gap-6 w-full", type === "page" ? "min-h-screen" : "py-24")}>
        <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center animate-pulse ring-4 ring-primary/10">
           <div className="w-6 h-6 bg-primary rounded-full animate-ping" />
        </div>
        {text && <p className="text-sm text-primary font-bold tracking-widest uppercase animate-pulse">{text}</p>}
      </div>
    );
  }

  // Default: skeleton
  if (type === "block") {
    return (
      <div className="py-24 px-8 max-w-5xl mx-auto space-y-4 w-full animate-in fade-in">
        <Skeleton className="h-10 w-1/3 rounded-lg mx-auto mb-8" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 md:p-16 space-y-8 animate-in fade-in duration-500 w-full">
      <div className="flex justify-between items-center mb-16">
         <Skeleton className="h-10 w-32 rounded-lg" />
         <Skeleton className="h-10 w-48 rounded-lg hidden md:block" />
      </div>
      <div className="space-y-6 max-w-4xl mx-auto text-center">
        <Skeleton className="h-16 md:h-24 w-3/4 mx-auto rounded-xl" />
        <Skeleton className="h-6 md:h-8 w-1/2 mx-auto rounded-lg" />
        <Skeleton className="h-12 w-40 mx-auto rounded-full mt-8" />
      </div>
    </div>
  );
};

// 🚀 1. EXPORT COLOR_PALETTES AND THEME_WRAPPER
// We export these so your new PortfolioLayout can import and use them!
export const COLOR_PALETTES = [
  { id: "violet", value: "#8b5cf6" },
  { id: "blue", value: "#3b82f6" },
  { id: "emerald", value: "#10b981" },
  { id: "rose", value: "#f43f5e" },
  { id: "amber", value: "#f59e0b" },
  { id: "slate", value: "#64748b" },
  { id: "black", value: "#000000" },
];

export const ThemeWrapper = ({
  children,
  theme,
}: {
  children: React.ReactNode;
  theme: any;
}) => {
  const fontClass =
    theme?.font === "serif"
      ? "font-serif"
      : theme?.font === "mono"
      ? "font-mono"
      : "font-sans";

  const activeColorObj =
    COLOR_PALETTES.find((c) => c.id === theme?.primaryColor) ||
    COLOR_PALETTES[0];
  const primaryHSL = hexToHSL(activeColorObj.value);
  const radiusVal = theme?.radius !== undefined ? theme.radius : 0.5;

  const style = {
    "--primary": primaryHSL,
    "--ring": primaryHSL,
    "--radius": `${radiusVal * 2}rem`,
  } as React.CSSProperties;

  // 🚀 MAGIC THEME CHECK: If it's Modern or Cinematic, force AAA+ Dark Mode globally!
  const isDarkTheme =
    !theme?.templateId ||
    theme?.templateId === "modern" ||
    theme?.templateId === "cinematic";

  return (
    <div
      className={cn(
        "min-h-screen flex flex-col w-full subpixel-antialiased",
        isDarkTheme
          ? "bg-neutral-950 text-white"
          : "bg-background text-foreground",
        fontClass
      )}
      data-theme={theme?.templateId}
      data-btn-style={theme?.buttonStyle || "solid"}
      style={style}
    >
      {children}
    </div>
  );
};

interface PortfolioHomeProps {
  editorData?: any;
  isPreview?: boolean;
}

const PortfolioHome: React.FC<PortfolioHomeProps> = ({
  editorData,
  isPreview = false,
}) => {
  // 🚀 2. SMART DATA FETCHING
  // If in builder mode, use editorData. If live site, grab from PortfolioLayout!
  let outletContext: any = null;
  try {
    outletContext = useOutletContext();
  } catch (e) {
    // Ignore error if rendered outside of a router (like in the builder iframe)
  }

  const portfolio = isPreview
    ? editorData
    : outletContext?.portfolio || editorData;

  if (!portfolio) {
    return <CustomLoader themeConfig={{}} type="page" />;
  }

  const sections = portfolio.sections as PortfolioSection[];
  const themeId = portfolio.theme_config?.templateId || "modern";
  const ActiveTheme = THEME_REGISTRY[themeId] || DEFAULT_THEME;

  // 🚀 3. RENDER THE SECTIONS
  const content = (
    <>
      {sections
        .filter((section) => {
          if (!section.isVisible) return false;

          // 🚀 THE MAGIC SWITCH:
          // On the LIVE site, PortfolioLayout renders the header and footer. So hide them here!
          // In the BUILDER preview, we MUST render them so the user can edit them.
          if (
            !isPreview &&
            section.type === "header" //|| section.type === "footer"
          ) {
            return false;
          }
          return true;
        })
        .map((section) => {
          const Component = resolveThemeComponent(ActiveTheme, section.type);

          if (!Component) {
            if (isPreview) {
              return (
                <div
                  key={section.id}
                  className="p-4 text-center text-red-500 font-mono text-sm bg-red-50"
                >
                  Missing Component: {section.type}
                </div>
              );
            }
            return null;
          }

          const zIndexClass =
            section.type === "header" ? "relative z-50" : "relative z-0";

          const sectionProps = {
            data: section.data,
            settings: section.settings || {},
            id: section.id,
            allSections: sections,
            isPreview: isPreview,
            actorId: portfolio.actor_id,
            portfolioId: portfolio.id,
          };

          return (
            <div
              id={section.id}
              key={section.id}
              className={cn("scroll-mt-20", zIndexClass)}
            >
              <React.Suspense
                fallback={
                  <CustomLoader themeConfig={portfolio.theme_config} type="block" />
                }
              >
                <Component {...sectionProps} />
              </React.Suspense>
            </div>
          );
        })}
    </>
  );

  // 🚀 4. BUILDER FALLBACK
  // If we are in the builder, PortfolioLayout isn't wrapping us, so we must apply the ThemeWrapper here!
  if (isPreview) {
    return (
      <ThemeWrapper theme={portfolio.theme_config}>{content}</ThemeWrapper>
    );
  }

  // On the live site, PortfolioLayout already applied the ThemeWrapper and Helmet, so just return the raw content!
  return content;
};

export default PortfolioHome;
