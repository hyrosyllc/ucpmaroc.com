import React from "react";
import { cn } from "@/lib/utils";
import { ArrowRight } from "lucide-react";
import { UCP } from "@ucp/sdk";
import type { HeroSectionProps } from "@/features/portfolio-builder/types/sections";

// 1. SCHEMA: Only adds NEW logic/styling specific to Cupertino
export const schema = [
  {
    id: "showGradient",
    type: "toggle",
    label: "Show Ambient Glow",
    defaultValue: true,
  },
  {
    id: "glowColor1",
    type: "color",
    label: "Primary Glow Color",
    defaultValue: "rgba(96, 165, 250, 0.3)",
  },
  {
    id: "glowColor2",
    type: "color",
    label: "Secondary Glow Color",
    defaultValue: "rgba(192, 132, 252, 0.3)",
  },
];

export default function Hero({
  data,
  settings = {},
  id,
  isPreview,
}: HeroSectionProps) {
  const align = data.alignment || "center";

  return (
    <section className="relative min-h-[90vh] flex flex-col justify-center overflow-hidden bg-white pt-20">
      {/* THEME SPECIFIC LOGIC */}
      {settings.showGradient !== false && (
        <>
          <div
            className="absolute top-[-20%] left-[20%] w-[600px] h-[600px] rounded-full blur-[120px] animate-pulse pointer-events-none"
            style={{ backgroundColor: settings.glowColor1 }}
          />
          <div
            className="absolute bottom-[-10%] right-[10%] w-[500px] h-[500px] rounded-full blur-[100px] pointer-events-none"
            style={{ backgroundColor: settings.glowColor2 }}
          />
        </>
      )}

      <div
        className={cn(
          "container mx-auto px-6 relative z-10",
          align === "center"
            ? "text-center"
            : align === "right"
            ? "text-right"
            : "text-left"
        )}
      >
        {/* PLATFORM PROP: Eyebrow */}
        {data.label && (
          <div
            className={cn(
              "mb-6 animate-in fade-in slide-in-from-bottom-4",
              align === "center" && "mx-auto",
              align === "right" && "ml-auto"
            )}
          >
            <span className="px-3 py-1 rounded-full border border-gray-200 bg-gray-50 text-[11px] font-bold uppercase tracking-widest text-gray-500 inline-block">
              <UCP.Text
                field="label"
                value={data.label}
                sectionId={id}
                isPreview={isPreview}
              />
            </span>
          </div>
        )}

        {/* PLATFORM PROP: Headline */}
        <UCP.Text
          as="h1"
          field="headline"
          value={data.headline}
          sectionId={id}
          isPreview={isPreview}
          className={cn(
            "text-6xl md:text-8xl font-[800] tracking-tighter text-slate-900 leading-[0.95] mb-6 inline-block",
            data.animateHeadline && "animate-pulse"
          )}
        />

        {/* PLATFORM PROP: Subheadline */}
        <UCP.Text
          as="p"
          field="subheadline"
          value={data.subheadline}
          sectionId={id}
          isPreview={isPreview}
          className={cn(
            "text-xl md:text-2xl text-slate-500 max-w-2xl font-medium leading-relaxed mb-10",
            align === "center" && "mx-auto",
            align === "right" && "ml-auto"
          )}
        />

        {/* PLATFORM PROP: CTA Buttons */}
        <div
          className={cn(
            "flex flex-wrap gap-4",
            align === "center"
              ? "justify-center"
              : align === "right"
              ? "justify-end"
              : "justify-start"
          )}
        >
          {data.ctaText && (
            <a
              href={data.ctaLink || "#"}
              className="px-8 py-4 bg-blue-600 text-white rounded-full font-semibold text-lg shadow-lg hover:scale-[1.02] transition-all"
            >
              <UCP.Text
                as="span"
                field="ctaText"
                value={data.ctaText}
                sectionId={id}
                isPreview={isPreview}
              />
            </a>
          )}
          {data.secondaryCtaText && (
            <a
              href={data.secondaryCtaLink || "#"}
              className="px-8 py-4 bg-white text-slate-900 border border-slate-200 rounded-full font-semibold text-lg flex items-center gap-2"
            >
              <UCP.Text
                as="span"
                field="secondaryCtaText"
                value={data.secondaryCtaText}
                sectionId={id}
                isPreview={isPreview}
              />{" "}
              <ArrowRight size={16} />
            </a>
          )}
        </div>

        {/* PLATFORM PROP: Background Image (styled as a product mockup) */}
        {data.backgroundImage && (
          <div className="mt-20 relative mx-auto max-w-5xl rounded-t-3xl overflow-hidden shadow-2xl border-t border-x border-gray-200">
            <img
              src={data.backgroundImage}
              alt="Hero Preview"
              className="w-full object-cover"
            />
          </div>
        )}
      </div>
    </section>
  );
}

Hero.schema = schema;
