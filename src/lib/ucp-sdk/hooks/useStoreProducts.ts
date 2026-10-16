import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/supabaseClient";
import { useCartStore } from "@/features/ecommerce/store/useCartStore";

/** Products for the data-bound store section: either the selected ones or the newest active products. */
export function useStoreProducts({ data, actorId, portfolioId }: { data: any; actorId?: string; portfolioId?: string }) {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const selectedIds: string[] = data.selectedProductIds || [];
  const selectedKey = JSON.stringify(selectedIds);

  useEffect(() => {
    let active = true;
    (async () => {
      let owner = actorId;
      // The builder preview passes a placeholder actor; resolve the signed-in owner instead.
      if (!owner || owner === "preview-actor-id") {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: actor } = await supabase.from("actors").select("id").eq("user_id", user.id).maybeSingle();
          owner = actor?.id;
        }
      }
      if (!owner || owner === "preview-actor-id") {
        if (active) setLoading(false);
        return;
      }

      let query = supabase.from("pro_products").select("*").eq("actor_id", owner).eq("status", "active");
      if (portfolioId) query = query.or(`portfolio_id.eq.${portfolioId},portfolio_id.is.null`);
      query = selectedIds.length > 0
        ? query.in("id", selectedIds)
        : query.order("created_at", { ascending: false }).limit(data.maxProductsToShow || 6);

      const { data: rows, error } = await query;
      if (!active) return;
      if (!error && rows) setProducts(rows);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [actorId, portfolioId, selectedKey, data.maxProductsToShow]);

  return { products, loading };
}

interface ProductOptions {
  isPreview?: boolean;
  portfolioId?: string;
}

function useProductUrl(product: any) {
  const location = useLocation();
  return () => {
    let base = location.pathname === "/" ? "" : location.pathname.replace(/\/$/, "");
    const isSiteRoot = base.split("/").length === 3 && base.startsWith("/pro/");
    if (!isSiteRoot && base.includes("/shop")) base = base.replace("/shop", "");
    return `${base}/product/${product.slug || product.id}`;
  };
}

function whatsappUrl(product: any, price: number, qty: number, options = "") {
  const text = `*NEW ORDER* 🛍️\n------------------\n*Product:* ${product.title}\n*Price:* $${price.toFixed(2)}\n*Qty:* ${qty}\n${options ? `*Options:* ${options}\n` : ""}------------------\nPlease confirm my order!`;
  const number = product.whatsapp_number ? String(product.whatsapp_number).replace(/[^0-9]/g, "") : "";
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
}

/** Behaviour of a product card: link target, quick action label, and what the action does. */
export function useProductCard(product: any, { isPreview, portfolioId }: ProductOptions) {
  const navigate = useNavigate();
  const addItem = useCartStore((s) => s.addItem);
  const getUrl = useProductUrl(product);

  const hasVariants = !!product.options?.length;
  const isExternal = product.action_type === "link";
  const isDirectOrder = product.action_type === "whatsapp" || product.action_type === "form_order";
  const image = product.images?.[0] || product.image;

  return {
    image,
    price: Number(product.price) || 0,
    onSale: Number(product.compare_at_price) > Number(product.price),
    hasVariants,
    isExternal,
    /** "link" | "options" | "add" so themes choose their own label and icon. */
    actionKind: (isExternal ? "link" : hasVariants || isDirectOrder ? "options" : "add") as "link" | "options" | "add",
    open: () => {
      if (!isPreview) navigate(getUrl());
    },
    quickAction: () => {
      if (isPreview) return;
      if (isExternal) window.open(product.checkout_url, "_blank");
      else if (hasVariants || product.action_type === "form_order") navigate(getUrl());
      else if (product.action_type === "whatsapp") window.open(whatsappUrl(product, product.price, 1), "_blank");
      else {
        addItem({
          id: product.id,
          title: product.title,
          price: product.price,
          image,
          quantity: 1,
          variant: "default",
          storeId: portfolioId || undefined,
          productType: product.product_type,
          collectionId: product.collection_id,
        });
      }
    },
  };
}

/** Full product configurator for a featured product: gallery, variants, quantity, live price, and the order action. */
export function useProductSpotlight(product: any, { isPreview, portfolioId }: ProductOptions) {
  const navigate = useNavigate();
  const addItem = useCartStore((s) => s.addItem);
  const getUrl = useProductUrl(product);
  const [quantity, setQuantity] = useState(1);
  const [activeImg, setActiveImg] = useState(0);
  const [selectedVariants, setSelectedVariants] = useState<Record<string, any>>({});

  const images: string[] = product.images?.length ? product.images : product.image ? [product.image] : [];
  const isOutOfStock = !!product.track_inventory && product.stock_count <= 0;

  useEffect(() => {
    if (!product.options?.length) return;
    const initial: Record<string, any> = {};
    product.options.forEach((opt: any) => {
      if (opt.values?.length > 0) initial[opt.name] = opt.values[0];
    });
    setSelectedVariants(initial);
  }, [product]);

  const currentPrice = useMemo(() => {
    const base = product.price || 0;
    if (!product.options?.length || Object.keys(selectedVariants).length === 0) return base;
    const prices = Object.values(selectedVariants).map((v: any) => Number(v.price)).filter((p) => !isNaN(p) && p > 0);
    return prices.length ? prices.reduce((sum, p) => sum + p, 0) : base;
  }, [product, selectedVariants]);

  const variantText = Object.entries(selectedVariants).map(([k, v]: [string, any]) => `${k}: ${v.label}`).join(", ");

  const act = () => {
    if (isPreview) return;
    if (product.action_type === "link") window.open(product.checkout_url, "_blank");
    else if (product.action_type === "whatsapp") window.open(whatsappUrl(product, currentPrice, quantity, variantText), "_blank");
    else if (product.action_type === "form_order") navigate(getUrl());
    else {
      addItem({
        id: product.id,
        title: product.title,
        price: currentPrice,
        image: product.images?.[0] || product.image,
        quantity,
        variant: variantText || "default",
        storeId: portfolioId || undefined,
        productType: product.product_type,
        collectionId: product.collection_id,
      });
    }
  };

  return {
    images,
    activeImg,
    setActiveImg,
    nextImage: () => setActiveImg((i) => (i + 1) % Math.max(images.length, 1)),
    prevImage: () => setActiveImg((i) => (i - 1 + images.length) % Math.max(images.length, 1)),
    quantity,
    setQuantity,
    selectedVariants,
    selectVariant: (name: string, value: any) => setSelectedVariants((s) => ({ ...s, [name]: value })),
    currentPrice,
    isOutOfStock,
    openProductPage: () => {
      if (!isPreview) navigate(getUrl());
    },
    act,
  };
}
