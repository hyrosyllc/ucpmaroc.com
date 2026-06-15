import React, { useEffect, useMemo } from "react";
import { Outlet, useParams, useLocation } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Loader2 } from "lucide-react";

import { usePortfolio } from "@/features/portfolio-builder";
import { trackEvent } from "@/lib/analytics";
import {
  THEME_REGISTRY,
  DEFAULT_THEME,
  resolveThemeComponent,
} from "@/themes/registry";

import CartDrawerContainer from "@/features/ecommerce/components/CartDrawerContainer";
import { useBuilderStore } from "@/store/useBuilderStore";
import { cn } from "@/lib/utils";

// --- Helper to convert HEX to HSL for Tailwind ---
function hexToHSLString(hex: string): string {
  hex = hex.replace(/^#/, "");
  let r = parseInt(hex.substring(0, 2), 16) / 255;
  let g = parseInt(hex.substring(2, 4), 16) / 255;
  let b = parseInt(hex.substring(4, 6), 16) / 255;

  let max = Math.max(r, g, b),
    min = Math.min(r, g, b);
  let h = 0,
    s = 0,
    l = (max + min) / 2;

  if (max !== min) {
    let d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(
    l * 100
  )}%`;
}

interface PortfolioLayoutProps {
  customDomain?: string;
}

export default function PortfolioLayout({
  customDomain,
}: PortfolioLayoutProps) {
  const { slug } = useParams<{ slug: string }>();
  const location = useLocation();

  // 🚀 1. DETECT IF WE ARE IN THE BUILDER
  // If the URL is exactly "/builder-preview", we are inside the iframe!
  const isBuilderPreview = location.pathname === "/builder-preview";

  // 🚀 2. FETCH DATA (Only if we are NOT in the builder)
  const { data, isLoading, isError } = usePortfolio({
    slug: isBuilderPreview ? undefined : slug,
    customDomain: isBuilderPreview ? undefined : customDomain,
  });

  // 🚀 3. GET ZUSTAND STORE DATA (Only matters if we ARE in the builder)
  const builderStore = useBuilderStore();

  // --- ANALYTICS TRACKING (Only run on live site) ---
  useEffect(() => {
    if (!isBuilderPreview && data?.portfolio && data.portfolio.actor_id) {
      const sessionKey = `viewed_${
        data.portfolio.id
      }_${new Date().toDateString()}`;
      if (!sessionStorage.getItem(sessionKey)) {
        trackEvent(data.portfolio.actor_id, "page_view", {
          portfolio_id: data.portfolio.id,
        });
        sessionStorage.setItem(sessionKey, "true");
      }
    }
  }, [data, isBuilderPreview]);

  // --- DETERMINE SOURCE OF TRUTH (Database vs Zustand) ---
  const activeData = useMemo(() => {
    if (isBuilderPreview) {
      return {
        portfolio: {
          sections: builderStore.sections,
          theme_config: builderStore.themeConfig,
          id: "preview-id",
          actor_id: "preview-actor-id",
          site_name: "Live Preview",
        },
        actorProfile: { ActorName: "Preview Mode" },
      };
    }
    return data;
  }, [isBuilderPreview, builderStore.sections, builderStore.themeConfig, data]);

  // --- LOADING & ERROR STATES (Only for live site) ---
  if (!isBuilderPreview && isLoading) {
    return (
      <div className="h-[100dvh] w-full flex items-center justify-center bg-background">
        <Loader2 className="animate-spin text-primary w-10 h-10" />
      </div>
    );
  }

  if (!isBuilderPreview && (isError || !activeData?.portfolio)) {
    return (
      <div className="h-[100dvh] w-full flex flex-col items-center justify-center text-center p-4 bg-background text-foreground">
        <h1 className="text-3xl font-bold mb-2">Portfolio Not Found</h1>
        <p className="text-muted-foreground">
          This page does not exist or has not been published yet.
        </p>
      </div>
    );
  }

  const { portfolio, actorProfile } = activeData || {};
  const sections = portfolio?.sections || [];
  const themeConfig = portfolio?.theme_config || {};

  // --- THEME & COMPONENT RESOLUTION ---
  const themeId = themeConfig.templateId || "modern";
  const ActiveTheme = THEME_REGISTRY[themeId] || DEFAULT_THEME;

  const headerSection = sections.find((s: any) => s.type === "header");
  const HeaderComponent = headerSection
    ? resolveThemeComponent(ActiveTheme, "header")
    : null;

  const seoTitle =
    portfolio?.site_name || actorProfile?.ActorName || "Portfolio";

  // --- CSS INJECTION LOGIC ---
  const primaryHsl = themeConfig.primaryColor
    ? hexToHSLString(themeConfig.primaryColor)
    : "259 94% 51%";
  const activeFont = themeConfig.font || "Inter";
  const fontUrl = `https://fonts.googleapis.com/css2?family=${activeFont.replace(
    / /g,
    "+"
  )}:wght@300;400;500;600;700;800;900&display=swap`;
  const activeRadius =
    themeConfig.radius !== undefined ? themeConfig.radius : 0.5;

  return (
    <>
      <Helmet>
        <title>{seoTitle}</title>
      </Helmet>

      {/* 🚀 THE STYLING ENGINE */}
      <style>
        {`
          @import url('${fontUrl}');
          
          :root {
            --primary: ${primaryHsl};
            --radius: ${activeRadius}rem;
          }

          .portfolio-canvas-wrapper {
            font-family: '${activeFont}', sans-serif;
            /* Force the background color of the wrapper to match the theme */
            background-color: ${
              themeId === "cinematic" ? "#0f172a" : "var(--background)"
            };
            color: ${themeId === "cinematic" ? "#f8fafc" : "var(--foreground)"};
          }
          
          .portfolio-canvas-wrapper button, 
          .portfolio-canvas-wrapper input, 
          .portfolio-canvas-wrapper textarea,
          .portfolio-canvas-wrapper select {
            font-family: inherit;
          }
        `}
      </style>

      {/* 🚀 MASTER WRAPPER (This div contains the injected styles) */}
      <div
        className={cn(
          "portfolio-canvas-wrapper min-h-screen flex flex-col selection:bg-primary/30 selection:text-primary",
          // Add a global dark class if it's the cinematic theme
          themeId === "cinematic" ? "dark" : ""
        )}
      >
        {HeaderComponent && headerSection?.isVisible && (
          <div className="relative z-50">
            <HeaderComponent
              data={headerSection.data}
              allSections={sections}
              id={headerSection.id}
              actorId={portfolio?.actor_id}
              portfolioId={portfolio?.id}
              isPreview={isBuilderPreview}
            />
          </div>
        )}

        <main className="flex-grow relative z-0 flex flex-col min-h-[calc(100vh-80px)]">
          {/* Outlet injects PortfolioHome, DynamicPage, etc. */}
          <Outlet
            context={{ portfolio, actorProfile, isPreview: isBuilderPreview }}
          />
        </main>

        {/* Global Cart (Hidden in builder preview to avoid clutter) */}
        {!isBuilderPreview && (
          <CartDrawerContainer
            theme={themeId}
            username={slug}
            isPreview={false}
          />
        )}
      </div>
    </>
  );
}
