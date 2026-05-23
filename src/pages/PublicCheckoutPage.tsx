import React, { useState, useEffect } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import { useCartStore, type CartItem } from "@/store/useCartStore";
import { supabase } from "../supabaseClient"; // Adjust path if needed
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { Loader2, Lock, ShoppingBag, CheckCircle2, Mail, Phone, MessageSquare, Calendar, User, AlertCircle, ChevronRight, Landmark, Bitcoin, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
// 🚀 Initialize Stripe outside the render cycle so it doesn't recreate on every state change
const stripePromise = loadStripe(
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ||
    "pk_test_YOUR_STRIPE_PUBLIC_KEY"
);

// --- THE STRIPE FORM COMPONENT ---
const CheckoutForm = ({
  amount,
  portfolioId,
  actorId,
  items,
  onComplete,
  formTemplate,
  formValues,
  setFormValues,
  isLoadingForm,
  clientSecret,
  paymentConfig
}: any) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"card" | "cod" | "bank" | "crypto">("card");

  // Fallback selector if Card isn't available
  useEffect(() => {
    if (!clientSecret) {
      if (paymentConfig?.cod?.enabled ?? true) setPaymentMethod("cod");
      else if (paymentConfig?.bank?.enabled) setPaymentMethod("bank");
      else if (paymentConfig?.crypto?.enabled) setPaymentMethod("crypto");
    }
  }, [clientSecret, paymentConfig]);

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
    const phone = getFieldVal(["phone", "tel", "mobile"]) || "";
    const address = getFieldVal(["address", "shipping", "street", "city", "zip"], ["email"]) || "";

    if (!name || !email) {
       setErrorMessage("Name and email are required for order processing.");
       setIsProcessing(false);
       return;
    }

    // Extract the exact Stripe Payment Intent ID from the client secret we fetched earlier
    let paymentIntentId = paymentMethod === "card" ? clientSecret?.split('_secret_')[0] : `${paymentMethod}_${Date.now()}`;

    // 1. Record the order in Supabase FIRST as "pending"
    let notesText = "";
    if (formTemplate) {
      notesText = Object.entries(formValues).map(([k, v]) => {
        const fieldDef = formTemplate.fields?.find((f: any) => f.id === k);
        const label = fieldDef ? fieldDef.label : k;
        return `${label}: ${v}`;
      }).join("\n");
    } else {
      notesText = `Email: ${email}`;
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
    
    if (paymentMethod !== "card") {
      notesText += `\nPayment Method: ${paymentMethod.toUpperCase()}`;
    } else if (paymentIntentId) {
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

    // 2. Now that it's safe in the database, confirm the payment with Stripe!
    if (paymentMethod === "card") {
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

  return (
    <form onSubmit={handleSubmit} className="space-y-10 animate-in fade-in duration-500">
      
      {/* CONTACT INFO SECTION */}
      <div className="space-y-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Contact Information</h2>
          <p className="text-sm text-muted-foreground mt-1">We'll use this to send your order updates and receipt.</p>
        </div>

        {isLoadingForm ? (
          <div className="flex items-center justify-center py-6"><Loader2 className="animate-spin text-primary" /></div>
        ) : formTemplate?.fields ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-5">
            {formTemplate.fields.filter((f: any) => f.enabled !== false).map((field: any, idx: number) => {
              const isHalf = field.width === "half";
              const fieldOptions = parseOptions(field.options);
              return (
                <div key={idx} className={cn("space-y-2", isHalf ? "col-span-1" : "col-span-1 sm:col-span-2")}>
                  <label className="text-sm font-semibold text-foreground flex items-center gap-1.5 ml-1">
                     {field.label} {field.required && <span className="text-primary">*</span>}
                  </label>
                  {field.type === "textarea" ? (
                    <Textarea required={field.required} placeholder={field.placeholder} className="bg-muted/20 hover:bg-muted/40 focus:bg-background min-h-[100px] resize-none rounded-xl p-4 border-border/40 shadow-sm focus-visible:ring-primary/20 focus-visible:border-primary/50 transition-all" value={formValues[field.id] || ""} onChange={(e) => setFormValues({ ...formValues, [field.id]: e.target.value })} />
                  ) : field.type === "select" ? (
                    <select required={field.required} className="w-full bg-muted/20 hover:bg-muted/40 focus:bg-background border border-border/40 text-foreground h-12 rounded-xl px-3 text-sm appearance-none outline-none focus:ring-4 focus:ring-primary/20 focus:border-primary/50 transition-all shadow-sm" value={formValues[field.id] || ""} onChange={(e) => setFormValues({ ...formValues, [field.id]: e.target.value })}>
                      <option value="" disabled>Select...</option>
                      {fieldOptions.map((opt: string, i: number) => (
                        <option key={i} value={opt}>{opt}</option>
                      ))}
                    </select>
                  ) : field.type === "radio" ? (
                    <div className="flex flex-col gap-2 pt-1">
                      {fieldOptions.map((opt: string, i: number) => (
                        <label key={i} className="flex items-center gap-3 cursor-pointer group p-4 rounded-xl border border-border/40 bg-muted/10 shadow-sm hover:bg-muted/30 transition-colors has-[:checked]:bg-primary/5 has-[:checked]:border-primary/30">
                          <div className="relative flex items-center justify-center w-5 h-5 rounded-full border border-border/60 group-hover:border-primary bg-background">
                            <input type="radio" name={field.id} value={opt} required={field.required} className="peer sr-only" onChange={(e) => setFormValues({ ...formValues, [field.id]: e.target.value })} />
                            <div className="w-2.5 h-2.5 rounded-full bg-primary opacity-0 peer-checked:opacity-100 transition-all scale-50 peer-checked:scale-100" />
                          </div>
                          <span className="text-foreground text-sm font-medium">{opt}</span>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <Input required={field.required} type={field.type === "email" ? "email" : field.type === "tel" ? "tel" : field.type === "date" ? "date" : "text"} placeholder={field.placeholder} className="bg-muted/20 hover:bg-muted/40 focus:bg-background h-12 rounded-xl border-border/40 shadow-sm focus:border-primary/50 focus:ring-4 focus:ring-primary/20 transition-all" value={formValues[field.id] || ""} onChange={(e) => setFormValues({ ...formValues, [field.id]: e.target.value })} />
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-semibold ml-1 text-foreground">
                Full Name
              </label>
              <Input
                required
                placeholder="Jane Doe"
                value={formValues.name || ""}
                onChange={(e) => setFormValues({ ...formValues, name: e.target.value })}
                className="bg-muted/20 hover:bg-muted/40 focus:bg-background h-12 rounded-xl border-border/40 shadow-sm focus:border-primary/50 focus:ring-4 focus:ring-primary/20 transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold ml-1 text-foreground">
                Email Address
              </label>
              <Input
                required
                type="email"
                placeholder="jane@example.com"
                value={formValues.email || ""}
                onChange={(e) => setFormValues({ ...formValues, email: e.target.value })}
                className="bg-muted/20 hover:bg-muted/40 focus:bg-background h-12 rounded-xl border-border/40 shadow-sm focus:border-primary/50 focus:ring-4 focus:ring-primary/20 transition-all"
              />
            </div>
          </div>
        )}
      </div>

      {/* PAYMENT SECURE SECTION */}
      <div className="space-y-6 pt-8 border-t border-border/40">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Payment Method</h2>
          <p className="text-sm text-muted-foreground mt-1">Select how you want to pay for your order.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {clientSecret && (
            <label
              className={cn(
                "flex flex-col items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all",
                paymentMethod === "card" ? "border-primary bg-primary/5 shadow-md" : "border-border/40 bg-muted/20 hover:bg-muted/40 hover:border-primary/50"
              )}
              onClick={() => setPaymentMethod("card")}
            >
              <div className="flex items-center gap-2">
                <div className="relative flex items-center justify-center w-5 h-5 rounded-full border border-border/60 bg-background">
                  <div className={cn("w-2.5 h-2.5 rounded-full bg-primary transition-all", paymentMethod === "card" ? "opacity-100 scale-100" : "opacity-0 scale-50")} />
                </div>
                <span className="font-semibold text-foreground">Credit Card</span>
              </div>
              <p className="text-sm text-muted-foreground ml-7">Secure encrypted payment via Stripe.</p>
            </label>
          )}

          {(paymentConfig?.cod?.enabled ?? true) && (
            <label
              className={cn(
                "flex flex-col items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all",
                paymentMethod === "cod" ? "border-primary bg-primary/5 shadow-md" : "border-border/40 bg-muted/20 hover:bg-muted/40 hover:border-primary/50"
              )}
              onClick={() => setPaymentMethod("cod")}
            >
              <div className="flex items-center gap-2">
                <div className="relative flex items-center justify-center w-5 h-5 rounded-full border border-border/60 bg-background">
                  <div className={cn("w-2.5 h-2.5 rounded-full bg-primary transition-all", paymentMethod === "cod" ? "opacity-100 scale-100" : "opacity-0 scale-50")} />
                </div>
                <span className="font-semibold text-foreground">Cash on Delivery</span>
              </div>
              <p className="text-sm text-muted-foreground ml-7">Pay in cash when your order arrives.</p>
            </label>
          )}

          {paymentConfig?.bank?.enabled && (
            <label
              className={cn(
                "flex flex-col items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all",
                paymentMethod === "bank" ? "border-primary bg-primary/5 shadow-md" : "border-border/40 bg-muted/20 hover:bg-muted/40 hover:border-primary/50"
              )}
              onClick={() => setPaymentMethod("bank")}
            >
              <div className="flex items-center gap-2">
                <div className="relative flex items-center justify-center w-5 h-5 rounded-full border border-border/60 bg-background">
                  <div className={cn("w-2.5 h-2.5 rounded-full bg-primary transition-all", paymentMethod === "bank" ? "opacity-100 scale-100" : "opacity-0 scale-50")} />
                </div>
                <span className="font-semibold text-foreground flex items-center gap-2">Bank Transfer</span>
              </div>
              <p className="text-sm text-muted-foreground ml-7">Transfer directly to our account.</p>
            </label>
          )}

          {paymentConfig?.crypto?.enabled && (
            <label
              className={cn(
                "flex flex-col items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all",
                paymentMethod === "crypto" ? "border-primary bg-primary/5 shadow-md" : "border-border/40 bg-muted/20 hover:bg-muted/40 hover:border-primary/50"
              )}
              onClick={() => setPaymentMethod("crypto")}
            >
              <div className="flex items-center gap-2">
                <div className="relative flex items-center justify-center w-5 h-5 rounded-full border border-border/60 bg-background">
                  <div className={cn("w-2.5 h-2.5 rounded-full bg-primary transition-all", paymentMethod === "crypto" ? "opacity-100 scale-100" : "opacity-0 scale-50")} />
                </div>
                <span className="font-semibold text-foreground flex items-center gap-2">Crypto (USDC/SOL)</span>
              </div>
              <p className="text-sm text-muted-foreground ml-7">Send stablecoins via Web3 wallet.</p>
            </label>
          )}
        </div>

        {paymentMethod === "card" && (
          <div className="p-5 rounded-2xl border border-border/40 bg-card/50 shadow-sm animate-in fade-in zoom-in-95">
            <PaymentElement />
          </div>
        )}
        
        {paymentMethod === "cod" && (
          <div className="p-5 rounded-2xl border border-border/40 bg-card/50 shadow-sm animate-in fade-in zoom-in-95">
            <p className="text-sm text-foreground">You will pay for your order upon delivery. No payment details required now.</p>
          </div>
        )}

        {paymentMethod === "bank" && (
          <div className="p-5 rounded-2xl border border-border/40 bg-card/50 shadow-sm animate-in fade-in zoom-in-95">
            <p className="text-sm font-semibold mb-3">Please transfer the total amount to the following bank account:</p>
            <div className="space-y-1.5 text-sm text-muted-foreground bg-muted/30 p-4 rounded-xl border border-border/40">
              <p><strong className="text-foreground">Bank:</strong> {paymentConfig?.bank?.name || "N/A"}</p>
              <p><strong className="text-foreground">Account Holder:</strong> {paymentConfig?.bank?.holder || "N/A"}</p>
              <p><strong className="text-foreground">IBAN/Account No:</strong> {paymentConfig?.bank?.iban || "N/A"}</p>
            </div>
            <p className="text-xs text-muted-foreground mt-4">After making the transfer, click "Place Order". Your order will be processed once the funds are verified.</p>
          </div>
        )}

        {paymentMethod === "crypto" && (
          <div className="p-5 rounded-2xl border border-border/40 bg-card/50 shadow-sm animate-in fade-in zoom-in-95">
            <p className="text-sm font-semibold mb-3 flex items-center gap-2"><Bitcoin className="text-amber-500 w-5 h-5"/> Send USDC or SOL to the following wallet:</p>
            <div className="space-y-1.5 text-sm text-muted-foreground bg-muted/30 p-4 rounded-xl border border-border/40 break-all">
              <p className="font-mono text-primary font-bold">{paymentConfig?.crypto?.wallet || "N/A"}</p>
            </div>
            <p className="text-xs text-muted-foreground mt-4">Supported networks: Solana, Polygon, Ethereum. Click "Place Order" after sending.</p>
          </div>
        )}
      </div>

      {/* ERROR HANDLER */}
      {errorMessage && (
        <div className="p-4 bg-destructive/10 text-destructive rounded-xl text-sm border border-destructive/20 flex items-start gap-3 animate-in fade-in duration-300">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <span className="font-medium leading-relaxed">{errorMessage}</span>
        </div>
      )}

      {/* SUBMIT */}
      <Button
        type="submit"
        disabled={(paymentMethod === "card" && (!stripe || !elements)) || isProcessing}
        className="w-full h-14 font-bold tracking-wide text-lg rounded-xl shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/40 hover:scale-[1.01] transition-all bg-primary text-primary-foreground hover:brightness-110"
      >
        {isProcessing ? (
          <Loader2 className="animate-spin mr-2" />
        ) : paymentMethod === "card" ? (
          <Lock size={18} className="mr-2" />
        ) : (
          <CheckCircle2 size={18} className="mr-2" />
        )}
        {paymentMethod === "card" ? `Pay $${amount.toFixed(2)}` : "Place Order"}
      </Button>
    </form>
  );
};

// --- MAIN PAGE COMPONENT ---
const PublicCheckoutPage = () => {
  // Grab the portfolio context passed down from CheckoutLayout
  const { portfolio } = useOutletContext<{ portfolio: any }>();
  const { items, clearCart } = useCartStore();
  const navigate = useNavigate();

  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [initError, setInitError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [formTemplate, setFormTemplate] = useState<any>(null);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [isLoadingForm, setIsLoadingForm] = useState(false);

  const MAIN_DOMAINS = [
    "ucpmaroc.com",
    "www.ucpmaroc.com",
    "localhost",
    "127.0.0.1",
    "symmetrical-acorn-697wxxq4r74j3jpj-5173.app.github.dev",
  ];
  const isCustomDomain = !MAIN_DOMAINS.some((domain) => window.location.hostname.includes(domain));
  const shopUrl = isCustomDomain ? '/shop' : `/pro/${portfolio.public_slug}/shop`;
  const homeUrl = isCustomDomain ? '/' : `/pro/${portfolio.public_slug}`;

  const total = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  useEffect(() => {
    // If cart is empty, bounce them back to the shop
    if (items.length === 0 && !isSuccess) {
      navigate(shopUrl);
      return;
    }

    // Request the Payment Intent from your Supabase Edge Function
    const initializeCheckout = async () => {
      try {
        const { data, error } = await supabase.functions.invoke(
          "create-payment-intent",
          {
            body: { amount: total * 100, portfolioId: portfolio.id }, // Total in cents
          }
        );

        if (error) throw error;
        if (data.error) throw new Error(data.error);
        if (data.clientSecret) setClientSecret(data.clientSecret);
      } catch (err: any) {
        if (err.message === "SELLER_NOT_CONNECTED") {
          setInitError(
            "This seller is currently not accepting automated payments."
          );
        } else {
          setInitError(
            "Checkout is currently unavailable. Please try again later."
          );
        }
      }
    };

    const fetchForm = async () => {
      if (items.length > 0) {
        setIsLoadingForm(true);
        const { data: prod } = await supabase.from('pro_products').select('form_id').eq('id', items[0].id).maybeSingle();
        if (prod?.form_id) {
          const { data: f } = await supabase.from('forms').select('*').eq('id', prod.form_id).maybeSingle();
          if (f) setFormTemplate(f);
        }
        setIsLoadingForm(false);
      }
    };

    if (total > 0 && !isSuccess) {
      initializeCheckout();
      fetchForm();
    }
  }, [items, total, portfolio.id, portfolio.public_slug, navigate, isSuccess]);

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
    <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-x-12 gap-y-12 items-start mt-4 md:mt-8 pt-8 md:pt-12 pb-12 px-4 md:px-8">
      
      {/* LEFT COLUMN: PAYMENT GATEWAY (Primary Focus) */}
      <div className="w-full lg:w-[55%] xl:w-3/5 order-2 lg:order-1 pt-4 lg:pt-0">
          {initError ? (
            <div className="p-6 bg-destructive/10 rounded-2xl border border-destructive/20 text-center">
              <p className="text-destructive font-semibold">{initError}</p>
            </div>
          ) : !clientSecret ? (
            <div className="flex flex-col items-center justify-center py-32 text-muted-foreground">
              <Loader2 className="w-8 h-8 animate-spin mb-4" />
              <p>Initializing secure connection...</p>
            </div>
          ) : (
            <Elements
              stripe={stripePromise}
              options={{ clientSecret, appearance: { theme: "stripe" } }}
            >
              <CheckoutForm
                amount={total}
                portfolioId={portfolio.id}
                actorId={portfolio.actor_id}
                items={items}
                onComplete={handleSuccess}
                formTemplate={formTemplate}
                formValues={formValues}
                setFormValues={setFormValues}
                isLoadingForm={isLoadingForm}
                clientSecret={clientSecret}
                paymentConfig={portfolio?.theme_config?.payments || {}}
              />
            </Elements>
          )}
      </div>

      {/* RIGHT COLUMN: ORDER SUMMARY (Sticky Sidebar) */}
      <div className="w-full lg:w-[45%] xl:w-2/5 order-1 lg:order-2 bg-card/50 backdrop-blur-xl border border-border/40 shadow-2xl rounded-[2rem] p-6 md:p-10 sticky top-24">
        
        <h2 className="text-xl font-bold flex items-center gap-2 mb-6 text-foreground">
          Order Summary
        </h2>

        <div className="space-y-5 mb-8">
          {items.map((item: CartItem) => (
            <div
              key={item.id}
              className="flex items-center gap-4"
            >
              <div className="relative w-16 h-16 rounded-xl border border-border/40 bg-muted/30 flex items-center justify-center shrink-0 shadow-sm">
                 {item.image ? (
                    <img src={item.image} className="w-full h-full object-cover rounded-xl" alt={item.title} />
                 ) : (
                    <ShoppingBag className="w-6 h-6 text-muted-foreground opacity-30" />
                 )}
                 <span className="absolute -top-2 -right-2 flex h-[22px] w-[22px] items-center justify-center rounded-full bg-foreground text-[11px] font-bold text-background shadow-sm z-10">
                    {item.quantity}
                 </span>
              </div>

              <div className="flex-1 min-w-0 pr-4">
                <h4 className="font-semibold text-foreground text-sm truncate">
                  {item.title}
                </h4>
                {item.variant && (
                  <p className="text-xs text-muted-foreground truncate mt-1">
                    {item.variant}
                  </p>
                )}
              </div>
              
              <div className="font-semibold text-foreground shrink-0 text-right">
                ${(item.price * item.quantity).toFixed(2)}
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-border/50 pt-5 space-y-3">
          <div className="flex justify-between text-muted-foreground text-sm font-medium">
            <span>Subtotal</span>
            <span>${total.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-black text-2xl pt-4 border-t border-border/50 mt-4 text-foreground items-end">
            <span className="text-lg">Total</span>
            <span className="text-primary">${total.toFixed(2)}</span>
          </div>
        </div>
      </div>

    </div>
  );
};

export default PublicCheckoutPage;
