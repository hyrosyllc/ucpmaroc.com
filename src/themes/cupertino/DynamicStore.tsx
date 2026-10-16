import React from "react";
import { ChevronLeft, ChevronRight, Loader2, ShoppingBag, Store } from "lucide-react";
import { cn } from "@/lib/utils";
import { UCP } from "@ucp/sdk";
import { SectionTitle } from "./SectionTitle";

export const schema = [
  { id: "variant", type: "select", label: "Layout", options: [{ value: "grid", label: "Grid" }, { value: "bento", label: "Bento" }, { value: "carousel", label: "Carousel" }, { value: "spotlight", label: "Spotlight" }], defaultValue: "grid" },
  { id: "spotlightAction", type: "select", label: "Spotlight Action", options: [{ value: "inline", label: "Inline checkout & cart" }, { value: "redirect", label: "Open product page" }], defaultValue: "inline", showIf: (s: any) => (s.variant || "grid") === "spotlight" },
];

const ACTION_LABEL = { link: "View", options: "Options", add: "Add to cart" } as const;

function ProductCard({ product, isPreview, portfolioId, bento }: any) {
  const p = UCP.useProductCard(product, { isPreview, portfolioId });
  const action = (e: React.MouseEvent) => {
    e.stopPropagation();
    p.quickAction();
  };

  return (
    <div
      role="link"
      tabIndex={0}
      onClick={p.open}
      onKeyDown={(e) => e.key === "Enter" && p.open()}
      className="group relative flex h-full cursor-pointer flex-col overflow-hidden rounded-[2rem] bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_20px_40px_rgb(0,0,0,0.1)] motion-reduce:transition-none"
    >
      <div className={cn("relative overflow-hidden bg-slate-100", bento ? "h-full min-h-[240px]" : "aspect-[4/3]")}>
        {p.image ? <img src={p.image} alt={product.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" /> : <div className="flex h-full items-center justify-center text-slate-300"><ShoppingBag size={48} /></div>}
        {p.onSale && <span className="absolute left-4 top-4 rounded-full bg-slate-900 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white">Sale</span>}
      </div>
      <div className={cn("flex flex-col gap-3 p-6", bento && "absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent text-white")}>
        <h3 className={cn("line-clamp-1 text-xl font-[800] tracking-tight", bento ? "text-white" : "text-slate-900")}>{product.title}</h3>
        {!bento && product.description && <p className="line-clamp-2 text-sm font-medium text-slate-500">{product.description}</p>}
        <div className="mt-auto flex items-center justify-between gap-3">
          <span className={cn("text-lg font-bold", bento ? "text-white" : "text-slate-900")}>${p.price.toFixed(2)}</span>
          <button type="button" onClick={action} className="rounded-full bg-slate-900 px-5 py-2 text-sm font-bold text-white transition hover:scale-105 active:scale-95">{ACTION_LABEL[p.actionKind]}</button>
        </div>
      </div>
    </div>
  );
}

function Spotlight({ product, isPreview, portfolioId, redirect }: any) {
  const s = UCP.useProductSpotlight(product, { isPreview, portfolioId });
  return (
    <div className="grid overflow-hidden rounded-[2.5rem] bg-white shadow-[0_20px_60px_rgb(0,0,0,0.08)] lg:grid-cols-2">
      <div className="relative min-h-[320px] bg-slate-100">
        {s.images.length > 0 ? <img src={s.images[s.activeImg]} alt={product.title} className="absolute inset-0 h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-slate-300"><ShoppingBag size={72} /></div>}
        {s.images.length > 1 && (
          <>
            <button type="button" aria-label="Previous image" onClick={s.prevImage} className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-3 shadow-lg"><ChevronLeft size={18} /></button>
            <button type="button" aria-label="Next image" onClick={s.nextImage} className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-3 shadow-lg"><ChevronRight size={18} /></button>
          </>
        )}
      </div>
      <div className="flex flex-col justify-center p-8 lg:p-12">
        <h3 className="text-3xl font-[800] tracking-tighter text-slate-900 lg:text-4xl">{product.title}</h3>
        <p className="mt-3 text-3xl font-bold text-slate-900">${s.currentPrice.toFixed(2)}</p>
        {product.description && <p className="mt-4 line-clamp-4 font-medium leading-relaxed text-slate-500">{product.description}</p>}

        {!redirect && product.options?.map((opt: any) => (
          <div key={opt.name} className="mt-6">
            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-400">{opt.name}</p>
            <div className="flex flex-wrap gap-2">
              {(opt.values || []).map((v: any) => (
                <button key={v.label} type="button" aria-pressed={s.selectedVariants[opt.name]?.label === v.label} onClick={() => s.selectVariant(opt.name, v)} className={cn("rounded-full border px-4 py-2 text-sm font-bold transition", s.selectedVariants[opt.name]?.label === v.label ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 text-slate-700 hover:border-slate-900")}>{v.label}</button>
              ))}
            </div>
          </div>
        ))}

        {redirect ? (
          <button type="button" onClick={s.openProductPage} className="mt-8 rounded-full bg-slate-900 px-8 py-4 font-bold text-white">View product</button>
        ) : (
          <div className="mt-8 flex items-center gap-4">
            <div className="flex items-center rounded-full border border-slate-200">
              <button type="button" aria-label="Decrease quantity" onClick={() => s.setQuantity((q) => Math.max(1, q - 1))} className="px-4 py-3 font-bold">−</button>
              <span className="w-8 text-center font-bold" aria-live="polite">{s.quantity}</span>
              <button type="button" aria-label="Increase quantity" onClick={() => s.setQuantity((q) => q + 1)} className="px-4 py-3 font-bold">+</button>
            </div>
            <button type="button" disabled={s.isOutOfStock} onClick={s.act} className="flex-1 rounded-full bg-slate-900 px-8 py-4 font-bold text-white transition hover:scale-[1.02] active:scale-95 disabled:opacity-50">{s.isOutOfStock ? "Out of stock" : "Add to cart"}</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CupertinoDynamicStore({ data = {}, settings = {}, id, isPreview, actorId, portfolioId }: any) {
  const { products, loading } = UCP.useStoreProducts({ data, actorId, portfolioId });
  const { carouselRef, scrollCarousel } = UCP.useCarousel();
  const variant = settings.variant || data.variant || "grid";
  const redirect = (settings.spotlightAction || data.spotlightAction) === "redirect";

  if (!loading && products.length === 0 && !isPreview) return null;

  return (
    <section id="store" className="bg-slate-50 px-6 py-24 md:py-32">
      <div className="mx-auto max-w-7xl">
        {variant !== "spotlight" && <SectionTitle data={data} id={id} isPreview={isPreview} fallback="Store" />}

        {loading ? (
          <div className="flex justify-center py-20" role="status"><Loader2 className="h-8 w-8 animate-spin text-slate-400" /></div>
        ) : products.length === 0 ? (
          <div className="mx-auto max-w-xl rounded-[2rem] border-2 border-dashed border-slate-300 py-20 text-center text-slate-400">
            <Store className="mx-auto mb-3 h-10 w-10" />
            <p className="font-bold">No products yet</p>
            <p className="text-sm">Create products in your dashboard and they appear here.</p>
          </div>
        ) : (
          <>
            {variant === "grid" && <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{products.map((p) => <ProductCard key={p.id} product={p} isPreview={isPreview} portfolioId={portfolioId} />)}</div>}
            {variant === "bento" && (
              <div className="grid auto-rows-[300px] gap-4 md:grid-cols-4">
                {products.map((p, i) => <div key={p.id} className={cn(i === 0 && "md:col-span-2 md:row-span-2")}><ProductCard product={p} isPreview={isPreview} portfolioId={portfolioId} bento /></div>)}
              </div>
            )}
            {variant === "carousel" && (
              <div>
                <div className="mb-4 flex justify-end gap-2">
                  <button type="button" aria-label="Previous" onClick={() => scrollCarousel("left")} className="rounded-full bg-white p-3 shadow"><ChevronLeft size={18} /></button>
                  <button type="button" aria-label="Next" onClick={() => scrollCarousel("right")} className="rounded-full bg-white p-3 shadow"><ChevronRight size={18} /></button>
                </div>
                <div ref={carouselRef} className="flex snap-x snap-mandatory gap-6 overflow-x-auto pb-6 [&::-webkit-scrollbar]:hidden">
                  {products.map((p) => <div key={p.id} className="w-[280px] shrink-0 snap-center md:w-[350px]"><ProductCard product={p} isPreview={isPreview} portfolioId={portfolioId} /></div>)}
                </div>
              </div>
            )}
            {variant === "spotlight" && products[0] && (
              <>
                <SectionTitle data={data} id={id} isPreview={isPreview} fallback="Featured product" />
                <Spotlight product={products[0]} isPreview={isPreview} portfolioId={portfolioId} redirect={redirect} />
              </>
            )}
          </>
        )}
      </div>
    </section>
  );
}
