import React, { useState, useEffect, useMemo } from "react";
import { useOutletContext, useNavigate, Link } from "react-router-dom";
import { useCartStore, type CartItem } from "../store/useCartStore";
import { supabase } from "@/supabaseClient"; // Adjust path if needed
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { Loader2, Lock, ShoppingBag, CheckCircle2, Mail, Phone, MessageSquare, Calendar, User, AlertCircle, ChevronLeft, Landmark, Bitcoin, Package, ShoppingCart, ChevronUp, ChevronDown, Tag, Truck, Edit2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
// 🚀 Initialize Stripe outside the render cycle so it doesn't recreate on every state change
const stripePromise = loadStripe(
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ||
    "pk_test_YOUR_STRIPE_PUBLIC_KEY"
);

const getFieldIcon = (type: string) => {
  switch (type) {
    case "email": return <Mail size={14} />;
    case "tel": return <Phone size={14} />;
    case "textarea": return <MessageSquare size={14} />;
    case "date": return <Calendar size={14} />;
    default: return <User size={14} />;
  }
};

const parseOptions = (optString?: string) => {
  if (!optString) return [];
  return optString.split(",").map((s) => s.trim()).filter(Boolean);
};

// --- STEP 1: CONTACT & SHIPPING FORM ---
const ContactShippingForm = ({ formTemplate, formValues, setFormValues, isLoadingForm, allowedCountries, onSubmit }: any) => {
  return (
    <form onSubmit={onSubmit} className="space-y-8 animate-in fade-in duration-500 w-full">
      <div className="space-y-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold tracking-tight text-white">Contact & Shipping</h2>
          <p className="text-sm text-neutral-400 mt-1">Where should we send your order?</p>
        </div>
        {isLoadingForm ? (
          <div className="flex items-center justify-center py-6"><Loader2 className="animate-spin text-primary" /></div>
        ) : formTemplate?.fields ? (
          <div className="grid grid-cols-1 sm:grid-cols-6 gap-x-4 gap-y-4">
            {formTemplate.fields.filter((f: any) => f.enabled !== false).map((field: any, idx: number) => {
              const widthClass = field.width === "third" ? "sm:col-span-2" : field.width === "half" ? "sm:col-span-3" : "sm:col-span-6";
              let fieldOptions = parseOptions(field.options);
              if (field.id === "checkout_country" && allowedCountries?.length > 0) {
                fieldOptions = allowedCountries;
              }
              return (
                <div key={idx} className={cn("space-y-2 col-span-1", widthClass)}>
                  <label className="text-sm font-medium text-neutral-300 flex items-center gap-1.5">
                     {field.label} {field.required && <span className="text-primary">*</span>}
                  </label>
                  {field.type === "textarea" ? (
                    <Textarea required={field.required} placeholder={field.placeholder} className="bg-neutral-900 hover:border-white/30 focus:bg-neutral-900 min-h-[100px] resize-none rounded-md p-3 border-white/10 shadow-sm focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-transparent text-white transition-all" value={formValues[field.id] || ""} onChange={(e) => setFormValues({ ...formValues, [field.id]: e.target.value })} />
                  ) : field.type === "select" ? (
                    <select required={field.required} className="w-full bg-neutral-900 hover:border-white/30 focus:bg-neutral-900 border border-white/10 text-white h-11 rounded-md px-3 text-sm appearance-none outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all shadow-sm" value={formValues[field.id] || ""} onChange={(e) => setFormValues({ ...formValues, [field.id]: e.target.value })}>
                      <option value="" disabled>Select...</option>
                      {fieldOptions.map((opt: string, i: number) => <option key={i} value={opt}>{opt}</option>)}
                    </select>
                  ) : field.type === "radio" ? (
                    <div className="flex flex-col gap-2">
                      {fieldOptions.map((opt: string, i: number) => (
                        <label key={i} className="flex items-center gap-3 cursor-pointer group p-3 rounded-md border border-white/10 bg-neutral-900 shadow-sm hover:border-white/30 transition-colors has-[:checked]:bg-primary/10 has-[:checked]:border-primary has-[:checked]:ring-1 has-[:checked]:ring-primary">
                          <div className="relative flex items-center justify-center w-4 h-4 rounded-full border border-white/20 group-hover:border-primary bg-neutral-800"><input type="radio" name={field.id} value={opt} required={field.required} checked={formValues[field.id] === opt} className="peer sr-only" onChange={(e) => setFormValues({ ...formValues, [field.id]: e.target.value })} /><div className="w-2 h-2 rounded-full bg-primary opacity-0 peer-checked:opacity-100 transition-all scale-50 peer-checked:scale-100" /></div>
                          <span className="text-white text-sm font-medium">{opt}</span>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <Input required={field.required} type={field.type === "email" ? "email" : field.type === "tel" ? "tel" : field.type === "date" ? "date" : "text"} placeholder={field.placeholder} className="bg-neutral-900 hover:border-white/30 focus:bg-neutral-900 text-white h-11 rounded-md border-white/10 shadow-sm focus-visible:border-transparent focus-visible:ring-2 focus-visible:ring-primary transition-all" value={formValues[field.id] || ""} onChange={(e) => setFormValues({ ...formValues, [field.id]: e.target.value })} />
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2"><label className="text-sm font-medium text-neutral-300">Full Name</label><Input required placeholder="Jane Doe" value={formValues.name || ""} onChange={(e) => setFormValues({ ...formValues, name: e.target.value })} className="bg-neutral-900 hover:border-white/30 focus:bg-neutral-900 text-white h-11 rounded-md border-white/10 shadow-sm focus-visible:border-transparent focus-visible:ring-2 focus-visible:ring-primary transition-all" /></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2"><label className="text-sm font-medium text-neutral-300">Email Address</label><Input required type="email" placeholder="jane@example.com" value={formValues.email || ""} onChange={(e) => setFormValues({ ...formValues, email: e.target.value })} className="bg-neutral-900 hover:border-white/30 focus:bg-neutral-900 text-white h-11 rounded-md border-white/10 shadow-sm focus-visible:border-transparent focus-visible:ring-2 focus-visible:ring-primary transition-all" /></div>
              <div className="space-y-2"><label className="text-sm font-medium text-neutral-300">Phone (Optional)</label><Input type="tel" placeholder="+1 234 567 890" value={formValues.phone || ""} onChange={(e) => setFormValues({ ...formValues, phone: e.target.value })} className="bg-neutral-900 hover:border-white/30 focus:bg-neutral-900 text-white h-11 rounded-md border-white/10 shadow-sm focus-visible:border-transparent focus-visible:ring-2 focus-visible:ring-primary transition-all" /></div>
            </div>
            <div className="space-y-2"><label className="text-sm font-medium text-neutral-300">Street Address</label><Input placeholder="123 Main St" value={formValues.address || ""} onChange={(e) => setFormValues({ ...formValues, address: e.target.value })} className="bg-neutral-900 hover:border-white/30 focus:bg-neutral-900 text-white h-11 rounded-md border-white/10 shadow-sm focus-visible:border-transparent focus-visible:ring-2 focus-visible:ring-primary transition-all" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><label className="text-sm font-medium text-neutral-300">City</label><Input placeholder="City" value={formValues.city || ""} onChange={(e) => setFormValues({ ...formValues, city: e.target.value })} className="bg-neutral-900 hover:border-white/30 focus:bg-neutral-900 text-white h-11 rounded-md border-white/10 shadow-sm focus-visible:border-transparent focus-visible:ring-2 focus-visible:ring-primary transition-all" /></div>
              <div className="space-y-2"><label className="text-sm font-medium text-neutral-300">Zip / Postal Code</label><Input placeholder="Zip" value={formValues.zip || ""} onChange={(e) => setFormValues({ ...formValues, zip: e.target.value })} className="bg-neutral-900 hover:border-white/30 focus:bg-neutral-900 text-white h-11 rounded-md border-white/10 shadow-sm focus-visible:border-transparent focus-visible:ring-2 focus-visible:ring-primary transition-all" /></div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-300">Country</label>
              <select className="w-full bg-neutral-900 hover:border-white/30 focus:bg-neutral-900 border border-white/10 text-white h-11 rounded-md px-3 text-sm appearance-none outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all shadow-sm" value={formValues.country || ""} onChange={(e) => setFormValues({ ...formValues, country: e.target.value })}>
                <option value="" disabled>Select Country</option>
                {(allowedCountries?.length > 0 ? allowedCountries : ["United States", "United Kingdom", "Canada", "Morocco", "France", "Spain", "Other"]).map((opt: string, i: number) => <option key={i} value={opt}>{opt}</option>)}
              </select>
            </div>
          </div>
        )}
      </div>
      <div className="pt-4">
        <Button type="submit" className="w-full h-14 text-lg rounded-md shadow-sm transition-all bg-primary text-primary-foreground hover:brightness-110">Continue to Payment</Button>
      </div>
    </form>
  );
};

// --- STEP 2: THE STRIPE PAYMENT COMPONENT ---
const PaymentForm = ({
  amount,
  portfolioId,
  actorId,
  items,
  onComplete,
  formTemplate,
  formValues,
  clientSecret,
  paymentConfig,
  coupon,
  discount,
  stripe,
  elements,
  isFreeOrder,
  shippingCost,
  selectedShippingRate
}: any) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"card" | "cod" | "bank" | "crypto" | "free">("card");
  
  const bankAccounts = paymentConfig?.bank?.accounts || (paymentConfig?.bank?.name ? [{ name: paymentConfig.bank.name, holder: paymentConfig.bank.holder, iban: paymentConfig.bank.iban }] : []);
  const [selectedBankIndex, setSelectedBankIndex] = useState(0);

  // Fallback selector if Card isn't available
  useEffect(() => {
    if (isFreeOrder) {
      setPaymentMethod("free");
    } else if (!clientSecret) {
      if (paymentConfig?.cod?.enabled ?? true) setPaymentMethod("cod");
      else if (paymentConfig?.bank?.enabled) setPaymentMethod("bank");
      else if (paymentConfig?.crypto?.enabled) setPaymentMethod("crypto");
    } else {
      setPaymentMethod("card");
    }
  }, [clientSecret, paymentConfig, isFreeOrder]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setErrorMessage("");
    
    const getFieldVal = (keywords: string[], excludeKeywords: string[] = []) => {
      if (formTemplate?.fields) {
        const field = formTemplate.fields.find((f: any) =>
          keywords.some((keyword) => 
            (f.label || "").toLowerCase().includes(keyword) || 
            (f.id || "").toLowerCase().includes(keyword)
          ) && !excludeKeywords.some((ex) => (f.label || "").toLowerCase().includes(ex))
        );
        if (field && formValues[field.id]) return formValues[field.id];
      }
      const key = Object.keys(formValues).find((k) =>
        keywords.some((keyword) => k.toLowerCase().includes(keyword)) &&
        !excludeKeywords.some((ex) => k.toLowerCase().includes(ex))
      );
      return key ? formValues[key] : "";
    };

    const name = getFieldVal(["name", "first", "last"]) || formValues.name;
    const email = getFieldVal(["email", "mail"]) || formValues.email;
    const phone = getFieldVal(["phone", "tel", "mobile"]) || formValues.phone || "";
    
    const addressField = getFieldVal(["address", "shipping", "street"], ["email"]) || formValues.address;
    const city = getFieldVal(["city"]) || formValues.city;
    const zip = getFieldVal(["zip", "postal"]) || formValues.zip;
    const country = getFieldVal(["country"]) || formValues.country;

    const address = [addressField, city, zip, country].filter(Boolean).join(", ");

    if (!name || !email) {
       setErrorMessage("Name and email are required for order processing.");
       setIsProcessing(false);
       return;
    }

    let paymentIntentId = isFreeOrder ? `free_${Date.now()}` : (paymentMethod === "card" ? clientSecret?.split('_secret_')[0] : `${paymentMethod}_${Date.now()}`);

    // 1. Record the order in Supabase FIRST as "pending"
    let notesText = "";
    if (formTemplate) {
      notesText = Object.entries(formValues).map(([k, v]) => {
        const fieldDef = formTemplate.fields?.find((f: any) => f.id === k);
        const label = fieldDef ? fieldDef.label : k;
        return `${label}: ${v}`;
      }).join("\n");
    } else {
      notesText = `Name: ${name}\nEmail: ${email}`;
      if (phone) notesText += `\nPhone: ${phone}`;
      if (addressField) notesText += `\nAddress: ${addressField}`;
      if (city) notesText += `\nCity: ${city}`;
      if (zip) notesText += `\nZip: ${zip}`;
      if (country) notesText += `\nCountry: ${country}`;
    }

    // Format for Orders Dashboard Compatibility
    const productName = items.length === 1 ? items[0].title : `Cart Order (${items.length} items)`;
    const productPrice = `$${amount.toFixed(2)}`;
    const qty = items.length === 1 ? items[0].quantity : 1;
    const variants = items.length === 1 
      ? (items[0].variant && items[0].variant !== "default" ? { variant: items[0].variant } : {})
      : items.reduce((acc: any, item: any, idx: number) => {
          acc[`Item ${idx + 1}`] = `${item.quantity}x ${item.title} ${item.variant && item.variant !== 'default' ? `(${item.variant})` : ''}`;
          return acc;
        }, {});

    // If cart has multiple items, let's inject their summary into the notes so the seller can see what they bought!
    if (items.length > 1) {
       const cartSummary = items.map((item: any) => `- ${item.quantity}x ${item.title} (${item.variant || 'Default'})`).join('\n');
       notesText = notesText ? `Cart Items:\n${cartSummary}\n\nForm Details:\n${notesText}` : `Cart Items:\n${cartSummary}`;
    }

    if (coupon && discount > 0) {
       notesText = `Coupon Applied: ${coupon.code} (-$${discount.toFixed(2)})\n${notesText}`;
    }

    if (selectedShippingRate) {
       notesText = `Shipping: ${selectedShippingRate.name} (${shippingCost === 0 ? 'Free' : `$${shippingCost.toFixed(2)}`})\n${notesText}`;
    }
    
    if (paymentMethod !== "card") {
      notesText += `\nPayment Method: ${paymentMethod.toUpperCase()}`;
      if (paymentMethod === "bank") {
        const selectedBank = bankAccounts[selectedBankIndex];
        if (selectedBank) {
          notesText += `\nBank Name: ${selectedBank.name || "N/A"}\nAccount Holder: ${selectedBank.holder || "N/A"}\nIBAN: ${selectedBank.iban || "N/A"}`;
        }
      }
    } else if (paymentIntentId && !isFreeOrder) {
       notesText += `\nPayment Intent: ${paymentIntentId}`;
    }
    
    const { data: dbData, error: dbError } = await supabase.from("pro_orders").insert({
      actor_id: actorId,
      portfolio_id: portfolioId,
      customer_name: name,
      customer_phone: phone || "No Phone",
      customer_address: address || "No Address Provided",
      product_name: productName,
      product_price: productPrice,
      quantity: qty,
      variants: variants,
      // IMPROVEMENT: Store structured data
      amount_cents: Math.round(amount * 100),
      items: items,
      stripe_payment_intent_id: paymentIntentId,
      status: "pending",
      notes: notesText || undefined
    }).select().single();

    if (dbError) {
      console.error("Failed to save order to DB:", dbError);
      setErrorMessage("Failed to initialize your order. Please try again.");
      setIsProcessing(false);
      return; 
    }

    // 1.5. Inventory Management for Manual Payments (COD/Bank/Crypto)
    // Since Stripe payments use the webhook, we deduct stock manually here for the others
    if (paymentMethod !== "card" || isFreeOrder) {
      for (const item of items) {
        await supabase.rpc('decrement_stock', {
          p_product_id: item.id,
          p_quantity: item.quantity
        });
      }
    }

    // 2. Now that it's safe in the database, confirm the payment with Stripe!
    if (paymentMethod === "card" && !isFreeOrder) {
      if (!stripe || !elements) {
        setIsProcessing(false);
        return;
      }
      
      const { error } = await stripe.confirmPayment({
        elements,
        redirect: "if_required",
        confirmParams: {
          payment_method_data: {
            billing_details: { name, email, phone: phone || undefined },
          },
        },
      });

      if (error) {
        setErrorMessage(error.message || "Payment failed. You have not been charged.");
        setIsProcessing(false);
        return;
      }
    }

    onComplete(dbData?.id); // Trigger the success screen, pass ID, and clear cart
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 animate-in fade-in duration-500 w-full">
      {/* PAYMENT SECURE SECTION */}
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Payment</h2>
          <p className="text-sm text-neutral-400 mt-1">
            {isFreeOrder ? "No payment required for this order." : "All transactions are secure and encrypted."}
          </p>
        </div>

        <div className="border border-white/10 bg-neutral-900 rounded-md overflow-hidden shadow-sm">
          {isFreeOrder ? (
            <div className="p-6 bg-neutral-900/50 text-center text-sm text-neutral-400">
              Your order total is $0.00. No payment is required.
            </div>
          ) : (
            <>
              {clientSecret && (
                <>
                  <label
                    className={cn(
                      "flex items-center gap-3 p-4 cursor-pointer transition-colors",
                      paymentMethod === "card" ? "bg-primary/10 border-b border-white/10" : "hover:bg-neutral-800"
                    )}
                    onClick={() => setPaymentMethod("card")}
                  >
                    <div className="relative flex items-center justify-center w-4 h-4 rounded-full border border-white/20 bg-neutral-800">
                      <div className={cn("w-2 h-2 rounded-full bg-primary transition-all", paymentMethod === "card" ? "opacity-100 scale-100" : "opacity-0 scale-50")} />
                    </div>
                    <span className="font-medium text-white text-sm">Credit card</span>
                  </label>
                  {paymentMethod === "card" && (
                    <div className="p-4 bg-neutral-900/50 border-b border-white/10">
                      <PaymentElement />
                    </div>
                  )}
                </>
              )}

              {(paymentConfig?.cod?.enabled ?? true) && (
                <>
                  {clientSecret && <div className="h-px bg-white/10 w-full" />}
                  <label
                    className={cn(
                      "flex items-center gap-3 p-4 cursor-pointer transition-colors",
                      paymentMethod === "cod" ? "bg-primary/10 border-b border-white/10" : "hover:bg-neutral-800"
                    )}
                    onClick={() => setPaymentMethod("cod")}
                  >
                    <div className="relative flex items-center justify-center w-4 h-4 rounded-full border border-white/20 bg-neutral-800">
                      <div className={cn("w-2 h-2 rounded-full bg-primary transition-all", paymentMethod === "cod" ? "opacity-100 scale-100" : "opacity-0 scale-50")} />
                    </div>
                    <span className="font-medium text-white text-sm">Cash on Delivery</span>
                  </label>
                  {paymentMethod === "cod" && (
                    <div className="p-6 bg-neutral-900/50 border-b border-white/10 text-center text-sm text-neutral-400">
                      You will pay for your order upon delivery.
                    </div>
                  )}
                </>
              )}


              {paymentConfig?.bank?.enabled && (
                <>
                  <div className="h-px bg-white/10 w-full" />
                  <label
                    className={cn(
                      "flex items-center gap-3 p-4 cursor-pointer transition-colors",
                      paymentMethod === "bank" ? "bg-primary/10 border-b border-white/10" : "hover:bg-neutral-800"
                    )}
                    onClick={() => setPaymentMethod("bank")}
                  >
                    <div className="relative flex items-center justify-center w-4 h-4 rounded-full border border-white/20 bg-neutral-800">
                      <div className={cn("w-2 h-2 rounded-full bg-primary transition-all", paymentMethod === "bank" ? "opacity-100 scale-100" : "opacity-0 scale-50")} />

                    </div>
                    <span className="font-medium text-white text-sm">Bank Transfer</span>
                  </label>
                  {paymentMethod === "bank" && (
                    <div className="p-6 bg-neutral-900/50 border-b border-white/10">
                      {bankAccounts.length > 1 && (
                        <div className="mb-5 space-y-2">
                          <p className="text-sm font-medium text-white mb-2">Select a Bank to transfer to:</p>
                          <div className="space-y-2">
                            {bankAccounts.map((bank: any, index: number) => (
                              <label key={index} className={cn("flex items-center gap-3 p-3 border rounded-md cursor-pointer transition-colors", selectedBankIndex === index ? "bg-primary/10 border-primary" : "border-white/10 bg-neutral-900 hover:border-white/30")}>
                                <input type="radio" name="selected_bank" value={index} checked={selectedBankIndex === index} onChange={() => setSelectedBankIndex(index)} className="sr-only" />
                                <div className={cn("w-4 h-4 rounded-full border flex items-center justify-center", selectedBankIndex === index ? "border-primary" : "border-white/20")}>
                                  {selectedBankIndex === index && <div className="w-2 h-2 rounded-full bg-primary" />}
                                </div>
                                <span className="font-medium text-white text-sm">{bank.name || `Account ${index + 1}`}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {bankAccounts[selectedBankIndex] && (
                        <>
                          {bankAccounts.length === 1 && (
                            <p className="text-sm font-medium text-white mb-3 text-center">Transfer the total amount to:</p>
                          )}
                          <div className="space-y-2 text-sm text-neutral-300 bg-neutral-900 p-4 rounded-md border border-white/10 shadow-sm">
                            <div className="flex justify-between"><span className="text-neutral-500">Bank</span><span className="font-medium text-white text-right">{bankAccounts[selectedBankIndex].name || "N/A"}</span></div>
                            <div className="flex justify-between"><span className="text-neutral-500">Account Holder</span><span className="font-medium text-white text-right">{bankAccounts[selectedBankIndex].holder || "N/A"}</span></div>
                            <div className="flex justify-between items-center"><span className="text-neutral-500">IBAN/Account No</span><span className="font-medium text-white break-all text-right ml-4">{bankAccounts[selectedBankIndex].iban || "N/A"}</span></div>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </>
              )}

              {paymentConfig?.crypto?.enabled && (
                <>
                  <div className="h-px bg-white/10 w-full" />
                  <label
                    className={cn(
                      "flex items-center gap-3 p-4 cursor-pointer transition-colors",
                      paymentMethod === "crypto" ? "bg-primary/10 border-b border-white/10" : "hover:bg-neutral-800"
                    )}
                    onClick={() => setPaymentMethod("crypto")}
                  >
                    <div className="relative flex items-center justify-center w-4 h-4 rounded-full border border-white/20 bg-neutral-800">
                      <div className={cn("w-2 h-2 rounded-full bg-primary transition-all", paymentMethod === "crypto" ? "opacity-100 scale-100" : "opacity-0 scale-50")} />

                    </div>
                    <span className="font-medium text-white text-sm">Crypto (USDC/SOL)</span>
                  </label>
                  {paymentMethod === "crypto" && (
                    <div className="p-6 bg-neutral-900/50 border-b border-white/10">
                      <p className="text-sm font-medium text-white mb-3 text-center flex items-center justify-center gap-2">
                         Send USDC or SOL to:
                      </p>
                      <div className="text-sm text-neutral-300 bg-neutral-900 p-4 rounded-md border border-white/10 shadow-sm break-all text-center font-mono font-bold text-primary">
                        {paymentConfig?.crypto?.wallet || "N/A"}
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>

        
      </div>

      {/* ERROR HANDLER */}
      {errorMessage && (
        <div className="p-4 bg-red-500/10 text-red-400 rounded-md text-sm border border-red-500/20 flex items-start gap-3 animate-in fade-in duration-300">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <span className="font-medium leading-relaxed">{errorMessage}</span>
        </div>
      )}

      {/* SUBMIT */}
      <Button
        type="submit"
        disabled={(paymentMethod === "card" && (!stripe || !elements) && !isFreeOrder) || isProcessing}
        className="w-full h-14 font-medium tracking-wide text-lg rounded-md shadow-sm transition-all bg-primary text-primary-foreground hover:brightness-110"
      >
        {isProcessing ? (
          <Loader2 className="animate-spin mr-2" />
        ) : paymentMethod === "card" && !isFreeOrder ? (
          <Lock size={18} className="mr-2" />
        ) : (
          <CheckCircle2 size={18} className="mr-2" />
        )}
        {paymentMethod === "card" && !isFreeOrder ? `Pay $${amount.toFixed(2)}` : "Place Order"}
      </Button>
    </form>
  );
};

// --- STRIPE CHECKOUT WRAPPER ---
const StripeCheckoutWrapper = (props: any) => {
  const stripe = useStripe();
  const elements = useElements();
  return <PaymentForm {...props} stripe={stripe} elements={elements} />;
};


// --- REUSABLE ORDER SUMMARY COMPONENT ---
const OrderSummaryContent = ({ items, total, subtotal, discount, coupon, shippingCost, requiresShipping, selectedShippingRate, couponInput, setCouponInput, handleApplyCoupon, removeCoupon, isValidatingCoupon, couponError }: any) => (
  <div className="flex flex-col h-full animate-in fade-in">
    <div className="space-y-4 mb-6 flex-grow">
      {items.map((item: CartItem) => (
        <div key={item.id} className="flex items-center gap-4">
          <div className="relative w-16 h-16 bg-neutral-900 border border-white/10 rounded-lg flex items-center justify-center shrink-0">
            {item.image ? (
              <img src={item.image} className="w-full h-full object-cover rounded-lg" alt={item.title} />
            ) : (
              <ShoppingBag className="w-6 h-6 text-neutral-600" />
            )}
            <span className="absolute -top-2 -right-2 bg-neutral-700/90 backdrop-blur-sm text-white text-xs font-medium w-5 h-5 flex items-center justify-center rounded-full shadow-sm">
              {item.quantity}
            </span>
          </div>
          <div className="flex-1 min-w-0 pr-4">
            <h4 className="font-medium text-white text-sm truncate">{item.title}</h4>
            {item.variant && <p className="text-xs text-neutral-400 truncate mt-0.5">{item.variant}</p>}
          </div>
          <div className="font-medium text-white shrink-0 text-right text-sm">
            ${(item.price * item.quantity).toFixed(2)}
          </div>
        </div>
      ))}
    </div>

    <div className="border-t border-white/10 pt-5 space-y-4">
      {/* COUPON INPUT */}
      <div className="space-y-2">
        {!coupon ? (
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="Discount code"
              value={couponInput}
              onChange={(e) => setCouponInput(e.target.value)}
              className="flex-1 bg-neutral-900 hover:border-white/30 focus:bg-neutral-900 text-white h-10 rounded-md border-white/10 shadow-sm focus-visible:border-transparent focus-visible:ring-2 focus-visible:ring-primary transition-all uppercase placeholder:normal-case"
            />
            <Button 
              type="button"
              variant="secondary" 
              onClick={handleApplyCoupon} 
              disabled={isValidatingCoupon || !couponInput.trim()} 
              className="h-10 px-4"
            >
              {isValidatingCoupon ? <Loader2 className="w-4 h-4 animate-spin" /> : "Apply"}
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-between bg-primary/10 border border-primary/20 rounded-md px-3 py-2">
            <div className="flex items-center gap-2 text-primary font-medium text-sm"><Tag size={14} /> {coupon.code}</div>
            <button type="button" onClick={removeCoupon} className="text-primary/70 hover:text-primary transition-colors"><X size={14} /></button>
          </div>
        )}
        {couponError && <p className="text-xs text-red-500 font-medium">{couponError}</p>}
      </div>

      <div className="space-y-3">
        <div className="flex justify-between text-sm text-neutral-400">
          <span>Subtotal</span>
          <span className="font-medium text-white">${subtotal.toFixed(2)}</span>
        </div>
      {coupon && discount > 0 && (
        <div className="flex justify-between text-sm text-primary font-medium">
          <span className="flex items-center gap-1.5"><Tag size={14}/> {coupon.code}</span>
          <span>-${discount.toFixed(2)}</span>
        </div>
      )}
      <div className="flex justify-between text-sm text-neutral-400">
        <span>Shipping</span>
        {requiresShipping ? (
          selectedShippingRate ? (
            <span className="font-medium text-white">{shippingCost === 0 ? 'Free' : `$${shippingCost.toFixed(2)}`}</span>
          ) : (
            <span className="text-neutral-500 text-xs">Calculated at next step</span>
          )
        ) : (
          <span className="text-neutral-500 text-xs">Free</span>
        )}
      </div>
      <div className="flex justify-between items-center mt-4 border-t border-white/10 pt-5">
        <span className="text-base font-semibold text-white">Total</span>
        <div className="flex items-end gap-2">
          <span className="text-xs text-neutral-500 mb-1">USD</span>
          <span className="text-2xl font-bold text-white tracking-tight">${total.toFixed(2)}</span>
        </div>
      </div>
    </div>
  </div>
  </div>
);

// --- MAIN PAGE COMPONENT ---
const PublicCheckoutPage = () => {
  // Grab the portfolio context passed down from CheckoutLayout
  const { portfolio } = useOutletContext<{ portfolio: any }>();
  const { items, clearCart, coupon, getCartDiscount, applyCoupon, removeCoupon } = useCartStore();
  const navigate = useNavigate();

  // Advanced Checkout State
  const [checkoutStep, setCheckoutStep] = useState<1 | 2>(1);
  const [cartProducts, setCartProducts] = useState<any[]>([]);
  const [shippingRates, setShippingRates] = useState<any[]>([]);
  const [selectedShippingRate, setSelectedShippingRate] = useState<any | null>(null);

  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [initError, setInitError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [formTemplate, setFormTemplate] = useState<any>(null);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [isLoadingForm, setIsLoadingForm] = useState(false);
  const [isSummaryExpanded, setIsSummaryExpanded] = useState(false);

  const [couponInput, setCouponInput] = useState("");
  const [couponError, setCouponError] = useState("");
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);

  const MAIN_DOMAINS = [
    "ucpmaroc.com",
    "www.ucpmaroc.com",
    "localhost",
    "127.0.0.1",
    "symmetrical-acorn-697wxxq4r74j3jpj-5173.app.github.dev",
    "psychic-cod-r74vrp5xx9gq2ppr7-5173.app.github.dev",
  ];
  const isCustomDomain = !MAIN_DOMAINS.some((domain) => window.location.hostname.includes(domain));
  const shopUrl = isCustomDomain ? '/shop' : `/pro/${portfolio.public_slug}/shop`;
  const homeUrl = isCustomDomain ? '/' : `/pro/${portfolio.public_slug}`;

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discount = getCartDiscount();
  const total = Math.max(0, subtotal - discount);

    
  // Shipping Logic
  const requiresShipping = cartProducts.some(p => p.delivery_type === 'physical' || p.requires_shipping);
  const totalWeight = items.reduce((sum, item) => {
    const prod = cartProducts.find(p => p.id === item.id);
    return sum + ((prod?.weight || 0) * item.quantity);
  }, 0);
  
  const userCountry = formValues.checkout_country || formValues.country || "";
  const applicableRates = useMemo(() => {
    if (!requiresShipping) return [];
    return shippingRates.filter(r => {
      const countryMatch = !r.countries || r.countries.length === 0 || r.countries.includes(userCountry);
      if (!countryMatch) return false;
      if (r.type === 'free_over' && r.min_order_amount_cents && (total * 100) < r.min_order_amount_cents) return false;
      if (r.type === 'weight') {
        if (r.min_weight && totalWeight < r.min_weight) return false;
        if (r.max_weight && totalWeight > r.max_weight) return false;
      }
      return true;
    });
  }, [shippingRates, userCountry, total, totalWeight, requiresShipping]);

  // Auto-Select Lowest Applicable Rate when entering Step 2
  useEffect(() => {
    if (checkoutStep === 2 && applicableRates.length > 0) {
      if (!selectedShippingRate || !applicableRates.find(r => r.id === selectedShippingRate.id)) {
        const lowest = [...applicableRates].sort((a,b) => (a.type === 'free_over' ? 0 : a.rate_cents) - (b.type === 'free_over' ? 0 : b.rate_cents))[0];
        setSelectedShippingRate(lowest);
      }
    } else if (applicableRates.length === 0) {
      setSelectedShippingRate(null);
    }
  }, [applicableRates, checkoutStep, selectedShippingRate]);

  const shippingCost = selectedShippingRate ? (selectedShippingRate.type === 'free_over' ? 0 : selectedShippingRate.rate_cents / 100) : 0;
  const finalTotal = Math.max(0, total + shippingCost);


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
    const validCoupon = data.find((c: any) => !c.portfolio_id || c.portfolio_id === storeId);

    if (!validCoupon) return setCouponError("This coupon is not valid for this store.");

    const now = new Date();
    if (validCoupon.start_date && new Date(validCoupon.start_date) > now) return setCouponError("This coupon is not active yet.");
    if (validCoupon.end_date && new Date(validCoupon.end_date) < now) return setCouponError("This coupon has expired.");
    if (validCoupon.usage_limit && validCoupon.times_used >= validCoupon.usage_limit) return setCouponError("This coupon has reached its usage limit.");
    if (validCoupon.min_order_amount_cents && (subtotal * 100) < validCoupon.min_order_amount_cents) return setCouponError(`Order must be at least $${(validCoupon.min_order_amount_cents / 100).toFixed(2)}`);

    applyCoupon(validCoupon);
    setCouponInput("");
  };

  useEffect(() => {
    // If cart is empty, bounce them back to the shop
    if (items.length === 0 && !isSuccess) {
      navigate(shopUrl);
      return;
    }


    const fetchInitialData = async () => {
      if (items.length > 0) {
        setIsLoadingForm(true);
                // Fetch Form

        const { data: prod } = await supabase.from('pro_products').select('form_id').eq('id', items[0].id).maybeSingle();
        if (prod?.form_id) {
          const { data: f } = await supabase.from('forms').select('*').eq('id', prod.form_id).maybeSingle();
          if (f) setFormTemplate(f);
        }
                
        // Fetch Products (for weight & shipping flags)
        const itemIds = items.map(i => i.id);
        const { data: prods } = await supabase.from('pro_products').select('id, weight, requires_shipping, delivery_type').in('id', itemIds);
        if (prods) setCartProducts(prods);
        

        setIsLoadingForm(false);
      }
            // Fetch Shipping Rates
      const { data: rates } = await supabase.from('pro_shipping_rates')
        .select('*')
        .eq('actor_id', portfolio.actor_id)
        .order('rate_cents', { ascending: true });
      if (rates) {
        setShippingRates(rates.filter(r => !r.portfolio_id || r.portfolio_id === portfolio.id));
      }

    };

        if (!isSuccess) fetchInitialData();
  }, [items, portfolio.id, portfolio.actor_id, navigate, isSuccess, shopUrl]);

  // Manage Payment Intent Sync
  useEffect(() => {
    const initializeCheckout = async () => {
      setClientSecret(null); // Clear previous to trigger loader
      try {
        const { data, error } = await supabase.functions.invoke(
          "create-payment-intent",
          { body: { amount: Math.round(finalTotal * 100), portfolioId: portfolio.id } }
        );
        if (error) throw error;
        if (data.error) throw new Error(data.error);
        if (data.clientSecret) setClientSecret(data.clientSecret);
      } catch (err: any) {
        if (err.message === "SELLER_NOT_CONNECTED") {
          setInitError("This seller is currently not accepting automated payments.");
        } else {
          setInitError("Checkout is currently unavailable. Please try again later.");
        }
      }
    };

    if (checkoutStep === 2 && finalTotal > 0 && !isSuccess) {
      initializeCheckout();
    }
  }, [checkoutStep, finalTotal, portfolio.id, isSuccess]);



  const handleSuccess = (orderId?: string) => {
    setIsSuccess(true);
    
    let thankYouUrl = isCustomDomain ? '/thank-you' : `/pro/${portfolio.public_slug}/thank-you`;
    if (orderId) {
      thankYouUrl += `?order=${orderId}`;
    }
    navigate(thankYouUrl, { replace: true });
  };

  // --- CHECKOUT VIEW ---
  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-neutral-950 font-sans text-white w-full overflow-x-hidden selection:bg-primary/20 selection:text-white">
      
      {/* MOBILE ACCORDION (Hidden on Desktop) */}
      <div className="lg:hidden bg-neutral-900/30 border-b border-white/10 w-full pt-20 sm:pt-24">
        <div 
          className="flex items-center justify-between p-5 sm:px-6 cursor-pointer"
          onClick={() => setIsSummaryExpanded(!isSummaryExpanded)}
        >
          <div className="flex items-center gap-2 text-primary text-sm font-medium">
            <ShoppingCart size={18} />
            {isSummaryExpanded ? "Hide order summary" : "Show order summary"}
            {isSummaryExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
          <span className="font-semibold text-white text-lg">${finalTotal.toFixed(2)}</span>
        </div>
        {isSummaryExpanded && (
          <div className="p-5 sm:px-6 border-t border-white/10 bg-neutral-900/30">
            <OrderSummaryContent items={items} total={finalTotal} subtotal={subtotal} discount={discount} coupon={coupon} shippingCost={shippingCost} requiresShipping={requiresShipping} selectedShippingRate={selectedShippingRate} couponInput={couponInput} setCouponInput={setCouponInput} handleApplyCoupon={handleApplyCoupon} removeCoupon={removeCoupon} isValidatingCoupon={isValidatingCoupon} couponError={couponError} />
          </div>
        )}
      </div>

      {/* LEFT COLUMN: ACTIVE FORM (White Background) */}
      <div className="w-full lg:w-[45%] xl:w-[48%] flex justify-end bg-neutral-950 pt-6 lg:pt-32">
        <div className="w-full max-w-2xl flex flex-col px-5 pb-8 sm:px-10 sm:pb-10 lg:px-12 lg:pb-12 xl:pr-16 lg:pl-8 mx-auto lg:mx-0">
          
          {/* Header Link / Logo */}
          <div className="mb-8">
            <Link to={shopUrl} className="inline-flex items-center text-sm font-medium text-neutral-400 hover:text-white transition-colors mb-6">
              <ChevronLeft size={16} className="mr-1" /> Return to cart
            </Link>
            <h1 className="text-2xl font-semibold tracking-tight text-white">{portfolio.site_name || portfolio.public_slug}</h1>
          </div>

          {initError ? (
            <div className="p-6 bg-red-500/10 rounded-md border border-red-500/20 text-center">
              <p className="text-red-400 font-semibold">{initError}</p>
            </div>
          ) : checkoutStep === 1 ? (
            <ContactShippingForm 
              formTemplate={formTemplate}
              formValues={formValues}
              setFormValues={setFormValues}
              isLoadingForm={isLoadingForm}
              allowedCountries={portfolio?.theme_config?.allowedCountries || []}
              onSubmit={(e: React.FormEvent) => {
                e.preventDefault();
                setCheckoutStep(2);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          ) : (
            <div className="space-y-8 animate-in slide-in-from-right-4 duration-500 w-full">
              
              {/* REVIEW INFORMATION */}
              <div className="border border-white/10 rounded-md p-5 bg-neutral-900/50 shadow-sm relative group overflow-hidden">
                 <div className="absolute right-0 top-0 h-full w-2 bg-primary/20" />
                 <div className="flex justify-between items-center mb-3">
                    <h3 className="font-semibold text-sm text-white uppercase tracking-widest">Contact & Shipping</h3>
                    <button onClick={() => setCheckoutStep(1)} className="text-xs text-primary font-bold hover:underline flex items-center gap-1"><Edit2 size={12}/> Edit</button>
                 </div>
                 <p className="text-sm text-white font-bold truncate mb-1">{formValues.checkout_name || formValues.name || "No name provided"}</p>
                 <p className="text-sm text-neutral-300 font-medium truncate mb-1">{formValues.checkout_email || formValues.email || "No email provided"} • {formValues.checkout_phone || formValues.phone || "No phone provided"}</p>
                 <p className="text-sm text-neutral-400 truncate">
                    {[formValues.checkout_address, formValues.checkout_city, formValues.checkout_country].filter(Boolean).join(", ") || 
                     [formValues.address, formValues.city, formValues.country].filter(Boolean).join(", ") || 
                     "No address provided"}
                 </p>
              </div>

              {/* SHIPPING METHOD SELECTION */}
              {requiresShipping && applicableRates.length > 0 && (
                 <div className="space-y-4">
                    <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2"><Truck size={20} className="text-neutral-500" /> Shipping Method</h2>
                    <div className="space-y-3">
                       {applicableRates.map(rate => (
                          <label key={rate.id} className={cn("flex items-center justify-between p-4 cursor-pointer border rounded-md transition-colors", selectedShippingRate?.id === rate.id ? "border-primary bg-primary/10" : "border-white/10 hover:border-white/30 bg-neutral-900")}>
                             <div className="flex items-center gap-3">
                                <div className="relative flex items-center justify-center w-4 h-4 rounded-full border border-white/20 bg-neutral-800">
                                   <input type="radio" name="shippingRate" value={rate.id} checked={selectedShippingRate?.id === rate.id} onChange={() => setSelectedShippingRate(rate)} className="peer sr-only" />
                                   <div className={cn("w-2 h-2 rounded-full bg-primary transition-all", selectedShippingRate?.id === rate.id ? "opacity-100 scale-100" : "opacity-0 scale-50")} />
                                </div>
                                <span className="font-medium text-white text-sm">{rate.name}</span>
                             </div>
                             <span className="font-medium text-white text-sm">
                                {rate.type === 'free_over' ? 'Free' : `$${(rate.rate_cents / 100).toFixed(2)}`}
                             </span>
                          </label>
                       ))}
                    </div>
                 </div>
              )}

              {/* PAYMENT SECTION */}
              {!clientSecret && finalTotal > 0 ? (
                 <div className="flex flex-col items-center justify-center py-20 text-neutral-500">
                   <Loader2 className="w-8 h-8 animate-spin mb-4" />
                   <p>Loading secure payment...</p>
                 </div>
              ) : finalTotal > 0 ? (
                <Elements
                  stripe={stripePromise}
                  options={{ 
                    clientSecret, 
                    appearance: { 
                      theme: "night",
                      variables: {
                        fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, sans-serif',
                        borderRadius: '6px',
                        colorBackground: '#171717',
                        colorText: '#ffffff',
                        colorPrimary: 'var(--primary)',
                        colorDanger: '#ef4444',
                        colorTextPlaceholder: '#a3a3a3',
                        colorBorder: '#333333',
                      },
                      rules: {
                        '.Input': {
                          backgroundColor: '#171717',
                          boxShadow: 'none',
                          padding: '12px',
                        },
                        '.Input:focus': {
                          border: '1px solid var(--primary)',
                          boxShadow: '0 0 0 1px var(--primary)',
                        },
                        '.Label': {
                          fontWeight: '500',
                          color: '#d4d4d4',
                          marginBottom: '4px'
                        },
                        '.Tab--selected': {
                        }
                      }
                    } 
                  }}
                >
                  <StripeCheckoutWrapper
                    amount={finalTotal}
                    portfolioId={portfolio.id}
                    actorId={portfolio.actor_id}
                    items={items}
                    onComplete={handleSuccess}
                    formTemplate={formTemplate}
                    formValues={formValues}
                    clientSecret={clientSecret}
                    paymentConfig={portfolio?.theme_config?.payments || {}}
                    coupon={coupon}
                    discount={discount}
                    shippingCost={shippingCost}
                    selectedShippingRate={selectedShippingRate}
                  />
                </Elements>
              ) : (
                <PaymentForm
                  amount={finalTotal}
                  portfolioId={portfolio.id}
                  actorId={portfolio.actor_id}
                  items={items}
                  onComplete={handleSuccess}
                  formTemplate={formTemplate}
                  formValues={formValues}
                  clientSecret={null}
                  paymentConfig={portfolio?.theme_config?.payments || {}}
                  coupon={coupon}
                  discount={discount}
                  isFreeOrder={true}
                  shippingCost={shippingCost}
                  selectedShippingRate={selectedShippingRate}
                />
              )}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: PASSIVE SUMMARY (Desktop Only) */}
      <div className="hidden lg:block flex-1 bg-neutral-900/30 border-l border-white/10 px-6 pb-12 lg:pt-32 lg:pb-12 xl:pl-16 lg:pr-12 xl:pr-16">
        <div className="w-full max-w-xl sticky top-32">
           <OrderSummaryContent items={items} total={finalTotal} subtotal={subtotal} discount={discount} coupon={coupon} shippingCost={shippingCost} requiresShipping={requiresShipping} selectedShippingRate={selectedShippingRate} couponInput={couponInput} setCouponInput={setCouponInput} handleApplyCoupon={handleApplyCoupon} removeCoupon={removeCoupon} isValidatingCoupon={isValidatingCoupon} couponError={couponError} />
        </div>
      </div>

    </div>
  );
};

export default PublicCheckoutPage;
