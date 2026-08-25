import React from "react";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, ShoppingBag, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { ShopLayoutProps } from "../../features/ecommerce/product-layouts/types";

export default function ModernShopLayout({
  username,
  collections,
  activeCollection,
  setActiveCollection,
  searchQuery,
  setSearchQuery,
  filteredProducts,
  themeConfig,
}: ShopLayoutProps & { themeConfig?: any }) {
  const showFilters = themeConfig?.store_shop_filters !== false;

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary selection:text-primary-foreground pt-20">
      {/* SHOP HEADER */}
      <header className="bg-card/30 border-b border-border pt-20 pb-12 px-6 text-center relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-full bg-primary/5 blur-[100px] rounded-full pointer-events-none" />

        <div className="relative z-10">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 text-foreground">
            Shop
          </h1>
          <p className="text-muted-foreground max-w-lg mx-auto text-lg">
            Browse our latest products, digital downloads, and exclusive
            services.
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-8 py-12 flex flex-col md:flex-row gap-8 items-start relative z-10">
        {/* LEFT SIDEBAR: FILTERS */}
        {showFilters && (
        <aside className="w-full md:w-64 flex-shrink-0 md:sticky md:top-24 space-y-8">
          <div className="relative">
            <Search className="absolute left-3 top-3.5 h-4 w-4 text-neutral-500" />
            <Input
              placeholder="Search products..."
              className="pl-10 bg-background/50 border-border text-foreground placeholder:text-muted-foreground/70 focus:border-primary/50 transition-colors h-11 rounded-xl"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="hidden md:block">
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground/70 mb-4 px-3">
              Collections
            </h3>
            <div className="flex flex-col space-y-1">
              <button
                onClick={() => setActiveCollection(null)}
                className={cn(
                  "text-left px-4 py-2.5 rounded-xl text-sm transition-all duration-200",
                  activeCollection === null
                    ? "bg-primary/10 text-primary font-bold border border-primary/20"
                    : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground border border-transparent"
                )}
              >
                All Products
              </button>
              {collections.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setActiveCollection(c.id)}
                  className={cn(
                    "text-left px-4 py-2.5 rounded-xl text-sm transition-all duration-200",
                    activeCollection === c.id
                      ? "bg-primary/10 text-primary font-bold border border-primary/20"
                      : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground border border-transparent"
                  )}
                >
                  {c.title}
                </button>
              ))}
            </div>
          </div>

          {/* MOBILE COLLECTION PILLS */}
          <div className="md:hidden flex overflow-x-auto gap-2 pb-2 hide-scrollbar">
            <Badge
              variant={activeCollection === null ? "default" : "outline"}
              className={cn(
                "cursor-pointer px-5 py-2.5 text-sm whitespace-nowrap rounded-full transition-all",
                activeCollection === null
                  ? "bg-primary text-primary-foreground hover:bg-primary/90 font-bold"
                  : "text-muted-foreground border-border hover:bg-foreground/5 hover:text-foreground"
              )}
              onClick={() => setActiveCollection(null)}
            >
              All
            </Badge>
            {collections.map((c) => (
              <Badge
                key={c.id}
                variant={activeCollection === c.id ? "default" : "outline"}
                className={cn(
                  "cursor-pointer px-5 py-2.5 text-sm whitespace-nowrap rounded-full transition-all",
                  activeCollection === c.id
                    ? "bg-primary text-primary-foreground hover:bg-primary/90 font-bold"
                    : "text-muted-foreground border-border hover:bg-foreground/5 hover:text-foreground"
                )}
                onClick={() => setActiveCollection(c.id)}
              >
                {c.title}
              </Badge>
            ))}
          </div>
        </aside>
        )}

        {/* RIGHT CONTENT: PRODUCT GRID */}
        <div className="flex-1 w-full">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-24 border-2 border-dashed border-border rounded-2xl bg-card/30">
              <ShoppingBag className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4 opacity-50" />
              <h3 className="text-2xl font-bold mb-2 text-foreground">
                No products found
              </h3>
              <p className="text-muted-foreground max-w-sm mx-auto">
                Try adjusting your search or selecting a different collection to
                find what you're looking for.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((product) => (
                <Link
                  key={product.id}
                  to={`/${username}/product/${product.slug || product.id}`}
                  className="group flex flex-col bg-card/50 border border-border rounded-2xl overflow-hidden hover:border-primary/50 hover:shadow-[0_0_30px_rgba(var(--primary),0.1)] transition-all duration-300"
                >
                  <div className="aspect-[4/3] bg-muted/50 relative overflow-hidden">
                    {product.images?.[0] ? (
                      <img
                        src={product.images[0]}
                        alt={product.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground/50">
                        <ShoppingBag size={48} opacity={0.5} />
                      </div>
                    )}
                    <div className="absolute top-3 right-3 flex flex-col gap-2 items-end">
                      <Badge className="bg-background/70 backdrop-blur-md text-foreground border-border font-bold px-3 py-1 text-sm shadow-xl">
                        ${product.price.toFixed(2)}
                      </Badge>
                    </div>
                  </div>
                  <div className="p-6 flex flex-col flex-1">
                    {product.pro_collections?.title && (
                      <span className="text-[10px] uppercase tracking-widest text-primary font-bold mb-3 block">
                        {product.pro_collections.title}
                      </span>
                    )}
                    <h3 className="font-bold text-xl leading-tight mb-2 group-hover:text-primary transition-colors text-foreground line-clamp-2">
                      {product.title}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-auto leading-relaxed">
                      {product.description}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
