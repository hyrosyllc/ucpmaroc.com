import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Loader2,
  Minus,
  Plus,
  ShoppingBag,
  ArrowRight,
  ChevronRight,
  MessageCircle,
  MessageSquare,
  Calendar,
  FileText,
  CheckCircle2,
  ExternalLink,
  User,
  Phone,
  MapPin,
  ArrowLeft,
  ChevronLeft,
  Tag,
  Layers,
  Box,
  Mail,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ProductLayoutProps } from "../../features/ecommerce/product-layouts/types";
import { Textarea } from "@/components/ui/textarea";

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

export default function ModernProductLayout({
  product,
  username,
  currentPrice,
  quantity,
  setQuantity,
  selectedVariants,
  setSelectedVariants,
  activeImgIndex,
  setActiveImgIndex,
  step,
  setStep,
  clientInfo,
  setClientInfo,
  isSubmitting,
  handleMainAction,
  handleConfirmOrder,
  formTemplate,
  formValues = {},
  setFormValues,
  isLoadingForm,
}: ProductLayoutProps) {
  // AAA+ Fix: Check both array images and legacy single image string
  const images = product?.images?.length
    ? product.images
    : product?.image 
    ? [product.image]
    : ["https://via.placeholder.com/600x600?text=No+Image"];

  // AAA+ Fix: Safely determine if the item is sold out
  const isOutOfStock = product?.track_inventory && product?.stock_count <= 0;

  return (
    <div className="min-h-screen bg-white text-neutral-900 font-sans pt-20">
      {/* HEADER / BREADCRUMBS */}
      <header className="border-b border-black/10 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center text-sm text-neutral-600">
          <Link
            to={`/${username}`}
            className="hover:text-neutral-900 transition-colors font-medium"
          >
            {username}
          </Link>
          <ChevronRight className="w-4 h-4 mx-2 opacity-50" />
          <Link
            to={`/${username}/shop`}
            className="hover:text-neutral-900 transition-colors font-medium"
          >
            Shop
          </Link>

          {product.pro_collections?.title && (
            <>
              <ChevronRight className="w-4 h-4 mx-2 opacity-50" />
              <Link
                to={`/${username}/shop/collections/${product.pro_collections.slug}`}
                className="hover:text-neutral-900 transition-colors font-medium"
              >
                {product.pro_collections.title}
              </Link>
            </>
          )}

          <ChevronRight className="w-4 h-4 mx-2 opacity-50" />
          <span className="text-neutral-900 truncate">{product.title}</span>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 py-12">
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-20">
          {/* LEFT: IMAGE GALLERY (Sticky) */}
          <div className="w-full lg:w-1/2 flex flex-col space-y-4 lg:sticky lg:top-24 lg:h-max">
            <div className="aspect-square bg-white/50 border border-black/10 rounded-2xl overflow-hidden flex items-center justify-center relative group">
              <img
                src={images[activeImgIndex]}
                alt={product.title}
                className="w-full h-full object-cover animate-in fade-in duration-500"
              />
              {product.compare_at_price > product.price && (
                <Badge className="absolute top-4 left-4 bg-primary text-black font-bold uppercase tracking-widest text-[10px] px-3 py-1 shadow-lg z-10 border-none">
                  Sale
                </Badge>
              )}
              {images.length > 1 && (
                <>
                  <button type="button" onClick={() => setActiveImgIndex((prev) => (prev - 1 + images.length) % images.length)} className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/70 text-neutral-900 p-2.5 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 z-20 backdrop-blur-sm">
                    <ChevronLeft size={20} />
                  </button>
                  <button type="button" onClick={() => setActiveImgIndex((prev) => (prev + 1) % images.length)} className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/70 text-neutral-900 p-2.5 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 z-20 backdrop-blur-sm">
                    <ChevronRight size={20} />
                  </button>
                </>
              )}
            </div>

            {images.length > 1 && (
              <div className="flex gap-4 overflow-x-auto pb-2 hide-scrollbar">
                {images.map((img: string, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImgIndex(idx)}
                    className={cn(
                      "w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden border-2 transition-all",
                      activeImgIndex === idx
                        ? "border-primary scale-105"
                        : "border-transparent opacity-50 hover:opacity-100 border-black/10"
                    )}
                  >
                    <img
                      src={img}
                      className="w-full h-full object-cover"
                      alt={`Thumbnail ${idx}`}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT: PRODUCT DETAILS & CHECKOUT */}
          <div className="w-full lg:w-1/2 flex flex-col">
            {step === "success" ? (
              <div className="flex flex-col items-center justify-center text-center space-y-6 py-20 animate-in fade-in zoom-in duration-500">
                <div className="w-24 h-24 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(34,197,94,0.2)]">
                  <CheckCircle2 size={48} />
                </div>
                <div>
                  <h2 className="text-3xl font-bold mb-2 text-neutral-900">
                    Order Confirmed!
                  </h2>
                  <p className="text-neutral-600 max-w-md mx-auto leading-relaxed">
                    Thank you, {clientInfo.name}. We've received your request
                    for <strong>{product.title}</strong>. We will reach out to
                    you shortly.
                  </p>
                </div>
                <Button
                  size="lg"
                  className="bg-white text-black hover:bg-neutral-200 mt-4"
                  asChild
                >
                  <Link to={`/${username}/shop`}>Continue Shopping</Link>
                </Button>
              </div>
            ) : step === "form" ? (
              <div className="animate-in slide-in-from-right-8 duration-300">
                <Button
                  variant="ghost"
                  onClick={() => setStep("details")}
                  className="-ml-4 mb-6 text-neutral-600 hover:text-neutral-900 hover:bg-black/5"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" /> Back to Product
                </Button>
                <h2 className="text-3xl font-bold mb-2 text-neutral-900">
                  {formTemplate?.title || "Shipping Details"}
                </h2>
                {formTemplate?.subheadline && <p className="text-sm text-neutral-600 mb-6">{formTemplate.subheadline}</p>}

                <div className="space-y-6 bg-black/5 p-6 md:p-8 rounded-2xl border border-black/10 shadow-xl">
                  {isLoadingForm ? (
                    <div className="py-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
                  ) : formTemplate?.fields ? (
                    <form onSubmit={handleConfirmOrder} className="space-y-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {formTemplate.fields.filter((f: any) => f.enabled !== false).map((field: any, idx: number) => {
                          const isHalf = field.width === "half";
                          const fieldOptions = parseOptions(field.options);
                          return (
                            <div key={idx} className={cn("space-y-2", isHalf ? "col-span-1" : "col-span-1 sm:col-span-2")}>
                              <Label className="text-neutral-600 flex items-center gap-2 text-xs uppercase tracking-widest font-bold ml-1">
                                {getFieldIcon(field.type)} {field.label} {field.required && <span className="text-primary">*</span>}
                              </Label>
                              {field.type === "textarea" ? (
                                <Textarea required={field.required} placeholder={field.placeholder} className="bg-white/50 border-black/10 text-neutral-900 min-h-[100px] resize-none rounded-xl p-4 focus:border-primary/50" value={formValues[field.id] || ""} onChange={(e) => setFormValues?.({ ...formValues, [field.id]: e.target.value })} />
                              ) : field.type === "select" ? (
                                <select required={field.required} className="w-full bg-white/50 border border-black/10 text-neutral-900 h-12 rounded-xl px-4 text-sm appearance-none outline-none focus:border-primary/50" value={formValues[field.id] || ""} onChange={(e) => setFormValues?.({ ...formValues, [field.id]: e.target.value })}>
                                  <option value="" disabled className="text-neutral-900">Select...</option>
                                  {fieldOptions.map((opt: string, i: number) => (
                                    <option key={i} value={opt} className="text-neutral-900">{opt}</option>
                                  ))}
                                </select>
                              ) : field.type === "radio" ? (
                                <div className="flex flex-col gap-2 pt-1">
                                  {fieldOptions.map((opt: string, i: number) => (
                                    <label key={i} className="flex items-center gap-3 cursor-pointer group p-3 rounded-xl border border-black/5 bg-white hover:bg-black/5 transition-colors has-[:checked]:bg-primary/5 has-[:checked]:border-primary/30">
                                      <div className="relative flex items-center justify-center w-5 h-5 rounded-full border border-black/20 group-hover:border-primary bg-black/5">
                                        <input type="radio" name={field.id} value={opt} required={field.required} className="peer sr-only" onChange={(e) => setFormValues?.({ ...formValues, [field.id]: e.target.value })} />
                                        <div className="w-2.5 h-2.5 rounded-full bg-primary opacity-0 peer-checked:opacity-100 transition-all scale-50 peer-checked:scale-100" />
                                      </div>
                                      <span className="text-neutral-700 text-sm font-medium">{opt}</span>
                                    </label>
                                  ))}
                                </div>
                              ) : (
                                <Input required={field.required} type={field.type === "email" ? "email" : field.type === "tel" ? "tel" : field.type === "date" ? "date" : "text"} placeholder={field.placeholder} className={cn("bg-white/50 border-black/10 text-neutral-900 h-12 rounded-xl focus:border-primary/50", field.type === "date" && "[color-scheme:dark]")} value={formValues[field.id] || ""} onChange={(e) => setFormValues?.({ ...formValues, [field.id]: e.target.value })} />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </form>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <Label className="text-neutral-600 uppercase tracking-wider text-xs">Full Name</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-3.5 h-5 w-5 text-neutral-500" />
                          <Input value={clientInfo.name} onChange={(e) => setClientInfo({ ...clientInfo, name: e.target.value })} placeholder="Your Name" className="bg-white/50 border-black/10 pl-11 h-12 text-base text-neutral-900 focus:border-primary/50 transition-colors" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-neutral-600 uppercase tracking-wider text-xs">Phone Number</Label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-3.5 h-5 w-5 text-neutral-500" />
                          <Input value={clientInfo.phone} onChange={(e) => setClientInfo({ ...clientInfo, phone: e.target.value })} placeholder="+1 234 567 890" className="bg-white/50 border-black/10 pl-11 h-12 text-base text-neutral-900 focus:border-primary/50 transition-colors" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-neutral-600 uppercase tracking-wider text-xs">Delivery Address</Label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-3.5 h-5 w-5 text-neutral-500" />
                          <Input value={clientInfo.address} onChange={(e) => setClientInfo({ ...clientInfo, address: e.target.value })} placeholder="Street, City, Zip Code" className="bg-white/50 border-black/10 pl-11 h-12 text-base text-neutral-900 focus:border-primary/50 transition-colors" />
                        </div>
                      </div>
                    </>
                  )}

                  <div className="pt-6 border-t border-black/10">
                    <div className="flex justify-between items-center mb-6 bg-black/5 p-4 rounded-xl border border-black/5">
                      <span className="text-lg text-neutral-600">
                        Total Estimate:
                      </span>
                      <span className="text-2xl font-bold text-primary">
                        ${(currentPrice * quantity).toFixed(2)}
                      </span>
                    </div>
                    <Button
                      size="lg"
                      disabled={isSubmitting}
                      className={cn(
                        "w-full h-14 text-lg font-semibold rounded-xl",
                        product.action_type === "whatsapp"
                          ? "bg-green-600 hover:bg-green-500 text-neutral-900"
                          : "bg-white text-black hover:bg-neutral-200"
                      )}
                      onClick={handleConfirmOrder}
                    >
                      {isSubmitting ? (
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      ) : product.action_type === "whatsapp" ? (
                        <MessageCircle className="mr-2 w-5 h-5" />
                      ) : (
                        <FileText className="mr-2 w-5 h-5" />
                      )}
                      {isSubmitting
                        ? "Processing..."
                        : product.action_type === "whatsapp"
                        ? "Confirm via WhatsApp"
                        : "Confirm Order"}
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="animate-in fade-in duration-500">
                {product.pro_collections?.title && (
                  <Badge
                    variant="outline"
                    className="mb-4 border-primary text-primary px-3 py-1 uppercase tracking-widest text-[10px] font-bold"
                  >
                    {product.pro_collections.title}
                  </Badge>
                )}

                <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 leading-tight text-neutral-900">
                  {product.title}
                </h1>

                <div className="flex items-center gap-4 mb-8">
                  <span className="text-3xl font-bold text-neutral-900">
                    ${currentPrice.toFixed(2)}
                  </span>
                  {product.compare_at_price > currentPrice && (
                    <span className="text-xl text-neutral-500 line-through">
                      ${product.compare_at_price.toFixed(2)}
                    </span>
                  )}
                </div>

                {/* AAA+ Fix: Safely fallback to empty string to prevent .split() crash */}
                <div className="prose prose-invert max-w-none text-neutral-700 leading-relaxed mb-10 whitespace-pre-wrap">
                  {(product?.description || "")
                    .split("\n")
                    .map((line: string, i: number) => (
                      <p key={i}>{line}</p>
                    ))}
                </div>

                {/* DYNAMIC OPTIONS / VARIANTS */}
                {product.options?.length > 0 && (
                  <div className="space-y-6 mb-8 border-y border-black/10 py-8">
                    {product.options.map((opt: any) => (
                      <div key={opt.name} className="space-y-3">
                        <div className="flex justify-between items-center">
                          <Label className="text-sm uppercase tracking-widest text-neutral-600 font-bold">
                            {opt.name}
                          </Label>
                          <span className="text-xs text-primary font-medium">
                            {selectedVariants[opt.name]?.label}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-3">
                          {opt.values.map((val: any) => {
                            const isSelected =
                              selectedVariants[opt.name]?.label === val.label;
                            return (
                              <button
                                key={val.label}
                                onClick={() =>
                                  setSelectedVariants((prev) => ({
                                    ...prev,
                                    [opt.name]: val,
                                  }))
                                }
                                className={cn(
                                  "px-5 py-3 rounded-xl border text-sm font-medium transition-all duration-200 flex items-center gap-2",
                                  isSelected
                                    ? "border-primary bg-primary/10 text-neutral-900"
                                    : "border-black/10 text-neutral-600 hover:border-black/30 hover:bg-black/10 bg-black/5"
                                )}
                              >
                                {val.label}
                                {val.price && (
                                  <span
                                    className={cn(
                                      "text-xs opacity-70",
                                      isSelected
                                        ? "text-primary"
                                        : "text-neutral-500"
                                    )}
                                  >
                                    +${val.price}
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* QUANTITY & ACTIONS */}
                <div className="flex flex-col sm:flex-row gap-4 mb-8">
                  {product.action_type !== "link" && (
                    <div className="flex items-center justify-between border border-black/10 rounded-xl px-4 h-14 w-full sm:w-1/3 bg-white/50 text-neutral-900">
                      <button
                        className="text-neutral-600 hover:text-neutral-900 transition-colors"
                        onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      >
                        <Minus size={20} />
                      </button>
                      <span className="font-mono text-lg font-bold">
                        {quantity}
                      </span>
                      <button
                        disabled={product.track_inventory && quantity >= product.stock_count}
                        className="text-neutral-600 hover:text-neutral-900 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        onClick={() => {
                          // Prevent incrementing beyond stock limits
                          if (product.track_inventory && quantity >= product.stock_count) return;
                          setQuantity((q) => q + 1);
                        }}
                      >
                        <Plus size={20} />
                      </button>
                    </div>
                  )}

                  <Button
                    size="lg"
                    disabled={isOutOfStock}
                    className={cn(
                      "flex-1 h-14 text-lg font-bold rounded-xl transition-all hover:scale-[1.02]",
                      isOutOfStock 
                        ? "bg-neutral-100 text-neutral-500 cursor-not-allowed shadow-none" 
                        : "shadow-[0_0_20px_rgba(255,255,255,0.1)] bg-white text-black hover:bg-neutral-200"
                    )}
                    onClick={handleMainAction}
                  >
                    {isOutOfStock
                      ? "Out of Stock"
                      : product.action_type === "link"
                      ? "Buy Now"
                      : product.action_type === "cart"
                      ? "Add to Cart"
                      : "Order Now"}
                    {product.action_type === "link" ? (
                      <ExternalLink className="ml-2 w-5 h-5" />
                    ) : product.action_type === "cart" ? (
                      <ShoppingBag className="ml-2 w-5 h-5" />
                    ) : (
                      <ArrowRight className="ml-2 w-5 h-5" />
                    )}
                  </Button>
                </div>

                {/* INVENTORY BADGE */}
                {product.track_inventory && (
                  <div className="flex items-center gap-2 text-sm bg-black/5 w-fit px-4 py-2 rounded-full border border-black/5">
                    <div
                      className={cn(
                        "w-2 h-2 rounded-full",
                        product.stock_count > 5
                          ? "bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]"
                          : "bg-orange-500 animate-pulse shadow-[0_0_10px_rgba(249,115,22,0.5)]"
                      )}
                    />
                    <span className="text-neutral-600 font-medium">
                      {product.stock_count > 0 ? (
                        `${product.stock_count} items remaining in stock`
                      ) : (
                        <span className="text-red-400">Out of stock</span>
                      )}
                    </span>
                  </div>
                )}

              {/* PRODUCT METADATA (SKU, TYPE, WEIGHT) */}
              {(product.sku || product.product_type || (product.requires_shipping && product.weight > 0)) && (
                <div className="mt-8 pt-6 border-t border-black/10 flex flex-wrap gap-x-6 gap-y-3 text-sm text-neutral-600 animate-in fade-in duration-500">
                  {product.sku && <div className="flex items-center gap-2"><Tag size={16} className="text-neutral-500" /> <span className="uppercase tracking-wider text-[10px] font-bold">SKU:</span> <span className="text-neutral-900 font-mono">{product.sku}</span></div>}
                  {product.product_type && <div className="flex items-center gap-2"><Layers size={16} className="text-neutral-500" /> <span className="uppercase tracking-wider text-[10px] font-bold">Type:</span> <span className="text-neutral-900 capitalize">{product.product_type}</span></div>}
                  {product.requires_shipping && product.weight > 0 && <div className="flex items-center gap-2"><Box size={16} className="text-neutral-500" /> <span className="uppercase tracking-wider text-[10px] font-bold">Weight:</span> <span className="text-neutral-900">{product.weight} kg</span></div>}
                </div>
              )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
