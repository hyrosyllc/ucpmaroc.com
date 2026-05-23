import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../../supabaseClient";
import {
  ShoppingBag,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Eye,
  ShoppingCart,
  Store,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCartStore } from "@/store/useCartStore";
// 🚀 1. IMPORT INLINE EDIT
import { InlineEdit } from "../../components/dashboard/InlineEdit";
import { isCustomDomain as checkIsCustomDomain } from "./utils";

// --- HELPER COMPONENTS ---

const ProductCard = ({
  product,
  isPreview,
  portfolioId,
}: {
  product: any;
  isPreview: boolean;
  portfolioId: string | null;
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
    } else if (hasVariants || isDirectOrder) {
      navigate(getProductUrl());
    } else {
      addItem({
        id: product.id,
        title: product.title,
        price: product.price,
        image: product.images?.[0] || product.image,
        quantity: 1,
        variant: "default",
        storeId: portfolioId || undefined,
      });
    }
  };

  return (
    <div
      className="group relative bg-black/5 border border-black/10 rounded-xl overflow-hidden hover:border-primary/50 transition-all duration-300 flex flex-col h-full cursor-pointer"
      onClick={handleCardClick}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-white/50">
        {product.images?.[0] || product.image ? (
          <img
            src={product.images?.[0] || product.image}
            alt={product.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-neutral-700">
            <ShoppingBag size={48} />
          </div>
        )}
        <div className="absolute top-3 right-3">
          <Badge
            variant="secondary"
            className="bg-black/70 backdrop-blur-md text-neutral-900 border-black/10 font-bold text-sm shadow-sm"
          >
            ${product.price.toFixed(2)}
          </Badge>
        </div>

        {/* Hover Overlay with Quick Action Button */}
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
          <Button
            variant="secondary"
            className="gap-2 shadow-xl pointer-events-auto"
            onClick={handleQuickAction}
          >
            {isExternal ? (
              <>
                <Eye size={16} /> View Link
              </>
            ) : hasVariants || isDirectOrder ? (
              <>
                <Eye size={16} /> Select Options
              </>
            ) : (
              <>
                <ShoppingCart size={16} /> Add to Cart
              </>
            )}
          </Button>
        </div>
      </div>
      <div className="p-5 flex flex-col flex-grow">
        <h3 className="text-lg font-bold mb-1 text-neutral-900 leading-tight line-clamp-1">
          {product.title}
        </h3>
        <p className="text-sm text-neutral-600 line-clamp-2 flex-grow">
          {product.description}
        </p>
      </div>
    </div>
  );
};

