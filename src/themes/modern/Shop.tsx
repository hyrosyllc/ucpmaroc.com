import React, { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { createPortal } from "react-dom";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ShoppingBag,
  ChevronRight,
  ChevronLeft,
  ExternalLink,
  MessageCircle,
  Tag,
  Loader2,
  X,
  Send,
  CheckCircle2,
  Mail,
  Phone,
  MessageSquare,
  Calendar,
  User,
  Plus,
  Minus,
  HelpCircle,
  ChevronDown,
  Store,
  ArrowRight,
  ShoppingCart,
  Badge,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { InlineEdit } from "../../components/dashboard/InlineEdit";
import { supabase } from "@/supabaseClient";
import { trackEvent } from "../../lib/analytics";

// --- TYPES ---
export interface ProductVariant {
  name: string;
  options: string | any[];
}

export interface Product {
  id?: string;
  actor_id: string;
  title: string;
  price: string;
  description: string;
  image?: string;
  images?: string[];
  variants?: ProductVariant[];
  faqs?: { question: string; answer: string }[];
  actionType?: "whatsapp" | "link" | "form_order";
  checkoutUrl?: string;
  whatsappNumber?: string;
  buttonText?: string;
  stock?: string;
  salePrice?: string;
}

// --- HELPERS ---
const getFieldIcon = (type: string) => {
  switch (type) {
    case "email":
      return <Mail size={14} />;
    case "tel":
      return <Phone size={14} />;
    case "textarea":
      return <MessageSquare size={14} />;
    case "date":
      return <Calendar size={14} />;
    default:
      return <User size={14} />;
  }
};

const parseOptions = (optString?: string) => {
  if (!optString) return [];
  return optString
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
};

const calculateTotalPrice = (
  basePrice: string,
  variants: Record<string, any>,
  qty: number
) => {
  const cleanBasePrice = parseFloat(
    (basePrice || "0").toString().replace(/[^0-9.]/g, "")
  );
  
  let hasVariantPrice = false;
  let variantTotal = 0;

  Object.values(variants).forEach((option) => {
    if (option && option.price) {
      const optionPrice = parseFloat(
        option.price.toString().replace(/[^0-9.]/g, "")
      );
      if (!isNaN(optionPrice) && optionPrice > 0) {
        hasVariantPrice = true;
        variantTotal += optionPrice;
      }
    }
  });

  const baseToUse = hasVariantPrice ? variantTotal : (isNaN(cleanBasePrice) ? 0 : cleanBasePrice);
  return (baseToUse * qty).toFixed(2);
};

// 🚀 SUB-COMPONENT: INLINE SPOTLIGHT CHECKOUT (For the 'spotlight' variant)
const SpotlightCheckout = ({
  product,
  actorId,
  portfolioId,
  isPreview,
}: {
  product: any;
  actorId?: string;
  portfolioId?: string;
  isPreview?: boolean;
}) => {
  const [step, setStep] = useState<"details" | "form" | "success">("details");
  const [quantity, setQuantity] = useState(1);
  const [selectedVariants, setSelectedVariants] = useState<Record<string, any>>(
    {}
  );
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [activeImgIndex, setActiveImgIndex] = useState(0);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const [formTemplate, setFormTemplate] = useState<any | null>(null);
  const [isLoadingForm, setIsLoadingForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const images = product.images?.length
    ? product.images
    : product.image
    ? [product.image]
    : [];
  const actionType = product.actionType || "whatsapp";

  const nextImage = () =>
    setActiveImgIndex((prev) => (prev + 1) % images.length);
  const prevImage = () =>
    setActiveImgIndex((prev) => (prev - 1 + images.length) % images.length);

  const handleMainAction = async () => {
    if (isPreview) {
      alert(
        "Checkout is disabled in Preview Mode. Publish your site to test orders."
      );
      return;
    }

    if (actionType === "link") {
      if (actorId)
        trackEvent(actorId, "shop_click", {
          product_name: product.title,
          portfolio_id: portfolioId,
        });
      window.open(product.checkoutUrl || "#", "_blank");
      return;
    }

    // Validate Variants
    if (product.variants && product.variants.length > 0) {
      const missing = product.variants.find(
        (v: any) => !selectedVariants[v.name]
      );
      if (missing) {
        alert(`Please select a ${missing.name}`);
        return;
      }
    }

    if (actionType === "form_order" && (product.formId || product.form_id)) {
      setIsLoadingForm(true);
      setStep("form");
      const { data } = await supabase
        .from("forms")
        .select("*")
        .eq("id", product.formId || product.form_id)
        .single();
      if (data) setFormTemplate(data);
      setIsLoadingForm(false);
      return;
    }

    setStep("form");
  };

  const handleConfirmOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isPreview) return;

    if (actionType === "whatsapp") {
      if (actorId)
        trackEvent(actorId, "whatsapp_click", {
          product_name: product.title,
          portfolio_id: portfolioId,
        });
      const variantText = Object.entries(selectedVariants)
        .map(([key, val]) => `${key}: ${val.label || val}`)
        .join(", ");
      const message = `*NEW ORDER* 🛍️\n------------------\n*Product:* ${
        product.title
      }\n*Price:* ${product.price}\n*Qty:* ${quantity}\n${
        variantText ? `*Options:* ${variantText}` : ""
      }\n\n*CUSTOMER DETAILS* 👤\n*Name:* ${
        formValues["name"] || "Not Provided"
      }\n*Phone:* ${
        formValues["phone"] || "Not Provided"
      }\n------------------\nPlease confirm my order!`;
      const number = product.whatsappNumber
        ? product.whatsappNumber.replace(/[^0-9]/g, "")
        : "";
      window.open(
        `https://wa.me/${number}?text=${encodeURIComponent(message)}`,
        "_blank"
      );
      return;
    }

    if (actionType === "form_order") {
      if (!actorId) return alert("Configuration Error: Missing Merchant ID");
      setIsSubmitting(true);

      const finalPrice = calculateTotalPrice(
        product.price,
        selectedVariants,
        quantity
      );

      const getFieldVal = (keywords: string[]) => {
        const key = Object.keys(formValues).find((k) =>
          keywords.some((keyword) => k.toLowerCase().includes(keyword))
        );
        return key ? formValues[key] : "";
      };

      const dbPayload = {
        actor_id: actorId,
        portfolio_id: portfolioId,
        customer_name:
          getFieldVal(["name", "first", "last"]) || "Anonymous Buyer",
        customer_phone: getFieldVal(["phone", "tel", "mobile"]) || "No Phone",
        customer_address:
          getFieldVal(["address", "shipping", "street", "city", "zip"]) ||
          "No Address",
        product_name: product.title,
        product_price: `$${finalPrice}`,
        quantity: quantity,
        variants: selectedVariants,
        status: "pending",
        notes: Object.entries(formValues)
          .map(([k, v]) => {
            // 🚀 FIX: Find the actual human-readable label instead of saving "field_1777"
            const fieldDef = formTemplate?.fields?.find((f: any) => f.id === k);
            const label = fieldDef ? fieldDef.label : k;
            return `${label}: ${v}`;
          })
          .join("\n"),
      };
      const { error } = await supabase.from("pro_orders").insert(dbPayload);
      setIsSubmitting(false);

      if (error) {
        console.error("Order Error:", error);
        alert("Could not place order. Please try again.");
      } else {
        setStep("success");
      }
    }
  };

  if (step === "success") {
    return (
      <div className="bg-card/30 border border-border rounded-[2.5rem] overflow-hidden min-h-[500px] flex flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in duration-300">
        <div className="w-20 h-20 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mb-6 ring-1 ring-green-500/50">
          <CheckCircle2 size={40} className="animate-in zoom-in duration-500" />
        </div>
        <h3 className="text-3xl font-bold text-foreground mb-2">
          {formTemplate?.success_title || "Order Received!"}
        </h3>
        <p className="text-muted-foreground max-w-md mx-auto mb-6">
          {formTemplate?.success_message ||
            `Thank you. We have received your order for ${product.title}.`}
        </p>

        {/* 🚀 BEAUTIFUL INVOICE SUMMARY */}
        <div className="w-full max-w-sm mx-auto bg-background/40 p-5 rounded-2xl border border-border/50 text-left mb-8 shadow-inner">
          <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground/70 border-b border-border pb-2 mb-3">
            Order Summary
          </h4>
          <div className="flex justify-between items-start gap-4 text-sm font-bold text-foreground">
            <div className="leading-tight">
              {product.title}{" "}
              <span className="text-muted-foreground/70 font-medium ml-1">
                x{quantity}
              </span>
            </div>
            <div className="font-mono text-primary">
              ${calculateTotalPrice(product.price, selectedVariants, quantity)}
            </div>
          </div>

          {Object.keys(selectedVariants).length > 0 && (
            <div className="mt-2 space-y-1">
              {Object.entries(selectedVariants).map(([key, val]: any, i) => (
              <div key={i} className="text-xs font-medium text-muted-foreground">
                <span className="text-muted-foreground/70 mr-1">{key}:</span>{" "}
                  {val.label || val}
                </div>
              ))}
            </div>
          )}

        <div className="pt-3 mt-3 border-t border-border flex justify-between items-center text-base font-black text-foreground">
            <span>Total</span>
            <span className="font-mono text-primary">
              ${calculateTotalPrice(product.price, selectedVariants, quantity)}
            </span>
          </div>
        </div>

        <Button
          onClick={() => setStep("details")}
          className="bg-foreground text-background hover:bg-foreground/90 h-12 px-8 rounded-full font-bold"
        >
          Continue Shopping
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-card/30 border border-border rounded-[2.5rem] overflow-hidden md:grid md:grid-cols-2 min-h-[600px] shadow-2xl">
      {/* LEFT: IMAGE GALLERY */}
      <div className="bg-muted/50 relative flex flex-col h-[400px] md:h-auto group/gallery">
        <div className="flex-grow relative overflow-hidden">
          {images.length > 0 ? (
            <>
              <img
                src={images[activeImgIndex]}
                alt={product.title}
                className="w-full h-full object-cover absolute inset-0 transition-all duration-500"
              />
              {images.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                  className="absolute left-4 top-[40%] group-hover/gallery:top-1/2 -translate-y-1/2 bg-background/40 hover:bg-background/70 text-foreground p-3 rounded-full opacity-0 group-hover/gallery:opacity-100 transition-all duration-300 z-20 backdrop-blur-sm"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-4 top-[40%] group-hover/gallery:top-1/2 -translate-y-1/2 bg-background/40 hover:bg-background/70 text-foreground p-3 rounded-full opacity-0 group-hover/gallery:opacity-100 transition-all duration-300 z-20 backdrop-blur-sm"
                  >
                    <ChevronRight size={20} />
                  </button>
                </>
              )}
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground/50">
              <ShoppingBag size={64} />
            </div>
          )}
        </div>
        {images.length > 1 && (
          <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-2 z-10 px-4">
            {images.map((img: string, idx: number) => (
              <button
                key={idx}
                onClick={() => setActiveImgIndex(idx)}
                className={cn(
                  "w-12 h-12 rounded-lg border-2 overflow-hidden transition-all shadow-sm shrink-0",
                  activeImgIndex === idx
                    ? "border-primary scale-110"
                    : "border-border/50 opacity-60 hover:opacity-100"
                )}
              >
                <img src={img} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* RIGHT: DETAILS OR FORM */}
      <div className="p-8 md:p-12 flex flex-col justify-center h-full relative">
        {step === "details" && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
              {product.salePrice && (
                <Badge className="bg-primary text-black hover:bg-primary mb-3">
                  On Sale
                </Badge>
              )}
          <h3 className="text-3xl md:text-4xl font-bold text-foreground leading-tight tracking-tight">
                {product.title}
              </h3>
              <div className="flex items-end gap-3 mt-3">
                {product.salePrice ? (
                  <>
                    <span className="text-3xl text-primary font-bold font-mono">
                      {product.salePrice}
                    </span>
                <span className="text-lg text-muted-foreground/70 line-through mb-1 font-mono">
                      {product.price}
                    </span>
                  </>
                ) : (
                  <span className="text-3xl text-primary font-bold font-mono">
                    {product.price}
                  </span>
                )}
              </div>
            </div>

        <p className="text-lg text-foreground/80 leading-relaxed">
              {product.description}
            </p>

            {/* VARIANTS */}
            {product.variants && product.variants.length > 0 && (
          <div className="space-y-4 pt-4 border-t border-border">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {product.variants.map((v: any, i: number) => {
                    const optionsArray = Array.isArray(v.options)
                      ? v.options.map((o: any) =>
                          typeof o === "string"
                            ? { label: o.trim(), price: "" }
                            : o
                        )
                      : typeof v.options === "string"
                      ? v.options
                          .split(",")
                          .map((s: string) => ({ label: s.trim(), price: "" }))
                      : [];

                    return (
                      <div key={i} className="space-y-2">
                    <Label className="text-xs text-muted-foreground font-bold uppercase tracking-wider">
                          {v.name}
                        </Label>
                        <Select
                          value={selectedVariants[v.name]?.label || ""}
                          onValueChange={(val) => {
                            const opt = optionsArray.find(
                              (o: any) => o.label === val
                            );
                            setSelectedVariants({
                              ...selectedVariants,
                              [v.name]: opt,
                            });
                          }}
                        >
                      <SelectTrigger className="bg-foreground/5 border-border text-foreground h-12 rounded-xl">
                            <SelectValue placeholder={`Select ${v.name}`} />
                          </SelectTrigger>
                      <SelectContent className="z-[100000] border-border bg-card text-foreground">
                            {optionsArray.map((opt: any, optIdx: number) => (
                              <SelectItem
                                key={optIdx}
                                value={opt.label}
                            className="focus:bg-foreground/10 focus:text-foreground"
                              >
                                {opt.label} {opt.price && `(+$${opt.price})`}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* FAQS */}
            {product.faqs && product.faqs.length > 0 && (
          <div className="space-y-2 pt-4 border-t border-border">
            <h4 className="text-xs font-bold uppercase tracking-widest text-foreground/70 flex items-center gap-2 mb-3">
                  <HelpCircle size={14} /> Details & FAQs
                </h4>
                {product.faqs.map((faq: any, i: number) => (
                  <div
                    key={i}
                className="bg-card/50 rounded-lg border border-border/50 overflow-hidden"
                  >
                    <button
                      type="button"
                  className="w-full px-4 py-3 flex items-center justify-between text-left text-sm font-medium text-foreground/90 hover:bg-foreground/5 transition-colors"
                      onClick={() =>
                        setExpandedFaq(expandedFaq === i ? null : i)
                      }
                    >
                      <span className="flex items-center gap-2">
                        {faq.question}
                      </span>
                      <ChevronDown
                        size={14}
                        className={cn(
                          "transition-transform duration-300",
                          expandedFaq === i && "rotate-180"
                        )}
                      />
                    </button>
                    {expandedFaq === i && (
                  <div className="px-4 pb-3 pt-1 text-xs text-muted-foreground leading-relaxed animate-in slide-in-from-top-1 fade-in">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* ACTIONS */}
        <div className="pt-6 flex flex-col sm:flex-row gap-4 border-t border-border">
              {actionType !== "link" && (
            <div className="flex items-center bg-foreground/5 rounded-xl p-1 border border-border w-max shrink-0">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() =>
                      setQuantity((q: number) => Math.max(1, q - 1))
                    }
                className="h-10 w-10 text-foreground hover:bg-foreground/10"
                  >
                    <Minus size={16} />
                  </Button>
              <span className="w-12 text-center font-mono text-lg text-foreground font-bold">
                    {quantity}
                  </span>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setQuantity((q: number) => q + 1)}
                className="h-10 w-10 text-foreground hover:bg-foreground/10"
                  >
                    <Plus size={16} />
                  </Button>
                </div>
              )}
              <Button
                size="lg"
            className="flex-grow h-12 text-base rounded-xl bg-foreground text-background hover:bg-foreground/90 font-bold"
                onClick={handleMainAction}
              >
                {product.buttonText ||
                  (actionType === "link" ? "Buy Now" : "Order Now")}
                {actionType === "link" ? (
                  <ExternalLink className="ml-2 w-4 h-4" />
                ) : (
                  <ArrowRight className="ml-2 w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        )}

        {/* INLINE CHECKOUT FORM */}
        {step === "form" && (
          <div className="space-y-6 h-full flex flex-col animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex items-center gap-2 -ml-2 mb-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStep("details")}
            className="text-muted-foreground hover:text-foreground"
              >
                <ChevronLeft className="w-4 h-4 mr-1" /> Back
              </Button>
            </div>

            {isLoadingForm ? (
              <div className="flex-grow flex flex-col items-center justify-center text-primary">
                <Loader2 className="w-8 h-8 animate-spin mb-4" />
                <p>Loading form...</p>
              </div>
            ) : (
              <div className="flex-grow flex flex-col">
                <div className="mb-6">
              <h3 className="text-2xl font-bold text-foreground mb-2">
                    {formTemplate?.title || "Complete Order"}
                  </h3>
              <p className="text-sm text-muted-foreground">
                    {formTemplate?.subheadline ||
                      "Enter your details to finalize the purchase."}
                  </p>
                </div>

                <form
                  onSubmit={handleConfirmOrder}
                  className="space-y-6 flex-grow flex flex-col"
                >
                  {formTemplate?.fields ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {formTemplate.fields
                        .filter((f: any) => f.enabled !== false) // 🚀 FIX: Hides disabled fields!
                        .map((field: any, idx: number) => {
                          const isHalf = field.width === "half";
                          const fieldOptions = parseOptions(field.options);
                          return (
                            <div
                              key={idx}
                              className={cn(
                                "space-y-2",
                                isHalf
                                  ? "col-span-1"
                                  : "col-span-1 sm:col-span-2"
                              )}
                            >
                            <Label className="text-muted-foreground flex items-center gap-2 text-xs uppercase tracking-widest font-bold ml-1">
                                {getFieldIcon(field.type)} {field.label}{" "}
                                {field.required && (
                                  <span className="text-primary">*</span>
                                )}
                              </Label>
                              {field.type === "textarea" ? (
                                <Textarea
                                  required={field.required}
                                  placeholder={field.placeholder}
                                className="bg-background/50 border-border text-foreground min-h-[100px] resize-none rounded-xl p-4"
                                  value={formValues[field.id] || ""}
                                  onChange={(e) =>
                                    setFormValues({
                                      ...formValues,
                                      [field.id]: e.target.value,
                                    })
                                  }
                                />
                              ) : field.type === "select" ? (
                                <select
                                  required={field.required}
                                className="w-full bg-background/50 border-border text-foreground h-12 rounded-xl px-4 text-sm appearance-none outline-none"
                                  value={formValues[field.id] || ""}
                                  onChange={(e) =>
                                    setFormValues({
                                      ...formValues,
                                      [field.id]: e.target.value,
                                    })
                                  }
                                >
                                  <option
                                    value=""
                                    disabled
                                  className="text-background"
                                  >
                                    Select...
                                  </option>
                                  {fieldOptions.map(
                                    (opt: string, i: number) => (
                                      <option
                                        key={i}
                                        value={opt}
                                      className="text-background"
                                      >
                                        {opt}
                                      </option>
                                    )
                                  )}
                                </select>
                              ) : field.type === "radio" ? (
                                <div className="flex flex-col gap-2 pt-1">
                                  {fieldOptions.map(
                                    (opt: string, i: number) => (
                                      <label
                                        key={i}
                                          className="flex items-center gap-3 cursor-pointer group p-3 rounded-xl border border-border/50 bg-foreground/[0.02] hover:bg-foreground/5 transition-colors has-[:checked]:bg-primary/5 has-[:checked]:border-primary/30"
                                      >
                                          <div className="relative flex items-center justify-center w-5 h-5 rounded-full border border-border/50 group-hover:border-primary bg-foreground/5">
                                          <input
                                            type="radio"
                                            name={field.id}
                                            value={opt}
                                            required={field.required}
                                            className="peer sr-only"
                                            onChange={(e) =>
                                              setFormValues({
                                                ...formValues,
                                                [field.id]: e.target.value,
                                              })
                                            }
                                          />
                                          <div className="w-2.5 h-2.5 rounded-full bg-primary opacity-0 peer-checked:opacity-100 transition-all scale-50 peer-checked:scale-100" />
                                        </div>
                                          <span className="text-foreground/80 text-sm font-medium">
                                          {opt}
                                        </span>
                                      </label>
                                    )
                                  )}
                                </div>
                              ) : (
                                <Input
                                  required={field.required}
                                  type={
                                    field.type === "email"
                                      ? "email"
                                      : field.type === "tel"
                                      ? "tel"
                                      : "text"
                                  }
                                  placeholder={field.placeholder}
                                  className={cn(
                                    "bg-background/50 border-border text-foreground h-12 rounded-xl",
                                    field.type === "date" &&
                                      "[color-scheme:dark]"
                                  )}
                                  value={formValues[field.id] || ""}
                                  onChange={(e) =>
                                    setFormValues({
                                      ...formValues,
                                      [field.id]: e.target.value,
                                    })
                                  }
                                />
                              )}
                            </div>
                          );
                        })}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-neutral-400">Full Name</Label>
                        <Input
                          required
                          value={formValues["name"] || ""}
                          onChange={(e) =>
                            setFormValues({
                              ...formValues,
                              name: e.target.value,
                            })
                          }
                          className="bg-white/5 border-white/10 h-12 rounded-xl"
                          placeholder="Your Name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-neutral-400">Phone</Label>
                        <Input
                          required
                          value={formValues["phone"] || ""}
                          onChange={(e) =>
                            setFormValues({
                              ...formValues,
                              phone: e.target.value,
                            })
                          }
                          className="bg-white/5 border-white/10 h-12 rounded-xl"
                          placeholder="Phone Number"
                        />
                      </div>
                    </div>
                  )}

                      <div className="mt-auto pt-6 border-t border-border">
                    <div className="flex items-end justify-between mb-6 bg-primary/10 p-4 rounded-xl border border-primary/20">
                      <div className="space-y-1">
                        <p className="text-xs text-primary font-bold uppercase tracking-widest">
                          Total Due
                        </p>
                      </div>
                          <div className="text-3xl font-black text-foreground font-mono tracking-tighter">
                        $
                        {calculateTotalPrice(
                          product.price,
                          selectedVariants,
                          quantity
                        )}
                      </div>
                    </div>
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full h-14 text-base font-bold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-transform hover:scale-[1.02]"
                    >
                      {isSubmitting ? (
                        <Loader2 className="animate-spin mr-2 w-5 h-5" />
                      ) : actionType === "whatsapp" ? (
                        <MessageCircle className="mr-2 w-5 h-5" />
                      ) : (
                        <Send className="mr-2 w-5 h-5" />
                      )}
                      {formTemplate?.button_text ||
                        (actionType === "whatsapp"
                          ? "Confirm via WhatsApp"
                          : "Confirm Order")}
                    </Button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// --- MAIN SHOP COMPONENT ---
const Shop: React.FC<any> = ({ data, settings = {}, id, isPreview, actorId, portfolioId }) => {
  const products = data.products || [];
  const variant = settings.variant || data.variant || "grid";
  const carouselRef = useRef<HTMLDivElement>(null);

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [expandedModalFaq, setExpandedModalFaq] = useState<number | null>(null);

  // MODAL RAW STATE (For Grid/Carousel)
  const [formTemplate, setFormTemplate] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoadingForm, setIsLoadingForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [selectedVariants, setSelectedVariants] = useState<Record<string, any>>(
    {}
  );
  const [quantity, setQuantity] = useState(1);

  const scrollCarousel = (direction: "left" | "right") => {
    if (carouselRef.current) {
      const amount = carouselRef.current.clientWidth * 0.8;
      carouselRef.current.scrollBy({
        left: direction === "left" ? -amount : amount,
        behavior: "smooth",
      });
    }
  };

  const handleProductAction = async (product: any, e: React.MouseEvent) => {
    if (isPreview) {
      e.preventDefault();
      alert("Checkout is disabled in Preview Mode.");
      return;
    }

    if (product.actionType === "link") {
      if (actorId)
        trackEvent(actorId, "shop_click", {
          product_name: product.title,
          portfolio_id: portfolioId,
        });
      return; // Link handles native href
    }

    e.preventDefault();
    setSelectedProduct(product);
    setIsModalOpen(true);
    setIsLoadingForm(true);
    setIsSuccess(false);
    setFormValues({});
    setSelectedVariants({});
    setQuantity(1);
    setExpandedModalFaq(null);

    if (product.actionType === "form_order" && product.formId) {
      const { data: formData } = await supabase
        .from("forms")
        .select("*")
        .eq("id", product.formId)
        .single();
      if (formData) setFormTemplate(formData);
    } else {
      setFormTemplate(null);
    }
    setIsLoadingForm(false);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actorId || !selectedProduct) return;

    // Variant Validation
    if (selectedProduct.variants && selectedProduct.variants.length > 0) {
      const missing = selectedProduct.variants.find(
        (v: any) => !selectedVariants[v.name]
      );
      if (missing) return alert(`Please select a ${missing.name}`);
    }

    const actionType = selectedProduct.actionType || "whatsapp";

    if (actionType === "whatsapp") {
      if (actorId)
        trackEvent(actorId, "whatsapp_click", {
          product_name: selectedProduct.title,
          portfolio_id: portfolioId,
        });
      const variantText = Object.entries(selectedVariants)
        .map(([key, val]) => `${key}: ${val.label || val}`)
        .join(", ");
      const message = `*NEW ORDER* 🛍️\n------------------\n*Product:* ${
        selectedProduct.title
      }\n*Price:* ${selectedProduct.price}\n*Qty:* ${quantity}\n${
        variantText ? `*Options:* ${variantText}` : ""
      }\n\n*CUSTOMER DETAILS* 👤\n*Name:* ${
        formValues["name"] || "Not Provided"
      }\n*Phone:* ${
        formValues["phone"] || "Not Provided"
      }\n------------------\nPlease confirm my order!`;
      const number = selectedProduct.whatsappNumber
        ? selectedProduct.whatsappNumber.replace(/[^0-9]/g, "")
        : "";
      window.open(
        `https://wa.me/${number}?text=${encodeURIComponent(message)}`,
        "_blank"
      );
      return;
    }

    if (actionType === "form_order") {
      setIsSubmitting(true);
      const finalPrice = calculateTotalPrice(
        selectedProduct.price,
        selectedVariants,
        quantity
      );

      const getFieldVal = (keywords: string[]) => {
        const key = Object.keys(formValues).find((k) =>
          keywords.some((keyword) => k.toLowerCase().includes(keyword))
        );
        return key ? formValues[key] : "";
      };

      const dbPayload = {
        actor_id: actorId,
        portfolio_id: portfolioId,
        customer_name:
          getFieldVal(["name", "first", "last"]) || "Anonymous Buyer",
        customer_phone: getFieldVal(["phone", "tel", "mobile"]) || "No Phone",
        customer_address:
          getFieldVal(["address", "shipping", "street", "city", "zip"]) ||
          "No Address Provided",
        product_name: selectedProduct.title,
        product_price: `$${finalPrice}`,
        quantity: quantity,
        variants: selectedVariants,
        status: "pending",
        notes: Object.entries(formValues)
          .map(([k, v]) => {
            // 🚀 FIX: Find the actual human-readable label instead of saving "field_1777"
            const fieldDef = formTemplate?.fields?.find((f: any) => f.id === k);
            const label = fieldDef ? fieldDef.label : k;
            return `${label}: ${v}`;
          })
          .join("\n"),
      };
      const { error } = await supabase.from("pro_orders").insert(dbPayload);
      setIsSubmitting(false);

      if (error) {
        console.error("Order Error:", error);
        alert("Failed to submit order. Please try again.");
      } else {
        setIsSuccess(true);
      }
    }
  };

  const hasProducts = products.length > 0;
  if (!hasProducts && !isPreview) return null;

  // --- SUB-COMPONENT: PRODUCT CARD (Grid/Carousel) ---
  const ProductCard = ({ product }: { product: any }) => {
    const isExternal = product.actionType === "link";
    const isWhatsApp = product.actionType === "whatsapp";
    const linkTarget = isExternal ? "_blank" : "_self";
    let href = "#";
    if (isExternal) href = product.checkoutUrl || "#";
    if (isWhatsApp)
      href = `https://wa.me/${
        product.whatsappNumber?.replace(/[^0-9]/g, "") || ""
      }`;

    const [activeImageIdx, setActiveImageIdx] = useState(0);
    const images = product.images || (product.image ? [product.image] : []);

    return (
      <div
        className="group h-full flex flex-col bg-card/40 border border-border rounded-[2rem] overflow-hidden hover:border-primary/30 transition-all duration-500 hover:bg-card/60 shadow-xl cursor-pointer"
        onClick={(e) => handleProductAction(product, e)}
      >
        <div className="relative aspect-square sm:aspect-[4/3] overflow-hidden bg-muted group/gallery">
          {images.length > 0 ? (
            <>
              <img
                src={images[activeImageIdx]}
                alt={product.title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover/gallery:scale-105"
              />
              {images.length > 1 && (
                <>
                  <div className="absolute inset-x-0 bottom-4 flex justify-center gap-1.5 opacity-0 group-hover/gallery:opacity-100 transition-opacity z-10">
                    {images.map((_: any, i: number) => (
                      <button
                        key={i}
                        className={cn(
                          "w-2 h-2 rounded-full transition-all",
                          i === activeImageIdx
                            ? "bg-foreground scale-125"
                            : "bg-foreground/50 hover:bg-foreground/80"
                        )}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setActiveImageIdx(i);
                        }}
                      />
                    ))}
                  </div>
                  {/* Hover Nav Arrows - Now drops down smoothly into center! */}
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setActiveImageIdx(
                        (prev) => (prev - 1 + images.length) % images.length
                      );
                    }}
                    className="absolute left-4 top-[40%] group-hover/gallery:top-1/2 -translate-y-1/2 bg-background/40 hover:bg-background/70 text-foreground p-2 rounded-full opacity-0 group-hover/gallery:opacity-100 transition-all duration-300 z-20 backdrop-blur-sm"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setActiveImageIdx((prev) => (prev + 1) % images.length);
                    }}
                    className="absolute right-4 top-[40%] group-hover/gallery:top-1/2 -translate-y-1/2 bg-background/40 hover:bg-background/70 text-foreground p-2 rounded-full opacity-0 group-hover/gallery:opacity-100 transition-all duration-300 z-20 backdrop-blur-sm"
                  >
                    <ChevronRight size={18} />
                  </button>
                </>
              )}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground/30">
              <ShoppingCart size={40} />
            </div>
          )}
          {product.salePrice && (
            <div className="absolute top-4 right-4 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest shadow-lg">
              Sale
            </div>
          )}
        </div>
        <div className="p-6 md:p-8 flex flex-col flex-grow">
          <div className="mb-4">
            <h3 className="text-xl md:text-2xl font-bold text-foreground tracking-tight mb-2">
              {product.title || "Product Name"}
            </h3>
            <div className="flex items-end gap-3 flex-wrap">
              {product.salePrice ? (
                <>
                  <span className="text-2xl font-mono text-primary font-bold">
                    {product.salePrice}
                  </span>
                  <span className="text-sm font-mono text-muted-foreground/70 line-through pb-1">
                    {product.price}
                  </span>
                </>
              ) : (
                <span className="text-2xl font-mono text-foreground font-bold">
                  {product.price || "$0.00"}
                </span>
              )}
            </div>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed mb-6 line-clamp-3">
            {product.description}
          </p>

          {/* Details Snippets */}
          {product.variants && product.variants.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {product.variants.map((v: any, i: number) => {
                const optionsArray = Array.isArray(v.options)
                  ? v.options
                  : typeof v.options === "string"
                  ? v.options
                      .split(",")
                      .map((s: string) => ({ label: s.trim() }))
                  : [];
                return (
                  <span
                    key={i}
                    className="text-xs bg-foreground/5 border border-border/50 px-2 py-1 rounded text-muted-foreground"
                  >
                    {v.name}: {optionsArray.length} options
                  </span>
                );
              })}
            </div>
          )}

          <div className="mt-auto pt-4 border-t border-border/50 flex items-center justify-between">
            <span className="text-sm font-bold text-foreground">View Details</span>
            <div className="w-8 h-8 rounded-full bg-foreground/10 text-foreground flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
              <ArrowRight
                size={14}
                className="group-hover:translate-x-0.5 transition-transform"
              />
            </div>
          </div>
        </div>
      </div>
    );
  };

  const showImageCover = formTemplate?.image && !isLoadingForm && !isSuccess;

  return (
    <>
      {/* 🚀 THE AAA+ GRID/CAROUSEL ORDER MODAL */}
      {isModalOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-4">
            <div
              className="absolute inset-0 bg-black/80 backdrop-blur-sm cursor-pointer animate-in fade-in duration-300"
              onClick={() => setIsModalOpen(false)}
            />
            <div
              className={cn(
                "relative w-full bg-neutral-950 border-t sm:border border-white/10 rounded-t-[2rem] sm:rounded-[2.5rem] p-0 shadow-2xl animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-500 max-h-[92vh] sm:max-h-[90vh] flex flex-col overflow-hidden",
                showImageCover ? "sm:max-w-6xl sm:flex-row" : "sm:max-w-2xl"
              )}
            >
              <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-white/20 rounded-full sm:hidden pointer-events-none z-50" />
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "absolute top-4 right-4 sm:top-6 sm:right-6 rounded-full z-50 transition-colors",
                  showImageCover
                    ? "text-foreground bg-background/20 hover:bg-background/50 backdrop-blur-sm"
                    : "text-muted-foreground hover:text-foreground bg-foreground/5 hover:bg-foreground/10"
                )}
                onClick={() => setIsModalOpen(false)}
              >
                <X className="w-5 h-5" />
              </Button>

              {showImageCover && (
                <div className="hidden sm:flex sm:w-2/5 relative border-r border-border bg-muted shrink-0">
                  <img
                    src={formTemplate.image}
                    alt="Cover"
                    className="absolute inset-0 w-full h-full object-cover opacity-80"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
                </div>
              )}

              <div
                className={cn(
                  "flex-grow overflow-y-auto flex flex-col p-6 sm:p-10",
                  // Custom Scrollbar styles!
                  "[&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent",
                  "[&::-webkit-scrollbar-thumb]:bg-foreground/10 hover:[&::-webkit-scrollbar-thumb]:bg-foreground/20 [&::-webkit-scrollbar-thumb]:rounded-full",
                  showImageCover ? "sm:w-3/5" : "w-full"
                )}
              >
                {isLoadingForm ? (
                  <div className="py-20 flex flex-col items-center justify-center text-primary h-full">
                    <Loader2 className="w-8 h-8 animate-spin mb-4" />
                    <p className="text-sm text-muted-foreground font-medium">
                      Loading checkout...
                    </p>
                  </div>
                ) : !formTemplate &&
                  selectedProduct?.actionType === "form_order" ? (
                  <div className="py-20 text-center h-full flex items-center justify-center">
                    <p className="text-muted-foreground">
                      Checkout template could not be loaded.
                    </p>
                  </div>
                ) : isSuccess ? (
                  <div className="py-16 text-center space-y-4 animate-in zoom-in-95 h-full flex flex-col items-center justify-center">
                    <div className="w-20 h-20 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mx-auto ring-1 ring-green-500/50">
                      <CheckCircle2 size={40} className="animate-in zoom-in" />
                    </div>
                    <h3 className="text-3xl font-bold text-foreground tracking-tight">
                      {formTemplate?.success_title || "Order Received!"}
                    </h3>
                    <p className="text-muted-foreground max-w-sm mx-auto mb-2">
                      {formTemplate?.success_message ||
                        `Thanks for ordering ${selectedProduct?.title}. We'll process it shortly.`}
                    </p>

                    {/* 🚀 BEAUTIFUL INVOICE SUMMARY */}
                    <div className="w-full max-w-sm mx-auto bg-foreground/5 p-5 rounded-2xl border border-border/50 text-left mb-4 shadow-inner">
                      <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground border-b border-border pb-2 mb-3">
                        Order Summary
                      </h4>
                      <div className="flex justify-between items-start gap-4 text-sm font-bold text-foreground">
                        <div className="leading-tight">
                          {selectedProduct?.title}{" "}
                          <span className="text-muted-foreground/70 font-medium ml-1">
                            x{quantity}
                          </span>
                        </div>
                        <div className="font-mono text-primary">
                          $
                          {calculateTotalPrice(
                            selectedProduct?.price || "0",
                            selectedVariants,
                            quantity
                          )}
                        </div>
                      </div>

                      {Object.keys(selectedVariants).length > 0 && (
                        <div className="mt-2 space-y-1">
                          {Object.entries(selectedVariants).map(
                            ([key, val]: any, i) => (
                              <div
                                key={i}
                                className="text-xs font-medium text-muted-foreground"
                              >
                                <span className="text-muted-foreground/70 mr-1">
                                  {key}:
                                </span>{" "}
                                {val.label || val}
                              </div>
                            )
                          )}
                        </div>
                      )}

                      <div className="pt-3 mt-3 border-t border-border flex justify-between items-center text-base font-black text-foreground">
                        <span>Total</span>
                        <span className="font-mono text-primary">
                          $
                          {calculateTotalPrice(
                            selectedProduct?.price || "0",
                            selectedVariants,
                            quantity
                          )}
                        </span>
                      </div>
                    </div>

                    <Button
                      className="mt-6 rounded-full px-8 bg-foreground text-background hover:bg-foreground/90 h-12 font-bold"
                      onClick={() => setIsModalOpen(false)}
                    >
                      Close
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-8 mt-4 sm:mt-0">
                    <div className="text-left space-y-3 pb-6 border-b border-border">
                      <h3 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight pr-8">
                        {formTemplate?.title || "Complete Your Order"}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {formTemplate?.subheadline ||
                          "Please fill in your details to finalize the purchase."}
                      </p>
                      <div className="mt-4 p-4 rounded-xl bg-card/50 border border-border flex gap-4 items-center">
                        <div className="w-16 h-16 rounded-md overflow-hidden bg-muted shrink-0 border border-border/50">
                          <img
                            src={
                              selectedProduct?.images?.[0] ||
                              selectedProduct?.image
                            }
                            alt={selectedProduct?.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-grow min-w-0">
                          <h4 className="font-bold text-foreground truncate text-sm">
                            {selectedProduct?.title}
                          </h4>
                          <div className="text-primary font-mono text-sm mt-1">
                            {selectedProduct?.price}
                          </div>
                        </div>
                      </div>
                    </div>

                    <form onSubmit={handleFormSubmit} className="space-y-8">
                      {/* VARIANTS */}
                      {selectedProduct?.variants &&
                        selectedProduct.variants.length > 0 && (
                          <div className="space-y-4">
                            <h4 className="text-xs font-bold uppercase tracking-widest text-foreground/70 flex items-center gap-2">
                              <Tag size={14} /> Customization
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              {selectedProduct.variants.map(
                                (v: any, i: number) => {
                                  const optionsArray = Array.isArray(v.options)
                                    ? v.options.map((o: any) =>
                                        typeof o === "string"
                                          ? { label: o.trim(), price: "" }
                                          : o
                                      )
                                    : typeof v.options === "string"
                                    ? v.options.split(",").map((s: string) => ({
                                        label: s.trim(),
                                        price: "",
                                      }))
                                    : [];
                                  return (
                                    <div key={i} className="space-y-2">
                                      <Label className="text-xs text-muted-foreground">
                                        {v.name}
                                      </Label>
                                      <Select
                                        required
                                        value={
                                          selectedVariants[v.name]?.label || ""
                                        }
                                        onValueChange={(val) => {
                                          const opt = optionsArray.find(
                                            (o: any) => o.label === val
                                          );
                                          setSelectedVariants({
                                            ...selectedVariants,
                                            [v.name]: opt,
                                          });
                                        }}
                                      >
                                        <SelectTrigger className="bg-foreground/5 border-border text-foreground h-12 rounded-xl">
                                          <SelectValue
                                            placeholder={`Select ${v.name}`}
                                          />
                                        </SelectTrigger>
                                        <SelectContent className="z-[100000] border-border bg-card text-foreground">
                                          {optionsArray.map(
                                            (opt: any, optIdx: number) => (
                                              <SelectItem
                                                key={optIdx}
                                                value={opt.label}
                                                className="focus:bg-foreground/10 focus:text-foreground"
                                              >
                                                {opt.label}{" "}
                                                {opt.price &&
                                                  `(+$${opt.price})`}
                                              </SelectItem>
                                            )
                                          )}
                                        </SelectContent>
                                      </Select>
                                    </div>
                                  );
                                }
                              )}
                            </div>
                          </div>
                        )}

                      {/* FAQs */}
                      {selectedProduct?.faqs &&
                        selectedProduct.faqs.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="text-xs font-bold uppercase tracking-widest text-foreground/70 flex items-center gap-2 mb-3">
                              <HelpCircle size={14} /> Details & FAQs
                            </h4>
                            {selectedProduct.faqs.map((faq: any, i: number) => (
                              <div
                                key={i}
                                className="bg-card/50 rounded-lg border border-border/50 overflow-hidden"
                              >
                                <button
                                  type="button"
                                  className="w-full px-4 py-3 flex items-center justify-between text-left text-sm font-medium text-foreground/90 hover:bg-foreground/5 transition-colors"
                                  onClick={() =>
                                    setExpandedModalFaq(
                                      expandedModalFaq === i ? null : i
                                    )
                                  }
                                >
                                  <span className="flex items-center gap-2">
                                    {faq.question}
                                  </span>
                                  <ChevronDown
                                    size={14}
                                    className={cn(
                                      "transition-transform duration-300",
                                      expandedModalFaq === i && "rotate-180"
                                    )}
                                  />
                                </button>
                                {expandedModalFaq === i && (
                                  <div className="px-4 pb-3 pt-1 text-xs text-muted-foreground leading-relaxed animate-in slide-in-from-top-1 fade-in">
                                    {faq.answer}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                      {/* DYNAMIC FORM FIELDS */}
                      <div className="space-y-4">
                        <h4 className="text-xs font-bold uppercase tracking-widest text-foreground/70 flex items-center gap-2">
                          <User size={14} /> Your Details
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-6 gap-4 sm:gap-5">
                          {formTemplate?.fields ? (
                            formTemplate.fields
                              .filter((f: any) => f.enabled !== false) // 🚀 FIX: Hides disabled fields!
                              .map((field: any, idx: number) => {
                                const widthClass = field.width === "third" ? "sm:col-span-2" : field.width === "half" ? "sm:col-span-3" : "sm:col-span-6";
                                const fieldOptions = parseOptions(
                                  field.options
                                );
                                return (
                                  <div
                                    key={idx}
                                    className={cn(
                                      "space-y-2",
                                      "col-span-1", widthClass
                                    )}
                                  >
                                    <Label className="text-muted-foreground flex items-center gap-2 text-xs uppercase tracking-widest font-bold ml-1">
                                      {getFieldIcon(field.type)} {field.label}{" "}
                                      {field.required && (
                                        <span className="text-primary">*</span>
                                      )}
                                    </Label>
                                    {field.type === "textarea" ? (
                                      <Textarea
                                        required={field.required}
                                        placeholder={field.placeholder}
                                        className="bg-background/50 border-border text-foreground min-h-[100px] resize-none rounded-xl p-4"
                                        value={formValues[field.id] || ""}
                                        onChange={(e) =>
                                          setFormValues({
                                            ...formValues,
                                            [field.id]: e.target.value,
                                          })
                                        }
                                      />
                                    ) : field.type === "select" ? (
                                      <select
                                        required={field.required}
                                        className="w-full bg-background/50 border-border text-foreground h-12 rounded-xl px-4 text-sm appearance-none outline-none"
                                        value={formValues[field.id] || ""}
                                        onChange={(e) =>
                                          setFormValues({
                                            ...formValues,
                                            [field.id]: e.target.value,
                                          })
                                        }
                                      >
                                        <option
                                          value=""
                                          disabled
                                          className="text-neutral-900"
                                        >
                                          Select...
                                        </option>
                                        {fieldOptions.map(
                                          (opt: string, i: number) => (
                                            <option
                                              key={i}
                                              value={opt}
                                              className="text-neutral-900"
                                            >
                                              {opt}
                                            </option>
                                          )
                                        )}
                                      </select>
                                    ) : field.type === "radio" ? (
                                      <div className="flex flex-col gap-2 pt-1">
                                        {fieldOptions.map(
                                          (opt: string, i: number) => (
                                            <label
                                              key={i}
                                              className="flex items-center gap-3 cursor-pointer group p-3 rounded-xl border border-border/50 bg-foreground/[0.02] hover:bg-foreground/5 transition-colors has-[:checked]:bg-primary/5 has-[:checked]:border-primary/30"
                                            >
                                              <div className="relative flex items-center justify-center w-5 h-5 rounded-full border border-border/50 group-hover:border-primary bg-foreground/5">
                                                <input
                                                  type="radio"
                                                  name={field.id}
                                                  value={opt}
                                                  required={field.required}
                                                  className="peer sr-only"
                                                  onChange={(e) =>
                                                    setFormValues({
                                                      ...formValues,
                                                      [field.id]:
                                                        e.target.value,
                                                    })
                                                  }
                                                />
                                                <div className="w-2.5 h-2.5 rounded-full bg-primary opacity-0 peer-checked:opacity-100 transition-all scale-50 peer-checked:scale-100" />
                                              </div>
                                              <span className="text-foreground/80 text-sm font-medium">
                                                {opt}
                                              </span>
                                            </label>
                                          )
                                        )}
                                      </div>
                                    ) : (
                                      <Input
                                        required={field.required}
                                        type={
                                          field.type === "email"
                                            ? "email"
                                            : field.type === "tel"
                                            ? "tel"
                                            : "text"
                                        }
                                        placeholder={field.placeholder}
                                        className={cn(
                                          "bg-background/50 border-border text-foreground h-12 rounded-xl focus:border-primary/50",
                                          field.type === "date" &&
                                            "[color-scheme:dark]"
                                        )}
                                        value={formValues[field.id] || ""}
                                        onChange={(e) =>
                                          setFormValues({
                                            ...formValues,
                                            [field.id]: e.target.value,
                                          })
                                        }
                                      />
                                    )}
                                  </div>
                                );
                              })
                          ) : (
                            <div className="space-y-4 col-span-2">
                              <div className="space-y-2">
                                <Label className="text-muted-foreground">
                                  Full Name
                                </Label>
                                <Input
                                  required
                                  value={formValues["name"] || ""}
                                  onChange={(e) =>
                                    setFormValues({
                                      ...formValues,
                                      name: e.target.value,
                                    })
                                  }
                                  className="bg-background/50 border-border h-12 rounded-xl"
                                  placeholder="Your Name"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label className="text-muted-foreground">
                                  Phone
                                </Label>
                                <Input
                                  required
                                  value={formValues["phone"] || ""}
                                  onChange={(e) =>
                                    setFormValues({
                                      ...formValues,
                                      phone: e.target.value,
                                    })
                                  }
                                  className="bg-background/50 border-border h-12 rounded-xl"
                                  placeholder="Phone Number"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="pt-6 border-t border-white/10 space-y-6">
                        <div className="flex items-center justify-between">
                          <Label className="text-neutral-400">Quantity</Label>
                          <div className="flex items-center gap-3 bg-white/5 rounded-full border border-white/10 p-1">
                            <button
                              type="button"
                              className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 disabled:opacity-50"
                              disabled={quantity <= 1}
                              onClick={() => setQuantity((q: number) => q - 1)}
                            >
                              <Minus size={14} />
                            </button>
                            <span className="font-mono font-bold w-4 text-center">
                              {quantity}
                            </span>
                            <button
                              type="button"
                              className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20"
                              onClick={() => setQuantity((q: number) => q + 1)}
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                        </div>
                        <div className="flex items-end justify-between bg-primary/10 p-4 rounded-2xl border border-primary/20">
                          <div className="space-y-1">
                            <p className="text-xs text-primary font-bold uppercase tracking-widest">
                              Total Due
                            </p>
                          </div>
                          <div className="text-3xl font-black text-white font-mono tracking-tighter">
                            $
                            {calculateTotalPrice(
                              selectedProduct?.price || "0",
                              selectedVariants,
                              quantity
                            )}
                          </div>
                        </div>
                        <Button
                          type="submit"
                          disabled={isSubmitting}
                          className="w-full h-14 text-base font-bold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-transform hover:scale-[1.02]"
                        >
                          {isSubmitting ? (
                            <Loader2 className="animate-spin mr-2 w-5 h-5" />
                          ) : selectedProduct?.actionType === "whatsapp" ? (
                            <MessageCircle className="mr-2 w-5 h-5" />
                          ) : (
                            <Send className="mr-2 w-5 h-5" />
                          )}
                          {formTemplate?.button_text ||
                            (selectedProduct?.actionType === "whatsapp"
                              ? "Confirm via WhatsApp"
                              : "Confirm Order")}
                        </Button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* 🚀 THE ACTUAL SHOP SECTION */}
      <section
        className="relative py-24 md:py-32 bg-background overflow-hidden text-foreground"
        id="shop"
      >
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>
        <div className="container max-w-7xl mx-auto relative z-10 px-6">
          {variant !== "spotlight" && (
            <div className="text-center max-w-3xl mx-auto mb-16 md:mb-24 space-y-6">
              <InlineEdit
                tagName="h2"
                className="text-4xl md:text-5xl lg:text-6xl font-black text-foreground tracking-tighter block"
                text={data.title || "Shop"}
                sectionId={id}
                fieldKey="title"
                isPreview={isPreview}
              />
              <div className="h-1 w-24 bg-gradient-to-r from-primary to-transparent mx-auto rounded-full" />
              <InlineEdit
                tagName="p"
                className="text-lg md:text-xl text-muted-foreground font-medium block"
                text={data.subheadline || "Browse our latest collection."}
                sectionId={id}
                fieldKey="subheadline"
                isPreview={isPreview}
              />
            </div>
          )}

          {!hasProducts && isPreview && (
            <div className="w-full py-24 border-2 border-dashed border-border rounded-3xl flex flex-col items-center justify-center text-muted-foreground/50 bg-card/30">
              <Store className="w-12 h-12 mb-4 opacity-50" />
              <p className="font-medium tracking-wide">
                No products added yet.
              </p>
              <p className="text-sm mt-2 opacity-70">
                Hover over this section and click "Design" to add items.
              </p>
            </div>
          )}

          {hasProducts && (
            <>
              {variant === "grid" && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {products.map((prod: any, i: number) => (
                    <ProductCard key={i} product={prod} />
                  ))}
                </div>
              )}

              {/* 🚀 ELITE SPOTLIGHT CHECKOUT */}
              {variant === "spotlight" && products[0] && (
                <div className="max-w-6xl mx-auto">
                  <div className="mb-12 text-center md:text-left">
                    <InlineEdit
                      tagName="h2"
                      className="text-3xl md:text-4xl lg:text-5xl font-black text-foreground block tracking-tight"
                      text={data.title || "Featured Product"}
                      sectionId={id}
                      fieldKey="title"
                      isPreview={isPreview}
                    />
                  </div>
                  <SpotlightCheckout
                    product={products[0]}
                    actorId={actorId}
                    portfolioId={portfolioId}
                    isPreview={isPreview}
                  />
                </div>
              )}

              {variant === "carousel" && (
                <div className="relative group/carousel -mx-6 px-6 md:mx-0 md:px-0">
                  <button
                  className="absolute left-4 top-[40%] group-hover/carousel:top-1/2 -translate-y-1/2 z-20 flex items-center justify-center bg-background/50 hover:bg-background/80 text-foreground rounded-full h-14 w-14 opacity-0 group-hover/carousel:opacity-100 transition-all duration-300 border border-border hidden md:flex backdrop-blur-md shadow-2xl hover:scale-105"
                    onClick={() => scrollCarousel("left")}
                  >
                    <ChevronLeft className="w-8 h-8" />
                  </button>
                  <button
                  className="absolute right-4 top-[40%] group-hover/carousel:top-1/2 -translate-y-1/2 z-20 flex items-center justify-center bg-background/50 hover:bg-background/80 text-foreground rounded-full h-14 w-14 opacity-0 group-hover/carousel:opacity-100 transition-all duration-300 border border-border hidden md:flex backdrop-blur-md shadow-2xl hover:scale-105"
                    onClick={() => scrollCarousel("right")}
                  >
                    <ChevronRight className="w-8 h-8" />
                  </button>

                  <div
                    ref={carouselRef}
                    className="flex overflow-x-auto pb-12 gap-6 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']"
                  >
                    {products.map((prod: any, i: number) => (
                      <div
                        key={i}
                        className="snap-center shrink-0 w-[85vw] sm:w-[400px]"
                      >
                        <ProductCard product={prod} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </>
  );
};

export default Shop;
