import React from "react";
import { Link } from "react-router-dom";
import { ChevronDown, ChevronLeft, ChevronUp, Loader2, Lock, ShoppingBag, Tag, Truck, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { UCP } from "@ucp/sdk";

const money = (n: number) => `$${n.toFixed(2)}`;

function Summary({ c }: { c: any }) {
  return (
    <div className="space-y-6">
      <ul className="space-y-4">
        {c.items.map((item: any) => (
          <li key={`${item.id}-${item.variant}`} className="flex items-center gap-4">
            <div className="relative h-16 w-16 shrink-0 rounded-2xl bg-slate-100">
              {item.image ? <img src={item.image} alt="" className="h-full w-full rounded-2xl object-cover" /> : <ShoppingBag className="m-auto mt-5 text-slate-400" size={22} />}
              <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 text-[11px] font-bold text-white">{item.quantity}</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold">{item.title}</p>
              {item.variant && item.variant !== "default" && <p className="truncate text-xs font-medium text-slate-500">{item.variant}</p>}
            </div>
            <span className="text-sm font-bold">{money(item.price * item.quantity)}</span>
          </li>
        ))}
      </ul>

      {c.coupon ? (
        <div className="flex items-center justify-between rounded-full bg-slate-100 px-4 py-2 text-sm font-bold">
          <span className="flex items-center gap-2"><Tag size={14} /> {c.coupon.code}</span>
          <button type="button" onClick={c.removeCoupon} aria-label="Remove coupon" className="text-slate-500 hover:text-slate-900"><X size={14} /></button>
        </div>
      ) : (
        <div>
          <div className="flex gap-2">
            <input value={c.couponInput} onChange={(e) => c.setCouponInput(e.target.value)} placeholder="Discount code" aria-label="Discount code" className="h-11 flex-1 rounded-full bg-slate-50 px-5 text-sm font-medium uppercase outline-none ring-1 ring-slate-200 placeholder:normal-case focus:ring-2 focus:ring-slate-900" />
            <button type="button" onClick={c.handleApplyCoupon} disabled={c.isValidatingCoupon || !c.couponInput.trim()} className="rounded-full bg-slate-100 px-5 text-sm font-bold transition hover:bg-slate-200 disabled:opacity-50">
              {c.isValidatingCoupon ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apply"}
            </button>
          </div>
          {c.couponError && <p role="alert" className="mt-2 text-xs font-semibold text-red-500">{c.couponError}</p>}
        </div>
      )}

      <dl className="space-y-2 border-t border-slate-100 pt-5 text-sm">
        <div className="flex justify-between text-slate-500"><dt>Subtotal</dt><dd className="font-semibold text-slate-900">{money(c.subtotal)}</dd></div>
        {c.coupon && c.discount > 0 && <div className="flex justify-between font-semibold text-emerald-600"><dt>{c.coupon.code}</dt><dd>-{money(c.discount)}</dd></div>}
        <div className="flex justify-between text-slate-500">
          <dt>Shipping</dt>
          <dd className="font-semibold text-slate-900">
            {!c.requiresShipping ? "Free" : c.selectedShippingRate ? (c.shippingCost === 0 ? "Free" : money(c.shippingCost)) : <span className="text-xs font-medium text-slate-400">Calculated at next step</span>}
          </dd>
        </div>
        <div className="flex items-end justify-between border-t border-slate-100 pt-4"><dt className="font-bold">Total</dt><dd className="text-3xl font-[800] tracking-tighter">{money(c.finalTotal)}</dd></div>
      </dl>
    </div>
  );
}

export default function CupertinoCheckoutView({ portfolio }: any) {
  const c = UCP.useCheckout(portfolio);
  const slots = c.slots;
  const steps = ["Contact", "Payment"];
  const values = c.formValues || {};

  return (
    <div className="min-h-screen bg-slate-50 pb-16 pt-24 font-sans text-slate-900">
      <div className="mx-auto max-w-6xl px-4 md:px-8">
        <div className="mb-8">
          <Link to={c.shopUrl} className="inline-flex items-center text-sm font-bold text-slate-500 transition hover:text-slate-900">
            <ChevronLeft size={16} className="mr-1" /> Back to shop
          </Link>
          <h1 className="mt-3 text-4xl font-[800] tracking-tighter">{portfolio.site_name || "Checkout"}</h1>
          <ol className="mt-6 flex items-center gap-3 text-sm font-bold" aria-label="Checkout steps">
            {steps.map((label, i) => (
              <li key={label} className={cn("flex items-center gap-2", c.checkoutStep === i + 1 ? "text-slate-900" : "text-slate-400")} aria-current={c.checkoutStep === i + 1 ? "step" : undefined}>
                <span className={cn("flex h-7 w-7 items-center justify-center rounded-full text-xs", c.checkoutStep === i + 1 ? "bg-slate-900 text-white" : "bg-slate-200")}>{i + 1}</span>
                {label}
                {i === 0 && <span className="mx-2 h-px w-8 bg-slate-300" />}
              </li>
            ))}
          </ol>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr]">
          <div className="lg:hidden">
            <button type="button" onClick={() => c.setIsSummaryExpanded(!c.isSummaryExpanded)} aria-expanded={c.isSummaryExpanded} className="flex w-full items-center justify-between rounded-[1.5rem] bg-white p-5 text-sm font-bold shadow-sm">
              <span className="flex items-center gap-2">{c.isSummaryExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />} {c.isSummaryExpanded ? "Hide" : "Show"} order summary</span>
              <span className="text-lg">{money(c.finalTotal)}</span>
            </button>
            {c.isSummaryExpanded && <div className="mt-3 rounded-[1.5rem] bg-white p-5 shadow-sm"><Summary c={c} /></div>}
          </div>

          <section className="rounded-[2rem] bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] sm:p-10">
            {c.initError ? (
              <p role="alert" className="rounded-2xl bg-red-50 p-6 text-center font-semibold text-red-600">{c.initError}</p>
            ) : c.checkoutStep === 1 ? (
              slots.contact
            ) : (
              <div className="space-y-8">
                <div className="rounded-[1.5rem] bg-slate-50 p-5">
                  <div className="mb-2 flex items-center justify-between">
                    <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500">Contact and shipping</h2>
                    <button type="button" onClick={() => c.setCheckoutStep(1)} className="text-xs font-bold underline underline-offset-4">Edit</button>
                  </div>
                  <p className="truncate text-sm font-bold">{values.checkout_name || values.name || "No name provided"}</p>
                  <p className="truncate text-sm text-slate-600">{values.checkout_email || values.email || "No email provided"}</p>
                  <p className="truncate text-sm text-slate-500">
                    {[values.checkout_address, values.checkout_city, values.checkout_country].filter(Boolean).join(", ") || [values.address, values.city, values.country].filter(Boolean).join(", ") || "No address provided"}
                  </p>
                </div>

                {c.requiresShipping && c.applicableRates.length > 0 && (
                  <fieldset className="space-y-3">
                    <legend className="mb-3 flex items-center gap-2 text-xl font-[800] tracking-tight"><Truck size={20} /> Shipping method</legend>
                    {c.applicableRates.map((rate: any) => {
                      const selected = c.selectedShippingRate?.id === rate.id;
                      return (
                        <label key={rate.id} className={cn("flex cursor-pointer items-center justify-between rounded-full px-6 py-4 text-sm font-bold ring-1 transition", selected ? "bg-slate-900 text-white ring-slate-900" : "bg-white ring-slate-200 hover:ring-slate-400")}>
                          <span className="flex items-center gap-3">
                            <input type="radio" name="shippingRate" value={rate.id} checked={selected} onChange={() => c.setSelectedShippingRate(rate)} className="sr-only" />
                            {rate.name}
                          </span>
                          <span>{rate.type === "free_over" ? "Free" : money(rate.rate_cents / 100)}</span>
                        </label>
                      );
                    })}
                  </fieldset>
                )}

                {slots.payment}
              </div>
            )}
            <p className="mt-8 flex items-center justify-center gap-2 text-xs font-semibold text-slate-400"><Lock size={12} /> Secure, encrypted checkout</p>
          </section>

          <aside className="hidden lg:block">
            <div className="sticky top-28 rounded-[2rem] bg-white p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)]"><Summary c={c} /></div>
          </aside>
        </div>
      </div>
    </div>
  );
}
