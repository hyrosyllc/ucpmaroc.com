import React, { useEffect } from "react";
import { Minus, Plus, ShoppingBag, Tag, Trash2, X, Loader2, ArrowRight } from "lucide-react";
import { UCP } from "@ucp/sdk";

export default function CupertinoCartDrawer({ username, isPreview }: { username?: string; isPreview?: boolean }) {
  const cart = UCP.useCartDrawer({ username, isPreview });

  useEffect(() => {
    if (!cart.isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && cart.close();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [cart.isOpen, cart.close]);

  if (!cart.isOpen) return null;

  return (
    <div className="fixed inset-0 z-[99999] flex justify-end" role="dialog" aria-modal="true" aria-label="Your cart">
      <button type="button" aria-label="Close cart" onClick={cart.close} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
      <aside className="relative flex h-full w-full max-w-md flex-col bg-white font-sans text-slate-900 shadow-2xl animate-in slide-in-from-right duration-300">
        <header className="flex items-center justify-between border-b border-slate-100 p-6">
          <h2 className="text-2xl font-[800] tracking-tighter">Your cart</h2>
          <button type="button" onClick={cart.close} aria-label="Close" className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"><X size={20} /></button>
        </header>

        <div className="flex-1 space-y-4 overflow-y-auto p-6">
          {cart.items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-slate-100 text-slate-400"><ShoppingBag size={36} /></div>
              <h3 className="text-xl font-[800] tracking-tight">Your cart is empty</h3>
              <button type="button" onClick={cart.close} className="rounded-full bg-slate-900 px-6 py-3 text-sm font-bold text-white transition hover:scale-105">Continue shopping</button>
            </div>
          ) : (
            cart.items.map((item: any) => (
              <div key={`${item.id}-${item.variant}`} className="flex gap-4 rounded-[1.5rem] bg-slate-50 p-3">
                <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-slate-200">
                  {item.image ? <img src={item.image} alt={item.title} className="h-full w-full object-cover" /> : <ShoppingBag className="m-auto mt-7 text-slate-400" size={22} />}
                </div>
                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="line-clamp-2 text-sm font-bold leading-tight">{item.title}</h3>
                    <button type="button" onClick={() => cart.remove(item.id, item.variant)} aria-label={`Remove ${item.title}`} className="text-slate-400 transition hover:text-red-500"><Trash2 size={15} /></button>
                  </div>
                  {item.variant && item.variant !== "default" && <p className="mt-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">{item.variant}</p>}
                  <div className="mt-auto flex items-center justify-between pt-2">
                    <div className="flex items-center rounded-full bg-white shadow-sm">
                      <button type="button" aria-label="Decrease quantity" onClick={() => cart.setQuantity(item.id, item.quantity - 1, item.variant)} className="p-2 text-slate-500 hover:text-slate-900"><Minus size={13} /></button>
                      <span className="w-6 text-center text-xs font-bold">{item.quantity}</span>
                      <button type="button" aria-label="Increase quantity" onClick={() => cart.setQuantity(item.id, item.quantity + 1, item.variant)} className="p-2 text-slate-500 hover:text-slate-900"><Plus size={13} /></button>
                    </div>
                    <span className="font-bold">${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {cart.items.length > 0 && (
          <footer className="space-y-4 border-t border-slate-100 p-6">
            {cart.coupon ? (
              <div className="flex items-center justify-between rounded-full bg-slate-100 px-4 py-2 text-sm font-bold">
                <span className="flex items-center gap-2"><Tag size={14} /> {cart.coupon.code}</span>
                <button type="button" onClick={cart.removeCoupon} aria-label="Remove coupon" className="text-slate-500 hover:text-slate-900"><X size={14} /></button>
              </div>
            ) : (
              <div>
                <div className="flex gap-2">
                  <input value={cart.couponInput} onChange={(e) => cart.setCouponInput(e.target.value)} placeholder="Discount code" aria-label="Discount code" className="h-11 flex-1 rounded-full bg-slate-50 px-5 text-sm font-medium uppercase outline-none ring-1 ring-slate-200 placeholder:normal-case focus:ring-2 focus:ring-slate-900" />
                  <button type="button" onClick={cart.submitCoupon} disabled={cart.isValidatingCoupon || !cart.couponInput.trim()} className="rounded-full bg-slate-100 px-5 text-sm font-bold transition hover:bg-slate-200 disabled:opacity-50">
                    {cart.isValidatingCoupon ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apply"}
                  </button>
                </div>
                {cart.couponError && <p role="alert" className="mt-2 text-xs font-semibold text-red-500">{cart.couponError}</p>}
              </div>
            )}

            <dl className="space-y-1.5 text-sm">
              <div className="flex justify-between text-slate-500"><dt>Subtotal</dt><dd className="font-semibold text-slate-900">${cart.subtotal.toFixed(2)}</dd></div>
              {cart.coupon && cart.discount > 0 && <div className="flex justify-between font-semibold text-emerald-600"><dt>{cart.coupon.code}</dt><dd>-${cart.discount.toFixed(2)}</dd></div>}
              <div className="flex items-end justify-between border-t border-slate-100 pt-3"><dt className="font-bold">Total</dt><dd className="text-3xl font-[800] tracking-tighter">${cart.total.toFixed(2)}</dd></div>
            </dl>

            <button type="button" onClick={cart.checkout} className="flex h-14 w-full items-center justify-center gap-2 rounded-full bg-slate-900 text-base font-bold text-white transition hover:scale-[1.02] active:scale-95">
              Checkout <ArrowRight size={18} />
            </button>
          </footer>
        )}
      </aside>
    </div>
  );
}
