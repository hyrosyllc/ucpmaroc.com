import React, { useState, useEffect } from "react";
import { useOutletContext, useNavigate, Link } from "react-router-dom";
import { useCartStore, type CartItem } from "@/store/useCartStore";
import { supabase } from "../supabaseClient"; // Adjust path if needed
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { Loader2, Lock, ShoppingBag, CheckCircle2, Mail, Phone, MessageSquare, Calendar, User, AlertCircle, ChevronLeft, Landmark, Bitcoin, Package, ShoppingCart, ChevronUp, ChevronDown } from "lucide-react";
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

    // 1.5. Inventory Management for Manual Payments (COD/Bank/Crypto)
    // Since Stripe payments use the webhook, we deduct stock manually here for the others
    if (paymentMethod !== "card") {
      for (const item of items) {
        await supabase.rpc('decrement_stock', {
          p_product_id: item.id,
          p_quantity: item.quantity
        });
      }
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
    <form onSubmit={handleSubmit} className="space-y-8 animate-in fade-in duration-500 w-full">
      
      {/* CONTACT INFO SECTION */}
      <div className="space-y-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold tracking-tight text-gray-900">Contact & Shipping</h2>
          <p className="text-sm text-gray-500 mt-1">We'll use this to send your order updates.</p>
        </div>

        {isLoadingForm ? (
          <div className="flex items-center justify-center py-6"><Loader2 className="animate-spin text-primary" /></div>
        ) : formTemplate?.fields ? (
          <div className="grid grid-cols-1 sm:grid-cols-6 gap-x-4 gap-y-4">
            {formTemplate.fields.filter((f: any) => f.enabled !== false).map((field: any, idx: number) => {
              const widthClass = field.width === "third" ? "sm:col-span-2" : field.width === "half" ? "sm:col-span-3" : "sm:col-span-6";
              const fieldOptions = parseOptions(field.options);
              return (
                <div key={idx} className={cn("space-y-2 col-span-1", widthClass)}>
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                     {field.label} {field.required && <span className="text-primary">*</span>}
                  </label>
                  {field.type === "textarea" ? (
                    <Textarea required={field.required} placeholder={field.placeholder} className="bg-white hover:border-gray-400 focus:bg-white min-h-[100px] resize-none rounded-md p-3 border-gray-300 shadow-sm focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-transparent text-gray-900 transition-all" value={formValues[field.id] || ""} onChange={(e) => setFormValues({ ...formValues, [field.id]: e.target.value })} />
                  ) : field.type === "select" ? (
                    <select required={field.required} className="w-full bg-white hover:border-gray-400 focus:bg-white border border-gray-300 text-gray-900 h-11 rounded-md px-3 text-sm appearance-none outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all shadow-sm" value={formValues[field.id] || ""} onChange={(e) => setFormValues({ ...formValues, [field.id]: e.target.value })}>
                      <option value="" disabled>Select...</option>
                      {fieldOptions.map((opt: string, i: number) => (
                        <option key={i} value={opt}>{opt}</option>
                      ))}
                    </select>
                  ) : field.type === "radio" ? (
                    <div className="flex flex-col gap-2">
                      {fieldOptions.map((opt: string, i: number) => (
                        <label key={i} className="flex items-center gap-3 cursor-pointer group p-3 rounded-md border border-gray-300 bg-white shadow-sm hover:border-gray-400 transition-colors has-[:checked]:bg-primary/5 has-[:checked]:border-primary has-[:checked]:ring-1 has-[:checked]:ring-primary">
                          <div className="relative flex items-center justify-center w-4 h-4 rounded-full border border-gray-300 group-hover:border-primary bg-white">
                            <input type="radio" name={field.id} value={opt} required={field.required} className="peer sr-only" onChange={(e) => setFormValues({ ...formValues, [field.id]: e.target.value })} />
                            <div className="w-2 h-2 rounded-full bg-primary opacity-0 peer-checked:opacity-100 transition-all scale-50 peer-checked:scale-100" />
                          </div>
                          <span className="text-gray-900 text-sm font-medium">{opt}</span>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <Input required={field.required} type={field.type === "email" ? "email" : field.type === "tel" ? "tel" : field.type === "date" ? "date" : "text"} placeholder={field.placeholder} className="bg-white hover:border-gray-400 focus:bg-white text-gray-900 h-11 rounded-md border-gray-300 shadow-sm focus-visible:border-transparent focus-visible:ring-2 focus-visible:ring-primary transition-all" value={formValues[field.id] || ""} onChange={(e) => setFormValues({ ...formValues, [field.id]: e.target.value })} />
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Full Name
              </label>
              <Input
                required
                placeholder="Jane Doe"
                value={formValues.name || ""}
                onChange={(e) => setFormValues({ ...formValues, name: e.target.value })}
                className="bg-white hover:border-gray-400 focus:bg-white text-gray-900 h-11 rounded-md border-gray-300 shadow-sm focus-visible:border-transparent focus-visible:ring-2 focus-visible:ring-primary transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Email Address
              </label>
              <Input
                required
                type="email"
                placeholder="jane@example.com"
                value={formValues.email || ""}
                onChange={(e) => setFormValues({ ...formValues, email: e.target.value })}
                className="bg-white hover:border-gray-400 focus:bg-white text-gray-900 h-11 rounded-md border-gray-300 shadow-sm focus-visible:border-transparent focus-visible:ring-2 focus-visible:ring-primary transition-all"
              />
            </div>
          </div>
        )}
      </div>

      {/* PAYMENT SECURE SECTION */}
      <div className="space-y-6 pt-8">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-gray-900">Payment</h2>
          <p className="text-sm text-gray-500 mt-1">All transactions are secure and encrypted.</p>
        </div>

        <div className="border border-gray-300 bg-white rounded-md overflow-hidden shadow-sm">
          {clientSecret && (
                        <>
              <label
                className={cn(
                  "flex items-center gap-3 p-4 cursor-pointer transition-colors",
                  paymentMethod === "card" ? "bg-primary/5 border-b border-gray-200" : "hover:bg-gray-50"
                )}
                onClick={() => setPaymentMethod("card")}
              >
                <div className="relative flex items-center justify-center w-4 h-4 rounded-full border border-gray-300 bg-white">
                  <div className={cn("w-2 h-2 rounded-full bg-primary transition-all", paymentMethod === "card" ? "opacity-100 scale-100" : "opacity-0 scale-50")} />
                </div>
                                <span className="font-medium text-gray-900 text-sm">Credit card</span>
              </label>
              {paymentMethod === "card" && (
                <div className="p-4 bg-gray-50 border-b border-gray-200">
                  <PaymentElement />
                </div>
              )}
            </>
          )}

          {(paymentConfig?.cod?.enabled ?? true) && (
                        <>
              {clientSecret && <div className="h-px bg-gray-200 w-full" />}
              <label
                className={cn(
                  "flex items-center gap-3 p-4 cursor-pointer transition-colors",
                  paymentMethod === "cod" ? "bg-primary/5 border-b border-gray-200" : "hover:bg-gray-50"
                )}
                onClick={() => setPaymentMethod("cod")}
              >
                <div className="relative flex items-center justify-center w-4 h-4 rounded-full border border-gray-300 bg-white">
                  <div className={cn("w-2 h-2 rounded-full bg-primary transition-all", paymentMethod === "cod" ? "opacity-100 scale-100" : "opacity-0 scale-50")} />
                </div>
                <span className="font-medium text-gray-900 text-sm">Cash on Delivery</span>
              </label>
              {paymentMethod === "cod" && (
                <div className="p-6 bg-gray-50 border-b border-gray-200 text-center text-sm text-gray-600">
                  You will pay for your order upon delivery.
                </div>
              )}
            </>
          )}


          {paymentConfig?.bank?.enabled && (
                        <>
              <div className="h-px bg-gray-200 w-full" />
              <label
                className={cn(
                  "flex items-center gap-3 p-4 cursor-pointer transition-colors",
                  paymentMethod === "bank" ? "bg-primary/5 border-b border-gray-200" : "hover:bg-gray-50"
                )}
                onClick={() => setPaymentMethod("bank")}
              >
                <div className="relative flex items-center justify-center w-4 h-4 rounded-full border border-gray-300 bg-white">
                  <div className={cn("w-2 h-2 rounded-full bg-primary transition-all", paymentMethod === "bank" ? "opacity-100 scale-100" : "opacity-0 scale-50")} />

                </div>
                <span className="font-medium text-gray-900 text-sm">Bank Transfer</span>
              </label>
              {paymentMethod === "bank" && (
                <div className="p-6 bg-gray-50 border-b border-gray-200">
                  <p className="text-sm font-medium text-gray-900 mb-3 text-center">Transfer the total amount to:</p>
                  <div className="space-y-2 text-sm text-gray-700 bg-white p-4 rounded-md border border-gray-200 shadow-sm">
                    <div className="flex justify-between"><span className="text-gray-500">Bank</span><span className="font-medium">{paymentConfig?.bank?.name || "N/A"}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Account Holder</span><span className="font-medium">{paymentConfig?.bank?.holder || "N/A"}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">IBAN/Account No</span><span className="font-medium break-all text-right">{paymentConfig?.bank?.iban || "N/A"}</span></div>
                  </div>
                </div>
              )}
            </>
          )}

          {paymentConfig?.crypto?.enabled && (
            <>
              <div className="h-px bg-gray-200 w-full" />
              <label
                className={cn(
                  "flex items-center gap-3 p-4 cursor-pointer transition-colors",
                  paymentMethod === "crypto" ? "bg-primary/5 border-b border-gray-200" : "hover:bg-gray-50"
                )}
                onClick={() => setPaymentMethod("crypto")}
              >
                <div className="relative flex items-center justify-center w-4 h-4 rounded-full border border-gray-300 bg-white">
                  <div className={cn("w-2 h-2 rounded-full bg-primary transition-all", paymentMethod === "crypto" ? "opacity-100 scale-100" : "opacity-0 scale-50")} />

                </div>
                <span className="font-medium text-gray-900 text-sm">Crypto (USDC/SOL)</span>
              </label>
              {paymentMethod === "crypto" && (
                <div className="p-6 bg-gray-50 border-b border-gray-200">
                  <p className="text-sm font-medium text-gray-900 mb-3 text-center flex items-center justify-center gap-2">
                     Send USDC or SOL to:
                  </p>
                  <div className="text-sm text-gray-700 bg-white p-4 rounded-md border border-gray-200 shadow-sm break-all text-center font-mono font-bold text-primary">
                    {paymentConfig?.crypto?.wallet || "N/A"}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        
      </div>

      {/* ERROR HANDLER */}
      {errorMessage && (
        <div className="p-4 bg-red-50 text-red-600 rounded-md text-sm border border-red-200 flex items-start gap-3 animate-in fade-in duration-300">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <span className="font-medium leading-relaxed">{errorMessage}</span>
        </div>
      )}

      {/* SUBMIT */}
      <Button
        type="submit"
        disabled={(paymentMethod === "card" && (!stripe || !elements)) || isProcessing}
        className="w-full h-14 font-medium tracking-wide text-lg rounded-md shadow-sm transition-all bg-primary text-primary-foreground hover:brightness-110"
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
// --- REUSABLE ORDER SUMMARY COMPONENT ---
const OrderSummaryContent = ({ items, total }: any) => (
  <div className="flex flex-col h-full animate-in fade-in">
    <div className="space-y-4 mb-6 flex-grow">
      {items.map((item: CartItem) => (
        <div key={item.id} className="flex items-center gap-4">
          <div className="relative w-16 h-16 bg-white border border-gray-200 rounded-lg flex items-center justify-center shrink-0">
            {item.image ? (
              <img src={item.image} className="w-full h-full object-cover rounded-lg" alt={item.title} />
            ) : (
              <ShoppingBag className="w-6 h-6 text-gray-300" />
            )}
            <span className="absolute -top-2 -right-2 bg-gray-500/90 backdrop-blur-sm text-white text-xs font-medium w-5 h-5 flex items-center justify-center rounded-full shadow-sm">
              {item.quantity}
            </span>
          </div>
          <div className="flex-1 min-w-0 pr-4">
            <h4 className="font-medium text-gray-900 text-sm truncate">{item.title}</h4>
            {item.variant && <p className="text-xs text-gray-500 truncate mt-0.5">{item.variant}</p>}
          </div>
          <div className="font-medium text-gray-900 shrink-0 text-right text-sm">
            ${(item.price * item.quantity).toFixed(2)}
          </div>
        </div>
      ))}
    </div>

    <div className="border-t border-gray-200 pt-5 space-y-3">
      <div className="flex justify-between text-sm text-gray-600">
        <span>Subtotal</span>
        <span className="font-medium text-gray-900">${total.toFixed(2)}</span>
      </div>
      <div className="flex justify-between text-sm text-gray-600">
        <span>Shipping</span>
        <span className="text-gray-500 text-xs">Calculated at next step</span>
      </div>
      <div className="flex justify-between items-center mt-4 border-t border-gray-200 pt-5">
        <span className="text-base font-semibold text-gray-900">Total</span>
        <div className="flex items-end gap-2">
          <span className="text-xs text-gray-500 mb-1">USD</span>
          <span className="text-2xl font-bold text-gray-900 tracking-tight">${total.toFixed(2)}</span>
        </div>
      </div>
    </div>
  </div>
);

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
  const [isSummaryExpanded, setIsSummaryExpanded] = useState(false);

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
    <div className="min-h-screen flex flex-col lg:flex-row bg-white font-sans text-gray-900 w-full overflow-x-hidden selection:bg-primary/20 selection:text-gray-900">
      
      {/* MOBILE ACCORDION (Hidden on Desktop) */}
      <div className="lg:hidden bg-[#F9FAFB] border-b border-gray-200 w-full">
        <div 
          className="flex items-center justify-between p-5 sm:px-6 cursor-pointer"
          onClick={() => setIsSummaryExpanded(!isSummaryExpanded)}
        >
          <div className="flex items-center gap-2 text-primary text-sm font-medium">
            <ShoppingCart size={18} />
            {isSummaryExpanded ? "Hide order summary" : "Show order summary"}
            {isSummaryExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
          <span className="font-semibold text-gray-900 text-lg">${total.toFixed(2)}</span>
        </div>
        {isSummaryExpanded && (
          <div className="p-5 sm:px-6 border-t border-gray-200 bg-[#F9FAFB]">
            <OrderSummaryContent items={items} total={total} />
          </div>
        )}
      </div>

      {/* LEFT COLUMN: ACTIVE FORM (White Background) */}
      <div className="flex-1 flex justify-end bg-white">
        <div className="w-full max-w-xl flex flex-col px-5 py-8 sm:p-10 lg:p-12 xl:pr-24 lg:pl-8 mx-auto lg:mx-0">
          
          {/* Header Link / Logo */}
          <div className="mb-8">
            <Link to={shopUrl} className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors mb-6">
              <ChevronLeft size={16} className="mr-1" /> Return to cart
            </Link>
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900">{portfolio.site_name || portfolio.public_slug}</h1>
          </div>

          {initError ? (
            <div className="p-6 bg-red-50 rounded-md border border-red-200 text-center">
              <p className="text-red-600 font-semibold">{initError}</p>
            </div>
          ) : !clientSecret ? (
            <div className="flex flex-col items-center justify-center py-32 text-gray-500">
              <Loader2 className="w-8 h-8 animate-spin mb-4" />
              <p>Initializing secure connection...</p>
            </div>
          ) : (
            <Elements
              stripe={stripePromise}
              options={{ 
                clientSecret, 
                appearance: { 
                  theme: "stripe",
                  variables: {
                    fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, sans-serif',
                    borderRadius: '6px',
                    colorBackground: 'transparent',
                    colorText: '#111827',
                    colorPrimary: 'var(--primary)',
                    colorDanger: '#ef4444',
                    colorTextPlaceholder: '#6B7280',
                    colorBorder: '#D1D5DB',
                  },
                  rules: {
                    '.Input': {
                      backgroundColor: '#ffffff',
                      boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                      padding: '12px',
                    },
                    '.Input:focus': {
                      border: '1px solid var(--primary)',
                      boxShadow: '0 0 0 1px var(--primary)',
                    },
                    '.Label': {
                      fontWeight: '500',
                      color: '#374151',
                      marginBottom: '4px'
                    },
                    '.Tab--selected': {
                    }
                  }
                } 
              }}
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
      </div>

      {/* RIGHT COLUMN: PASSIVE SUMMARY (Desktop Only) */}
      <div className="hidden lg:block w-[45%] xl:w-[42%] bg-[#F9FAFB] border-l border-gray-200 px-6 py-12 lg:p-12 xl:pl-16">
        <div className="w-full max-w-md sticky top-12">
           <OrderSummaryContent items={items} total={total} />
        </div>
      </div>

    </div>
  );
};

export default PublicCheckoutPage;
