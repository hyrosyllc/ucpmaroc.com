import React from "react";
import { createPortal } from "react-dom";
import type { BlockProps } from "../types";
import { Button } from "@/components/ui/button";
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
  ShoppingCart,
  ChevronRight,
  ExternalLink,
  Loader2,
  X,
  CheckCircle2,
  Mail,
  Phone,
  MessageSquare,
  Calendar,
  User,
  ChevronDown,
  Minus,
  Plus,
  ChevronLeft,
  Store,
  ArrowRight,
  MessageCircle,
  Tag,
  HelpCircle,
  Send,
  Badge,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { UCP } from "@ucp/sdk"; // 🚀 SDK Magic

// ==========================================
// 1. TYPES & PROP EXTENSION
// ==========================================
export interface ShopProps extends BlockProps {
  portfolioId?: string;
  actorId?: string;
}

// ==========================================
// 2. THEME CUSTOM SCHEMA
// ==========================================
export const schema = [
  {
    id: "variant",
    label: "Layout Style",
    type: "select",
    options: ["grid", "carousel", "spotlight"],
    defaultValue: "grid",
  },
];

export const defaultProps = {
  title: "Store",
  subheadline: "Shop the latest products and services.",
  variant: "grid",
};

// --- HELPERS ---
const getFieldIcon = (type: string) => {
  switch (type) {
    case "email":
      return <Mail size={14} className="text-slate-400" />;
    case "tel":
      return <Phone size={14} className="text-slate-400" />;
    case "textarea":
      return <MessageSquare size={14} className="text-slate-400" />;
    case "date":
      return <Calendar size={14} className="text-slate-400" />;
    default:
      return <User size={14} className="text-slate-400" />;
  }
};

