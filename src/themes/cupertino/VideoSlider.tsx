import React from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, Play, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { UCP } from "@ucp/sdk";
import { SectionTitle } from "./SectionTitle";

export const schema = [
  { id: "variant", type: "select", label: "Layout", options: [{ value: "grid", label: "Grid" }, { value: "carousel", label: "Carousel" }, { value: "cinema", label: "Featured" }], defaultValue: "grid" },
  { id: "gridColumns", type: "select", label: "Grid Columns", options: ["2", "3", "4"], defaultValue: "3" },
];

export default function CupertinoVideoSlider({ data = {}, settings = {}, id, isPreview }: any) {
  const videos = data.videos || [];
  const variant = settings.variant || data.variant || "grid";
  const columns = Number(settings.gridColumns || data.gridColumns || 3);
  const gallery = UCP.useVideoGallery(videos, isPreview);
  const { carouselRef, scrollCarousel } = UCP.useCarousel();

  if (videos.length === 0) {
    return isPreview ? <div className="py-16 text-center text-sm text-slate-400">Add videos in the section editor.</div> : null;
  }

  const card = (v: any, i: number, className = "") => {
    const thumb = gallery.thumbnail(v.url);
    return (
      <button
        key={i}
        type="button"
        onClick={() => gallery.openLightbox(i)}
        aria-label={`Play ${v.title || "video"}`}
        className={cn("group relative block w-full overflow-hidden rounded-[2rem] bg-slate-900 text-left shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-transform duration-500 hover:-translate-y-1 motion-reduce:transition-none", className)}
      >
        <div className="relative aspect-video">
          {thumb ? (
            <img src={thumb} alt="" loading="lazy" className="h-full w-full object-cover opacity-80 transition-opacity group-hover:opacity-100" />
          ) : (
            <video src={v.url} muted playsInline preload="metadata" className="h-full w-full object-cover opacity-80 transition-opacity group-hover:opacity-100" />
          )}
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/90 shadow-lg backdrop-blur-md transition-transform group-hover:scale-110"><Play className="ml-1 h-6 w-6 fill-slate-900 text-slate-900" /></span>
          </span>
        </div>
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-5">
          <p className="truncate font-bold text-white">{v.title || "Untitled video"}</p>
          {v.caption && <p className="truncate text-sm text-white/70">{v.caption}</p>}
        </div>
      </button>
    );
  };

  const lightbox = gallery.lightboxOpen && gallery.lightboxVideo && typeof document !== "undefined"
    ? createPortal(
        <div role="dialog" aria-modal="true" aria-label={gallery.lightboxVideo.title || "Video"} className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4" onClick={gallery.closeLightbox}>
          <button type="button" aria-label="Close" onClick={gallery.closeLightbox} className="absolute right-5 top-5 rounded-full bg-white/10 p-3 text-white hover:bg-white/20"><X /></button>
          {videos.length > 1 && (
            <>
              <button type="button" aria-label="Previous video" onClick={(e) => { e.stopPropagation(); gallery.prevInLightbox(); }} className="absolute left-4 rounded-full bg-white/10 p-3 text-white hover:bg-white/20"><ChevronLeft /></button>
              <button type="button" aria-label="Next video" onClick={(e) => { e.stopPropagation(); gallery.nextInLightbox(); }} className="absolute right-4 rounded-full bg-white/10 p-3 text-white hover:bg-white/20"><ChevronRight /></button>
            </>
          )}
          <div className="aspect-video w-full max-w-5xl overflow-hidden rounded-3xl bg-black" onClick={(e) => e.stopPropagation()}>
            {gallery.isYoutube(gallery.lightboxVideo.url) ? (
              <iframe src={gallery.embedUrl(gallery.lightboxVideo.url)!} title={gallery.lightboxVideo.title || "Video"} allow="autoplay; encrypted-media; fullscreen" allowFullScreen className="h-full w-full border-0" />
            ) : (
              <video src={gallery.lightboxVideo.url} controls autoPlay playsInline className="h-full w-full" />
            )}
          </div>
        </div>,
        document.body
      )
    : null;

  return (
    <section className="py-24 md:py-32 px-6 bg-slate-50">
      <div className="mx-auto max-w-7xl">
        <SectionTitle data={data} id={id} isPreview={isPreview} />

        {variant === "grid" && (
          <div className={cn("grid gap-6 sm:grid-cols-2", columns === 2 && "lg:grid-cols-2", columns === 3 && "lg:grid-cols-3", columns === 4 && "lg:grid-cols-4")}>
            {videos.map((v: any, i: number) => card(v, i))}
          </div>
        )}

        {variant === "carousel" && (
          <div>
            <div className="mb-4 flex justify-end gap-2">
              <button type="button" aria-label="Previous" onClick={() => scrollCarousel("left")} className="rounded-full bg-white p-3 shadow"><ChevronLeft size={18} /></button>
              <button type="button" aria-label="Next" onClick={() => scrollCarousel("right")} className="rounded-full bg-white p-3 shadow"><ChevronRight size={18} /></button>
            </div>
            <div ref={carouselRef} className="flex snap-x snap-mandatory gap-6 overflow-x-auto pb-6 [&::-webkit-scrollbar]:hidden">
              {videos.map((v: any, i: number) => card(v, i, "w-[85vw] shrink-0 snap-center sm:w-[420px]"))}
            </div>
          </div>
        )}

        {variant === "cinema" && (
          <div className="space-y-6">
            {card(videos[gallery.current], gallery.current)}
            {videos.length > 1 && (
              <div className="flex items-center justify-center gap-3">
                <button type="button" aria-label="Previous" onClick={gallery.prev} className="rounded-full bg-white p-3 shadow"><ChevronLeft size={18} /></button>
                <span className="text-sm font-semibold text-slate-500">{gallery.current + 1} / {videos.length}</span>
                <button type="button" aria-label="Next" onClick={gallery.next} className="rounded-full bg-white p-3 shadow"><ChevronRight size={18} /></button>
              </div>
            )}
          </div>
        )}
      </div>
      {lightbox}
    </section>
  );
}
