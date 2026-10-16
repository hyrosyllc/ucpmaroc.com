// src/pages/DynamicPage.tsx
import React from "react";
import { useParams, useOutletContext } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/supabaseClient";
import { Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { getSectionFrame, getSectionAnchor } from "../sections/frame";
import {
  resolveThemeComponent,
} from "@/themes/registry";
import { useActiveTheme } from "../hooks/useActiveTheme";
import { CustomLoader } from "./PortfolioHome";

export default function DynamicPage() {
  const { pageSlug } = useParams();

  // Grab the portfolio data passed down from PortfolioLayout!
  const { portfolio } = useOutletContext<any>();

  const { data: pageData, isLoading, isError, refetch } = useQuery({
    queryKey: ["page", portfolio?.id, pageSlug],
    // 🚀 1. SAFEGUARD: Only run query if we have the portfolio ID
    enabled: !!portfolio?.id && !!pageSlug,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pro_pages") // Assuming you have a table for custom pages
        .select("*")
        .eq("portfolio_id", portfolio.id)
        .eq("slug", pageSlug)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const { theme: ActiveTheme, isLoading: themeLoading } = useActiveTheme(
    portfolio?.theme_config?.templateId || "modern",
    portfolio?.theme_config?.themeVersion
  );

  if (isLoading || themeLoading)
    return <CustomLoader themeConfig={portfolio?.theme_config} type="page" />;

  if (isError)
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="text-xl font-bold text-foreground">This page could not be loaded</h1>
        <p className="max-w-md text-sm text-muted-foreground">Please try again in a moment.</p>
        <button type="button" onClick={() => refetch()} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
          Try again
        </button>
      </div>
    );

  if (!pageData)
    return <div className="py-24 text-center text-muted-foreground">Page not found.</div>;

  return (
    <div className="flex flex-col flex-grow w-full relative z-0">
      {pageData.sections?.map((section: any) => {
        const Component = resolveThemeComponent(ActiveTheme, section.type);
        if (!Component) return null;

        // 🚀 2. UNIFIED PROPS: Match exactly what PortfolioHome passes
        const sectionProps = {
          data: section.data,
          settings: section.settings || {},
          id: section.id,
          allSections: pageData.sections, // Pass the page's sections
          isPreview: false, // Always false on the live site
          portfolioId: portfolio.id,
          actorId: portfolio.actor_id,
        };

        const frame =
          section.type === "header"
            ? { className: "", style: {} }
            : getSectionFrame(section.settings);
        const anchor = getSectionAnchor(section.settings);

        return (
          <div
            key={section.id}
            id={section.id}
            className={`relative ${frame.className}`}
            style={frame.style}
          >
            {anchor && <span id={anchor} aria-hidden className="absolute -top-20" />}
            <Component {...sectionProps} />
          </div>
        );
      })}
    </div>
  );
}
