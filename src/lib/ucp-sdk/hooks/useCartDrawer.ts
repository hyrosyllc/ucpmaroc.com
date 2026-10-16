import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCartStore } from "@/features/ecommerce/store/useCartStore";
import { supabase } from "@/supabaseClient";

interface Options {
  username?: string;
  isPreview?: boolean;
}

/** Cart drawer state and actions. Themes decide how the drawer looks; pricing, coupons and routing stay here. */
export function useCartDrawer({ username, isPreview }: Options = {}) {
  const { items, isOpen, closeCart, updateQuantity, removeItem, coupon, applyCoupon, removeCoupon, getCartDiscount } = useCartStore();
  const navigate = useNavigate();
  const [couponInput, setCouponInput] = useState("");
  const [couponError, setCouponError] = useState("");
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discount = getCartDiscount();
  const total = Math.max(0, subtotal - discount);

  const submitCoupon = async () => {
    setCouponError("");
    if (!couponInput.trim()) return;

    setIsValidatingCoupon(true);
    const { data, error } = await supabase.from("pro_coupons").select("*").eq("code", couponInput.trim().toUpperCase()).eq("is_active", true);
    setIsValidatingCoupon(false);

    if (error || !data || data.length === 0) return setCouponError("Invalid or expired coupon code.");

    const storeId = items[0]?.storeId || null;
    const valid = data.find((c: any) => !c.portfolio_id || c.portfolio_id === storeId);
    if (!valid) return setCouponError("This coupon is not valid for this store.");

    const now = new Date();
    if (valid.start_date && new Date(valid.start_date) > now) return setCouponError("This coupon is not active yet.");
    if (valid.end_date && new Date(valid.end_date) < now) return setCouponError("This coupon has expired.");
    if (valid.usage_limit && valid.times_used >= valid.usage_limit) return setCouponError("This coupon has reached its usage limit.");
    if (valid.min_order_amount_cents && subtotal * 100 < valid.min_order_amount_cents) {
      return setCouponError(`Order must be at least $${(valid.min_order_amount_cents / 100).toFixed(2)}`);
    }

    applyCoupon(valid);
    setCouponInput("");
  };

  const checkout = () => {
    if (isPreview) {
      alert("Checkout is disabled in Preview Mode. Publish your site to test the checkout flow.");
      return;
    }
    closeCart();

    // The URL decides the checkout route so platform and custom domains both land on the right store.
    const currentPath = window.location.pathname;
    if (currentPath.startsWith("/pro/")) {
      const slug = currentPath.split("/")[2];
      if (slug) return navigate(`/pro/${slug}/checkout`);
    } else if (username && username.startsWith("pro/")) {
      return navigate(`/${username}/checkout`);
    }
    navigate("/checkout");
  };

  return {
    items,
    isOpen,
    close: closeCart,
    setQuantity: (id: string, quantity: number, variant?: string) => updateQuantity(id, Math.max(1, quantity), variant),
    remove: (id: string, variant?: string) => removeItem(id, variant),
    coupon,
    couponInput,
    setCouponInput,
    couponError,
    isValidatingCoupon,
    submitCoupon,
    removeCoupon,
    subtotal,
    discount,
    total,
    checkout,
  };
}
