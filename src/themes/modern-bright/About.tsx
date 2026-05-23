import React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { InlineEdit } from "../../components/dashboard/InlineEdit";

const About: React.FC<any> = ({ data, settings = {}, id, isPreview }) => {
  // 1. CONFIGURATION
  const variant = settings.variant || data.variant || "split"; // 'simple', 'split', 'profile'
  const isSimple = variant === "simple";
  const isProfile = variant === "profile";

  // Layout Alignment
  const mediaPosition = settings.layout || data.layout || "right"; // Default to right like standard modern
  const isMediaLeft = mediaPosition === "left";

  // Image Style Filter
  const imageFilter = settings.imageFilter || "grayscale";

  // Helper to detect video files
  const isVideo = (url?: string) => {
    if (!url) return false;
    return url.match(/\.(mp4|webm|mov)$/i);
  };

  // --- SUB-COMPONENT: CINEMATIC MEDIA BLOCK ---
  const MediaBlock = () => {
    if (!data.image) return null;

    return (
      <div
        className={cn(
          "relative group mx-auto lg:mx-0 w-full max-w-md xl:max-w-lg",
          isSimple ? "hidden" : "block",
          "animate-in fade-in slide-in-from-bottom-8 duration-1000 fill-mode-both"
        )}
      >
        <div
          className={cn(
            "absolute inset-0 bg-black/5 rounded-3xl transform translate-x-4 translate-y-4 transition-transform duration-500 group-hover:translate-x-6 group-hover:translate-y-6",
            "hidden md:block"
          )}
        />

        <div className="relative rounded-3xl overflow-hidden bg-neutral-50 border border-black/10 shadow-2xl aspect-[4/5] ring-1 ring-white/5">
          {isVideo(data.image) ? (
            <video
              src={data.image}
              className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity duration-700"
              autoPlay
              loop
              muted
              playsInline
            />
          ) : (
            <img
              src={data.image}
              alt={data.title || "About Me"}
            className={cn(
              "w-full h-full object-cover transition-transform duration-700 group-hover:scale-105",
              imageFilter === "grayscale" ? "filter grayscale-[20%] group-hover:grayscale-0" : ""
            )}
              loading="lazy"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
        </div>
      </div>
    );
  };

  // --- SUB-COMPONENT: STATS GRID ---
  const StatsGrid = () => {
    if (!data.stats || data.stats.length === 0) return null;
    return (
      <div
        className={cn(
          "pt-8 border-t border-black/10 w-full animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100",
          isSimple && "max-w-2xl mx-auto" // 🚀 Centers the block in simple mode
        )}
      >
        <div
          className={cn(
            "grid grid-cols-2 sm:grid-cols-3 gap-6",
            isSimple ? "text-center" : "text-left" // 🚀 Centers the text in simple mode
          )}
        >
          {data.stats.map((stat: any, idx: number) => (
            <div
              key={idx}
              className={cn(
                "space-y-1",
                isSimple && "flex flex-col items-center"
              )}
            >
              <h4 className="text-3xl md:text-4xl font-black text-primary">
                {stat.value}
              </h4>
              <p className="text-xs text-neutral-600 uppercase tracking-wider font-bold">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // --- SUB-COMPONENT: FEATURES LIST ---
  const FeaturesList = () => {
    if (!data.features || data.features.length === 0) return null;
    return (
      <ul
        className={cn(
          "grid gap-4 pt-4 sm:grid-cols-2 w-full animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100",
          isSimple && "max-w-xl mx-auto place-items-center" // 🚀 Centers the block
        )}
      >
        {data.features.map((feature: string, idx: number) => (
          <li
            key={idx}
            className={cn(
              "flex items-start gap-3",
              isSimple && "justify-center text-center"
            )}
          >
            <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 shrink-0" />
            <span className="text-sm md:text-base text-neutral-700 font-medium">
              {feature}
            </span>
          </li>
        ))}
      </ul>
    );
  };

  // --- MAIN RENDER ---
  return (
    <section className="relative py-24 md:py-32 px-6 bg-white overflow-hidden text-neutral-900">
      {/* === ATMOSPHERE LAYERS === */}
      <div className="hidden md:block absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay pointer-events-none"></div>
      <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-primary/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-primary/5 blur-[100px] rounded-full pointer-events-none" />

      <div className="relative container mx-auto z-10 max-w-7xl">
        {/* === VARIANT 1: SIMPLE (Centered) === */}
        {isSimple ? (
          <div className="max-w-4xl mx-auto text-center space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
            {data.label && (
              <span className="text-primary font-mono text-sm tracking-widest uppercase inline-flex items-center gap-2 mb-2">
                <span className="w-8 h-px bg-primary/50"></span>
                <InlineEdit
                  tagName="span"
                  text={data.label}
                  sectionId={id}
                  fieldKey="label"
                  isPreview={isPreview}
                />
                <span className="w-8 h-px bg-primary/50"></span>
              </span>
            )}

            <InlineEdit
              tagName="h2"
              className="text-4xl md:text-5xl lg:text-7xl font-extrabold tracking-tight text-neutral-900 leading-[1.1] block"
              text={data.title || "About Me"}
              sectionId={id}
              fieldKey="title"
              isPreview={isPreview}
            />

            <div className="h-1 w-24 mx-auto bg-gradient-to-r from-primary to-transparent" />

            <InlineEdit
              tagName="div"
              className="prose prose-lg prose-invert mx-auto text-neutral-700 leading-relaxed whitespace-pre-wrap font-medium"
              text={data.content || "Write your bio here..."}
              sectionId={id}
              fieldKey="content"
              isPreview={isPreview}
            />

            <FeaturesList />

            {data.ctaText && (
              <div className="pt-8">
                <Button
                  asChild
                  size="lg"
                  className="rounded-full px-10 h-14 text-base bg-white text-black hover:bg-neutral-200 hover:scale-105 transition-all shadow-[0_0_30px_rgba(255,255,255,0.15)]"
                >
                  <a href={data.ctaLink || "#"}>
                    <InlineEdit
                      tagName="span"
                      text={data.ctaText}
                      sectionId={id}
                      fieldKey="ctaText"
                      isPreview={isPreview}
                    />
                    <ArrowRight className="ml-2 w-5 h-5 inline-block" />
                  </a>
                </Button>
              </div>
            )}
          </div>
        ) : (
          /* === VARIANT 2 & 3: SPLIT & PROFILE (Grid) === */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            {/* COLUMN: MEDIA */}
            <div
              className={cn(
                "transition-all duration-1000 ease-out flex justify-center",
                isMediaLeft
                  ? "lg:order-1 lg:justify-start"
                  : "lg:order-2 lg:justify-end",
                "order-1"
              )}
            >
              <MediaBlock />
            </div>

            {/* COLUMN: CONTENT */}
            <div
              className={cn(
                "space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200 fill-mode-both",
                isMediaLeft ? "lg:order-2" : "lg:order-1",
                "order-2"
              )}
            >
              <div className="space-y-6">
                {data.label && (
                  <span className="text-primary font-mono text-sm tracking-widest uppercase flex items-center gap-3">
                    <span className="w-8 h-px bg-primary"></span>
                    <InlineEdit
                      tagName="span"
                      text={data.label}
                      sectionId={id}
                      fieldKey="label"
                      isPreview={isPreview}
                    />
                  </span>
                )}

                <InlineEdit
                  tagName="h2"
                  className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-neutral-900 tracking-tight leading-[1.1] block"
                  text={data.title || "About Me"}
                  sectionId={id}
                  fieldKey="title"
                  isPreview={isPreview}
                />

                <div className="h-1 w-24 bg-gradient-to-r from-primary to-transparent" />
              </div>

              <InlineEdit
                tagName="div"
                className="prose prose-lg prose-invert text-neutral-700 leading-relaxed whitespace-pre-wrap font-medium"
                text={data.content || "Write your bio here..."}
                sectionId={id}
                fieldKey="content"
                isPreview={isPreview}
              />

              {!isProfile && <FeaturesList />}
              {isProfile && <StatsGrid />}

              {data.ctaText && (
                <div className="pt-4">
                  <Button
                    asChild
                    size="lg"
                    className="h-14 px-8 rounded-full bg-white text-black hover:bg-neutral-200 transition-all hover:scale-105 shadow-[0_0_20px_rgba(255,255,255,0.15)] group"
                  >
                    <a href={data.ctaLink || "#"}>
                      <InlineEdit
                        tagName="span"
                        text={data.ctaText}
                        sectionId={id}
                        fieldKey="ctaText"
                        isPreview={isPreview}
                      />
                      <ArrowRight className="ml-2 w-5 h-5 inline-block group-hover:translate-x-1 transition-transform" />
                    </a>
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default About;
