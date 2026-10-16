import React from "react";
import { ChevronLeft, ChevronRight, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { UCP } from "@ucp/sdk";
import { SectionTitle } from "./SectionTitle";

export const schema = [
  { id: "variant", type: "select", label: "Layout", options: [{ value: "standard", label: "Slideshow" }, { value: "carousel", label: "Carousel" }, { value: "cards", label: "Grid" }], defaultValue: "standard" },
  { id: "height", type: "select", label: "Height", options: ["small", "medium", "large", "full"], defaultValue: "large" },
  { id: "imageFit", type: "select", label: "Image Fit", options: ["cover", "contain"], defaultValue: "cover" },
  { id: "interval", type: "slider", min: 0, max: 15, label: "Autoplay (seconds, 0 = off)", defaultValue: 5 },
];

const HEIGHT: Record<string, string> = {
  small: "h-[40vh] min-h-[250px] md:h-[350px]",
  medium: "h-[50vh] min-h-[350px] md:h-[500px]",
  large: "h-[65vh] min-h-[450px] md:h-[700px]",
  full: "h-[100dvh]",
};

export default function CupertinoImageSlider({ data = {}, settings = {}, id, isPreview }: any) {
  const images: Array<{ url: string; caption?: string }> = data.images || [];
  const variant = settings.variant || data.variant || "standard";
  const height = HEIGHT[settings.height || data.height || "large"];
  const fit = (settings.imageFit || data.imageFit) === "contain" ? "object-contain" : "object-cover";
  const interval = settings.interval ?? data.interval ?? 5;

  const slider = UCP.useSlider(images.length, { intervalSeconds: interval, autoplay: !isPreview && variant === "standard" });
  const { carouselRef, scrollCarousel } = UCP.useCarousel();

  if (images.length === 0) {
    if (!isPreview) return null;
    return (
      <section className="py-24 px-6 bg-slate-50">
        <div className={cn("mx-auto flex max-w-5xl flex-col items-center justify-center rounded-[2rem] border-2 border-dashed border-slate-300 text-slate-400", "h-64")}>
          <ImageIcon className="mb-3 h-10 w-10" />
          <p>No images yet. Click Edit to add some.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 md:py-24 px-6 bg-slate-50">
      <div className="mx-auto max-w-7xl">
        <SectionTitle data={data} id={id} isPreview={isPreview} />

        {variant === "standard" && (
          <div className={cn("relative w-full overflow-hidden rounded-[2.5rem] bg-slate-900 shadow-[0_20px_60px_rgb(0,0,0,0.12)]", height)}>
            {images.map((img, i) => (
              <figure key={i} aria-hidden={i !== slider.current} className={cn("absolute inset-0 transition-opacity duration-700 motion-reduce:transition-none", i === slider.current ? "opacity-100" : "opacity-0")}>
                <img src={img.url} alt={img.caption || `Slide ${i + 1}`} className={cn("h-full w-full", fit)} />
                {img.caption && <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-8 text-lg font-semibold text-white">{img.caption}</figcaption>}
              </figure>
            ))}
            {images.length > 1 && (
              <>
                <button type="button" aria-label="Previous slide" onClick={slider.prev} className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-3 shadow-lg backdrop-blur-md hover:bg-white"><ChevronLeft size={20} /></button>
                <button type="button" aria-label="Next slide" onClick={slider.next} className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-3 shadow-lg backdrop-blur-md hover:bg-white"><ChevronRight size={20} /></button>
                <div className="absolute bottom-5 left-0 right-0 flex justify-center gap-2">
                  {images.map((_, i) => (
                    <button key={i} type="button" aria-label={`Go to slide ${i + 1}`} aria-current={i === slider.current} onClick={() => slider.goTo(i)} className={cn("h-2 rounded-full transition-all", i === slider.current ? "w-6 bg-white" : "w-2 bg-white/60")} />
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {variant === "carousel" && (
          <div className="relative">
            <div className="mb-4 flex justify-end gap-2">
              <button type="button" aria-label="Previous" onClick={() => scrollCarousel("left")} className="rounded-full bg-white p-3 shadow"><ChevronLeft size={18} /></button>
              <button type="button" aria-label="Next" onClick={() => scrollCarousel("right")} className="rounded-full bg-white p-3 shadow"><ChevronRight size={18} /></button>
            </div>
            <div ref={carouselRef} className="flex snap-x snap-mandatory gap-6 overflow-x-auto pb-6 [&::-webkit-scrollbar]:hidden">
              {images.map((img, i) => (
                <figure key={i} className="w-[85vw] shrink-0 snap-center overflow-hidden rounded-[2rem] bg-white shadow-[0_8px_30px_rgb(0,0,0,0.06)] sm:w-[420px]">
                  <img src={img.url} alt={img.caption || `Image ${i + 1}`} loading="lazy" className={cn("aspect-[4/3] w-full", fit)} />
                  {img.caption && <figcaption className="p-5 font-semibold text-slate-700">{img.caption}</figcaption>}
                </figure>
              ))}
            </div>
          </div>
        )}

        {variant === "cards" && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {images.map((img, i) => (
              <figure key={i} className="overflow-hidden rounded-[2rem] bg-white shadow-[0_8px_30px_rgb(0,0,0,0.06)]">
                <img src={img.url} alt={img.caption || `Image ${i + 1}`} loading="lazy" className={cn("aspect-[4/3] w-full", fit)} />
                {img.caption && <figcaption className="p-5 font-semibold text-slate-700">{img.caption}</figcaption>}
              </figure>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
