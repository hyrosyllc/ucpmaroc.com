import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/supabaseClient";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

// Import Layouts
import ModernShopLayout from "@/themes/modern/ShopLayout";
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

export default function PublicShopPage() {
  const { slug } = useParams<{ slug?: string }>();
  const navigate = useNavigate();

  const [theme, setTheme] = useState<string>("modern");
  const [resolvedPublicSlug, setResolvedPublicSlug] = useState<string>("");
  const [products, setProducts] = useState<any[]>([]);
  const [collections, setCollections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter State
  const [activeCollection, setActiveCollection] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchShopData = async () => {
      setLoading(true);

      const currentHostname = window.location.hostname;
      const isCustomDomain = !MAIN_DOMAINS.some((domain) =>
        currentHostname.includes(domain)
      );

      let currentActorId = null;
      let currentPortfolioId = null; // <-- NEW: We need this to filter the products
      let currentTheme = "modern";
      let currentPublicSlug = slug || "";

      // 1. ENVIRONMENT-AWARE ACTOR LOOKUP (FIXED 406 CRASH)
      if (isCustomDomain) {
        // Fetch by custom domain from portfolios
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

      // 2. Fetch Products & Collections (WITH STORE SEPARATION LOGIC)
      let productsQuery = supabase
        .from("pro_products")
        .select(`*, pro_collections(title, slug)`)
        .eq("actor_id", currentActorId)
        .eq("status", "active")
        .order("created_at", { ascending: false });

      // ✅ SMART FILTER: Only fetch products assigned to this specific store OR global (null) products!
      if (currentPortfolioId) {
        productsQuery = productsQuery.or(
          `portfolio_id.eq.${currentPortfolioId},portfolio_id.is.null`
        );
      }

      let collectionsQuery = supabase
        .from("pro_collections")
        .select("*")
        .eq("actor_id", currentActorId)
        .eq("status", "active")
        .order("created_at", { ascending: false });

      if (currentPortfolioId) {
        collectionsQuery = collectionsQuery.or(
          `portfolio_id.eq.${currentPortfolioId},portfolio_id.is.null`
        );
      }

      const [productsRes, collectionsRes] = await Promise.all([
        productsQuery,
        collectionsQuery,
      ]);

      if (productsRes.data) setProducts(productsRes.data);
      if (collectionsRes.data) setCollections(collectionsRes.data);

      setLoading(false);
    };

    fetchShopData();
  }, [slug]);

  // Derived state: Filter products based on search query AND active collection
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesCollection = activeCollection
        ? product.collection_id === activeCollection
        : true;
      const matchesSearch =
        product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCollection && matchesSearch;
    });
  }, [products, activeCollection, searchQuery]);

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );

  if (error)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground">
        <h2 className="text-2xl font-bold mb-4">{error}</h2>
        <Button onClick={() => navigate(-1)}>Go Back</Button>
      </div>
    );

  // Helper for the layout props to keep URLs clean based on environment
  function isCustomDomain() {
    return !MAIN_DOMAINS.some((domain) =>
      window.location.hostname.includes(domain)
    );
  }

  const layoutProps = {
    username: isCustomDomain() ? "" : `pro/${resolvedPublicSlug}`,
    products,
    collections,
    activeCollection,
    setActiveCollection,
    searchQuery,
    setSearchQuery,
    filteredProducts,
  };

  // ROUTER: Inject the exact layout based on the actor's active theme
  return (
    <>
      <CartDrawerContainer theme={theme} username={layoutProps.username} />
      <ModernShopLayout {...layoutProps} />
    </>
  );
}
