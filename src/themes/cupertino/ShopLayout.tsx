import React from "react";
import { Search, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";
import { UCP } from "@ucp/sdk";

const ACTION_LABEL = { link: "View", options: "Options", add: "Add to cart" } as const;

function ProductCard({ product, portfolioId }: any) {
  const p = UCP.useProductCard(product, { isPreview: false, portfolioId });
  return (
    <div
      role="link"
      tabIndex={0}
      onClick={p.open}
      onKeyDown={(e) => e.key === "Enter" && p.open()}
      className="group flex h-full cursor-pointer flex-col overflow-hidden rounded-[2rem] bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_20px_40px_rgb(0,0,0,0.1)] motion-reduce:transition-none"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
        {p.image ? (
          <img src={p.image} alt={product.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
        ) : (
          <div className="flex h-full items-center justify-center text-slate-300"><ShoppingBag size={48} /></div>
        )}
        {p.onSale && <span className="absolute left-4 top-4 rounded-full bg-slate-900 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white">Sale</span>}
      </div>
      <div className="flex flex-1 flex-col gap-3 p-6">
        <h3 className="line-clamp-1 text-xl font-[800] tracking-tight text-slate-900">{product.title}</h3>
        {product.description && <p className="line-clamp-2 text-sm font-medium text-slate-500">{product.description}</p>}
        <div className="mt-auto flex items-center justify-between gap-3">
          <span className="text-lg font-bold text-slate-900">${p.price.toFixed(2)}</span>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); p.quickAction(); }}
            className="rounded-full bg-slate-900 px-5 py-2 text-sm font-bold text-white transition hover:scale-105 active:scale-95"
          >
            {ACTION_LABEL[p.actionKind as keyof typeof ACTION_LABEL]}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CupertinoShopLayout({ collections, activeCollection, setActiveCollection, searchQuery, setSearchQuery, filteredProducts, themeConfig, portfolioId }: any) {
  const showFilters = themeConfig?.store_shop_filters !== false;
  const pill = (active: boolean) =>
    cn("whitespace-nowrap rounded-full px-5 py-2.5 text-sm font-bold transition", active ? "bg-slate-900 text-white" : "bg-white text-slate-600 shadow-sm hover:text-slate-900");

  return (
    <div className="min-h-screen bg-slate-50 pt-24 font-sans text-slate-900">
      <header className="px-6 pb-10 pt-12 text-center">
        <h1 className="text-5xl font-[800] tracking-tighter md:text-6xl">Shop</h1>
        <p className="mx-auto mt-4 max-w-lg text-lg font-medium text-slate-500">Browse our latest products, downloads and services.</p>
      </header>

      <main className="mx-auto max-w-7xl px-4 pb-24 md:px-8">
        {showFilters && (
          <div className="mx-auto mb-10 flex max-w-3xl flex-col gap-4">
            <label className="relative block">
              <span className="sr-only">Search products</span>
              <Search className="absolute left-5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products"
                className="h-14 w-full rounded-full border-0 bg-white pl-12 pr-6 text-base font-medium shadow-sm outline-none ring-1 ring-slate-200 transition focus:ring-2 focus:ring-slate-900"
              />
            </label>
            {collections.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-1 md:justify-center">
                <button type="button" onClick={() => setActiveCollection(null)} className={pill(activeCollection === null)}>All</button>
                {collections.map((c: any) => (
                  <button key={c.id} type="button" onClick={() => setActiveCollection(c.id)} className={pill(activeCollection === c.id)}>{c.title}</button>
                ))}
              </div>
            )}
          </div>
        )}

        {filteredProducts.length === 0 ? (
          <div className="rounded-[2rem] bg-white py-24 text-center shadow-sm">
            <ShoppingBag className="mx-auto mb-4 h-14 w-14 text-slate-300" />
            <h2 className="text-2xl font-[800] tracking-tight">No products found</h2>
            <p className="mx-auto mt-2 max-w-sm font-medium text-slate-500">Try another search or collection.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredProducts.map((product: any) => (
              <ProductCard key={product.id} product={product} portfolioId={portfolioId} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
