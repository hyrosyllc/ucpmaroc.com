import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { BlockProps } from "../types";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Play, X } from "lucide-react";
import { Button } from "@/components/ui/button";
// 🚀 1. IMPORT INLINE EDIT
import { InlineEdit } from "../../components/dashboard/InlineEdit";
import { getYoutubeId } from "./utils";

// 🚀 2. GRAB id AND isPreview FROM PROPS
const VideoSlider: React.FC<any> = ({ data, settings = {}, id, isPreview }) => {
  const [current, setCurrent] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [mounted, setMounted] = useState(false);

  const carouselRef = useRef<HTMLDivElement>(null);

  const videos = data.videos || [];
  const variant = settings.variant || data.variant || "cinema"; // cinema, carousel, grid

  const sliderHeight = settings.height || data.height || "large";
  const gridColumns = Number(settings.gridColumns) || data.gridColumns || 3;
  const videoFit = settings.videoFit || data.videoFit || "cover";
  const fitClass = videoFit === "contain" ? "object-contain" : "object-cover";

  const heightClass =
    sliderHeight === "full" ? "h-[100dvh]"
    : sliderHeight === "small" ? "h-[40vh] min-h-[250px] md:h-[350px]"
    : sliderHeight === "medium" ? "h-[50vh] min-h-[350px] md:h-[500px]"
    : "h-[65vh] min-h-[450px] md:h-[700px]";

  useEffect(() => {
    setMounted(true);
  }, []);

  // --- SCROLL LOCK ---
  useEffect(() => {
    if (lightboxOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [lightboxOpen]);

  // --- YOUTUBE HELPERS ---
  const getThumbnail = (url: string) => {
    const ytId = getYoutubeId(url);
    if (ytId) return `https://img.youtube.com/vi/${ytId}/maxresdefault.jpg`;
    return null;
  };

  // --- NAVIGATION ---
  const nextSlide = () => setCurrent((prev) => (prev + 1) % videos.length);
  const prevSlide = () =>
    setCurrent((prev) => (prev - 1 + videos.length) % videos.length);

  const scrollCarousel = (direction: "left" | "right") => {
    if (carouselRef.current) {
      const amount = 350;
      carouselRef.current.scrollBy({
        left: direction === "left" ? -amount : amount,
        behavior: "smooth",
      });
    }
  };

  // --- LIGHTBOX ---
  const openLightbox = (index: number) => {
    // Don't open lightbox if they are just trying to click/edit something in the builder
    if (isPreview) return;
    setLightboxIndex(index);
    setLightboxOpen(true);
  };
  const closeLightbox = () => setLightboxOpen(false);

  // --- SUB-COMPONENT: VIDEO CARD ---
  const VideoCard = ({
    video,
    index,
    className,
  }: {
    video: any;
    index: number;
    className?: string;
  }) => {
    const isYoutube = !!getYoutubeId(video.url);
    const thumb = getThumbnail(video.url);

    return (
      <div
        className={cn(
          "group relative rounded-xl overflow-hidden bg-neutral-50 border border-black/10 shadow-lg cursor-pointer transition-transform hover:-translate-y-1 hover:shadow-2xl",
          className
        )}
        onClick={() => openLightbox(index)}
      >
        <div className="relative w-full h-full aspect-video bg-white">
          {isYoutube ? (
            <img
              src={thumb || ""}
              className={cn("w-full h-full opacity-70 group-hover:opacity-100 transition-opacity", fitClass)}
              alt={video.title}
            />
          ) : (
            <video
              src={video.url}
              className={cn("w-full h-full opacity-70 group-hover:opacity-100 transition-opacity", fitClass)}
              muted
              playsInline
              onContextMenu={(e) => e.preventDefault()}
            />
          )}

          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-black/5 backdrop-blur-md border border-black/20 flex items-center justify-center group-hover:scale-110 group-hover:bg-primary transition-all shadow-lg">
              <Play className="w-5 h-5 text-neutral-900 fill-white ml-1" />
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 via-black/60 to-transparent pointer-events-none">
          <h4 className="text-neutral-900 font-medium text-sm truncate">
            {video.title || "Untitled Video"}
          </h4>
          {video.caption && (
            <p className="text-neutral-500 text-xs truncate">{video.caption}</p>
          )}
        </div>
      </div>
    );
  };

  // Keep rendering the shell even if no videos exist so the user can edit the headers
  const hasVideos = videos.length > 0;

  const labelText = data.label !== undefined ? data.label : "WATCH";
  const titleText = data.title !== undefined ? data.title : "My Reels";
  const showHeader = isPreview || labelText.trim().length > 0 || titleText.trim().length > 0;

  return (
    <section className="py-20 bg-white text-neutral-900 relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay pointer-events-none"></div>

      <div className="container px-4 mx-auto relative z-10">
        {showHeader && (
          <div className="mb-10 text-center space-y-2">
            {(isPreview || labelText.trim().length > 0) && (
              <span className="inline-block text-xs font-bold tracking-[0.2em] text-primary uppercase">
                {/* 🚀 3. INLINE EDIT LABEL */}
                <InlineEdit
                  tagName="span"
                  text={labelText}
                  sectionId={id}
                  fieldKey="label"
                  isPreview={isPreview}
                />
              </span>
            )}
            {(isPreview || titleText.trim().length > 0) && (
              <InlineEdit
                tagName="h2"
                className="text-3xl md:text-5xl font-bold block"
                text={titleText}
                sectionId={id}
                fieldKey="title"
                isPreview={isPreview}
              />
            )}
          </div>
        )}

        {!hasVideos && isPreview && (
          <div className="w-full py-20 border-2 border-dashed border-black/20 rounded-2xl flex flex-col items-center justify-center text-neutral-500">
            <Play className="w-12 h-12 mb-4 opacity-50" />
            <p>No videos added yet. Click the "Edit" button to add videos.</p>
          </div>
        )}

        {hasVideos && (
          <>
            {/* === VARIANT 1: CINEMA SPOTLIGHT === */}
            {variant === "cinema" && (
              <div className="max-w-5xl mx-auto">
                <div className={cn("relative bg-white rounded-2xl overflow-hidden shadow-2xl border border-black/10 pointer-events-none w-full", heightClass)}>
                  {(() => {
                    const vid = videos[current];
                    const ytId = getYoutubeId(vid.url);
                    return ytId ? (
                      <iframe
                        src={`https://www.youtube.com/embed/${ytId}?rel=0`}
                        className={cn("w-full h-full pointer-events-auto", fitClass)}
                        allowFullScreen
                        title={vid.title}
                      />
                    ) : (
                      <video
                        src={vid.url}
                        className={cn("w-full h-full pointer-events-auto bg-white", fitClass)}
                        controls
                        controlsList="nodownload"
                        onContextMenu={(e) => e.preventDefault()}
                      />
                    );
                  })()}
                </div>
                <div className="flex items-center justify-between mt-6">
                  <div className="space-y-1">
                    <h3 className="text-2xl font-bold">
                      {videos[current].title}
                    </h3>
                    <p className="text-neutral-600">
                      {videos[current].caption}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={prevSlide}
                      className="rounded-full border-black/10 hover:bg-black/5 text-neutral-900"
                    >
                      <ChevronLeft />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={nextSlide}
                      className="rounded-full border-black/10 hover:bg-black/5 text-neutral-900"
                    >
                      <ChevronRight />
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* === VARIANT 2: CAROUSEL (Netflix Strip) === */}
            {variant === "carousel" && (
              <div className="relative group/carousel">
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-0 top-1/2 -translate-y-1/2 z-20 bg-white/50 hover:bg-black/80 text-neutral-900 h-14 w-14 opacity-0 group-hover/carousel:opacity-100 transition-all duration-300 backdrop-blur-md hidden md:flex rounded-r-xl rounded-l-none border-y border-r border-black/10 shadow-2xl"
                  onClick={() => scrollCarousel("left")}
                >
                  <ChevronLeft className="w-8 h-8" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-1/2 -translate-y-1/2 z-20 bg-white/50 hover:bg-black/80 text-neutral-900 h-14 w-14 opacity-0 group-hover/carousel:opacity-100 transition-all duration-300 backdrop-blur-md hidden md:flex rounded-l-xl rounded-r-none border-y border-l border-black/10 shadow-2xl"
                  onClick={() => scrollCarousel("right")}
                >
                  <ChevronRight className="w-8 h-8" />
                </Button>

                <div
                  ref={carouselRef}
                  className="flex overflow-x-auto gap-4 pb-8 snap-x snap-mandatory scrollbar-hide -mx-4 px-4 md:mx-0 flex-nowrap"
                >
                  {videos.map((vid: any, idx: number) => (
                    <div
                      key={idx}
                      className="snap-center shrink-0 w-[85vw] sm:w-[350px]"
                    >
                      <VideoCard
                        video={vid}
                        index={idx}
                        className="w-full h-full"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* === VARIANT 3: GRID (Video Wall) === */}
            {variant === "grid" && (
              <div
                className={cn(
                  "grid gap-6",
                  gridColumns === 2
                    ? "sm:grid-cols-2"
                    : gridColumns === 4
                    ? "sm:grid-cols-2 lg:grid-cols-4"
                    : "sm:grid-cols-2 lg:grid-cols-3"
                )}
              >
                {videos.map((vid: any, idx: number) => (
                  <div key={idx} className="aspect-video">
                    <VideoCard
                      video={vid}
                      index={idx}
                      className="w-full h-full"
                    />
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* --- LIGHTBOX (PORTAL FIX) --- */}
      {/* Ensure lightbox doesn't trigger when in preview/builder mode to prevent breaking iframe layout */}
      {mounted &&
        lightboxOpen &&
        !isPreview &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] w-screen h-screen bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 md:p-10"
            onClick={closeLightbox}
          >
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 text-neutral-600 hover:text-neutral-900 z-50 hover:bg-black/5 rounded-full h-12 w-12"
              onClick={closeLightbox}
            >
              <X className="w-8 h-8" />
            </Button>

            <div
              className="w-full max-w-6xl aspect-video bg-white rounded-xl overflow-hidden shadow-2xl relative ring-1 ring-black/10 animate-in zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              {(() => {
                const vid = videos[lightboxIndex];
                const ytId = getYoutubeId(vid.url);
                return ytId ? (
                  <iframe
                    src={`https://www.youtube.com/embed/${ytId}?autoplay=1&rel=0`}
                    className="w-full h-full"
                    allowFullScreen
                    allow="autoplay"
                  />
                ) : (
                  <video
                    src={vid.url}
                    className="w-full h-full"
                    controls
                    autoPlay
                    controlsList="nodownload"
                    onContextMenu={(e) => e.preventDefault()}
                  />
                );
              })()}
            </div>
          </div>,
          document.body
        )}
    </section>
  );
};

export default VideoSlider;
