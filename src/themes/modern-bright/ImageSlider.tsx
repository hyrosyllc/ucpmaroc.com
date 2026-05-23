import React, { useState, useEffect, useCallback, useRef } from "react";
import { BlockProps } from "../types";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
// 🚀 1. IMPORT INLINE EDIT
import { InlineEdit } from "../../components/dashboard/InlineEdit";

// 🚀 2. GRAB id AND isPreview FROM PROPS
const ImageSlider: React.FC<any> = ({ data, settings = {}, id, isPreview }) => {
  const [current, setCurrent] = useState(0);
  const images = data.images || [];
  const hasImages = images.length > 0;
  const carouselRef = useRef<HTMLDivElement>(null);
  
  const variant = settings.variant || data.variant || "standard"; // standard, cinematic, cards, split, carousel
  const intervalValue = settings.interval !== undefined ? settings.interval : data.interval || 5;
  const intervalTime = intervalValue * 1000;
  const sliderHeight = settings.height || data.height || "large";
  
  const imageFit = settings.imageFit || data.imageFit || "cover";
  const fitClass = imageFit === "contain" ? "object-contain" : "object-cover";

  const titleText = data.title !== undefined ? data.title : "IMAGE SLIDER";
  const showTitle = isPreview || titleText.trim().length > 0;

  // 🚀 Disable autoplay in preview mode so it doesn't distract the user while editing
  const autoPlayEnabled = intervalTime > 0 && !isPreview;

  // 🚀 3. HIDE ON LIVE SITE IF EMPTY, BUT SHOW IN PREVIEW
  if (!hasImages && !isPreview) return null;

  // Height Classes
  const heightClass =
    sliderHeight === "full"
      ? "h-[100dvh]"
      : sliderHeight === "small"
      ? "h-[40vh] min-h-[250px] md:h-[350px]"
      : sliderHeight === "medium"
      ? "h-[50vh] min-h-[350px] md:h-[500px]"
      : "h-[65vh] min-h-[450px] md:h-[700px]";

  // --- NAVIGATION LOGIC ---
  const nextSlide = useCallback(() => {
    if (!hasImages) return;
    if (variant === "carousel" && carouselRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current;
      if (scrollLeft + clientWidth >= scrollWidth - 10) {
        carouselRef.current.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        const amount = window.innerWidth < 768 ? window.innerWidth * 0.8 : 400;
        carouselRef.current.scrollBy({ left: amount, behavior: "smooth" });
      }
    } else {
      setCurrent((prev) => (prev + 1) % images.length);
    }
  }, [images.length, hasImages, variant]);

  const prevSlide = () => {
    if (!hasImages) return;
    if (variant === "carousel" && carouselRef.current) {
      const amount = window.innerWidth < 768 ? window.innerWidth * 0.8 : 400;
      carouselRef.current.scrollBy({ left: -amount, behavior: "smooth" });
    } else {
      setCurrent((prev) => (prev - 1 + images.length) % images.length);
    }
  };

  // --- AUTOPLAY ---
  useEffect(() => {
    if (!autoPlayEnabled || !hasImages) return;
    const timer = setInterval(nextSlide, intervalTime);
    return () => clearInterval(timer);
  }, [autoPlayEnabled, intervalTime, nextSlide, hasImages]);

  return (
    <section className="bg-white relative overflow-hidden group">
      {/* 🚀 4. INLINE EDITABLE TITLE (Hidden when empty on live site) */}
      {showTitle && (
        <div className="absolute top-8 left-0 right-0 z-40 text-center pointer-events-none">
          <span className="inline-block py-1 px-4 rounded-full bg-black/30 backdrop-blur-md border border-black/10 text-neutral-900 text-sm font-medium tracking-widest uppercase pointer-events-auto">
            <InlineEdit
              tagName="span"
              text={titleText}
              sectionId={id}
              fieldKey="title"
              isPreview={isPreview}
            />
          </span>
        </div>
      )}

      {/* 🚀 5. EMPTY STATE UX FOR BUILDER */}
      {!hasImages && isPreview && (
        <div
          className={cn(
            "w-full flex items-center justify-center p-8",
            heightClass
          )}
        >
          <div className="w-full h-full border-2 border-dashed border-black/20 rounded-2xl flex flex-col items-center justify-center text-neutral-500">
            <ImageIcon className="w-12 h-12 mb-4 opacity-50" />
            <p>
              No images added yet. Hover over this section and click "Edit
              Slider" to upload media.
            </p>
          </div>
        </div>
      )}

      {hasImages && (
        <>
          {/* === VARIANT 1: STANDARD (Swipe) === */}
          {variant === "standard" && (
            <div className={cn("relative w-full", heightClass)}>
              {images.map((slide: any, idx: number) => (
                <div
                  key={idx}
                  className={cn(
                    "absolute inset-0 transition-opacity duration-700 ease-in-out",
                    idx === current ? "opacity-100 z-10" : "opacity-0 z-0"
                  )}
                >
                  <img
                    src={slide.url}
                    alt={slide.caption || `Slide ${idx + 1}`}
                    className={cn("w-full h-full", fitClass)}
                  />
                  {/* Caption */}
                  {slide.caption && (
                    <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/80 to-transparent pointer-events-none">
                      <p className="text-neutral-900 text-lg md:text-xl font-light text-center">
                        {slide.caption}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* === VARIANT 2: CINEMATIC (Ken Burns Fade) === */}
          {variant === "cinematic" && (
            <div className={cn("relative w-full", heightClass)}>
              {images.map((slide: any, idx: number) => (
                <div
                  key={idx}
                  className={cn(
                    "absolute inset-0 transition-all duration-[2000ms] ease-in-out",
                    idx === current
                      ? "opacity-100 z-10 scale-100"
                      : "opacity-0 z-0 scale-110"
                  )}
                >
                  <img
                    src={slide.url}
                    alt={slide.caption || `Slide ${idx + 1}`}
                    className={cn(
                      "w-full h-full transition-transform duration-[10000ms] ease-linear",
                      fitClass,
                      idx === current ? "scale-110" : "scale-100"
                    )}
                  />
                  <div className="absolute inset-0 bg-black/20" />

                  {/* Caption (Cinematic style) */}
                  {slide.caption && (
                    <div className="absolute bottom-12 left-8 md:left-12 max-w-lg pointer-events-none">
                      <div className="h-1 w-12 bg-primary mb-4" />
                      <p className="text-neutral-900 text-2xl md:text-4xl font-bold tracking-tight shadow-black drop-shadow-lg leading-tight">
                        {slide.caption}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* === VARIANT 3: CARDS (Focus Mode) === */}
          {variant === "cards" && (
            <div
              className={cn(
                "relative w-full flex items-center justify-center",
                heightClass
              )}
            >
              <div className="relative w-full max-w-6xl mx-auto h-[80%] px-4 perspective-1000">
                {images.map((slide: any, idx: number) => {
                  let position = "hidden";
                  if (idx === current) position = "center";
                  else if (
                    idx ===
                    (current - 1 + images.length) % images.length
                  )
                    position = "left";
                  else if (idx === (current + 1) % images.length)
                    position = "right";

                  return (
                    <div
                      key={idx}
                      className={cn(
                        "absolute top-0 bottom-0 w-[70%] md:w-[60%] left-0 right-0 mx-auto transition-all duration-500 ease-out shadow-2xl rounded-xl overflow-hidden",
                        position === "center" &&
                          "z-20 opacity-100 scale-100 translate-x-0",
                        position === "left" &&
                          "z-10 opacity-40 scale-90 -translate-x-[60%] blur-[1px]",
                        position === "right" &&
                          "z-10 opacity-40 scale-90 translate-x-[60%] blur-[1px]",
                        position === "hidden" && "z-0 opacity-0 scale-75"
                      )}
                    >
                      <img
                        src={slide.url}
                        alt={slide.caption || `Slide ${idx + 1}`}
                        className={cn("w-full h-full", fitClass)}
                      />
                      {position === "center" && slide.caption && (
                        <div className="absolute bottom-4 left-4 right-4 bg-black/60 backdrop-blur-md p-3 rounded-lg text-neutral-900 text-center pointer-events-none">
                          {slide.caption}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* === VARIANT 4: EDITORIAL SPLIT === */}
          {variant === "split" && (
            <div className={cn("relative w-full flex flex-col md:flex-row", heightClass)}>
              <div className="w-full md:w-1/2 h-1/2 md:h-full relative overflow-hidden shadow-2xl z-10">
                {images.map((slide: any, idx: number) => (
                  <div
                    key={idx}
                    className={cn(
                      "absolute inset-0 transition-all duration-[1500ms] ease-in-out",
                      idx === current
                        ? "opacity-100 z-10 scale-100"
                        : "opacity-0 z-0 scale-105"
                    )}
                  >
                    <img
                      src={slide.url}
                      alt={slide.caption || `Slide ${idx + 1}`}
                      className={cn("w-full h-full", fitClass)}
                    />
                  </div>
                ))}
              </div>
              <div className="w-full md:w-1/2 h-1/2 md:h-full flex items-center justify-center p-8 md:p-16 relative bg-white">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 pointer-events-none" />
                {images.map((slide: any, idx: number) => (
                  <div
                    key={idx}
                    className={cn(
                      "absolute max-w-md w-full px-8 transition-all duration-1000",
                      idx === current
                        ? "opacity-100 translate-y-0 z-10"
                        : "opacity-0 translate-y-8 z-0 pointer-events-none"
                    )}
                  >
                    {slide.caption ? (
                      <>
                        <div className="h-1 w-12 bg-primary mb-6" />
                        <p className="text-neutral-900 text-3xl md:text-5xl font-light tracking-tight leading-tight drop-shadow-sm">
                          {slide.caption}
                        </p>
                      </>
                    ) : (
                      <div className="text-neutral-600 text-sm tracking-widest uppercase font-bold">
                        Image {idx + 1}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* === VARIANT 5: FILM STRIP (Carousel) === */}
          {variant === "carousel" && (
            <div className={cn("relative w-full flex items-center", heightClass)}>
              <div
                ref={carouselRef}
                className="flex overflow-x-auto gap-4 md:gap-6 px-4 md:px-12 w-full h-full sm:h-[85%] py-4 snap-x snap-mandatory hide-scrollbar [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none'] items-center"
              >
                {images.map((slide: any, idx: number) => (
                  <div
                    key={idx}
                    className="snap-center shrink-0 w-[80vw] sm:w-[450px] h-full"
                  >
                    <div className="w-full h-full rounded-2xl overflow-hidden relative shadow-lg group/film">
                      <img
                        src={slide.url}
                        alt={slide.caption || `Slide ${idx + 1}`}
                        className={cn("w-full h-full transition-transform duration-700 group-hover/film:scale-105", fitClass)}
                      />
                      {slide.caption && (
                        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none">
                          <p className="text-neutral-900 text-lg font-medium drop-shadow-sm">
                            {slide.caption}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="absolute top-0 right-0 h-full w-24 bg-gradient-to-l from-white to-transparent pointer-events-none z-10 hidden md:block" />
              <div className="absolute top-0 left-0 h-full w-24 bg-gradient-to-r from-white to-transparent pointer-events-none z-10 hidden md:block" />
            </div>
          )}

          {/* --- CONTROLS (Arrows & Dots) --- */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-between px-2 md:px-4 z-30">
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.preventDefault();
                prevSlide();
              }}
              className="pointer-events-auto h-8 w-8 md:h-12 md:w-12 rounded-full bg-black/10 hover:bg-black/40 text-neutral-900 backdrop-blur-md border border-black/10 transition-all hover:scale-110 opacity-70 md:opacity-0 md:group-hover:opacity-100 flex items-center justify-center shadow-md"
            >
              <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.preventDefault();
                nextSlide();
              }}
              className="pointer-events-auto h-8 w-8 md:h-12 md:w-12 rounded-full bg-black/10 hover:bg-black/40 text-neutral-900 backdrop-blur-md border border-black/10 transition-all hover:scale-110 opacity-70 md:opacity-0 md:group-hover:opacity-100 flex items-center justify-center shadow-md"
            >
              <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
            </Button>
          </div>

          {/* Dots */}
          {variant !== "carousel" && (
            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 z-30 pointer-events-none">
              {images.map((_: any, idx: number) => (
                <button
                  key={idx}
                  onClick={(e) => {
                    e.preventDefault();
                    setCurrent(idx);
                  }}
                  className={cn(
                    "w-2 h-2 rounded-full transition-all duration-300 pointer-events-auto",
                    idx === current
                      ? "bg-white w-6"
                      : "bg-white/40 hover:bg-white/80"
                  )}
                />
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
};

export default ImageSlider;