const SpotlightLayout = ({
  product,
  isPreview,
  portfolioId,
}: {
  product: any;
  isPreview: boolean;
  portfolioId: string | null;
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const addItem = useCartStore((state) => state.addItem);

  const images = product.images?.length
    ? product.images
    : product.image
    ? [product.image]
    : [];
  const [activeImg, setActiveImg] = useState(0);

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
    } else if (hasVariants || isDirectOrder) {
      navigate(getProductUrl());
    } else {
      addItem({
        id: product.id,
        title: product.title,
        price: product.price,
        image: product.images?.[0] || product.image,
        quantity: 1,
        variant: "default",
        storeId: portfolioId || undefined,
      });
    }
  };

  return (
    <div className="bg-black/5 border border-black/10 rounded-2xl overflow-hidden md:grid md:grid-cols-2 min-h-[450px] shadow-sm">
      <div
        className="bg-white/50 relative flex flex-col h-[300px] md:h-auto group/gallery cursor-pointer"
        onClick={(e) => {
          if (isPreview) e.preventDefault();
          else navigate(getProductUrl());
        }}
      >
        <div className="flex-grow relative overflow-hidden">
          {images.length > 0 ? (
            <>
              <img
                src={images[activeImg]}
                alt={product.title}
                className="w-full h-full object-cover absolute inset-0 transition-all duration-500 hover:scale-105"
              />
              {images.length > 1 && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveImg(
                        (prev) => (prev - 1 + images.length) % images.length
                      );
                    }}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/50 hover:bg-black/80 text-neutral-900 p-2 rounded-full opacity-0 group-hover/gallery:opacity-100 transition-opacity z-20 shadow-sm"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveImg((prev) => (prev + 1) % images.length);
                    }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/50 hover:bg-black/80 text-neutral-900 p-2 rounded-full opacity-0 group-hover/gallery:opacity-100 transition-opacity z-20 shadow-sm"
                  >
                    <ChevronRight size={20} />
                  </button>
                </>
              )}
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-neutral-600">
              <ShoppingBag size={64} />
            </div>
          )}
        </div>
      </div>

      <div className="p-8 md:p-12 flex flex-col justify-center h-full relative">
        <Badge className="bg-primary/10 text-primary hover:bg-primary/20 w-max mb-4 shadow-none">
          Featured Product
        </Badge>
        <h3 className="text-3xl md:text-4xl font-bold text-neutral-900 leading-tight mb-2">
          {product.title}
        </h3>
        <p className="text-2xl text-primary font-bold mb-6">
          ${product.price.toFixed(2)}
        </p>
        <p className="text-neutral-600 leading-relaxed mb-8 text-lg line-clamp-4">
          {product.description}
        </p>

        <Button
          size="lg"
          className="w-full h-14 text-lg rounded-xl shadow-md"
          onClick={handleAction}
        >
          {isExternal
            ? "View Link"
            : hasVariants || isDirectOrder
            ? "View Options & Details"
            : "Add to Cart"}
        </Button>
      </div>
    </div>
  );
};

// --- MAIN DYNAMIC STORE COMPONENT ---
// 🚀 2. GRAB id AND isPreview FROM PROPS
export const DynamicStore = ({ data, actorId, isPreview, id }: any) => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [portfolioId, setPortfolioId] = useState<string | null>(null);

  const variant = data.variant || "grid";
  const selectedIds = data.selectedProductIds || [];

  useEffect(() => {
    const fetchStoreData = async () => {
      let currentActorId = actorId;
      let currentPortfolioId = null;

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
      const isCustomDomain = checkIsCustomDomain();

      if (isCustomDomain) {
        const { data: portData } = await supabase
          .from("portfolios")
          .select("id")
          .eq("custom_domain", currentHostname)
          .maybeSingle();
        if (portData) currentPortfolioId = portData.id;
      } else {
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
      className="py-24 px-4 md:px-8 relative overflow-hidden bg-white text-neutral-900"
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
              className="text-4xl md:text-5xl font-bold tracking-tight text-neutral-900 block"
              text={data.title || "Store"}
              sectionId={id}
              fieldKey="title"
              isPreview={isPreview}
            />
            <InlineEdit
              tagName="p"
              className="text-lg text-neutral-600 block"
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
          <div className="text-center py-24 border-2 border-dashed border-black/20 rounded-3xl bg-black/5 max-w-2xl mx-auto shadow-sm">
            <Store className="w-12 h-12 mx-auto text-neutral-500 mb-4" />
            <h3 className="text-xl font-bold text-neutral-900 mb-2">
              No products found
            </h3>
            <p className="text-neutral-600 max-w-sm mx-auto">
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

            {variant === "spotlight" && products[0] && (
              <div>
                <div className="mb-12 text-center space-y-4">
                  <InlineEdit
                    tagName="h2"
                    className="text-4xl md:text-5xl font-bold tracking-tight text-neutral-900 block"
                    text={data.title || "Featured Product"}
                    sectionId={id}
                    fieldKey="title"
                    isPreview={isPreview}
                  />
                  <InlineEdit
                    tagName="p"
                    className="text-lg text-neutral-600 block"
                    text={data.subtitle || ""}
                    sectionId={id}
                    fieldKey="subtitle"
                    isPreview={isPreview}
                  />
                </div>
                <SpotlightLayout product={products[0]} isPreview={isPreview} portfolioId={portfolioId} />
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
