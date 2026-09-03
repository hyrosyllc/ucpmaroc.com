import React, { useState, useEffect, useRef } from "react";
import { BlockProps } from "../types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowRight, ChevronDown, Play, Star } from "lucide-react";
import { InlineEdit } from "../../components/dashboard/InlineEdit";

const Hero: React.FC<any> = ({ data, settings = {}, id, isPreview }) => {
  const heroRef = useRef<HTMLElement>(null);
  const [isMobileView, setIsMobileView] = useState(false);

  // 🚀 BULLETPROOF MOBILE DETECTION (Dual-Tracking)
  useEffect(() => {
    const checkWidth = (width: number) => setIsMobileView(width < 768);

    // 1. Check window resize (for normal viewing)
    const handleResize = () => checkWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    if (typeof window !== "undefined") checkWidth(window.innerWidth);

    // 2. Check element resize (for iframe builder toggles)
    if (!heroRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        checkWidth(entry.contentRect.width);
      }
    });
    observer.observe(heroRef.current);

    return () => {
      window.removeEventListener("resize", handleResize);
      observer.disconnect();
    };
  }, []);

  const getYoutubeId = (url: string) => {
    const regExp =
      /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  // 🚀 1. LAYOUT & ALIGNMENT ENGINE
  const layout = settings.layout || data.layout || "center"; // fallback to data.layout for older saves
  const align = settings.alignment || data.alignment || "center";

  let layoutClass = "";
  let widthClass = "max-w-3xl";

  if (layout === "center") {
    layoutClass = "justify-center";
    widthClass = "max-w-4xl";
  } else if (layout === "split-left") {
    layoutClass = "justify-center md:justify-start";
    widthClass = "max-w-2xl md:w-1/2";
  } else if (layout === "split-right") {
    layoutClass = "justify-center md:justify-end";
    widthClass = "max-w-2xl md:w-1/2 md:ml-auto";
  } else if (layout === "bottom") {
    layoutClass = "justify-end pb-32 md:pb-40";
    widthClass = "max-w-4xl";
  }

  const alignmentClass =
    align === "left"
      ? "text-left items-start"
      : align === "right"
      ? "text-right items-end"
      : "text-center items-center";

  // 🚀 2. CUSTOM GRADIENT ENGINE
  const c1 = data.gradientColor1 || "#0f172a";
  const c2 = data.gradientColor2 || "#3b82f6";
  const isMesh = data.colorType === "mesh";
  const gradientStyle = {
    backgroundImage: `linear-gradient(135deg, ${c1}, ${c2}, ${c1})`,
  };

  // 🚀 3. SMART MEDIA RESOLVERS
  const activeImage =
    isMobileView && data.mobileBackgroundImage
      ? data.mobileBackgroundImage
      : data.backgroundImage || data.mobileBackgroundImage;

  const activeVideoUrl =
    isMobileView && data.mobileVideoUrl ? data.mobileVideoUrl : data.videoUrl;

  const activeVideoFit =
    isMobileView && !data.mobileVideoUrl
      ? data.mobileVideoFit || "cover"
      : "cover";

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes typing-clip {
          0% { clip-path: inset(0 100% 0 0); }
          100% { clip-path: inset(0 0 0 0); }
        }
        .animate-typewriter {
          animation: typing-clip 1.5s cubic-bezier(0.2, 0.6, 0.2, 1) forwards;
          display: inline-block;
        }
        
        @keyframes mesh-shift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-mesh {
          background-size: 200% 200%;
          animation: mesh-shift 10s ease infinite;
        }
      `,
        }}
      />

      <section
        ref={heroRef}
        className="relative min-h-[100dvh] flex flex-col justify-center overflow-hidden bg-black text-white"
      >
        {/* --- LAYER 1: BACKGROUND MEDIA --- */}
        <div className="absolute inset-0 z-0">
          {/* 🚀 A. VIDEO BACKGROUND VARIANT */}
          {data.variant === "video" && activeVideoUrl ? (
            <div className="absolute inset-0 overflow-hidden pointer-events-none bg-black">
              {getYoutubeId(activeVideoUrl) ? (
                <iframe
                  key={activeVideoUrl} // Forces browser to reload iframe if URL changes
                  className={cn(
                    "absolute pointer-events-none opacity-80",
                    activeVideoFit === "contain"
                      ? "inset-0 w-full h-full object-contain"
                      : "top-1/2 left-1/2 w-[177.77vh] min-w-full min-h-[56.25vw] h-[56.25vw] -translate-x-1/2 -translate-y-1/2"
                  )}
                  src={`https://www.youtube.com/embed/${getYoutubeId(
                    activeVideoUrl
                  )}?controls=0&autoplay=1&mute=1&loop=1&playlist=${getYoutubeId(
                    activeVideoUrl
                  )}&playsinline=1&rel=0&iv_load_policy=3&disablekb=1`}
                  allow="autoplay; encrypted-media"
                  title="Hero Video"
                />
              ) : (
                <video
                  key={`${activeVideoUrl}-${activeVideoFit}`} // Forces React to rebuild video tag
                  autoPlay
                  loop
                  muted
                  playsInline
                  preload="metadata"
                  className={cn(
                    "absolute w-full h-full",
                    activeVideoFit === "contain"
                      ? "object-contain"
                      : activeVideoFit === "fill"
                      ? "object-fill"
                      : "object-cover"
                  )}
                  poster={activeImage}
                >
                  <source src={activeVideoUrl} type="video/mp4" />
                </video>
              )}
            </div>
          ) : /* 🚀 B. COLOR & GRADIENT VARIANT */
          data.variant === "color" ? (
            <div className="absolute inset-0 overflow-hidden">
              {data.colorType === "solid" ? (
                <div
                  className="absolute inset-0"
                  style={{ backgroundColor: data.backgroundColor || "#000000" }}
                />
              ) : (
                <div
                  className={cn("absolute inset-0", isMesh && "animate-mesh")}
                  style={gradientStyle}
                />
              )}
            </div>
          ) : /* 🚀 C. STATIC IMAGE VARIANT */
          activeImage ? (
            <div className="absolute inset-0 overflow-hidden bg-black">
              <img
                key={activeImage} // Forces image remount on mobile toggle!
                src={activeImage}
                alt="Hero Background"
                className="absolute inset-0 w-full h-full object-cover animate-ken-burns opacity-90 will-change-transform"
                style={{ animationDuration: "20s" }}
                loading="eager"
                decoding="async"
              />
            </div>
          ) : (
            /* DEFAULT FALLBACK */
            <div className="absolute inset-0 bg-neutral-950 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-neutral-800 to-neutral-950" />
          )}

          {/* Gradient Overlay */}
          <div
            className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/50 to-neutral-950"
            style={{ opacity: (data.overlayOpacity || 60) / 100 }}
          />

          {/* Cinematic Grain Effect */}
          <div className="hidden md:block absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay pointer-events-none"></div>
        </div>

        {/* --- LAYER 2: CONTENT --- */}
        <div
          className={cn(
            "relative z-10 container mx-auto w-full h-full flex flex-col px-6 pt-20 md:pt-32",
            layoutClass
          )}
        >
          <div
            className={cn(
              "space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000 fill-mode-both flex flex-col",
              widthClass,
              alignmentClass,
              layout === "center" ? "mx-auto" : ""
            )}
          >
            {/* Eyebrow Label */}
            {data.label && (
              <div className="overflow-hidden">
                <span className="inline-block py-1.5 px-4 rounded-full border border-primary/30 bg-primary/10 backdrop-blur-sm text-xs md:text-sm font-semibold tracking-widest uppercase text-primary animate-fade-up">
                  <InlineEdit
                    tagName="span"
                    text={data.label}
                    sectionId={id}
                    fieldKey="label"
                    isPreview={isPreview}
                  />
                </span>
              </div>
            )}

            {/* Headline */}
            <InlineEdit
              tagName="h1"
              className={cn(
                "text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[1.1] md:leading-[1.1] text-transparent bg-clip-text bg-gradient-to-b from-white to-white/70 drop-shadow-sm will-change-transform block",
                data.animateHeadline && "animate-typewriter"
              )}
              text={data.headline || "Your Headline Here"}
              sectionId={id}
              fieldKey="headline"
              isPreview={isPreview}
            />

            {/* Subheadline */}
            <InlineEdit
              tagName="p"
              className="text-lg md:text-2xl text-neutral-300 font-light leading-relaxed max-w-2xl text-shadow-sm block"
              text={data.subheadline || "I am a creative voice actor..."}
              sectionId={id}
              fieldKey="subheadline"
              isPreview={isPreview}
            />

            {/* CTA Buttons Row */}
            {(data.ctaText || data.secondaryCtaText) && (
              <div
                className={cn(
                  "pt-4 md:pt-6 flex flex-wrap gap-4 w-full",
                  align === "center"
                    ? "justify-center"
                    : align === "right"
                    ? "justify-end"
                    : "justify-start"
                )}
              >
                {/* Primary Button */}
                {data.ctaText && (
                  <Button
                    asChild
                    size="lg"
                    className="h-14 md:h-16 px-8 md:px-10 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 text-base md:text-lg font-semibold transition-all hover:scale-105 shadow-none md:shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)] group"
                  >
                    <a href={data.ctaLink || "#contact"}>
                      <InlineEdit
                        tagName="span"
                        text={data.ctaText}
                        sectionId={id}
                        fieldKey="ctaText"
                        isPreview={isPreview}
                      />
                      <ArrowRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1 inline-block" />
                    </a>
                  </Button>
                )}

                {/* Secondary Button */}
                {data.secondaryCtaText && (
                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="h-14 md:h-16 px-8 md:px-10 rounded-full border-white/20 bg-white/5 hover:bg-white/10 text-white backdrop-blur-sm text-base md:text-lg transition-all hover:scale-105"
                  >
                    <a href={data.secondaryCtaLink || "#"}>
                      {data.variant === "video" && (
                        <Play className="w-4 h-4 mr-2 fill-current inline-block" />
                      )}
                      <InlineEdit
                        tagName="span"
                        text={data.secondaryCtaText}
                        sectionId={id}
                        fieldKey="secondaryCtaText"
                        isPreview={isPreview}
                      />
                    </a>
                  </Button>
                )}
              </div>
            )}

            {/* 🚀 TRUST BADGE */}
            {data.showTrustBadge && data.trustText && (
              <div
                className="pt-6 animate-fade-up"
                style={{ animationDelay: "400ms" }}
              >
                <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm shadow-xl">
                  <div className="flex text-amber-400">
                    <Star size={14} className="fill-current" />
                    <Star size={14} className="fill-current" />
                    <Star size={14} className="fill-current" />
                    <Star size={14} className="fill-current" />
                    <Star size={14} className="fill-current" />
                  </div>
                  <span className="text-xs md:text-sm font-medium text-white/90">
                    <InlineEdit
                      tagName="span"
                      text={data.trustText}
                      sectionId={id}
                      fieldKey="trustText"
                      isPreview={isPreview}
                    />
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* --- LAYER 3: SCROLL INDICATOR --- */}
        <div className="absolute bottom-8 left-0 right-0 z-20 flex justify-center animate-bounce-slow opacity-70">
          <a
            href="#content"
            className="flex flex-col items-center gap-2 text-white/50 hover:text-white transition-colors cursor-pointer"
          >
            <span className="text-[10px] uppercase tracking-widest">
              Scroll
            </span>
            <ChevronDown className="w-6 h-6" />
          </a>
        </div>
      </section>
    </>
  );
};

export default Hero;
