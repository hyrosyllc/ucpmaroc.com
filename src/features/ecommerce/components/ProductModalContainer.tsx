// src/components/shop/ProductModalContainer.tsx
import React from "react";
import { supabase } from "@/supabaseClient";
import { trackEvent } from "@/lib/analytics";
import ModernProductModal from "@/themes/modern/components/ModernProductModal";
// import MinimalProductModal from '@/themes/minimal/components/MinimalProductModal';

const ProductModalContainer = ({
  product,
  actorId,
  portfolioId,
  isOpen,
  onClose,
  isPreview,
  theme = "modern",
}: any) => {
  // --- LOGIC 1: EXTERNAL LINK ---
  const handleExternalLink = () => {
    if (isPreview)
      return alert("Checkout actions are disabled in the builder.");
    trackEvent(actorId, "shop_click", {
      product_name: product.title,
      url: product.checkoutUrl,
      portfolio_id: portfolioId,
    });
    window.open(product.checkoutUrl || "#", "_blank");
    onClose();
  };

  // --- LOGIC 2: WHATSAPP ---
  const handleWhatsAppOrder = (
    clientInfo: any,
    quantity: number,
    selectedVariants: any
  ) => {
    if (isPreview)
      return alert("Checkout actions are disabled in the builder.");
    trackEvent(actorId, "whatsapp_click", {
      product_name: product.title,
      portfolio_id: portfolioId,
    });

    const variantText = Object.entries(selectedVariants)
      .map(([key, val]) => `${key}: ${val}`)
      .join(", ");
    const message = `*NEW ORDER REQUEST* 🛍️\n------------------\n*Product:* ${
      product.title
    }\n*Price:* ${product.price}\n*Qty:* ${quantity}\n${
      variantText ? `*Options:* ${variantText}` : ""
    }\n\n*CUSTOMER DETAILS* 👤\n*Name:* ${clientInfo.name}\n*Phone:* ${
      clientInfo.phone
    }\n*Address:* ${
      clientInfo.address
    }\n------------------\nPlease confirm this order!`;

    const number = product.whatsappNumber
      ? product.whatsappNumber.replace(/[^0-9]/g, "")
      : "1234567890";
    window.open(
      `https://wa.me/${number}?text=${encodeURIComponent(message)}`,
      "_blank"
    );
    onClose();
  };

  // --- LOGIC 3: SUPABASE DIRECT ORDER ---
  const handleDirectOrder = async (
    clientInfo: any,
    quantity: number,
    selectedVariants: any
  ): Promise<boolean> => {
    if (isPreview) return false;
    if (!actorId) {
      alert("Configuration Error: Missing Merchant ID");
      return false;
    }

    const { error } = await supabase.from("pro_orders").insert({
      actor_id: actorId,
      portfolio_id: portfolioId,
      customer_name: clientInfo.name,
      customer_phone: clientInfo.phone,
      customer_address: clientInfo.address,
      product_name: product.title,
      product_price: product.price,
      quantity: quantity,
      variants: selectedVariants,
      status: "pending",
    });

    if (error) {
      console.error("Order Error:", error);
      alert("There was an issue saving your order. Please try again.");
      return false;
    }

    trackEvent(actorId, "shop_click", {
      product_name: product.title,
      type: "direct_order",
      portfolio_id: portfolioId,
    });
    return true; // Success!
  };

  // --- ROUTER ---
  // if (theme === 'minimal') return <MinimalProductModal ... />

  return (
    <ModernProductModal
      product={product}
      isOpen={isOpen}
      onClose={onClose}
      onExternalLink={handleExternalLink}
      onWhatsAppOrder={handleWhatsAppOrder}
      onDirectOrder={handleDirectOrder}
    />
  );
};

export default ProductModalContainer;

