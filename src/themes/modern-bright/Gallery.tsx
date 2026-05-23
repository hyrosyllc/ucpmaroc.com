import React, { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Play,
  Image as ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { InlineEdit } from "../../components/dashboard/InlineEdit";
import { getYoutubeId } from "./utils";

const Gallery: React.FC<any> = ({ data, settings = {}, id, isPreview }) => {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);

  const images = data.images || [];
  const hasImages = images.length > 0;
  const variant = settings.variant || data.variant || "masonry";

  // HIDE ON LIVE SITE IF EMPTY
  if (!hasImages && !isPreview) return null;

  // 🚀 AAA+ Aspect Ratios & Grids
  const aspectRatio = settings.aspectRatio || data.aspectRatio || "square";
  const aspectClass =
    aspectRatio === "portrait"
      ? "aspect-[4/5]"
      : aspectRatio === "landscape"
      ? "aspect-video"
      : "aspect-square";

  const gridColumns = Number(settings.gridColumns) || data.gridColumns || 3;
  const gridColsClass =
    gridColumns === 2
      ? "grid-cols-1 sm:grid-cols-2"
      : gridColumns === 4
      ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-4"
      : "grid-cols-1 sm:grid-cols-2 md:grid-cols-3"; // Default 3

  // --- SCROLL BUTTON LOGIC ---
  const scrollCarousel = (direction: "left" | "right") => {
    if (carouselRef.current) {
      const scrollAmount = carouselRef.current.clientWidth * 0.6;
      carouselRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  // --- LIGHTBOX LOGIC ---
  const openLightbox = (index: number) => {
    if (isPreview) return; // Prevent getting trapped in builder
    setCurrentIndex(index);
    setLightboxOpen(true);
    document.body.style.overflow = "hidden";
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
    document.body.style.overflow = "auto";
  };

  const nextImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!lightboxOpen) return;
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowRight") nextImage();
      if (e.key === "ArrowLeft") prevImage();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxOpen]);

  // 🚀 SMART MEDIA HELPERS
  const isVideo = (url: string) => url.match(/\.(mp4|webm|mov)$/i);

  // --- SUB-COMPONENT: GALLERY ITEM ---
  const GalleryItem = ({
    img,
    index,
    className,
    imageClass,
  }: {
    img: any;
    index: number;
    className?: string;
    imageClass?: string;
  }) => {
    const ytId = getYoutubeId(img.url);

    return (
      <div
        className={cn(
          "group relative overflow-hidden bg-neutral-50 mb-4 break-inside-avoid",
          "rounded-2xl border border-black/5 shadow-lg transition-all duration-700 hover:shadow-2xl hover:border-black/20 hover:-translate-y-1",
          isPreview ? "cursor-default" : "cursor-zoom-in",
          className
        )}
        onClick={() => openLightbox(index)}
      >
        {/* 🚀 SMART RENDERING: YouTube vs MP4 vs Image */}
        {ytId ? (
          <div className="relative w-full h-full bg-white">
            <img
              src={`https://img.youtube.com/vi/${ytId}/hqdefault.jpg`}
              className={cn(
                "w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity duration-500",
                imageClass
              )}
              alt="YouTube Thumbnail"
            />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="bg-red-600/90 backdrop-blur-md p-3 rounded-xl border border-black/10 group-hover:scale-110 transition-transform duration-500 shadow-lg">
                <Play className="w-6 h-6 text-neutral-900 fill-white ml-0.5" />
              </div>
            </div>
          </div>
        ) : isVideo(img.url) ? (
          <div className="relative w-full h-full bg-white">
            <video
              src={img.url}
              className={cn(
                "w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity duration-500",
                imageClass
              )}
              muted
              autoPlay
              loop
              playsInline
            />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="bg-black/40 backdrop-blur-md p-3 rounded-full border border-black/20 group-hover:scale-110 transition-transform duration-500">
                <Play className="w-5 h-5 text-neutral-900 fill-white ml-0.5" />
              </div>
            </div>
          </div>
        ) : (
          <img
            src={img.url}
            alt="Gallery"
            loading="lazy"
            className={cn(
              "w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 filter grayscale-[15%] group-hover:grayscale-0",
              imageClass
            )}
          />
        )}

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none flex items-end p-4">
          <Maximize2 className="w-5 h-5 text-neutral-900 opacity-80 absolute top-4 right-4" />
        </div>
      </div>
    );
  };

  // --- MAIN RENDER ---
  return (
    <section className="py-24 md:py-32 bg-white text-neutral-900 relative overflow-hidden">
      {/* Atmosphere Layers */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay pointer-events-none"></div>

      <div className="container px-6 mx-auto relative z-10 max-w-7xl">
        {/* HEADER SECTION */}
        <div className="mb-16 text-center space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <InlineEdit
            tagName="h2"
            className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight block"
            text={data.title || "Gallery"}
            sectionId={id}
            fieldKey="title"
            isPreview={isPreview}
          />
          <div className="h-1 w-24 bg-gradient-to-r from-primary to-transparent mx-auto rounded-full" />
        </div>

        {/* 🚀 EMPTY STATE UX FOR BUILDER */}
        {!hasImages && isPreview && (
          <div className="w-full py-24 border-2 border-dashed border-black/10 rounded-3xl flex flex-col items-center justify-center text-white/40 bg-black/5 backdrop-blur-sm">
            <ImageIcon className="w-12 h-12 mb-4 opacity-50" />
            <p className="font-medium tracking-wide">No media uploaded yet.</p>
            <p className="text-xs mt-2 opacity-70">
              Hover over this section and click "Design" to add images.
            </p>
          </div>
        )}

        {hasImages && (
          <>
            {/* --- VARIANT 1: MASONRY --- */}
            {variant === "masonry" && (
              <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
                {images.map((img: any, idx: number) => (
                  <GalleryItem
                    key={idx}
                    img={img}
                    index={idx}
                    className="w-full"
                  />
                ))}
              </div>
            )}

            {/* --- VARIANT 2: GRID --- */}
            {variant === "grid" && (
              <div className={cn("grid gap-4 md:gap-6", gridColsClass)}>
                {images.map((img: any, idx: number) => (
                  <GalleryItem
                    key={idx}
                    img={img}
                    index={idx}
                    className={cn("w-full mb-0", aspectClass)}
                  />
                ))}
              </div>
            )}

            {/* --- VARIANT 3: CAROUSEL --- */}
            {variant === "carousel" && (
              <div className="relative group/carousel -mx-6 px-6 md:mx-0 md:px-0">
                <button
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center bg-white/50 hover:bg-black/80 text-neutral-900 rounded-full h-12 w-12 opacity-0 group-hover/carousel:opacity-100 transition-all duration-300 backdrop-blur-md hidden md:flex border border-black/10 shadow-2xl hover:scale-105"
                  onClick={() => scrollCarousel("left")}
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>

                <button
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center bg-white/50 hover:bg-black/80 text-neutral-900 rounded-full h-12 w-12 opacity-0 group-hover/carousel:opacity-100 transition-all duration-300 backdrop-blur-md hidden md:flex border border-black/10 shadow-2xl hover:scale-105"
                  onClick={() => scrollCarousel("right")}
                >
                  <ChevronRight className="w-6 h-6" />
                </button>

                <div
                  ref={carouselRef}
                  className="flex overflow-x-auto gap-4 md:gap-6 pb-8 pt-4 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']"
                >
                  {images.map((img: any, idx: number) => (
                    <div
                      key={idx}
                      className="snap-center shrink-0 h-[400px] md:h-[600px] shadow-2xl"
                    >
                      <GalleryItem
                        img={img}
                        index={idx}
                        className="h-full w-auto aspect-auto mb-0 rounded-2xl"
                        imageClass="w-auto h-full object-contain md:object-cover min-w-[250px]"
                      />
                    </div>
                  ))}
                </div>

                {/* Fade edges for carousel */}
                <div className="absolute top-0 right-0 h-full w-32 bg-gradient-to-l from-white to-transparent pointer-events-none md:block hidden z-10" />
                <div className="absolute top-0 left-0 h-full w-32 bg-gradient-to-r from-white to-transparent pointer-events-none md:block hidden z-10" />
              </div>
            )}
          </>
        )}
      </div>

      {/* --- LIGHTBOX --- */}
      {lightboxOpen &&
        !isPreview &&
        (() => {
          const currentImg = images[currentIndex];
          const activeYtId = getYoutubeId(currentImg.url);

          return (
            <div
              className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-xl flex items-center justify-center animate-in fade-in duration-300"
              onClick={closeLightbox}
            >
              <button
                className="absolute top-4 right-4 text-neutral-600 hover:text-neutral-900 z-[99] p-2 transition-colors"
                onClick={closeLightbox}
              >
                <X className="w-8 h-8" />
              </button>

              <button
                className="absolute left-6 top-1/2 -translate-y-1/2 z-[99] h-14 w-14 rounded-full flex items-center justify-center bg-black/40 border border-black/10 hover:border-black/20 hover:scale-105 active:scale-95 transition-all text-neutral-600 hover:text-neutral-900"
                onClick={prevImage}
              >
                <ChevronLeft className="w-9 h-9" />
              </button>

              <button
                className="absolute right-6 top-1/2 -translate-y-1/2 z-[99] h-14 w-14 rounded-full flex items-center justify-center bg-black/40 border border-black/10 hover:border-black/20 hover:scale-105 active:scale-95 transition-all text-neutral-600 hover:text-neutral-900"
                onClick={nextImage}
              >
                <ChevronRight className="w-9 h-9" />
              </button>

              <div
                className="relative max-w-7xl max-h-[90vh] w-full p-4 flex flex-col items-center justify-center"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="relative shadow-2xl rounded-xl overflow-hidden ring-1 ring-black/10 flex items-center justify-center w-full">
                  {/* 🚀 THE SMART LIGHTBOX PLAYER */}
                  {activeYtId ? (
                    <iframe
                      src={`https://www.youtube.com/embed/${activeYtId}?autoplay=1&rel=0`}
                      className="w-full aspect-video max-w-5xl bg-white rounded-lg"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : isVideo(currentImg.url) ? (
                    <video
                      src={currentImg.url}
                      className="max-w-full max-h-[80vh] object-contain bg-white"
                      controls
                      autoPlay
                      loop
                      playsInline
                    />
                  ) : (
                    <img
                      src={currentImg.url}
                      alt="Full Screen"
                      className="max-w-full max-h-[80vh] object-contain"
                    />
                  )}
                </div>

                <div className="absolute bottom-4 left-0 right-0 text-center text-neutral-500 text-sm font-mono tracking-widest">
                  {currentIndex + 1} / {images.length}
                </div>
              </div>
            </div>
          );
        })()}
    </section>
  );
};

export default Gallery;
