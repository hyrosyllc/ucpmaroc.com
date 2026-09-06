import { useState, useEffect } from "react";
import { useParams, useNavigate, useOutletContext } from "react-router-dom";
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
  "laughing-succotash-wrxrgrqvpj75hv99q-5173.app.github.dev",
];


export default function PublicProductPage() {
  const { slug, productSlug } = useParams<{
    slug?: string;
    productSlug: string;
  }>();
  const { portfolio } = useOutletContext<{ portfolio?: any }>();

  const navigate = useNavigate();
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

  // Store & Customer State
  const [themeConfig, setThemeConfig] = useState<any>({});
  const [customer, setCustomer] = useState<any>(null);
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  const [reviewForm, setReviewForm] = useState({ rating: 5, title: '', content: '' });
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);

  useEffect(() => {
    const fetchProductAndTheme = async () => {
      if (!productSlug) return;
      setLoading(true);

      const currentPortfolioId = portfolio?.id || null;
      const currentActorId = portfolio?.actor_id || null;
      const currentTheme = portfolio?.theme_config?.templateId || "modern";
      const currentPublicSlug = portfolio?.public_slug || slug || "";
      const currentThemeConfig = portfolio?.theme_config || {};

      if (!currentActorId) {
        setError("Store not found.");
        setLoading(false);
        return;
      }

      setTheme(currentTheme);
      setResolvedPublicSlug(currentPublicSlug);
      setPortfolioId(currentPortfolioId);
      setThemeConfig(currentThemeConfig);
      
      // 🚀 FORCE CONTEXT SWITCH IMMEDIATELY
      if (currentPortfolioId) {
        useCartStore.getState().validateStoreContext(currentPortfolioId);
      }

      // Check for Customer Session
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user && currentPortfolioId) {
         const { data: custData } = await supabase.from('pro_customers').select('id, name, email').eq('user_id', session.user.id).eq('portfolio_id', currentPortfolioId).maybeSingle();
         if (custData) setCustomer(custData);
      }

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

        // Fetch Approved Product Reviews
        const { data: reviewsData } = await supabase
          .from("pro_product_reviews")
          .select(`*, pro_customers(name, email)`)
          .eq("product_id", productData.id)
          .eq("is_published", true)
          .order("created_at", { ascending: false });
        
        if (reviewsData) productData.reviews = reviewsData;

        // 3. FETCH RELATED PRODUCTS
        let relatedQuery = supabase
          .from("pro_products")
          .select(`id, title, slug, price, compare_at_price, images, pro_collections(title)`)
          .eq("actor_id", currentActorId)
          .eq("status", "active")
          .neq("id", productData.id);

        if (currentPortfolioId) relatedQuery = relatedQuery.or(`portfolio_id.eq.${currentPortfolioId},portfolio_id.is.null`);

        if (productData.related_type === 'manual' && productData.related_products?.length > 0) {
          relatedQuery = relatedQuery.in('id', productData.related_products);
        } else if (productData.related_type === 'collection' && productData.related_collection_id) {
          relatedQuery = relatedQuery.eq('collection_id', productData.related_collection_id);
        } else if (productData.collection_id) {
          relatedQuery = relatedQuery.eq('collection_id', productData.collection_id); // Fallback: Auto
        }

        const { data: relData } = await relatedQuery.limit(4);
        if (relData) setRelatedProducts(relData);
      }
      setLoading(false);
    };

    fetchProductAndTheme();
  }, [portfolio, slug, productSlug]);

  // 🚀 DYNAMIC SEO & METADATA INJECTION
  useEffect(() => {
    if (!product) return;
    
    const title = product.seo_title || product.title || "Product";
    const desc = product.seo_description || product.short_description || product.description?.substring(0, 160) || "";
    const image = product.images?.[0] || "";

    // 1. Update Browser / Google Title
    document.title = title;

    // 2. Helper to safely create/update Meta tags
    const setMetaTag = (attribute: string, attrValue: string, content: string) => {
      let tag = document.querySelector(`meta[${attribute}="${attrValue}"]`);
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute(attribute, attrValue);
        document.head.appendChild(tag);
      }
      tag.setAttribute('content', content);
    };

    // 3. Inject Standard SEO & Open Graph Tags
    setMetaTag('name', 'description', desc);
    setMetaTag('property', 'og:title', title);
    setMetaTag('property', 'og:description', desc);
    if (image) setMetaTag('property', 'og:image', image);
  }, [product]);

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
        requiresShipping: product.delivery_type === 'physical' || product.requires_shipping,
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
    const variantText = Object.entries(selectedVariants)
      .map(([name, value]) => `${name}: ${value}`)
      .join(", ");

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

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer || !product) return;
    setIsSubmittingReview(true);
    const { error } = await supabase.from('pro_product_reviews').insert({
      product_id: product.id,
      customer_id: customer.id,
      rating: reviewForm.rating,
      title: reviewForm.title,
      content: reviewForm.content,
      is_published: false
    });
    setIsSubmittingReview(false);
    if (!error) {
      setReviewSuccess(true);
      setReviewForm({ rating: 5, title: '', content: '' });
    } else {
      alert("Failed to submit review. Try again.");
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
    themeConfig,
    customer,
    reviewForm,
    setReviewForm,
    isSubmittingReview,
    reviewSuccess,
    handleReviewSubmit,
    relatedProducts,
  };

  return (
    <>
      <CartDrawerContainer theme={theme} username={layoutProps.username} storeId={portfolioId} />

      {theme === "minimal" ? (
        <MinimalProductLayout {...layoutProps} />
      ) : (
        <ModernProductLayout {...layoutProps} />
      )}
    </>
  );
}
