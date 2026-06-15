import React, { useEffect, useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { supabase } from "@/supabaseClient";
import {
  ShoppingBag,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Eye,
  ShoppingCart,
  Store,
  CheckCircle2,
  ArrowRight,
  HelpCircle,
  ChevronDown,
  Tag,
  ExternalLink,
  Minus,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCartStore } from "@/store/useCartStore";
// 🚀 1. IMPORT INLINE EDIT
import { InlineEdit } from "../../components/dashboard/InlineEdit";

const MAIN_DOMAINS = [
  "ucpmaroc.com",
  "www.ucpmaroc.com",
  "localhost",
  "127.0.0.1",
  "symmetrical-acorn-697wxxq4r74j3jpj-5173.app.github.dev",
];

// --- HELPER COMPONENTS ---

const ProductCard = ({
  product,
  isPreview,
  portfolioId,
  layout,
}: {
  product: any;
  isPreview: boolean;
  portfolioId: string | null;
  layout?: "grid" | "carousel" | "bento";
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const addItem = useCartStore((state) => state.addItem);

  const hasVariants = product.options && product.options.length > 0;
  const isExternal = product.action_type === "link";
  const isDirectOrder =
    product.action_type === "whatsapp" || product.action_type === "form_order";

  // --- DYNAMIC URL GENERATOR ---
  const getProductUrl = () => {
    let basePath =
      location.pathname === "/" ? "" : location.pathname.replace(/\/$/, "");

    if (basePath.split("/").length === 3 && basePath.startsWith("/pro/")) {
      // do nothing, basePath is perfect
    } else if (basePath.includes("/shop")) {
      basePath = basePath.replace("/shop", "");
    }
    return `${basePath}/product/${product.slug || product.id}`;
  };

  const handleCardClick = (e: React.MouseEvent) => {
    if (isPreview) {
      e.preventDefault();
      return;
    }
    navigate(getProductUrl());
  };

  const handleQuickAction = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isPreview) {
      e.preventDefault();
      return;
    }

    if (isExternal) {
      window.open(product.checkout_url, "_blank");
    } else if (hasVariants || product.action_type === "form_order") {
      navigate(getProductUrl());
    } else if (product.action_type === "whatsapp") {
      const message = `*NEW ORDER* 🛍️\n------------------\n*Product:* ${product.title}\n*Price:* $${product.price.toFixed(2)}\n*Qty:* 1\n------------------\nPlease confirm my order!`;
      const number = product.whatsapp_number ? product.whatsapp_number.replace(/[^0-9]/g, "") : "";
      window.open(`https://wa.me/${number}?text=${encodeURIComponent(message)}`, "_blank");
    } else {
      addItem({
        id: product.id,
        title: product.title,
        price: product.price,
        image: product.images?.[0] || product.image,
        quantity: 1,
        variant: "default",
        storeId: portfolioId || undefined,
        productType: product.product_type,
        collectionId: product.collection_id,
      });
    }
  };

  return (
    <div
      className="group relative bg-neutral-900/50 border border-white/10 rounded-xl overflow-hidden hover:border-primary/50 transition-all duration-300 flex flex-col h-full cursor-pointer"
      onClick={handleCardClick}
    >
            {layout === "bento" ? (
        <>
          <div className="absolute inset-0 bg-neutral-950">
            {product.images?.[0] || product.image ? (
              <img src={product.images?.[0] || product.image} alt={product.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
            ) : (
              <div className="flex items-center justify-center h-full text-neutral-800"><ShoppingBag size={48} /></div>
            )}
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent p-6 flex flex-col justify-end">
             {product.compare_at_price > product.price && (
               <Badge className="absolute top-4 left-4 bg-primary text-black font-bold uppercase tracking-widest text-[10px] px-3 py-1 shadow-lg border-none">Sale</Badge>
             )}
             <h3 className="text-xl font-bold text-white leading-tight line-clamp-1">{product.title}</h3>
             <p className="text-sm text-neutral-300 line-clamp-2 mt-2 mb-4">{product.description}</p>
             <div className="flex items-center justify-between mt-auto">
               <span className="font-bold text-lg text-white">${product.price.toFixed(2)}</span>
               <Button variant="secondary" size="sm" className="gap-2 shadow-xl bg-white text-black hover:bg-neutral-200" onClick={handleQuickAction}>
                 {isExternal ? "View Link" : hasVariants || isDirectOrder ? "Options" : "Add to Cart"}
               </Button>
             </div>
          </div>
        </>
      ) : (
        <>
          <div className="relative aspect-[4/3] overflow-hidden bg-black/50">
            {product.images?.[0] || product.image ? (
              <img src={product.images?.[0] || product.image} alt={product.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
            ) : (
              <div className="flex items-center justify-center h-full text-neutral-700"><ShoppingBag size={48} /></div>
            )}
            <div className="absolute top-3 right-3"><Badge variant="secondary" className="bg-black/70 backdrop-blur-md text-white border-white/10 font-bold text-sm shadow-sm">${product.price.toFixed(2)}</Badge></div>
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
              <Button variant="secondary" className="gap-2 shadow-xl pointer-events-auto bg-white text-black hover:bg-neutral-200" onClick={handleQuickAction}>
                {isExternal ? <><ExternalLink size={16} /> View Link</> : hasVariants || isDirectOrder ? <><Eye size={16} /> Select Options</> : <><ShoppingCart size={16} /> Add to Cart</>}
              </Button>
            </div>
          </div>
          <div className="p-5 flex flex-col flex-grow">
            <h3 className="text-lg font-bold mb-1 text-white leading-tight line-clamp-1">{product.title}</h3>
            <p className="text-sm text-neutral-400 line-clamp-2 flex-grow">{product.description}</p>
          </div>
        </>
      )}
    </div>

  );
};

const SpotlightLayout = ({
  product,
  isPreview,
  portfolioId,
  actionBehavior = "inline",
  onOpenModal,
}: {
  product: any;
  isPreview: boolean;
  layout?: "grid" | "carousel" | "bento";
  portfolioId: string | null;
  actionBehavior?: string;
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const addItem = useCartStore((state) => state.addItem);

  const images = product.images?.length
    ? product.images
    : product.image
    ? [product.image]
    : [];
  const isOutOfStock = product.track_inventory && product.stock_count <= 0;
  
  const [quantity, setQuantity] = useState(1);

  const [activeImg, setActiveImg] = useState(0);
  const [selectedVariants, setSelectedVariants] = useState<Record<string, any>>({});

  // Auto-initialize first variant options
  useEffect(() => {
    if (product.options?.length > 0) {
      const initialVariants: Record<string, any> = {};
      product.options.forEach((opt: any) => {
        if (opt.values?.length > 0) {
          initialVariants[opt.name] = opt.values[0];
        }
      });
      setSelectedVariants(initialVariants);
    }
  }, [product]);

  // Calculate dynamic price based on selected variants
  let currentPrice = product.price || 0;
  if (product.options?.length > 0 && Object.keys(selectedVariants).length > 0) {
    const variantPrices = Object.values(selectedVariants)
      .map((val: any) => Number(val.price))
      .filter((p) => !isNaN(p) && p > 0);
    if (variantPrices.length > 0) {
      currentPrice = variantPrices.reduce((sum, p) => sum + p, 0);
    }
  }

  const hasVariants = product.options && product.options.length > 0;
  const isExternal = product.action_type === "link";
  const isDirectOrder =
    product.action_type === "whatsapp" || product.action_type === "form_order";

  const getProductUrl = () => {
    let basePath =
      location.pathname === "/" ? "" : location.pathname.replace(/\/$/, "");
    if (basePath.includes("/shop")) basePath = basePath.replace("/shop", "");
    return `${basePath}/product/${product.slug || product.id}`;
  };

  const handleAction = (e: React.MouseEvent) => {
    if (isPreview) {
      e.preventDefault();
      return;
    }

    if (isExternal) {
      window.open(product.checkout_url, "_blank");
    } else if (product.action_type === "whatsapp") {
      const variantText = Object.entries(selectedVariants).map(([key, val]: any) => `${key}: ${val.label}`).join(", ");
      const message = `*NEW ORDER* 🛍️\n------------------\n*Product:* ${product.title}\n*Price:* $${currentPrice.toFixed(2)}\n*Qty:* ${quantity}\n${variantText ? `*Options:* ${variantText}` : ""}\n------------------\nPlease confirm my order!`;
      const number = product.whatsapp_number ? product.whatsapp_number.replace(/[^0-9]/g, "") : "";
      window.open(`https://wa.me/${number}?text=${encodeURIComponent(message)}`, "_blank");
    } else if (product.action_type === "form_order") {
      navigate(getProductUrl());
    } else {
      const variantString = Object.entries(selectedVariants)
        .map(([k, v]: [string, any]) => `${k}: ${v.label}`)
        .join(", ");

      addItem({
        id: product.id,
        title: product.title,
        price: currentPrice,
        image: product.images?.[0] || product.image,
        quantity: quantity,
        variant: variantString || "default",
        storeId: portfolioId || undefined,
        productType: product.product_type,
        collectionId: product.collection_id,
      });
    }
  };

  return (
    <div className="bg-neutral-900/30 border border-white/10 rounded-3xl overflow-hidden flex flex-col lg:flex-row shadow-2xl">
      {/* LEFT: GALLERY */}
      <div className="w-full lg:w-1/2 bg-black/50 relative flex flex-col h-[400px] lg:h-auto group/gallery overflow-hidden">
          {images.length > 0 ? (
            <>
              <img
                src={images[activeImg]}
                alt={product.title}
                className="w-full h-full object-cover absolute inset-0 transition-all duration-700 hover:scale-105"
              />
              {images.length > 1 && (
                <>
                  <button onClick={() => setActiveImg((prev) => (prev - 1 + images.length) % images.length)} className="absolute left-4 top-[40%] group-hover/gallery:top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/70 text-white p-3 rounded-full opacity-0 group-hover/gallery:opacity-100 transition-all duration-300 z-20 backdrop-blur-sm">
                    <ChevronLeft size={20} />
                  </button>
                  <button onClick={() => setActiveImg((prev) => (prev + 1) % images.length)} className="absolute right-4 top-[40%] group-hover/gallery:top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/70 text-white p-3 rounded-full opacity-0 group-hover/gallery:opacity-100 transition-all duration-300 z-20 backdrop-blur-sm">
                    <ChevronRight size={20} />
                  </button>
                  
                  <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-2 z-10 px-4">
                    {images.map((img: string, idx: number) => (
                      <button key={idx} onClick={() => setActiveImg(idx)} className={cn("w-14 h-14 rounded-lg border-2 overflow-hidden transition-all shadow-sm shrink-0", activeImg === idx ? "border-primary scale-110" : "border-white/30 opacity-60 hover:opacity-100")}>
                        <img src={img} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-neutral-600">
              <ShoppingBag size={80} />
            </div>
          )}
      </div>

      {/* RIGHT: DETAILS */}
      <div className="w-full lg:w-1/2 p-8 lg:p-12 flex flex-col justify-center relative">
        {product.salePrice && <Badge className="bg-primary text-black hover:bg-primary w-max mb-4 border-none shadow-sm uppercase tracking-widest text-[10px] font-bold">On Sale</Badge>}
        
        <h3 className="text-3xl lg:text-4xl font-bold text-white leading-tight mb-3">
          {product.title}
        </h3>
        
        <div className="flex items-center gap-4 mb-6">
          <span className="text-3xl font-bold text-white">${currentPrice.toFixed(2)}</span>
          {product.compare_at_price > product.price && (
            <span className="text-xl text-neutral-500 line-through">${product.compare_at_price.toFixed(2)}</span>
          )}
        </div>

        <div className="prose prose-invert max-w-none text-neutral-300 leading-relaxed mb-8 text-base">
          <p className="line-clamp-4">{product.description}</p>
        </div>

        {/* INTERACTIVE VARIANTS */}
        {product.options?.length > 0 && actionBehavior !== "redirect" && (
          <div className="mb-8 space-y-4 border-y border-white/10 py-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {product.options.map((opt: any, i: number) => {
                const optionsArray = Array.isArray(opt.values) ? opt.values : [];
                return (
                  <div key={i} className="space-y-2">
                    <Label className="text-xs text-neutral-400 font-bold uppercase tracking-wider">
                      {opt.name}
                    </Label>
                    <Select
                      value={selectedVariants[opt.name]?.label || ""}
                      onValueChange={(val) => {
                        const selectedOpt = optionsArray.find((o: any) => o.label === val);
                        setSelectedVariants({
                          ...selectedVariants,
                          [opt.name]: selectedOpt,
                        });
                      }}
                    >
                      <SelectTrigger className="bg-neutral-900 border-white/10 text-white h-12 rounded-xl focus:ring-primary/50">
                        <SelectValue placeholder={`Select ${opt.name}`} />
                      </SelectTrigger>
                      <SelectContent className="bg-neutral-900 border-white/10 text-white z-[100000]">
                        {optionsArray.map((v: any, vIdx: number) => (
                          <SelectItem key={vIdx} value={v.label} className="focus:bg-white/10 focus:text-white cursor-pointer">
                            {v.label} {v.price && `(+$${v.price})`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Details Snippets for Redirect Mode */}
        {product.options && product.options.length > 0 && actionBehavior === "redirect" && (
          <div className="mb-8 space-y-2 border-y border-white/10 py-5">
            {product.options.map((opt: any, i: number) => (
              <div key={i} className="flex flex-wrap gap-2 text-sm text-neutral-400">
                <span className="font-bold text-white">{opt.name}:</span>
                <span>{opt.values.map((v: any) => v.label).join(", ")}</span>
              </div>
            ))}
          </div>
        )}
        
        {/* ACTION ROW */}
        {actionBehavior === "redirect" ? (
          <div className="flex flex-col sm:flex-row gap-4 mt-auto shrink-0">
             <Button size="lg" className="w-full sm:flex-1 h-14 text-base sm:text-lg font-bold rounded-xl shadow-[0_0_20px_rgba(255,255,255,0.1)] bg-white text-black hover:bg-neutral-200 transition-all hover:scale-[1.02] whitespace-nowrap" asChild>
               <Link to={getProductUrl()} onClick={(e) => {
                 if (isPreview) {
                   e.preventDefault();
                 }
               }}>
                 View Details
                 <ArrowRight className="ml-2 w-5 h-5 shrink-0" />
               </Link>
             </Button>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row gap-4 mt-auto shrink-0">
            {product.action_type !== "link" && (
              <div className="flex items-center justify-between border border-white/10 rounded-xl px-4 h-14 w-full sm:w-1/3 bg-black/50 text-white shrink-0">
                <button className="text-neutral-400 hover:text-white transition-colors" onClick={() => setQuantity((q) => Math.max(1, q - 1))}><Minus size={20} /></button>
                <span className="font-mono text-lg font-bold">{quantity}</span>
                <button disabled={product.track_inventory && quantity >= product.stock_count} className="text-neutral-400 hover:text-white transition-colors disabled:opacity-30" onClick={() => setQuantity((q) => q + 1)}><Plus size={20} /></button>
              </div>
            )}
            
            <Button size="lg" disabled={isOutOfStock} className={cn("w-full sm:flex-1 h-14 text-base sm:text-lg font-bold rounded-xl transition-all hover:scale-[1.02] whitespace-nowrap", isOutOfStock ? "bg-neutral-800 text-neutral-500 cursor-not-allowed shadow-none" : "shadow-[0_0_20px_rgba(255,255,255,0.1)] bg-white text-black hover:bg-neutral-200")} onClick={handleAction}>
              {isOutOfStock
                ? "Out of Stock"
                : product.action_type === "link"
                ? "Buy Now"
                : product.action_type === "cart" || !product.action_type
                ? "Add to Cart"
                : "Order Now"}
              {!isOutOfStock && (product.action_type === "link" ? (
                <ExternalLink className="ml-2 w-5 h-5 shrink-0" />
              ) : product.action_type === "cart" || !product.action_type ? (
                <ShoppingBag className="ml-2 w-5 h-5 shrink-0" />
              ) : (
                <ArrowRight className="ml-2 w-5 h-5 shrink-0" />
              ))}
            </Button>
          </div>
        )}
        
        {/* INVENTORY BADGE */}
        {product.track_inventory && (
          <div className="flex items-center gap-2 text-sm bg-neutral-950 w-fit px-4 py-2 rounded-full border border-white/5 mt-6">
            <div className={cn("w-2 h-2 rounded-full", product.stock_count > 5 ? "bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]" : "bg-orange-500 animate-pulse shadow-[0_0_10px_rgba(249,115,22,0.5)]")} />
            <span className="text-neutral-400 font-medium">
              {product.stock_count > 0 ? `${product.stock_count} items remaining in stock` : <span className="text-red-400">Out of stock</span>}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

// --- MAIN DYNAMIC STORE COMPONENT ---
// 🚀 2. GRAB id AND isPreview FROM PROPS
export const DynamicStore = ({ data, settings = {}, actorId, isPreview, id, portfolioId: propPortfolioId }: any) => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [portfolioId, setPortfolioId] = useState<string | null>(propPortfolioId || null);

  const variant = settings?.variant || data.variant || "grid";
  const spotlightAction = settings?.spotlightAction || data.spotlightAction || "inline";
  const selectedIds = data.selectedProductIds || [];

  useEffect(() => {
    const fetchStoreData = async () => {
      let currentActorId = actorId;
      let currentPortfolioId = propPortfolioId || null;

      if (!currentActorId || currentActorId === "preview-actor-id") {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          const { data: actorProfile } = await supabase
            .from("actors")
            .select("id")
            .eq("user_id", user.id)
            .maybeSingle();
          if (actorProfile) currentActorId = actorProfile.id;
        }
      }

      if (!currentActorId || currentActorId === "preview-actor-id") {
        setLoading(false);
        return;
      }

      const currentHostname = window.location.hostname;
      const isCustomDomain = !MAIN_DOMAINS.some((domain) =>
        currentHostname.includes(domain)
      );

      if (!currentPortfolioId && isCustomDomain) {
        const { data: portData } = await supabase
          .from("portfolios")
          .select("id")
          .eq("custom_domain", currentHostname)
          .maybeSingle();
        if (portData) currentPortfolioId = portData.id;
      } else if (!currentPortfolioId) {
        const pathParts = window.location.pathname.split("/");
        const proIndex = pathParts.indexOf("pro");

        if (proIndex !== -1 && pathParts.length > proIndex + 1) {
          const currentSlug = pathParts[proIndex + 1];
          const { data: portData } = await supabase
            .from("portfolios")
            .select("id")
            .eq("public_slug", currentSlug)
            .maybeSingle();
          if (portData) currentPortfolioId = portData.id;
        } else {
          const { data: portData } = await supabase
            .from("portfolios")
            .select("id")
            .eq("actor_id", currentActorId)
            .limit(1)
            .maybeSingle();
          if (portData) currentPortfolioId = portData.id;
        }
      }

      let query = supabase
        .from("pro_products")
        .select("*")
        .eq("actor_id", currentActorId)
        .eq("status", "active");

      if (currentPortfolioId) {
        query = query.or(
          `portfolio_id.eq.${currentPortfolioId},portfolio_id.is.null`
        );
      }

      if (selectedIds.length > 0) {
        query = query.in("id", selectedIds);
      } else {
        query = query
          .order("created_at", { ascending: false })
          .limit(data.maxProductsToShow || 6);
      }

      const { data: prods, error } = await query;
      setPortfolioId(currentPortfolioId);
      if (!error && prods) setProducts(prods);
      setLoading(false);
    };

    fetchStoreData();
  }, [actorId, JSON.stringify(selectedIds), data.maxProductsToShow]);

  // 🚀 3. Hide completely on Live site if empty. Let it render in Preview mode!
  const hasProducts = products.length > 0;
  if (!loading && !hasProducts && !isPreview) return null;

  return (
    <section
      className="py-24 px-4 md:px-8 relative overflow-hidden bg-neutral-950 text-white"
      id="store"
    >
      {/* Background Atmosphere */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay pointer-events-none"></div>
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* 🚀 4. INLINE EDITABLE HEADERS */}
        {variant !== "spotlight" && (
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <InlineEdit
              tagName="h2"
              className="text-4xl md:text-5xl font-bold tracking-tight text-white block"
              text={data.title || "Store"}
              sectionId={id}
              fieldKey="title"
              isPreview={isPreview}
            />
            <InlineEdit
              tagName="p"
              className="text-lg text-neutral-400 block"
              text={data.subtitle || "Browse my digital and physical products."}
              sectionId={id}
              fieldKey="subtitle"
              isPreview={isPreview}
            />
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : !hasProducts && isPreview ? (
          /* 🚀 5. AAA+ EMPTY STATE UX FOR BUILDER */
          <div className="text-center py-24 border-2 border-dashed border-white/20 rounded-3xl bg-white/5 max-w-2xl mx-auto shadow-sm">
            <Store className="w-12 h-12 mx-auto text-neutral-500 mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">
              No products found
            </h3>
            <p className="text-neutral-400 max-w-sm mx-auto">
              This block automatically syncs with your Dashboard Store. Go to
              your Dashboard's Product tab to create products.
            </p>
          </div>
        ) : (
          <>
            {variant === "grid" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                {products.map((p) => (
                  <ProductCard key={p.id} product={p} isPreview={isPreview} portfolioId={portfolioId} />
                ))}
              </div>
            )}

            {variant === "bento" && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6 auto-rows-[300px]">
                {products.map((p, i) => (
                  <div 
                    key={p.id} 
                    className={cn(
                      i === 0 ? "md:col-span-2 md:row-span-2" : "md:col-span-1 md:row-span-1"
                    )}
                  >
                    <ProductCard product={p} isPreview={isPreview} portfolioId={portfolioId} layout="bento" />
                  </div>
                ))}
              </div>
            )}

            {variant === "spotlight" && products[0] && (
              <div>
                <div className="mb-12 text-center space-y-4">
                  <InlineEdit
                    tagName="h2"
                    className="text-4xl md:text-5xl font-bold tracking-tight text-white block"
                    text={data.title || "Featured Product"}
                    sectionId={id}
                    fieldKey="title"
                    isPreview={isPreview}
                  />
                  <InlineEdit
                    tagName="p"
                    className="text-lg text-neutral-400 block"
                    text={data.subtitle || ""}
                    sectionId={id}
                    fieldKey="subtitle"
                    isPreview={isPreview}
                  />
                </div>
                <SpotlightLayout product={products[0]} isPreview={isPreview} portfolioId={portfolioId} actionBehavior={spotlightAction} />
              </div>
            )}

            {variant === "carousel" && (
              <div className="flex overflow-x-auto pb-8 gap-6 snap-x snap-mandatory hide-scrollbar -mx-4 px-4 md:mx-0 md:px-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
                {products.map((p) => (
                  <div
                    key={p.id}
                    className="min-w-[280px] md:min-w-[350px] snap-center"
                  >
                    <ProductCard product={p} isPreview={isPreview} portfolioId={portfolioId} />
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
};
export default DynamicStore;
