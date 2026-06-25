import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCartStore } from "@/features/ecommerce/store/useCartStore";
import { supabase } from "@/supabaseClient";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, Tag, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ModernCartDrawer({
  username,
  isPreview,
}: {
  username?: string;
  isPreview?: boolean;
}) {
  const { items, isOpen, closeCart, updateQuantity, removeItem, coupon, applyCoupon, removeCoupon, getCartDiscount } =
    useCartStore();
  const navigate = useNavigate();
  
  const [couponInput, setCouponInput] = useState("");
  const [couponError, setCouponError] = useState("");
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discount = getCartDiscount();
  const cartTotal = Math.max(0, subtotal - discount);

  const handleApplyCoupon = async () => {
    setCouponError("");
    if (!couponInput.trim()) return;
    
    setIsValidatingCoupon(true);
    const { data, error } = await supabase
      .from('pro_coupons')
      .select('*')
      .eq('code', couponInput.trim().toUpperCase())
      .eq('is_active', true);
    setIsValidatingCoupon(false);

    if (error || !data || data.length === 0) {
      return setCouponError("Invalid or expired coupon code.");
    }

    const storeId = items[0]?.storeId || null;
    const validCoupon = data.find(c => !c.portfolio_id || c.portfolio_id === storeId);

    if (!validCoupon) return setCouponError("This coupon is not valid for this store.");

    // Validate constraints
    const now = new Date();
    if (validCoupon.start_date && new Date(validCoupon.start_date) > now) return setCouponError("This coupon is not active yet.");
    if (validCoupon.end_date && new Date(validCoupon.end_date) < now) return setCouponError("This coupon has expired.");
    if (validCoupon.usage_limit && validCoupon.times_used >= validCoupon.usage_limit) return setCouponError("This coupon has reached its usage limit.");
    if (validCoupon.min_order_amount_cents && (subtotal * 100) < validCoupon.min_order_amount_cents) return setCouponError(`Order must be at least $${(validCoupon.min_order_amount_cents / 100).toFixed(2)}`);

    applyCoupon(validCoupon);
    setCouponInput("");
  };

  const handleCheckout = () => {
    if (isPreview) {
      alert(
        "Checkout is disabled in Preview Mode. Publish your site to test the checkout flow."
      );
      return;
    }

    closeCart();
    
    // Smart Routing based on current URL to guarantee it goes to the right checkout
    const currentPath = window.location.pathname;
    
    if (currentPath.startsWith("/pro/")) {
      const pathParts = currentPath.split('/');
      const slug = pathParts[2]; // ['', 'pro', 'slug']
      if (slug) {
        navigate(`/pro/${slug}/checkout`);
        return;
      }
    } else if (username && username.startsWith("pro/")) {
      navigate(`/${username}/checkout`);
      return;
    }
    
    // Custom Domain Fallback
    navigate(`/checkout`);
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && closeCart()}>
      {/* 🚀 GLASSMORPHISM & THEME BACKGROUND */}
      <SheetContent className="w-full sm:max-w-md flex flex-col p-0 bg-neutral-950/95 backdrop-blur-2xl border-l border-white/10 text-white z-[99999] shadow-[-20px_0_50px_rgba(0,0,0,0.5)]">
        <SheetHeader className="p-6 border-b border-white/10 text-left relative overflow-hidden shrink-0">
          {/* Subtle Primary Glow behind the header */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-[50px] rounded-full pointer-events-none" />

          <SheetTitle className="flex items-center text-2xl font-bold text-white relative z-10">
            <ShoppingBag className="w-6 h-6 mr-3 text-primary" />
            Your Cart
          </SheetTitle>

          <SheetDescription className="sr-only">
            Review your selected items and proceed to checkout.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar relative z-10">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-5 opacity-70 animate-in fade-in duration-500">
              <div className="w-24 h-24 rounded-full bg-neutral-900/50 border border-white/5 flex items-center justify-center">
                <ShoppingBag className="w-10 h-10 text-neutral-500" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-white">
                  Your cart is empty
                </h3>
                <p className="text-sm font-medium text-neutral-400 max-w-[200px] mx-auto">
                  Looks like you haven't added anything yet.
                </p>
              </div>
              <Button
                variant="outline"
                onClick={closeCart}
                className="mt-4 border-white/10 bg-neutral-900/50 text-white hover:bg-white/10 transition-colors"
              >
                Continue Shopping
              </Button>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={`${item.id}-${item.variant}`}
                className="flex gap-4 relative group bg-neutral-900/40 p-3 rounded-2xl border border-white/5 hover:border-primary/30 hover:bg-neutral-900/60 transition-all duration-300"
              >
                <div className="w-20 h-20 rounded-xl border border-white/10 bg-black overflow-hidden flex-shrink-0 relative">
                  {item.image ? (
                    <img
                      src={item.image}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      alt={item.title}
                    />
                  ) : (
                    <ShoppingBag className="w-6 h-6 m-auto text-neutral-600 mt-7" />
                  )}
                  {/* Subtle overlay gradient on images */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
                </div>

                <div className="flex flex-col flex-1 py-1 pr-6">
                  <h3 className="font-bold text-white leading-tight line-clamp-2 group-hover:text-primary transition-colors text-sm">
                    {item.title}
                  </h3>
                  {item.variant && (
                    <p className="text-[11px] uppercase tracking-wider text-primary font-bold mt-1.5 opacity-90">
                      {item.variant}
                    </p>
                  )}

                  <div className="mt-auto flex items-center justify-between pt-3">
                    <div className="flex items-center border border-white/10 rounded-lg bg-black/50">
                      <button
                        className="px-2.5 py-1.5 text-neutral-400 hover:text-white transition-colors"
                        onClick={() =>
                          updateQuantity(
                            item.id,
                            Math.max(1, item.quantity - 1),
                            item.variant
                          )
                        }
                      >
                        <Minus size={12} />
                      </button>
                      <span className="text-xs font-bold w-6 text-center text-white">
                        {item.quantity}
                      </span>
                      <button
                        className="px-2.5 py-1.5 text-neutral-400 hover:text-white transition-colors"
                        onClick={() =>
                          updateQuantity(
                            item.id,
                            item.quantity + 1,
                            item.variant
                          )
                        }
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                    <span className="font-bold text-white text-base">
                      ${(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>

                  <button
                    onClick={() => removeItem(item.id, item.variant)}
                    className="absolute top-2 right-2 p-2 rounded-full text-neutral-500 hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
                    title="Remove item"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {items.length > 0 && (
          <div className="p-6 bg-neutral-950 border-t border-white/10 space-y-4 shrink-0 relative">
            
            {/* Coupon Input Area */}
            <div className="space-y-2">
              {!coupon ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Discount code"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value)}
                    className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 text-sm focus:outline-none focus:border-primary transition-colors uppercase placeholder:normal-case text-white"
                  />
                  <Button variant="secondary" onClick={handleApplyCoupon} disabled={isValidatingCoupon || !couponInput.trim()} className="h-10 px-4">
                    {isValidatingCoupon ? <Loader2 className="w-4 h-4 animate-spin" /> : "Apply"}
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-between bg-primary/10 border border-primary/20 rounded-lg px-3 py-2">
                  <div className="flex items-center gap-2 text-primary font-medium text-sm"><Tag size={14} /> {coupon.code}</div>
                  <button onClick={removeCoupon} className="text-primary/70 hover:text-primary transition-colors"><X size={14} /></button>
                </div>
              )}
              {couponError && <p className="text-xs text-red-400 font-medium">{couponError}</p>}
            </div>

            {/* Subtotal & Total */}
            <div className="space-y-1.5 pt-2">
               <div className="flex justify-between items-center text-sm">
                  <span className="text-neutral-400">Subtotal</span>
                  <span className="text-white">${subtotal.toFixed(2)}</span>
               </div>
               {coupon && discount > 0 && (
                 <div className="flex justify-between items-center text-sm text-primary font-medium">
                    <span className="flex items-center gap-1.5"><Tag size={14}/> {coupon.code}</span>
                    <span>-${discount.toFixed(2)}</span>
                 </div>
               )}
               <div className="flex justify-between items-center text-lg mt-2 border-t border-white/10 pt-3">
                  <span className="text-neutral-400 font-medium text-sm uppercase tracking-wider">Total</span>
                  <span className="text-3xl font-bold text-white">${cartTotal.toFixed(2)}</span>
               </div>
            </div>

            {/* 🚀 THEME INHERITANCE: Button uses Primary color and glowing shadow */}
            <Button
              className="w-full h-14 text-lg font-bold bg-primary text-primary-foreground hover:brightness-110 shadow-[0_0_20px_rgba(var(--primary),0.25)] hover:shadow-[0_0_30px_rgba(var(--primary),0.4)] hover:scale-[1.02] transition-all duration-300"
              onClick={handleCheckout}
            >
              Proceed to Checkout <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