// ==========================================
// 3. SUB-COMPONENT: INLINE SPOTLIGHT CHECKOUT
// ==========================================
const SpotlightCheckout = ({
  product,
  actorId,
  portfolioId,
  isPreview,
}: any) => {
  // 🚀 Spotlight gets its OWN isolated SDK instance!
  const checkout = UCP.useShopOrderForm({
    actorId,
    portfolioId,
    isPreview,
    initialProduct: product,
  });

  const { step, setStep } = checkout;
  const { isOpen: isFaqOpen, toggle: toggleFaq } = UCP.useAccordion();

  const images = product.images?.length
    ? product.images
    : product.image
    ? [product.image]
    : [];
  const actionType = product.actionType || "whatsapp";

  const { current: activeImageIdx, next: nextImage, prev: prevImage, goTo: setActiveImageIdx } = UCP.useSlider(images.length);

  if (step === "success") {
    return (
      <div className="bg-white border border-gray-200/60 rounded-[2.5rem] overflow-hidden min-h-[500px] flex flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in duration-500 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-6 ring-4 ring-blue-50/50">
          <CheckCircle2 size={40} className="animate-in zoom-in duration-500" />
        </div>
        <h3 className="text-3xl font-bold text-slate-900 mb-2 tracking-tight">
          {checkout.formTemplate?.success_title || "Order Received!"}
        </h3>
        <p className="text-slate-500 max-w-md mx-auto mb-6 leading-relaxed">
          {checkout.formTemplate?.success_message ||
            `Thank you. We have received your order for ${product.title}.`}
        </p>

        {/* 🚀 BEAUTIFUL INVOICE SUMMARY */}
        <div className="w-full max-w-sm mx-auto bg-gray-50/50 p-5 rounded-2xl border border-gray-100 text-left mb-8 shadow-inner">
          <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 border-b border-gray-200 pb-2 mb-3">
            Order Summary
          </h4>
          <div className="flex justify-between items-start gap-4 text-sm font-bold text-slate-900">
            <div className="leading-tight">
              {product.title}{" "}
              <span className="text-slate-400 font-medium ml-1">
                x{checkout.quantity}
              </span>
            </div>
            <div className="font-mono text-blue-600">
              $
              {checkout.calculateTotalPrice(
                product.price,
                checkout.selectedVariants,
                checkout.quantity
              )}
            </div>
          </div>

          {Object.keys(checkout.selectedVariants).length > 0 && (
            <div className="mt-2 space-y-1">
              {Object.entries(checkout.selectedVariants).map(
                ([key, val]: any, i) => (
                  <div key={i} className="text-xs font-medium text-slate-500">
                    <span className="text-slate-400 mr-1">{key}:</span>{" "}
                    {val.label || val}
                  </div>
                )
              )}
            </div>
          )}

          <div className="pt-3 mt-3 border-t border-gray-200 flex justify-between items-center text-base font-black text-slate-900">
            <span>Total</span>
            <span className="font-mono text-blue-600">
              $
              {checkout.calculateTotalPrice(
                product.price,
                checkout.selectedVariants,
                checkout.quantity
              )}
            </span>
          </div>
        </div>

        <Button
          onClick={() => setStep("details")}
          className="bg-slate-900 text-white hover:bg-slate-800 h-12 px-8 rounded-full font-semibold shadow-md transition-all hover:scale-105"
        >
          Continue Shopping
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200/60 rounded-[2.5rem] overflow-hidden md:grid md:grid-cols-2 min-h-[600px] shadow-[0_8px_30px_rgb(0,0,0,0.06)]">
      {/* LEFT: IMAGE GALLERY (Light Apple Look) */}
      <div className="bg-gray-50 relative flex flex-col h-[400px] md:h-auto group/gallery">
        <div className="flex-grow relative overflow-hidden">
          {images.length > 0 ? (
            <>
              <img
                src={images[activeImageIdx]}
                alt={product.title}
                className="w-full h-full object-cover absolute inset-0 transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]"
              />
              {images.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-4 top-[40%] group-hover/gallery:top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-slate-900 p-3 rounded-full opacity-0 group-hover/gallery:opacity-100 transition-all duration-300 z-20 backdrop-blur-md shadow-lg"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-4 top-[40%] group-hover/gallery:top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-slate-900 p-3 rounded-full opacity-0 group-hover/gallery:opacity-100 transition-all duration-300 z-20 backdrop-blur-md shadow-lg"
                  >
                    <ChevronRight size={20} />
                  </button>
                </>
              )}
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-slate-300">
              <ShoppingCart size={64} />
            </div>
          )}
        </div>
        {images.length > 1 && (
          <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-2 z-10 px-4">
            {images.map((img: string, idx: number) => (
              <button
                key={idx}
                onClick={() => setActiveImageIdx(idx)}
                className={cn(
                  "w-12 h-12 rounded-xl border-2 overflow-hidden transition-all shadow-md shrink-0 bg-white",
                  activeImageIdx === idx
                    ? "border-blue-600 scale-110"
                    : "border-transparent opacity-70 hover:opacity-100"
                )}
              >
                <img src={img} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* RIGHT: DETAILS OR FORM */}
      <div className="p-8 md:p-12 flex flex-col justify-center h-full relative bg-white">
        {step === "details" && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500 ease-out">
            <div>
              {product.salePrice && (
                <Badge className="bg-blue-50 text-blue-600 hover:bg-blue-100 mb-3 px-3 py-1 text-xs uppercase tracking-widest font-bold shadow-none border-none">
                  On Sale
                </Badge>
              )}
              <h3 className="text-3xl md:text-4xl font-extrabold text-slate-900 leading-tight tracking-tight">
                {product.title}
              </h3>
              <div className="flex items-baseline gap-3 mt-2">
                {product.salePrice ? (
                  <>
                    <span className="text-3xl text-blue-600 font-bold tracking-tight">
                      {product.salePrice}
                    </span>
                    <span className="text-lg text-slate-400 line-through font-medium">
                      {product.price}
                    </span>
                  </>
                ) : (
                  <span className="text-3xl text-slate-900 font-bold tracking-tight">
                    {product.price}
                  </span>
                )}
              </div>
            </div>

            <p className="text-base text-slate-500 leading-relaxed font-medium">
              {product.description}
            </p>

            {/* VARIANTS */}
            {product.variants && product.variants.length > 0 && (
              <div className="space-y-4 pt-4 border-t border-slate-100">
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
                      <div key={i} className="space-y-1.5">
                        <Label className="text-xs text-slate-500 font-bold uppercase tracking-wider ml-1">
                          {v.name}
                        </Label>
                        <Select
                          required
                          value={checkout.selectedVariants[v.name]?.label || ""}
                          onValueChange={(val) => {
                            const opt = optionsArray.find(
                              (o: any) => o.label === val
                            );
                            checkout.setSelectedVariants({
                              ...checkout.selectedVariants,
                              [v.name]: opt,
                            });
                          }}
                        >
                          <SelectTrigger className="w-full bg-gray-50 border border-gray-200 text-slate-900 h-12 rounded-xl focus:ring-blue-600 focus:ring-offset-0 shadow-sm transition-all hover:bg-gray-100">
                            <SelectValue placeholder={`Select ${v.name}...`} />
                          </SelectTrigger>

                          {/* 🚀 BULLETPROOF TEXT COLOR FIX FOR PORTALS */}
                          <SelectContent className="z-[100000] border-gray-200 bg-white !text-slate-900 rounded-xl shadow-xl [&_*]:!text-slate-900">
                            {optionsArray.map((opt: any, optIdx: number) => (
                              <SelectItem
                                key={optIdx}
                                value={opt.label}
                                className="!text-slate-900 font-medium focus:!bg-blue-50 focus:!text-blue-700 cursor-pointer rounded-lg m-1 transition-colors"
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
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2 mb-3">
                  <HelpCircle size={14} className="text-slate-400" /> Product
                  Details
                </h4>
                <div className="bg-gray-50 rounded-2xl overflow-hidden border border-gray-100 divide-y divide-gray-200/60">
                  {product.faqs.map((faq: any, i: number) => (
                    <div key={i}>
                      <button
                        type="button"
                        className="w-full px-5 py-4 flex items-center justify-between text-left text-sm font-semibold text-slate-700 hover:bg-gray-100 transition-colors"
                        onClick={() => toggleFaq(i)}
                      >
                        <span>{faq.question}</span>
                        <ChevronDown
                          size={16}
                          className={cn(
                            "transition-transform duration-300 text-slate-400",
                            isFaqOpen(i) && "rotate-180"
                          )}
                        />
                      </button>
                      {isFaqOpen(i) && (
                        <div className="px-5 pb-4 text-sm text-slate-500 leading-relaxed animate-in slide-in-from-top-1 fade-in font-medium">
                          {faq.answer}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ACTIONS */}
            <div className="pt-6 flex flex-col sm:flex-row gap-3 border-t border-slate-100">
              {actionType !== "link" && (
                <div className="flex items-center bg-gray-50 rounded-full p-1 border border-gray-200 w-max shrink-0 shadow-sm">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() =>
                      checkout.setQuantity((q: number) => Math.max(1, q - 1))
                    }
                    className="h-10 w-10 text-slate-600 hover:text-slate-900 hover:bg-white rounded-full"
                  >
                    <Minus size={16} />
                  </Button>
                  <span className="w-12 text-center font-semibold text-lg text-slate-900">
                    {checkout.quantity}
                  </span>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => checkout.setQuantity((q: number) => q + 1)}
                    className="h-10 w-10 text-slate-600 hover:text-slate-900 hover:bg-white rounded-full"
                  >
                    <Plus size={16} />
                  </Button>
                </div>
              )}
              <Button
                size="lg"
                className="flex-grow h-12 text-base rounded-full bg-blue-600 text-white hover:bg-blue-700 font-bold shadow-[0_4px_14px_rgba(37,99,235,0.3)] transition-all hover:scale-[1.02]"
                onClick={() => checkout.proceedToCheckout(product)}
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
        {checkout.step === "form" && (
          <div className="space-y-6 h-full flex flex-col animate-in fade-in slide-in-from-right-4 duration-500 ease-out">
            <div className="flex items-center gap-2 -ml-2 mb-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => checkout.setStep("details")}
                className="text-slate-500 hover:text-slate-900 hover:bg-gray-100 rounded-full font-medium"
              >
                <ChevronLeft className="w-4 h-4 mr-1" /> Back
              </Button>
            </div>

            {checkout.isLoadingForm ? (
              <div className="flex-grow flex flex-col items-center justify-center text-blue-600">
                <Loader2 className="w-8 h-8 animate-spin mb-4" />
                <p className="font-medium">Loading form...</p>
              </div>
            ) : (
              <div className="flex-grow flex flex-col">
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-slate-900 mb-1">
                    {checkout.formTemplate?.title || "Complete Order"}
                  </h3>
                  <p className="text-sm text-slate-500 font-medium">
                    {checkout.formTemplate?.subheadline ||
                      "Enter your details to finalize the purchase."}
                  </p>
                </div>

                <form
                  onSubmit={checkout.handleFormSubmit}
                  className="space-y-6 flex-grow flex flex-col"
                >
                  {checkout.formTemplate?.fields ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {checkout.formTemplate.fields
                        .filter((f: any) => f.enabled !== false) // 🚀 FIX: Hides disabled fields!
                        .map((field: any, idx: number) => {
                          const isHalf = field.width === "half";
                          const fieldOptions = checkout.parseOptions(
                            field.options
                          );
                          return (
                            <div
                              key={idx}
                              className={cn(
                                "space-y-1.5",
                                isHalf
                                  ? "col-span-1"
                                  : "col-span-1 sm:col-span-2"
                              )}
                            >
                              <Label className="text-slate-500 flex items-center gap-2 text-xs uppercase tracking-widest font-bold ml-1">
                                {getFieldIcon(field.type)} {field.label}{" "}
                                {field.required && (
                                  <span className="text-red-500">*</span>
                                )}
                              </Label>
                              {field.type === "textarea" ? (
                                <Textarea
                                  required={field.required}
                                  placeholder={field.placeholder}
                                  className="bg-gray-50 border border-gray-200 text-slate-900 min-h-[100px] resize-none rounded-xl p-4 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all shadow-sm"
                                  value={checkout.formValues[field.id] || ""}
                                  onChange={(e) =>
                                    checkout.setFormValues({
                                      ...checkout.formValues,
                                      [field.id]: e.target.value,
                                    })
                                  }
                                />
                              ) : field.type === "select" ? (
                                <select
                                  required={field.required}
                                  className="w-full bg-gray-50 border border-gray-200 text-slate-900 h-12 rounded-xl px-4 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-blue-600 transition-all shadow-sm"
                                  value={checkout.formValues[field.id] || ""}
                                  onChange={(e) =>
                                    checkout.setFormValues({
                                      ...checkout.formValues,
                                      [field.id]: e.target.value,
                                    })
                                  }
                                >
                                  <option value="" disabled>
                                    Select...
                                  </option>
                                  {fieldOptions.map(
                                    (opt: string, i: number) => (
                                      <option key={i} value={opt}>
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
                                        className="flex items-center gap-3 cursor-pointer group p-3 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors has-[:checked]:bg-blue-50 has-[:checked]:border-blue-200 has-[:checked]:ring-1 has-[:checked]:ring-blue-600"
                                      >
                                        <div className="relative flex items-center justify-center w-5 h-5 rounded-full border border-gray-300 group-hover:border-blue-600 bg-white">
                                          <input
                                            type="radio"
                                            name={field.id}
                                            value={opt}
                                            required={field.required}
                                            className="peer sr-only"
                                            onChange={(e) =>
                                              checkout.setFormValues({
                                                ...checkout.formValues,
                                                [field.id]: e.target.value,
                                              })
                                            }
                                          />
                                          <div className="w-2.5 h-2.5 rounded-full bg-blue-600 opacity-0 peer-checked:opacity-100 transition-all scale-50 peer-checked:scale-100" />
                                        </div>
                                        <span className="text-slate-900 text-sm font-semibold">
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
                                  className="bg-gray-50 border border-gray-200 text-slate-900 h-12 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 focus:border-transparent px-4 transition-all shadow-sm"
                                  value={checkout.formValues[field.id] || ""}
                                  onChange={(e) =>
                                    checkout.setFormValues({
                                      ...checkout.formValues,
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
                      <div className="space-y-1.5">
                        <Label className="text-slate-500 text-xs font-bold uppercase tracking-widest ml-1">
                          Full Name
                        </Label>
                        <Input
                          required
                          value={checkout.formValues["name"] || ""}
                          onChange={(e) =>
                            checkout.setFormValues({
                              ...checkout.formValues,
                              name: e.target.value,
                            })
                          }
                          className="bg-gray-50 border border-gray-200 text-slate-900 h-12 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 transition-all shadow-sm px-4"
                          placeholder="Your Name"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-slate-500 text-xs font-bold uppercase tracking-widest ml-1">
                          Phone
                        </Label>
                        <Input
                          required
                          value={checkout.formValues["phone"] || ""}
                          onChange={(e) =>
                            checkout.setFormValues({
                              ...checkout.formValues,
                              phone: e.target.value,
                            })
                          }
                          className="bg-gray-50 border border-gray-200 text-slate-900 h-12 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 transition-all shadow-sm px-4"
                          placeholder="Phone Number"
                        />
                      </div>
                    </div>
                  )}

                  <div className="mt-auto pt-6 border-t border-gray-100 space-y-5">
                    <div className="flex items-end justify-between bg-blue-50/50 p-5 rounded-2xl border border-blue-100">
                      <div className="space-y-1">
                        <p className="text-xs text-blue-600 font-bold uppercase tracking-widest">
                          Total Due
                        </p>
                      </div>
                      <div className="text-3xl font-black text-blue-900 tracking-tight">
                        $
                        {checkout.calculateTotalPrice(
                          product.price,
                          checkout.selectedVariants,
                          checkout.quantity
                        )}
                      </div>
                    </div>
                    <Button
                      type="submit"
                      disabled={checkout.isSubmitting}
                      className="w-full h-14 text-lg font-bold rounded-full bg-blue-600 text-white hover:bg-blue-700 shadow-[0_4px_14px_rgba(37,99,235,0.3)] transition-transform hover:scale-[1.02]"
                    >
                      {checkout.isSubmitting ? (
                        <Loader2 className="animate-spin mr-2 w-5 h-5" />
                      ) : actionType === "whatsapp" ? (
                        <MessageCircle className="mr-2 w-5 h-5" />
                      ) : (
                        <Send className="mr-2 w-5 h-5" />
                      )}
                      {checkout.formTemplate?.button_text ||
                        (actionType === "whatsapp"
                          ? "Confirm via WhatsApp"
                          : "Complete Order")}
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

// ==========================================
// 4. MAIN SHOP COMPONENT (Grid / Carousel / Modal)
// ==========================================
export default function Shop({
  data,
  id,
  isPreview,
  actorId,
  portfolioId,
}: ShopProps) {
  const products = data.products || [];
  const variant = data.variant || "grid";
  const hasProducts = products.length > 0;

  // 🚀 Initialize Global SDKs (For Grid/Carousel Modal)
  const { carouselRef, scrollCarousel } = UCP.useCarousel();
  const globalCheckout = UCP.useShopOrderForm({
    actorId,
    portfolioId,
    isPreview,
  });

  if (!hasProducts && !isPreview) return null;

  // --- iOS Style Product Card ---
  const CupertinoProductCard = ({ product }: { product: any }) => {
    const isExternal = product.actionType === "link";
    const linkTarget = isExternal ? "_blank" : "_self";
    let href = "#";
    if (isExternal) href = product.checkoutUrl || "#";

    const images = product.images || (product.image ? [product.image] : []);
    const slider = UCP.useSlider(images.length);
    const activeImageIdx = slider.current;
    const setActiveImageIdx = slider.goTo;

    return (
      <div
        className="group h-full flex flex-col bg-white rounded-[2rem] overflow-hidden transition-all duration-300 hover:scale-[1.01] shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-200/50 cursor-pointer"
        onClick={() => globalCheckout.openProductModal(product)}
      >
        <div className="relative aspect-[4/3] overflow-hidden bg-gray-50 group/gallery border-b border-gray-100">
          {images.length > 0 ? (
            <>
              <img
                src={images[activeImageIdx]}
                alt={product.title}
                className="w-full h-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover/gallery:scale-105"
              />
              {images.length > 1 && (
                <>
                  <div className="absolute inset-x-0 bottom-4 flex justify-center gap-1.5 opacity-0 group-hover/gallery:opacity-100 transition-opacity z-10">
                    {images.map((_: any, i: number) => (
                      <button
                        key={i}
                        className={cn(
                          "w-2 h-2 rounded-full transition-all shadow-sm",
                          i === activeImageIdx
                            ? "bg-white scale-125"
                            : "bg-white/60 hover:bg-white"
                        )}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setActiveImageIdx(i);
                        }}
                      />
                    ))}
                  </div>
                  {/* Apple Style Hover Nav Arrows */}
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      slider.prev();
                    }}
                    className="absolute left-4 top-[40%] group-hover/gallery:top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-slate-900 p-2.5 rounded-full opacity-0 group-hover/gallery:opacity-100 transition-all duration-300 z-20 backdrop-blur-md shadow-md"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      slider.next();
                    }}
                    className="absolute right-4 top-[40%] group-hover/gallery:top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-slate-900 p-2.5 rounded-full opacity-0 group-hover/gallery:opacity-100 transition-all duration-300 z-20 backdrop-blur-md shadow-md"
                  >
                    <ChevronRight size={18} />
                  </button>
                </>
              )}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-300">
              <ShoppingCart size={40} />
            </div>
          )}
          {product.salePrice && (
            <div className="absolute top-4 left-4 bg-blue-500 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest shadow-sm">
              Sale
            </div>
          )}
        </div>

        <div className="p-6 flex flex-col flex-grow">
          <div className="mb-4">
            <h3 className="text-xl font-bold text-slate-900 tracking-tight mb-1 line-clamp-1">
              {product.title || "Product Name"}
            </h3>
            <div className="flex items-baseline gap-2">
              {product.salePrice ? (
                <>
                  <span className="text-xl text-blue-600 font-bold tracking-tight">
                    {product.salePrice}
                  </span>
                  <span className="text-sm text-slate-400 line-through font-medium">
                    {product.price}
                  </span>
                </>
              ) : (
                <span className="text-xl text-slate-900 font-bold tracking-tight">
                  {product.price || "$0.00"}
                </span>
              )}
            </div>
          </div>

          <p className="text-sm text-slate-500 leading-relaxed mb-6 line-clamp-2 font-medium">
            {product.description}
          </p>

          {product.variants && product.variants.length > 0 && (
            <p className="text-xs text-slate-400 mb-6 font-semibold uppercase tracking-wider">
              {product.variants.length} Customization
              {product.variants.length > 1 ? "s" : ""} Available
            </p>
          )}

          <div className="mt-auto pt-4 border-t border-gray-100">
            <button className="w-full h-12 rounded-full text-sm font-bold transition-all bg-gray-50 text-blue-600 hover:bg-blue-50 flex items-center justify-center gap-2 pointer-events-none">
              {product.buttonText || "View Details"}
              {isExternal ? (
                <ExternalLink size={16} />
              ) : (
                <ChevronRight size={16} />
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const showImageCover =
    globalCheckout.formTemplate?.image &&
    !globalCheckout.isLoadingForm &&
    !globalCheckout.isSuccess;

  return (
    <>
      {/* 🚀 APPLE-STYLE MODAL (Bottom Sheet style on Mobile, Floating Dialog on Desktop) */}
      {globalCheckout.isModalOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-6">
            <div
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm cursor-pointer animate-in fade-in duration-300"
              onClick={() => globalCheckout.setIsModalOpen(false)}
            />

            <div
              className={cn(
                "relative w-full bg-white rounded-t-[2rem] sm:rounded-[2.5rem] p-0 shadow-2xl animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] max-h-[92vh] sm:max-h-[85vh] flex flex-col overflow-hidden border border-gray-200/50",
                showImageCover ? "sm:max-w-4xl sm:flex-row" : "sm:max-w-xl"
              )}
            >
              {/* iOS Top Bar */}
              <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-white/80 backdrop-blur-xl absolute top-0 left-0 right-0 z-50">
                <button
                  className="text-blue-600 font-semibold px-2 hover:opacity-80 transition-opacity"
                  onClick={() => globalCheckout.setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <span className="font-bold text-slate-900 text-sm truncate max-w-[200px] text-center">
                  {globalCheckout.selectedProduct?.title}
                </span>
                <div className="w-12" /> {/* Spacer for centering */}
              </div>

              {showImageCover && (
                <div className="hidden sm:flex sm:w-1/2 relative bg-gray-100 shrink-0 mt-[60px] border-r border-gray-100">
                  <img
                    src={globalCheckout.formTemplate.image}
                    alt="Cover"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                </div>
              )}

              <div
                className={cn(
                  "flex-grow overflow-y-auto flex flex-col p-6 pt-24",
                  // Styled Scrollbars (Light)
                  "[&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent",
                  "[&::-webkit-scrollbar-thumb]:bg-gray-200 hover:[&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full",
                  showImageCover ? "sm:w-1/2" : "w-full"
                )}
              >
                {globalCheckout.isLoadingForm ? (
                  <div className="py-20 flex flex-col items-center justify-center text-blue-600 h-full">
                    <Loader2 className="w-8 h-8 animate-spin mb-4" />
                    <p className="text-sm text-slate-500 font-medium">
                      Loading...
                    </p>
                  </div>
                ) : !globalCheckout.formTemplate &&
                  globalCheckout.selectedProduct?.actionType === "form_order" &&
                  globalCheckout.step === "form" ? (
                  <div className="py-20 text-center h-full flex items-center justify-center">
                    <p className="text-slate-500">
                      Checkout template could not be loaded.
                    </p>
                  </div>
                ) : globalCheckout.isSuccess ? (
                  <div className="py-16 text-center space-y-4 animate-in zoom-in-95 h-full flex flex-col items-center justify-center">
                    <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto ring-4 ring-blue-50/50">
                      <CheckCircle2
                        size={40}
                        className="animate-in zoom-in duration-500"
                      />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 tracking-tight">
                      {globalCheckout.formTemplate?.success_title ||
                        "Order Received"}
                    </h3>
                    <p className="text-slate-500 max-w-sm mx-auto text-base font-medium mb-4">
                      {globalCheckout.formTemplate?.success_message ||
                        `Thank you for ordering ${globalCheckout.selectedProduct?.title}. We'll process it shortly.`}
                    </p>

                    {/* 🚀 BEAUTIFUL INVOICE SUMMARY */}
                    <div className="w-full max-w-sm mx-auto bg-gray-50/50 p-5 rounded-2xl border border-gray-100 text-left mb-6 shadow-inner">
                      <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 border-b border-gray-200 pb-2 mb-3">
                        Order Summary
                      </h4>
                      <div className="flex justify-between items-start gap-4 text-sm font-bold text-slate-900">
                        <div className="leading-tight">
                          {globalCheckout.selectedProduct?.title}{" "}
                          <span className="text-slate-400 font-medium ml-1">
                            x{globalCheckout.quantity}
                          </span>
                        </div>
                        <div className="font-mono text-blue-600">
                          $
                          {globalCheckout.calculateTotalPrice(
                            globalCheckout.selectedProduct?.price || "0",
                            globalCheckout.selectedVariants,
                            globalCheckout.quantity
                          )}
                        </div>
                      </div>

                      {Object.keys(globalCheckout.selectedVariants).length >
                        0 && (
                        <div className="mt-2 space-y-1">
                          {Object.entries(globalCheckout.selectedVariants).map(
                            ([key, val]: any, i) => (
                              <div
                                key={i}
                                className="text-xs font-medium text-slate-500"
                              >
                                <span className="text-slate-400 mr-1">
                                  {key}:
                                </span>{" "}
                                {val.label || val}
                              </div>
                            )
                          )}
                        </div>
                      )}

                      <div className="pt-3 mt-3 border-t border-gray-200 flex justify-between items-center text-base font-black text-slate-900">
                        <span>Total</span>
                        <span className="font-mono text-blue-600">
                          $
                          {globalCheckout.calculateTotalPrice(
                            globalCheckout.selectedProduct?.price || "0",
                            globalCheckout.selectedVariants,
                            globalCheckout.quantity
                          )}
                        </span>
                      </div>
                    </div>

                    <Button
                      className="mt-4 rounded-full px-8 bg-blue-600 text-white hover:bg-blue-700 font-bold h-12 shadow-md hover:scale-105 transition-all"
                      onClick={() => globalCheckout.setIsModalOpen(false)}
                    >
                      Done
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-8 mt-4 sm:mt-0">
                    {/* DETAILS STEP */}
                    {globalCheckout.step === "details" && (
                      <div className="animate-in fade-in slide-in-from-left-4 duration-500 ease-out space-y-6">
                        <div className="text-left space-y-2 pb-6 border-b border-gray-100">
                          <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
                            {globalCheckout.selectedProduct?.title}
                          </h3>
                          <div className="flex items-baseline gap-2 mt-2">
                            {globalCheckout.selectedProduct?.salePrice ? (
                              <>
                                <span className="text-2xl text-blue-600 font-bold tracking-tight">
                                  {globalCheckout.selectedProduct.salePrice}
                                </span>
                                <span className="text-sm text-slate-400 line-through font-medium">
                                  {globalCheckout.selectedProduct.price}
                                </span>
                              </>
                            ) : (
                              <span className="text-2xl text-slate-900 font-bold tracking-tight">
                                {globalCheckout.selectedProduct?.price ||
                                  "$0.00"}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Variants */}
                        {globalCheckout.selectedProduct?.variants &&
                          globalCheckout.selectedProduct.variants.length >
                            0 && (
                            <div className="space-y-4">
                              <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500">
                                Customization
                              </h4>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {globalCheckout.selectedProduct.variants.map(
                                  (v: any, i: number) => {
                                    const optionsArray =
                                      globalCheckout.parseOptions(v.options);
                                    return (
                                      <div key={i} className="space-y-1.5">
                                        <Label className="text-xs text-slate-500 font-bold uppercase tracking-wider ml-1">
                                          {v.name}
                                        </Label>
                                        <Select
                                          required
                                          value={
                                            globalCheckout.selectedVariants[
                                              v.name
                                            ]?.label || ""
                                          }
                                          onValueChange={(val) => {
                                            const opt = optionsArray.find(
                                              (o: any) => o.label === val
                                            );
                                            globalCheckout.setSelectedVariants({
                                              ...globalCheckout.selectedVariants,
                                              [v.name]: opt,
                                            });
                                          }}
                                        >
                                          <SelectTrigger className="w-full bg-gray-50 border-gray-200 text-slate-900 h-12 rounded-xl focus:ring-blue-600 focus:ring-offset-0 shadow-sm transition-all hover:bg-gray-100">
                                            <SelectValue
                                              placeholder={`Select ${v.name}...`}
                                            />
                                          </SelectTrigger>
                                          <SelectContent className="z-[100000] border-gray-200 bg-white text-slate-900 rounded-xl shadow-xl">
                                            {optionsArray.map(
                                              (opt: any, optIdx: number) => (
                                                <SelectItem
                                                  key={optIdx}
                                                  value={opt.label}
                                                  // 🚀 FIX: Added text-slate-700 and font-medium so it is perfectly visible!
                                                  className="text-slate-700 font-medium focus:bg-blue-50 focus:text-blue-700 cursor-pointer rounded-lg m-1 transition-colors"
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
                        {globalCheckout.selectedProduct?.faqs &&
                          globalCheckout.selectedProduct.faqs.length > 0 && (
                            <div className="space-y-3">
                              <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2 mb-3">
                                <HelpCircle
                                  size={14}
                                  className="text-slate-400"
                                />{" "}
                                Product Details
                              </h4>
                              <div className="bg-gray-50 rounded-2xl overflow-hidden border border-gray-100 divide-y divide-gray-200/60">
                                {globalCheckout.selectedProduct.faqs.map(
                                  (faq: any, i: number) => (
                                    <div key={i}>
                                      <button
                                        type="button"
                                        className="w-full px-5 py-4 flex items-center justify-between text-left text-sm font-semibold text-slate-700 hover:bg-gray-100 transition-colors"
                                        onClick={() =>
                                          globalCheckout.setExpandedModalFaq(
                                            globalCheckout.expandedModalFaq ===
                                              i
                                              ? null
                                              : i
                                          )
                                        }
                                      >
                                        <span>{faq.question}</span>
                                        <ChevronDown
                                          size={16}
                                          className={cn(
                                            "transition-transform duration-300 text-slate-400",
                                            globalCheckout.expandedModalFaq ===
                                              i && "rotate-180"
                                          )}
                                        />
                                      </button>
                                      {globalCheckout.expandedModalFaq ===
                                        i && (
                                        <div className="px-5 pb-4 text-sm text-slate-500 leading-relaxed animate-in slide-in-from-top-1 fade-in font-medium">
                                          {faq.answer}
                                        </div>
                                      )}
                                    </div>
                                  )
                                )}
                              </div>
                            </div>
                          )}

                        <div className="pt-6 border-t border-gray-100 space-y-6">
                          <div className="flex items-center justify-between">
                            <Label className="text-slate-900 font-bold text-sm">
                              Quantity
                            </Label>
                            <div className="flex items-center gap-4 bg-gray-50 border border-gray-200 rounded-full p-1 shadow-sm">
                              <button
                                type="button"
                                className="w-10 h-10 rounded-full flex items-center justify-center text-slate-600 hover:bg-white hover:text-slate-900 transition-colors disabled:opacity-30"
                                disabled={globalCheckout.quantity <= 1}
                                onClick={() =>
                                  globalCheckout.setQuantity(
                                    (q: number) => q - 1
                                  )
                                }
                              >
                                <Minus size={16} />
                              </button>
                              <span className="font-bold w-4 text-center text-slate-900">
                                {globalCheckout.quantity}
                              </span>
                              <button
                                type="button"
                                className="w-10 h-10 rounded-full flex items-center justify-center text-slate-600 hover:bg-white hover:text-slate-900 transition-colors"
                                onClick={() =>
                                  globalCheckout.setQuantity(
                                    (q: number) => q + 1
                                  )
                                }
                              >
                                <Plus size={16} />
                              </button>
                            </div>
                          </div>

                          <Button
                            onClick={() =>
                              globalCheckout.proceedToCheckout(
                                globalCheckout.selectedProduct
                              )
                            }
                            className="w-full h-14 text-lg font-bold rounded-full bg-blue-600 text-white hover:bg-blue-700 shadow-[0_4px_14px_rgba(37,99,235,0.3)] transition-all hover:scale-[1.02]"
                          >
                            {globalCheckout.selectedProduct?.buttonText ||
                              "Checkout"}
                            <ArrowRight className="ml-2 w-5 h-5" />
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* FORM STEP */}
                    {globalCheckout.step === "form" && (
                      <div className="animate-in fade-in slide-in-from-right-4 duration-500 ease-out flex-grow flex flex-col">
                        <div className="flex items-center gap-2 -ml-2 mb-4 border-b border-gray-100 pb-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => globalCheckout.setStep("details")}
                            className="text-slate-500 hover:text-slate-900 hover:bg-gray-100 rounded-full font-semibold"
                          >
                            <ChevronLeft className="w-4 h-4 mr-1" /> Back to
                            details
                          </Button>
                        </div>

                        <form
                          onSubmit={globalCheckout.handleFormSubmit}
                          className="space-y-6 flex-grow flex flex-col"
                        >
                          <div className="space-y-4">
                            <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500">
                              Your Details
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                              {globalCheckout.formTemplate?.fields ? (
                                globalCheckout.formTemplate.fields
                                  .filter((f: any) => f.enabled !== false) // 🚀 FIX: Hides disabled fields!
                                  .map((field: any, idx: number) => {
                                    const isHalf = field.width === "half";
                                    const fieldOptions =
                                      globalCheckout.parseOptions(
                                        field.options
                                      );
                                    return (
                                      <div
                                        key={idx}
                                        className={cn(
                                          "space-y-1.5",
                                          isHalf
                                            ? "col-span-1"
                                            : "col-span-1 sm:col-span-2"
                                        )}
                                      >
                                        <Label className="text-slate-500 flex items-center gap-2 text-xs font-bold ml-1">
                                          {field.label}{" "}
                                          {field.required && (
                                            <span className="text-red-500">
                                              *
                                            </span>
                                          )}
                                        </Label>
                                        {field.type === "textarea" ? (
                                          <Textarea
                                            required={field.required}
                                            placeholder={field.placeholder}
                                            className="bg-gray-50 border border-gray-200 text-slate-900 min-h-[100px] resize-none rounded-xl p-4 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all shadow-sm"
                                            value={
                                              globalCheckout.formValues[
                                                field.id
                                              ] || ""
                                            }
                                            onChange={(e) =>
                                              globalCheckout.setFormValues({
                                                ...globalCheckout.formValues,
                                                [field.id]: e.target.value,
                                              })
                                            }
                                          />
                                        ) : field.type === "select" ? (
                                          <select
                                            required={field.required}
                                            className="w-full bg-gray-50 border border-gray-200 text-slate-900 h-12 rounded-xl px-4 text-sm appearance-none outline-none focus:bg-white focus:ring-2 focus:ring-blue-600 transition-all shadow-sm"
                                            value={
                                              globalCheckout.formValues[
                                                field.id
                                              ] || ""
                                            }
                                            onChange={(e) =>
                                              globalCheckout.setFormValues({
                                                ...globalCheckout.formValues,
                                                [field.id]: e.target.value,
                                              })
                                            }
                                          >
                                            <option
                                              value=""
                                              disabled
                                              className="text-slate-500"
                                            >
                                              Select...
                                            </option>
                                            {fieldOptions.map(
                                              (opt: string, i: number) => (
                                                <option
                                                  key={i}
                                                  value={opt}
                                                  className="text-slate-900"
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
                                                  className="flex items-center gap-3 cursor-pointer group p-3 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors has-[:checked]:bg-blue-50 has-[:checked]:border-blue-200 has-[:checked]:ring-1 has-[:checked]:ring-blue-600"
                                                >
                                                  <div className="relative flex items-center justify-center w-5 h-5 rounded-full border border-gray-300 group-hover:border-blue-600 bg-white">
                                                    <input
                                                      type="radio"
                                                      name={field.id}
                                                      value={opt}
                                                      required={field.required}
                                                      className="peer sr-only"
                                                      onChange={(e) =>
                                                        globalCheckout.setFormValues(
                                                          {
                                                            ...globalCheckout.formValues,
                                                            [field.id]:
                                                              e.target.value,
                                                          }
                                                        )
                                                      }
                                                    />
                                                    <div className="w-2.5 h-2.5 rounded-full bg-blue-600 opacity-0 peer-checked:opacity-100 transition-all scale-50 peer-checked:scale-100" />
                                                  </div>
                                                  <span className="text-slate-900 text-sm font-semibold">
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
                                            className="bg-gray-50 border border-gray-200 text-slate-900 h-12 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 focus:border-transparent px-4 transition-all shadow-sm"
                                            value={
                                              globalCheckout.formValues[
                                                field.id
                                              ] || ""
                                            }
                                            onChange={(e) =>
                                              globalCheckout.setFormValues({
                                                ...globalCheckout.formValues,
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
                                  <div className="space-y-1.5">
                                    <Label className="text-slate-500 ml-1 text-xs font-bold uppercase tracking-widest">
                                      Full Name
                                    </Label>
                                    <Input
                                      required
                                      value={
                                        globalCheckout.formValues["name"] || ""
                                      }
                                      onChange={(e) =>
                                        globalCheckout.setFormValues({
                                          ...globalCheckout.formValues,
                                          name: e.target.value,
                                        })
                                      }
                                      className="bg-gray-50 border border-gray-200 text-slate-900 h-12 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 px-4 shadow-sm transition-all"
                                      placeholder="Your Name"
                                    />
                                  </div>
                                  <div className="space-y-1.5">
                                    <Label className="text-slate-500 ml-1 text-xs font-bold uppercase tracking-widest">
                                      Phone
                                    </Label>
                                    <Input
                                      required
                                      value={
                                        globalCheckout.formValues["phone"] || ""
                                      }
                                      onChange={(e) =>
                                        globalCheckout.setFormValues({
                                          ...globalCheckout.formValues,
                                          phone: e.target.value,
                                        })
                                      }
                                      className="bg-gray-50 border border-gray-200 text-slate-900 h-12 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 px-4 shadow-sm transition-all"
                                      placeholder="Phone Number"
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="mt-auto pt-6 border-t border-gray-100 space-y-6">
                            <div className="flex items-end justify-between bg-blue-50 p-5 rounded-2xl border border-blue-100">
                              <div className="space-y-1">
                                <p className="text-xs text-blue-600 font-bold uppercase tracking-widest">
                                  Total Due
                                </p>
                              </div>
                              <div className="text-3xl font-black text-blue-900 tracking-tight">
                                $
                                {globalCheckout.calculateTotalPrice(
                                  globalCheckout.selectedProduct?.price || "0",
                                  globalCheckout.selectedVariants,
                                  globalCheckout.quantity
                                )}
                              </div>
                            </div>

                            <Button
                              type="submit"
                              disabled={globalCheckout.isSubmitting}
                              className="w-full h-14 text-lg font-bold rounded-full bg-blue-600 text-white hover:bg-blue-700 shadow-[0_4px_14px_rgba(37,99,235,0.3)] transition-transform hover:scale-[1.02]"
                            >
                              {globalCheckout.isSubmitting ? (
                                <Loader2 className="animate-spin mr-2 w-5 h-5" />
                              ) : null}
                              {globalCheckout.formTemplate?.button_text ||
                                "Complete Order"}
                            </Button>
                          </div>
                        </form>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* 🚀 THE ACTUAL SHOP SECTION */}
      <section
        className="relative py-24 md:py-32 bg-white overflow-hidden"
        id="shop"
      >
        <div className="container max-w-6xl mx-auto relative z-10 px-6">
          {variant !== "spotlight" && (
            <div className="text-center max-w-3xl mx-auto mb-16 md:mb-20 space-y-4">
              <UCP.Text
                as="h2"
                field="title"
                value={data.title || "Shop"}
                sectionId={id}
                isPreview={isPreview}
                className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight block"
              />
              <UCP.Text
                as="p"
                field="subheadline"
                value={data.subheadline || "Browse our latest collection."}
                sectionId={id}
                isPreview={isPreview}
                className="text-lg md:text-xl text-slate-500 block max-w-xl mx-auto font-medium"
              />
            </div>
          )}

          {!hasProducts && isPreview && (
            <div className="w-full py-24 border border-dashed border-gray-300 rounded-3xl flex flex-col items-center justify-center text-slate-400 bg-gray-50">
              <Store className="w-12 h-12 mb-4 opacity-50" />
              <p className="font-semibold tracking-wide">
                No products added yet.
              </p>
            </div>
          )}

          {hasProducts && (
            <>
              {variant === "grid" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                  {products.map((prod: any, i: number) => (
                    <CupertinoProductCard key={i} product={prod} />
                  ))}
                </div>
              )}

              {/* Spotlight - iOS Feature Card Style */}
              {variant === "spotlight" && products[0] && (
                <div className="max-w-5xl mx-auto">
                  <div className="mb-10 text-center md:text-left">
                    <UCP.Text
                      as="h2"
                      field="title"
                      value={data.title || "Featured Product"}
                      sectionId={id}
                      isPreview={isPreview}
                      className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-slate-900 block tracking-tight"
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
                    className="absolute left-4 top-[40%] group-hover/carousel:top-1/2 -translate-y-1/2 z-20 flex items-center justify-center bg-white/90 hover:bg-white text-slate-900 rounded-full h-14 w-14 opacity-0 group-hover/carousel:opacity-100 transition-all duration-300 border border-gray-200 hidden md:flex shadow-lg backdrop-blur-md"
                    onClick={() => scrollCarousel("left")}
                  >
                    <ChevronLeft size={24} />
                  </button>
                  <button
                    className="absolute right-4 top-[40%] group-hover/carousel:top-1/2 -translate-y-1/2 z-20 flex items-center justify-center bg-white/90 hover:bg-white text-slate-900 rounded-full h-14 w-14 opacity-0 group-hover/carousel:opacity-100 transition-all duration-300 border border-gray-200 hidden md:flex shadow-lg backdrop-blur-md"
                    onClick={() => scrollCarousel("right")}
                  >
                    <ChevronRight size={24} />
                  </button>

                  <div
                    ref={carouselRef}
                    className="flex overflow-x-auto pb-12 gap-6 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']"
                  >
                    {products.map((prod: any, i: number) => (
                      <div
                        key={i}
                        className="snap-center shrink-0 w-[85vw] sm:w-[350px]"
                      >
                        <CupertinoProductCard product={prod} />
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
}

Shop.schema = schema;
