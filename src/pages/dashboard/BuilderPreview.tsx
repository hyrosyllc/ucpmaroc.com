// src/pages/dashboard/BuilderPreview.tsx
import React, { useState, useEffect, Suspense } from "react";
import { PortfolioSection } from "../../types/portfolio";
import {
  THEME_REGISTRY,
  DEFAULT_THEME,
  resolveThemeComponent,
} from "../../themes/registry";
import { cn } from "@/lib/utils";
import { Loader2, AlertTriangle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/supabaseClient";

// 🚀 AAA+ UPGRADE: We are using the native executor hook, NO BABEL REQUIRED!
import { usePrecompiledTheme } from "@/hooks/usePrecompiledTheme";

// --- Helper to convert section type (e.g., 'video_slider') to Component Name ('VideoSlider') ---
function formatSectionTypeToComponentName(type: string): string {
  if (type === 'lead_form') return 'LeadForm';
  return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('');
}

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

export default function BuilderPreview() {
  const [sections, setSections] = useState<PortfolioSection[]>([]);
  const [themeConfig, setThemeConfig] = useState<any>({});
  const [actorId, setActorId] = useState<string>("preview-mode");
  const [portfolioId, setPortfolioId] = useState<string>("preview-mode");

  // 1. Establish the postMessage Bridge
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "UPDATE_PREVIEW") {
        setSections(event.data.payload.sections);
        setThemeConfig(event.data.payload.themeConfig);
        if (event.data.payload.actorId) setActorId(event.data.payload.actorId);
        if (event.data.payload.portfolioId) setPortfolioId(event.data.payload.portfolioId);
      } else if (event.data?.type === "SCROLL_TO_SECTION") {
        const el = document.getElementById(event.data.payload);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }
    };

    window.addEventListener("message", handleMessage);
    window.parent.postMessage({ type: "PREVIEW_READY" }, "*");

    return () => window.removeEventListener("message", handleMessage);
  }, []);

  // 2. Setup Theme Variables
  const themeId = themeConfig.templateId || "modern";
  
  // 🚀 NEW: Is this a custom marketplace theme?
  const isCustomTheme = !!themeId && !THEME_REGISTRY[themeId];

  // 🚀 AAA+ UPGRADE: Fetch ONLY the lightweight compiled bundle!
  const { data: customThemeData, isLoading: isLoadingTheme, error: fetchError } = useQuery({
    queryKey: ['customThemeCompiled', themeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('marketplace_themes')
        .select('compiled_bundle') // We do not need the heavy 'files' array here
        .eq('id', themeId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: isCustomTheme,
    staleTime: 1000 * 60 * 5, // Cache for 5 mins so changing colors is instant
  });

  // 🚀 AAA+ UPGRADE: Execute natively using the new hook
  const { compiledComponents } = usePrecompiledTheme(customThemeData?.compiled_bundle);

  const ActiveTheme = THEME_REGISTRY[themeId] || DEFAULT_THEME;
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
      <style>
        {`
          @import url('${fontUrl}');
          
          :root {
            --primary: ${primaryHsl};
            --radius: ${activeRadius}rem;
          }

          ::-webkit-scrollbar {
            width: 6px;
            height: 6px;
          }
          ::-webkit-scrollbar-track {
            background: transparent;
          }
          ::-webkit-scrollbar-thumb {
            background: rgba(156, 163, 175, 0.3);
            border-radius: 10px;
          }
          ::-webkit-scrollbar-thumb:hover {
            background: rgba(156, 163, 175, 0.5);
          }

          html, body {
            margin: 0;
            padding: 0;
            background-color: ${
              themeId === "cinematic" ? "#0f172a" : "var(--background)"
            };
            color: ${themeId === "cinematic" ? "#f8fafc" : "var(--foreground)"};
          }

          .builder-preview-wrapper {
            font-family: '${activeFont}', sans-serif;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
          }
          
          .builder-preview-wrapper button, 
          .builder-preview-wrapper input, 
          .builder-preview-wrapper textarea,
          .builder-preview-wrapper select {
            font-family: inherit;
          }
        `}
      </style>

      <div
        className={cn(
          "builder-preview-wrapper selection:bg-primary/30 selection:text-primary",
          themeId === "cinematic" ? "dark" : ""
        )}
        data-btn-style={themeConfig.buttonStyle || "solid"}
      >
        {/* Loading / Error States for Custom Themes */}
        {isCustomTheme && isLoadingTheme && (
           <div className="flex items-center justify-center p-12 h-full flex-grow text-muted-foreground">
              <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading Custom Theme...
           </div>
        )}
        
        {fetchError && (
           <div className="m-4 bg-red-50 border border-red-200 text-red-600 p-4 rounded-lg flex items-start gap-3">
              <AlertTriangle className="shrink-0 mt-0.5" size={20} />
              <div>
                <h4 className="font-bold text-sm">Theme Fetch Error</h4>
                <p className="text-xs font-mono mt-1 whitespace-pre-wrap">{fetchError.message}</p>
              </div>
           </div>
        )}

        {!isLoadingTheme && !fetchError && sections
          .filter((s) => s.isVisible)
          .map((section) => {
            
            // 🚀 SMART RENDERER: Pick from Natively Compiled Components OR Local Registry
            let Component = null;
            if (isCustomTheme && compiledComponents) {
               const compName = formatSectionTypeToComponentName(section.type);
               Component = compiledComponents[compName] || compiledComponents[section.type]; 
               
               // Fallback check to 'modern' registry if the developer missed a section block
               if (!Component && THEME_REGISTRY['modern']) {
                  Component = resolveThemeComponent(THEME_REGISTRY['modern'], section.type);
               }
            } else {
               Component = resolveThemeComponent(ActiveTheme, section.type);
            }

            if (!Component) return null;

            const sectionProps = {
              data: section.data,
              settings: section.settings || {},
              id: section.id,
              allSections: sections,
              isPreview: true,
              actorId: actorId,
              portfolioId: portfolioId,
            };

            const zIndexClass =
              section.type === "header" ? "relative z-50" : "relative z-0";

            return (
              <div
                id={section.id}
                key={section.id}
                className={cn(
                  zIndexClass,
                  "group relative hover:ring-2 hover:ring-primary/40 hover:ring-inset transition-all duration-200"
                )}
                onClickCapture={(e) => {
                  const target = e.target as HTMLElement;
                  if (target.closest("a") || target.tagName === "BUTTON") {
                    e.preventDefault();
                  }
                }}
              >
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-[100]">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      window.parent.postMessage(
                        { type: "EDIT_SECTION", payload: section.id },
                        "*"
                      );
                    }}
                    className="bg-primary text-primary-foreground text-xs font-bold px-3 py-1.5 rounded shadow-lg flex items-center gap-2 cursor-pointer hover:scale-105 active:scale-95 transition-transform"
                  >
                    Edit {section.type.replace("_", " ")}
                  </button>
                </div>

                <Suspense
                  fallback={
                    <div className="py-12 flex justify-center">
                      <Loader2 className="animate-spin text-muted-foreground" />
                    </div>
                  }
                >
                  <Component {...sectionProps} />
                </Suspense>
              </div>
            );
          })}
      </div>
    </>
  );
}