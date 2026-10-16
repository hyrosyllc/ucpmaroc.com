import React from "react";
import { createPortal } from "react-dom";
import { Star, X, Video as VideoIcon, MessageSquareText } from "lucide-react";
import { cn } from "@/lib/utils";
import { UCP } from "@ucp/sdk";
import { SectionTitle } from "./SectionTitle";

export const schema = [
  { id: "variant", type: "select", label: "Layout", options: [{ value: "grid", label: "Grid" }, { value: "carousel", label: "Carousel" }], defaultValue: "grid" },
  { id: "cardStyle", type: "select", label: "Card Style", options: ["elevated", "glass", "flat-bordered"], defaultValue: "elevated" },
];

const Stars = ({ value }: { value: number }) => (
  <div className="flex gap-1" role="img" aria-label={`${value} out of 5 stars`}>
    {[0, 1, 2, 3, 4].map((i) => <Star key={i} size={18} className={cn("fill-current", i < value ? "text-amber-400" : "text-slate-200")} />)}
  </div>
);

export default function CupertinoReviews({ data = {}, settings = {}, id, isPreview, portfolioId }: any) {
  const r = UCP.useReviews({ portfolioId, isPreview });
  const { carouselRef, scrollCarousel } = UCP.useCarousel();
  const carousel = (settings.variant || data.variant) === "carousel";
  const showText = data.showTextReviews !== false;
  const showVideo = data.showVideoReviews !== false;
  const card =
    settings.cardStyle === "glass" ? "bg-white/50 backdrop-blur-xl border border-white shadow-lg"
    : settings.cardStyle === "flat-bordered" ? "bg-white border border-slate-200"
    : "bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)]";

  if (!r.loading && r.reviews.length === 0 && !isPreview && data.allowSubmissions === false) return null;

  const textCard = (rev: any) => {
    const images: string[] = rev.images?.length ? rev.images : rev.image_url ? [rev.image_url] : [];
    return (
      <figure key={rev.id} className={cn("flex h-full flex-col rounded-[2rem] p-8", card, carousel && "w-[85vw] shrink-0 snap-center sm:w-[380px]")}>
        <Stars value={rev.rating || 5} />
        {rev.title && <h4 className="mt-4 text-xl font-[800] tracking-tight text-slate-900">{rev.title}</h4>}
        <blockquote className="mt-2 flex-1 whitespace-pre-line font-medium leading-relaxed text-slate-600">“{rev.content}”</blockquote>
        {images.length > 0 && (
          <div className="mt-5 flex gap-2 overflow-x-auto">
            {images.map((src, i) => <img key={i} src={src} alt="" loading="lazy" className="h-20 w-20 shrink-0 rounded-2xl object-cover" />)}
          </div>
        )}
        <figcaption className="mt-6 flex items-center gap-3 border-t border-slate-100 pt-5">
          {rev.reviewer_avatar && <img src={rev.reviewer_avatar} alt="" className="h-9 w-9 rounded-full object-cover" />}
          <span className="font-bold text-slate-800">{rev.reviewer_name}</span>
        </figcaption>
      </figure>
    );
  };

  const videoCard = (rev: any) => (
    <figure key={rev.id} className={cn("overflow-hidden rounded-[2rem]", card, carousel && "w-[85vw] shrink-0 snap-center sm:w-[380px]")}>
      <video src={rev.video_url} controls playsInline preload="metadata" className="aspect-video w-full bg-black" />
      <figcaption className="p-5"><Stars value={rev.rating || 5} /><p className="mt-2 font-bold text-slate-800">{rev.reviewer_name}</p></figcaption>
    </figure>
  );

  const list = (items: any[], render: (r: any) => React.ReactNode) =>
    carousel ? (
      <div>
        <div className="mb-4 flex justify-end gap-2">
          <button type="button" aria-label="Previous" onClick={() => scrollCarousel("left")} className="rounded-full bg-white px-4 py-2 font-bold shadow">‹</button>
          <button type="button" aria-label="Next" onClick={() => scrollCarousel("right")} className="rounded-full bg-white px-4 py-2 font-bold shadow">›</button>
        </div>
        <div ref={carouselRef} className="flex snap-x snap-mandatory gap-6 overflow-x-auto pb-6 [&::-webkit-scrollbar]:hidden">{items.map(render)}</div>
      </div>
    ) : (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{items.map(render)}</div>
    );

  const input = "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 font-medium text-slate-900";

  const modal = r.isFormOpen && typeof document !== "undefined"
    ? createPortal(
        <div role="dialog" aria-modal="true" aria-label="Write a review" className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4" onClick={r.closeForm}>
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-[2rem] bg-white p-8 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-6 flex items-start justify-between">
              <h3 className="text-2xl font-[800] tracking-tight text-slate-900">Share your experience</h3>
              <button type="button" aria-label="Close" onClick={r.closeForm} className="rounded-full p-2 hover:bg-slate-100"><X size={18} /></button>
            </div>
            {r.success ? (
              <div className="py-8 text-center" role="status">
                <p className="text-xl font-bold text-slate-900">Thank you!</p>
                <p className="mt-2 text-slate-500">Your review will appear once it has been approved.</p>
                <button type="button" onClick={r.closeForm} className="mt-6 rounded-full bg-slate-900 px-6 py-3 font-bold text-white">Close</button>
              </div>
            ) : r.step === "select_type" ? (
              <div className="grid gap-3">
                <button type="button" onClick={() => { r.setReviewType("text_media"); r.setStep("form"); }} className="flex items-center gap-3 rounded-2xl border border-slate-200 p-5 text-left font-bold hover:border-slate-900"><MessageSquareText /> Written review with photos</button>
                <button type="button" onClick={() => { r.setReviewType("video"); r.setStep("form"); }} className="flex items-center gap-3 rounded-2xl border border-slate-200 p-5 text-left font-bold hover:border-slate-900"><VideoIcon /> Video review</button>
              </div>
            ) : (
              <form onSubmit={r.submit} className="space-y-4">
                <label className="block text-sm font-semibold text-slate-600">Your name<input required className={input} value={r.draft.name} onChange={(e) => r.setDraft({ ...r.draft, name: e.target.value })} /></label>
                <div>
                  <span className="mb-1 block text-sm font-semibold text-slate-600">Rating</span>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button key={n} type="button" aria-label={`${n} stars`} aria-pressed={r.draft.rating === n} onClick={() => r.setDraft({ ...r.draft, rating: n })}>
                        <Star size={28} className={cn("fill-current", n <= r.draft.rating ? "text-amber-400" : "text-slate-200")} />
                      </button>
                    ))}
                  </div>
                </div>
                {r.reviewType === "text_media" ? (
                  <>
                    <label className="block text-sm font-semibold text-slate-600">Title<input className={input} value={r.draft.title} onChange={(e) => r.setDraft({ ...r.draft, title: e.target.value })} /></label>
                    <label className="block text-sm font-semibold text-slate-600">Review<textarea required rows={4} className={input} value={r.draft.content} onChange={(e) => r.setDraft({ ...r.draft, content: e.target.value })} /></label>
                    <label className="block text-sm font-semibold text-slate-600">Photos (optional)<input type="file" accept="image/*" multiple onChange={(e) => r.uploadMedia(e, "image")} className="mt-1 block w-full text-sm" /></label>
                  </>
                ) : (
                  <label className="block text-sm font-semibold text-slate-600">Video<input required={!r.draft.video_url} type="file" accept="video/*" onChange={(e) => r.uploadMedia(e, "video")} className="mt-1 block w-full text-sm" /></label>
                )}
                {r.uploading && <p role="status" className="text-sm text-slate-500">Uploading…</p>}
                {r.error && <p role="alert" className="text-sm font-medium text-red-600">{r.error}</p>}
                <button type="submit" disabled={r.isSubmitting || r.uploading} className="w-full rounded-full bg-slate-900 px-6 py-3.5 font-bold text-white disabled:opacity-60">{r.isSubmitting ? "Sending…" : "Submit review"}</button>
              </form>
            )}
          </div>
        </div>,
        document.body
      )
    : null;

  return (
    <section className="py-24 md:py-32 px-6 bg-slate-50">
      <div className="mx-auto max-w-7xl">
        <SectionTitle data={data} id={id} isPreview={isPreview} fallback="What people say" />
        {r.reviews.length > 0 && (
          <p className="-mt-8 mb-12 text-center font-semibold text-slate-500">{r.average.toFixed(1)} average · {r.reviews.length} review{r.reviews.length === 1 ? "" : "s"}</p>
        )}

        {r.loading ? (
          <p role="status" className="py-12 text-center text-slate-400">Loading reviews…</p>
        ) : r.reviews.length === 0 ? (
          <p className="py-12 text-center text-slate-400">No reviews yet. Be the first.</p>
        ) : (
          <div className="space-y-12">
            {showText && r.textReviews.length > 0 && list(r.textReviews, textCard)}
            {showVideo && r.videoReviews.length > 0 && list(r.videoReviews, videoCard)}
          </div>
        )}

        {data.allowSubmissions !== false && (
          <div className="mt-12 text-center">
            <button type="button" onClick={r.openForm} className="rounded-full bg-slate-900 px-8 py-4 font-bold text-white transition hover:scale-105 active:scale-95">Write a review</button>
          </div>
        )}
      </div>
      {modal}
    </section>
  );
}
