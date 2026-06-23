import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/supabaseClient";
import { useCartStore } from "../store/useCartStore";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

// Import Theme Layouts
import ModernProductLayout from "@/themes/modern/ProductLayout";
import MinimalProductLayout from "@/themes/cupertino/ProductLayout"; // Note: ensure path is correct!
import CartDrawerContainer from "@/features/ecommerce/components/CartDrawerContainer";

// Ensure this matches App.tsx
const MAIN_DOMAINS = [
  "ucpmaroc.com",
  "www.ucpmaroc.com",
  "localhost",
  "127.0.0.1",
  "symmetrical-acorn-697wxxq4r74j3jpj-5173.app.github.dev",
    "psychic-cod-r74vrp5xx9gq2ppr7-5173.app.github.dev",
];

export default function PublicProductPage() {
  const { slug, productSlug } = useParams<{
    slug?: string;
    productSlug: string;
  }>();

  const navigate = useNavigate();
  const location = useLocation();
  const addItem = useCartStore((state) => state.addItem);

  const [product, setProduct] = useState<any>(null);
  const [theme, setTheme] = useState<string>("modern");

  // ✅ Tracks the correct store URL prefix
  const [resolvedPublicSlug, setResolvedPublicSlug] = useState<string>("");
  const [portfolioId, setPortfolioId] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Interaction State
  const [activeImgIndex, setActiveImgIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariants, setSelectedVariants] = useState<Record<string, any>>(
    {}
  );

  // Checkout State
  const [step, setStep] = useState<"details" | "form" | "success">("details");
  const [clientInfo, setClientInfo] = useState({
    name: "",
    phone: "",
    address: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dynamic Form State
  const [formTemplate, setFormTemplate] = useState<any>(null);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [isLoadingForm, setIsLoadingForm] = useState(false);

  useEffect(() => {
    const fetchProductAndTheme = async () => {
      if (!productSlug) return;
      setLoading(true);

      const currentHostname = window.location.hostname;
      const isCustomDomain = !MAIN_DOMAINS.some((domain) =>
        currentHostname.includes(domain)
      );

      let currentActorId = null;
      let currentPortfolioId = null; // <-- NEW: Track this for store separation
      let currentTheme = "modern";
      let currentPublicSlug = slug || "";

      // 1. ENVIRONMENT-AWARE ACTOR LOOKUP (FIXED 406 CRASH)
      if (isCustomDomain) {
        const { data: portData } = await supabase
          .from("portfolios")
          .select("id, actor_id, theme_config, public_slug")
          .eq("custom_domain", currentHostname)
          .maybeSingle(); // <-- PREVENTS 406 ERROR

        if (portData) {
          currentPortfolioId = portData.id;
          currentActorId = portData.actor_id;
          currentTheme = portData.theme_config?.templateId || "modern";
          if (portData.public_slug) currentPublicSlug = portData.public_slug;
        }
      } else if (slug) {
        // ✅ CORRECT LOOKUP: Query PORTFOLIOS using public_slug!
        const { data: portData } = await supabase
          .from("portfolios")
          .select("id, actor_id, theme_config, public_slug")
          .eq("public_slug", slug)
          .maybeSingle(); // <-- PREVENTS 406 ERROR

        if (portData) {
          currentPortfolioId = portData.id;
          currentActorId = portData.actor_id;
          currentTheme = portData.theme_config?.templateId || "modern";
          currentPublicSlug = portData.public_slug;
        }
      }

      if (!currentActorId) {
        setError("Store not found.");
        setLoading(false);
        return;
      }

      setTheme(currentTheme);
      setResolvedPublicSlug(currentPublicSlug);
      setPortfolioId(currentPortfolioId);

      // 2. FETCH EXACT PRODUCT (WITH STORE SEPARATION LOGIC)
      let productQuery = supabase
        .from("pro_products")
        .select(`*, pro_collections(title, slug)`)
        .eq("actor_id", currentActorId)
        .eq("slug", productSlug)
        .eq("status", "active");

      // ✅ SMART FILTER: Ensure product belongs to this specific store OR is global!
      if (currentPortfolioId) {
        productQuery = productQuery.or(
          `portfolio_id.eq.${currentPortfolioId},portfolio_id.is.null`
        );
      }

      // Use maybeSingle to prevent crashes if a user tries to view a Store B product on Store A's site
      const { data: productData, error: productError } =
        await productQuery.maybeSingle();

      if (productError || !productData) {
        setError("Product not found.");
      } else {
        setProduct(productData);

        // Auto-select the first available variant option
        const initialVariants: Record<string, any> = {};
        if (productData.options?.length > 0) {
          productData.options.forEach((opt: any) => {
            if (opt.values.length > 0)
              initialVariants[opt.name] = opt.values[0];
          });
        }
        setSelectedVariants(initialVariants);

        // Fetch dynamic form if applicable
        if (productData.action_type === 'form_order' && productData.form_id) {
          setIsLoadingForm(true);
          const { data: fData } = await supabase.from('forms').select('*').eq('id', productData.form_id).maybeSingle();
          if (fData) setFormTemplate(fData);
          setIsLoadingForm(false);
        }
      }
      setLoading(false);
    };

    fetchProductAndTheme();
  }, [slug, productSlug]);

  let currentPrice = product?.price || 0;
  if (product && selectedVariants) {
    const variantPrices = Object.values(selectedVariants)
      .map((val: any) => Number(val.price))
      .filter((p) => !isNaN(p) && p > 0);
    if (variantPrices.length > 0) {
      currentPrice = variantPrices.reduce((sum, p) => sum + p, 0);
    }
  }

  const handleMainAction = () => {
    const actionType = product.action_type || "cart";

    if (actionType === "link") {
      window.open(product.checkout_url || "#", "_blank");
      return;
    }

    if (actionType === "cart") {
      const variantString = Object.entries(selectedVariants)
        .map(([k, v]) => `${k}: ${v.label}`)
        .join(", ");
      addItem({
        id: product.id,
        title: product.title,
        price: currentPrice,
        image: product.images?.[0],
        quantity,
        variant: variantString || "default",
        storeId: portfolioId || undefined,
        productType: product.product_type,
        collectionId: product.collection_id,
      });
      return;
    }

    setStep("form");
  };

  const handleConfirmOrder = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!formTemplate) {
      if (!clientInfo.name || !clientInfo.phone) {
        alert("Please provide your name and phone number.");
        return;
      }
    }

    setIsSubmitting(true);
    const actionType = product.action_type;

    if (actionType === "whatsapp") {
      const message = `*NEW ORDER REQUEST* 🛍️\n------------------\n*Product:* ${
        product.title
      }\n*Price:* $${currentPrice.toFixed(2)}\n*Qty:* ${quantity}\n${
        variantText ? `*Options:* ${variantText}` : ""
      }\n\n*CUSTOMER DETAILS* 👤\n*Name:* ${clientInfo.name}\n*Phone:* ${
        clientInfo.phone
      }\n*Address:* ${
        clientInfo.address
      }\n------------------\nPlease confirm this order!`;

      const number = product.whatsapp_number
        ? product.whatsapp_number.replace(/[^0-9]/g, "")
        : "";
      window.open(
        `https://wa.me/${number}?text=${encodeURIComponent(message)}`,
        "_blank"
      );

      setStep("success");
      setIsSubmitting(false);
      return;
    }

    if (actionType === "form_order") {
      const getFieldVal = (keywords: string[]) => {
        const key = Object.keys(formValues).find((k) =>
          keywords.some((keyword) => k.toLowerCase().includes(keyword))
        );
        return key ? formValues[key] : "";
      };

      const finalName = formTemplate ? getFieldVal(["name", "first", "last"]) : clientInfo.name;
      const finalPhone = formTemplate ? getFieldVal(["phone", "tel", "mobile"]) : clientInfo.phone;
      const finalAddress = formTemplate ? getFieldVal(["address", "shipping", "street", "city", "zip"]) : clientInfo.address;

      let notesText = "";
      if (formTemplate) {
        notesText = Object.entries(formValues).map(([k, v]) => {
          const fieldDef = formTemplate.fields?.find((f: any) => f.id === k);
          const label = fieldDef ? fieldDef.label : k;
          return `${label}: ${v}`;
        }).join("\n");
      }

      const { error: orderError } = await supabase.from("pro_orders").insert({
        actor_id: product.actor_id,
        portfolio_id: portfolioId,
        customer_name: finalName || "Anonymous Buyer",
        customer_phone: finalPhone || "No Phone",
        customer_address: finalAddress || "No Address Provided",
        product_name: product.title,
        product_price: currentPrice,
        quantity: quantity,
        variants: selectedVariants,
        status: "pending",
        notes: notesText || undefined
      });

      if (orderError) {
        alert("There was an issue placing your order. Please try again.");
      } else {
        setStep("success");
      }
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground">
        <h2 className="text-2xl font-bold mb-4">{error}</h2>
        <Button onClick={() => navigate(-1)}>Go Back</Button>
      </div>
    );
  }

  function isCustomDomain() {
    return !MAIN_DOMAINS.some((domain) =>
      window.location.hostname.includes(domain)
    );
  }

  const layoutProps = {
    product,
    username: isCustomDomain() ? "" : `pro/${resolvedPublicSlug}`,
    currentPrice,
    quantity,
    setQuantity,
    selectedVariants,
    setSelectedVariants,
    activeImgIndex,
    setActiveImgIndex,
    step,
    setStep,
    clientInfo,
    setClientInfo,
    isSubmitting,
    handleMainAction,
    handleConfirmOrder,
    formTemplate,
    formValues,
    setFormValues,
    isLoadingForm,
  };

  return (
    <>
      <CartDrawerContainer theme={theme} username={layoutProps.username} />

      {theme === "minimal" ? (
        <MinimalProductLayout {...layoutProps} />
      ) : (
        <ModernProductLayout {...layoutProps} />
      )}
    </>
  );
}
