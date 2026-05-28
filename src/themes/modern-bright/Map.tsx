import React from "react";
import { cn } from "@/lib/utils";
import { MapPin, Navigation, ExternalLink, Map } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InlineEdit } from "../../components/dashboard/InlineEdit";

const LocationMap: React.FC<any> = ({ data, settings = {}, id, isPreview }) => {
  const variant = settings.variant || data.variant || "standard"; // standard, dark, card
  const isBoxed = variant === "card";

  const height = settings.height || data.height || "medium";
  const heightClass =
    height === "small" ? "h-[350px]"
      : height === "large" ? "h-[80vh] min-h-[600px]"
      : "h-[50vh] min-h-[450px]";

  // Helper to extract SRC securely
  const getCleanMapUrl = (input: string) => {
    if (!input) return "";
    const srcMatch = input.match(/src="([^"]+)"/);
    return srcMatch ? srcMatch[1] : input;
  };

  const cleanUrl = getCleanMapUrl(data.mapUrl);

  // 🚀 FIX: Official Google Maps Search API fallback url
  const fallbackQuery = encodeURIComponent(data.address || data.title || "");
  const directionLink = data.directionUrl || (fallbackQuery ? `https://www.google.com/maps/search/?api=1&query=${fallbackQuery}` : "#");

  // --- EMPTY STATE UX FOR BUILDER ---
  if (!cleanUrl) {
    if (isPreview) {
      return (
        <section className="py-24 px-6 bg-white">
          <div className="container mx-auto border-2 border-dashed border-black/10 rounded-3xl p-16 flex flex-col items-center justify-center text-white/40 bg-black/5 backdrop-blur-sm">
            <Map className="w-16 h-16 mb-6 opacity-40" />
            <h3 className="text-2xl font-bold text-neutral-900 mb-2 tracking-tight">Location Map</h3>
            <p className="text-center max-w-md">
              No map embed URL provided. Hover over this section and click "Design" to configure your map.
            </p>
          </div>
        </section>
      );
    }
    return null;
  }

  return (
    <section className="relative bg-white overflow-hidden pb-0">
      {/* Background Texture */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay pointer-events-none"></div>

      {/* HEADER (Always Rendered) */}
      <div className="container mx-auto px-6 pt-24 pb-12 text-center relative z-10 pointer-events-none">
        <InlineEdit
          tagName="h2"
          className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter text-neutral-900 block pointer-events-auto w-max mx-auto"
          text={data.title || "Find Us Here"}
          sectionId={id}
          fieldKey="title"
          isPreview={isPreview}
        />
        <div className="h-1 w-24 bg-gradient-to-r from-primary to-transparent mx-auto rounded-full mt-6" />
      </div>

      {/* MAP CONTAINER */}
      <div
        className={cn(
          "relative w-full overflow-hidden group flex items-center justify-center",
          heightClass,
          isBoxed ? "container mx-auto px-6 pb-24" : "w-full border-t border-black/5"
        )}
      >
        <div className={cn(
          "relative w-full h-full overflow-hidden",
          isBoxed && "rounded-[2.5rem] shadow-2xl ring-1 ring-black/10"
        )}>
          
          {/* --- THE IFRAME --- */}
          <iframe
            src={cleanUrl}
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className={cn(
              "w-full h-full transition-all duration-1000",
              variant === "dark" && "filter grayscale-[100%] invert-[90%] hue-rotate-180 contrast-[1.1] opacity-80 group-hover:opacity-100 transition-opacity",
              variant === "card" && "opacity-70 grayscale-[30%] group-hover:grayscale-0 transition-all duration-700"
            )}
            title="Location Map"
          />

          {/* 🚀 CINEMATIC VIGNETTE (Only for full-width) */}
          {!isBoxed && (
            <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_100px_rgba(10,10,10,0.8)]" />
          )}

          {/* --- VARIANT 1 & 2: FLOATING BUTTON --- */}
          {!isBoxed && (
            <div className="absolute bottom-8 right-8 z-20 pointer-events-auto">
              <Button
                asChild
                size="lg"
                className="shadow-[0_0_30px_rgba(0,0,0,0.5)] bg-white text-black hover:bg-neutral-200 rounded-full px-8 h-14 font-bold transform transition-all hover:scale-105 border border-white/50"
              >
                <a
                  href={directionLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => isPreview && e.preventDefault()}
                >
                  <Navigation className="w-5 h-5 mr-2" /> Get Directions
                </a>
              </Button>
            </div>
          )}

          {/* --- VARIANT 3: GLASS OVERLAY CARD --- */}
          {isBoxed && (
            <div className="absolute inset-0 flex items-center justify-center p-6 pointer-events-none z-20">
              <div className="bg-neutral-950/70 backdrop-blur-2xl border border-black/10 p-10 rounded-3xl max-w-sm w-full text-center shadow-2xl animate-in zoom-in-95 duration-700 pointer-events-auto ring-1 ring-white/5">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 text-primary ring-1 ring-primary/20">
                  <MapPin className="w-7 h-7" />
                </div>

                <InlineEdit
                  tagName="h3"
                  className="text-2xl font-bold text-neutral-900 mb-3 block tracking-tight"
                  text={data.title || "Our Studio"}
                  sectionId={id}
                  fieldKey="title"
                  isPreview={isPreview}
                />

                <InlineEdit
                  tagName="p"
                  className="text-neutral-600 leading-relaxed text-sm mb-8 block font-medium"
                  text={data.address || "123 Creative Ave\nLos Angeles, CA 90028"}
                  sectionId={id}
                  fieldKey="address"
                  isPreview={isPreview}
                />

                <Button
                  asChild
                  className="w-full rounded-full bg-white text-black hover:bg-neutral-200 h-12 font-bold transition-all hover:scale-105 shadow-xl"
                >
                  <a
                    href={directionLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => isPreview && e.preventDefault()}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" /> Open in Google Maps
                  </a>
                </Button>
              </div>
            </div>
          )}

          {/* --- INTERACTION SHIELD --- */}
          <div
            className="absolute inset-0 bg-transparent z-10"
            onClick={(e) => {
              if (!isPreview) e.currentTarget.style.pointerEvents = "none";
            }}
            onMouseLeave={(e) => {
              if (!isPreview) e.currentTarget.style.pointerEvents = "auto";
            }}
            title={isPreview ? "Map disabled in builder mode" : "Click to interact with map"}
          />
        </div>
      </div>
    </section>
  );
};

export default LocationMap;