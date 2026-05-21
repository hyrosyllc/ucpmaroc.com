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
import { Loader2, Lock, ShoppingBag, CheckCircle2, Mail, Phone, MessageSquare, Calendar, User } from "lucide-react";
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
const StripeCheckoutForm = ({
  amount,
  portfolioId,
  actorId,
  items,
  onComplete,
  formTemplate,
  formValues,
  setFormValues,
  isLoadingForm,
}: any) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setIsProcessing(true);
    setErrorMessage("");
    
    const getFieldVal = (keywords: string[]) => {
      const key = Object.keys(formValues).find((k) =>
        keywords.some((keyword) => k.toLowerCase().includes(keyword))
      );
      return key ? formValues[key] : "";
    };

    const name = formTemplate ? getFieldVal(["name", "first", "last"]) : formValues.name;
    const email = formTemplate ? getFieldVal(["email", "mail"]) : formValues.email;
    const phone = formTemplate ? getFieldVal(["phone", "tel", "mobile"]) : "";
    const address = formTemplate ? getFieldVal(["address", "shipping", "street", "city", "zip"]) : "";

    if (!name || !email) {
       setErrorMessage("Name and email are required for payment processing.");
       setIsProcessing(false);
       return;
    }

    // 1. Confirm the payment with Stripe
    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: "if_required", // Do not automatically redirect; we need to save the order first
      confirmParams: {
        payment_method_data: {
          billing_details: { name, email, phone: phone || undefined },
        },
      },
    });

    if (error) {
      setErrorMessage(error.message || "Payment failed.");
      setIsProcessing(false);
      return;
    }

    // 2. If successful, record the order in Supabase
    if (paymentIntent && paymentIntent.status === "succeeded") {
      let notesText = "";
      if (formTemplate) {
        notesText = Object.entries(formValues).map(([k, v]) => {
          const fieldDef = formTemplate.fields?.find((f: any) => f.id === k);
          const label = fieldDef ? fieldDef.label : k;
          return `${label}: ${v}`;
        }).join("\n");
      }
      
      const { error: dbError } = await supabase.from("pro_orders").insert({
        actor_id: actorId,
        portfolio_id: portfolioId,
        customer_email: email,
        customer_name: name,
        customer_phone: phone || "No Phone",
        customer_address: address || "No Address Provided",
        amount_cents: amount * 100,
        status: "paid",
        items: items,
        stripe_payment_intent_id: paymentIntent.id,
        notes: notesText || undefined
      });

      if (dbError) {
        console.error("Failed to save order to DB:", dbError);
        // Depending on your architecture, you might want to alert an admin here,
        // but the payment HAS succeeded, so we still show the success screen to the fan.
      }
      onComplete(); // Trigger the success screen and clear cart
    }
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
    <form onSubmit={handleSubmit} className="space-y-6">
      {isLoadingForm ? (
        <div className="flex items-center justify-center py-6"><Loader2 className="animate-spin text-primary" /></div>
      ) : formTemplate?.fields ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {formTemplate.fields.filter((f: any) => f.enabled !== false).map((field: any, idx: number) => {
            const isHalf = field.width === "half";
            const fieldOptions = parseOptions(field.options);
            return (
              <div key={idx} className={cn("space-y-2", isHalf ? "col-span-1" : "col-span-1 sm:col-span-2")}>
                <label className="text-sm font-medium mb-1 block text-foreground flex items-center gap-1.5">
                   {field.label} {field.required && <span className="text-primary">*</span>}
                </label>
                {field.type === "textarea" ? (
                  <Textarea required={field.required} placeholder={field.placeholder} className="bg-background min-h-[100px] resize-none rounded-xl p-4 focus:border-primary/50" value={formValues[field.id] || ""} onChange={(e) => setFormValues({ ...formValues, [field.id]: e.target.value })} />
                ) : field.type === "select" ? (
                  <select required={field.required} className="w-full bg-background border border-border text-foreground h-10 rounded-md px-3 text-sm appearance-none outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2" value={formValues[field.id] || ""} onChange={(e) => setFormValues({ ...formValues, [field.id]: e.target.value })}>
                    <option value="" disabled>Select...</option>
                    {fieldOptions.map((opt: string, i: number) => (
                      <option key={i} value={opt}>{opt}</option>
                    ))}
                  </select>
                ) : field.type === "radio" ? (
                  <div className="flex flex-col gap-2 pt-1">
                    {fieldOptions.map((opt: string, i: number) => (
                      <label key={i} className="flex items-center gap-3 cursor-pointer group p-3 rounded-xl border border-border bg-background hover:bg-muted/50 transition-colors has-[:checked]:bg-primary/5 has-[:checked]:border-primary/30">
                        <div className="relative flex items-center justify-center w-5 h-5 rounded-full border border-border group-hover:border-primary">
                          <input type="radio" name={field.id} value={opt} required={field.required} className="peer sr-only" onChange={(e) => setFormValues({ ...formValues, [field.id]: e.target.value })} />
                          <div className="w-2.5 h-2.5 rounded-full bg-primary opacity-0 peer-checked:opacity-100 transition-all scale-50 peer-checked:scale-100" />
                        </div>
                        <span className="text-foreground text-sm font-medium">{opt}</span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <Input required={field.required} type={field.type === "email" ? "email" : field.type === "tel" ? "tel" : field.type === "date" ? "date" : "text"} placeholder={field.placeholder} className={cn("bg-background h-10 rounded-md focus:border-primary/50", field.type === "date" && "[color-scheme:dark]")} value={formValues[field.id] || ""} onChange={(e) => setFormValues({ ...formValues, [field.id]: e.target.value })} />
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block text-foreground">
              Full Name
            </label>
            <Input
              required
              placeholder="Jane Doe"
              value={formValues.name || ""}
              onChange={(e) => setFormValues({ ...formValues, name: e.target.value })}
              className="bg-background"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block text-foreground">
              Email Address
            </label>
            <Input
              required
              type="email"
              placeholder="jane@example.com"
              value={formValues.email || ""}
              onChange={(e) => setFormValues({ ...formValues, email: e.target.value })}
              className="bg-background"
            />
          </div>
        </div>
      )}

      <div className="pt-4 border-t border-border">
        <label className="text-sm font-medium mb-3 block text-foreground">
          Payment Details
        </label>
        {/* Renders the secure credit card / Apple Pay input */}
        <PaymentElement />
      </div>

      {errorMessage && (
        <div className="p-3 bg-destructive/10 text-destructive rounded-lg text-sm border border-destructive/20">
          {errorMessage}
        </div>
      )}

      <Button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full h-12 font-bold text-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-opacity"
      >
        {isProcessing ? (
          <Loader2 className="animate-spin mr-2" />
        ) : (
          <Lock size={18} className="mr-2" />
        )}
        Pay ${amount.toFixed(2)}
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

  const total = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  useEffect(() => {
    // If cart is empty, bounce them back to the shop
    if (items.length === 0 && !isSuccess) {
      navigate(`/pro/${portfolio.public_slug}/shop`);
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

  const handleSuccess = () => {
    clearCart();
    setIsSuccess(true);
  };

  // --- SUCCESS VIEW ---
  if (isSuccess) {
    return (
      <div className="max-w-md mx-auto mt-12 text-center space-y-6 animate-in fade-in zoom-in duration-500">
        <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2
            size={40}
            className="text-green-600 dark:text-green-400"
          />
        </div>
        <div>
          <h1 className="text-3xl font-black text-foreground">
            Payment Successful!
          </h1>
          <p className="text-muted-foreground mt-2">
            Your receipt has been sent to your email. The seller has been
            notified of your order.
          </p>
        </div>
        <Button
          onClick={() => navigate(`/pro/${portfolio.public_slug}`)}
          className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90"
        >
          Return to Website
        </Button>
      </div>
    );
  }

  // --- CHECKOUT VIEW ---
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start mt-8">
      {/* LEFT COLUMN: ORDER SUMMARY */}
      <div className="lg:col-span-5 order-2 lg:order-1">
        <div className="bg-card text-card-foreground p-6 md:p-8 rounded-3xl border shadow-sm sticky top-24">
          <h2 className="text-xl font-bold flex items-center gap-2 mb-6">
            <ShoppingBag size={20} /> Order Summary
          </h2>

          <div className="space-y-4 mb-6">
            {items.map((item: CartItem) => (
              <div
                key={item.id}
                className="flex justify-between items-start gap-4"
              >
                <div>
                  <div className="font-semibold text-foreground">
                    {item.title}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Qty: {item.quantity}
                  </div>
                </div>
                <div className="font-medium text-foreground">
                  ${(item.price * item.quantity).toFixed(2)}
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-border pt-4 space-y-2">
            <div className="flex justify-between text-muted-foreground text-sm">
              <span>Subtotal</span>
              <span>${total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground text-sm">
              <span>Taxes & Fees</span>
              <span>Calculated at next step</span>
            </div>
            <div className="flex justify-between font-black text-xl pt-2 border-t border-border mt-2 text-foreground">
              <span>Total</span>
              <span className="text-primary">${total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: PAYMENT GATEWAY */}
      <div className="lg:col-span-7 order-1 lg:order-2">
        <div className="bg-card text-card-foreground p-6 md:p-8 rounded-3xl border shadow-sm">
          <h2 className="text-2xl font-black mb-6">Secure Checkout</h2>

          {initError ? (
            <div className="p-6 bg-destructive/10 rounded-2xl border border-destructive/20 text-center">
              <p className="text-destructive font-semibold">{initError}</p>
            </div>
          ) : !clientSecret ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="w-8 h-8 animate-spin mb-4" />
              <p>Initializing secure connection...</p>
            </div>
          ) : (
            <Elements
              stripe={stripePromise}
              options={{ clientSecret, appearance: { theme: "stripe" } }}
            >
              <StripeCheckoutForm
                amount={total}
                portfolioId={portfolio.id}
                actorId={portfolio.actor_id}
                items={items}
                onComplete={handleSuccess}
                formTemplate={formTemplate}
                formValues={formValues}
                setFormValues={setFormValues}
                isLoadingForm={isLoadingForm}
              />
            </Elements>
          )}
        </div>
      </div>
    </div>
  );
};

export default PublicCheckoutPage;
