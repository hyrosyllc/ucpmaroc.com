import React from "react";
import { cn } from "@/lib/utils";
import { UCP } from "@ucp/sdk";
import { SectionTitle } from "./SectionTitle";

export const schema = [
  { id: "layout", type: "select", label: "Layout", options: [{ value: "grid", label: "Grid" }, { value: "carousel", label: "Carousel" }], defaultValue: "grid" },
  { id: "cardStyle", type: "select", label: "Card Style", options: ["elevated", "glass", "flat-bordered"], defaultValue: "elevated" },
];

export default function CupertinoTestimonials({ data = {}, settings = {}, id, isPreview }: any) {
  const items = (data.items || []).filter((i: any) => i?.quote);
  const { carouselRef, scrollCarousel } = UCP.useCarousel();
  const carousel = settings.layout === "carousel";
  const card =
    settings.cardStyle === "glass" ? "bg-white/50 backdrop-blur-xl border border-white shadow-lg"
    : settings.cardStyle === "flat-bordered" ? "bg-white border border-slate-200"
    : "bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)]";

  if (items.length === 0) {
    return isPreview ? <div className="py-12 text-center text-sm text-slate-400">Add testimonials in the section editor.</div> : null;
  }

  const figure = (t: any, i: number) => (
    <figure key={i} className={cn("flex h-full flex-col rounded-[2rem] p-8", card, carousel && "w-[85vw] shrink-0 snap-center sm:w-[380px]")}>
      <blockquote className="flex-1 text-lg font-medium leading-relaxed text-slate-700 whitespace-pre-line">“{t.quote}”</blockquote>
      <figcaption className="mt-8 flex items-center gap-3">
        {t.avatar && <img src={t.avatar} alt="" loading="lazy" className="h-12 w-12 rounded-full object-cover" />}
        <div>
          <div className="font-bold text-slate-900">{t.name}</div>
          {t.role && <div className="text-sm font-medium text-slate-400">{t.role}</div>}
        </div>
      </figcaption>
    </figure>
  );

  return (
    <section className="py-24 md:py-32 px-6 bg-slate-50">
      <div className="mx-auto max-w-7xl">
        <SectionTitle data={data} id={id} isPreview={isPreview} />
        {carousel ? (
          <div className="relative">
            <div className="mb-4 flex justify-end gap-2">
              <button type="button" aria-label="Previous" onClick={() => scrollCarousel("left")} className="rounded-full bg-white px-4 py-2 font-bold shadow">‹</button>
              <button type="button" aria-label="Next" onClick={() => scrollCarousel("right")} className="rounded-full bg-white px-4 py-2 font-bold shadow">›</button>
            </div>
            <div ref={carouselRef} className="flex snap-x snap-mandatory gap-6 overflow-x-auto pb-6 [&::-webkit-scrollbar]:hidden">{items.map(figure)}</div>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{items.map(figure)}</div>
        )}
      </div>
    </section>
  );
}
