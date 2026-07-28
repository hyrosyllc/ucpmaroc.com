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
  Star,
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
  ChevronDown,
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
  themeConfig,
  customer,
  reviewForm,
  setReviewForm,
  isSubmittingReview,
  reviewSuccess,
  handleReviewSubmit,
  relatedProducts,

}: ProductLayoutProps) {
  // AAA+ Fix: Check both array images and legacy single image string
  const images = product?.images?.length
    ? product.images
    : product?.image 
    ? [product.image]
    : ["https://via.placeholder.com/600x600?text=No+Image"];

  // AAA+ Fix: Safely determine if the item is sold out
  const isOutOfStock = product?.track_inventory && product?.stock_count <= 0;

  const showReviews = themeConfig?.store_product_reviews !== false;

  return (
    <div className="min-h-screen bg-neutral-950 text-white font-sans pt-20">
      {/* HEADER / BREADCRUMBS */}
      <header className="border-b border-white/10 bg-neutral-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center text-sm text-neutral-400">
          <Link
            to={`/${username}`}
            className="hover:text-white transition-colors font-medium"
          >
            {username}
          </Link>
          <ChevronRight className="w-4 h-4 mx-2 opacity-50" />
          <Link
            to={`/${username}/shop`}
            className="hover:text-white transition-colors font-medium"
          >
            Shop
          </Link>

          {product.pro_collections?.title && (
            <>
              <ChevronRight className="w-4 h-4 mx-2 opacity-50" />
              <Link
                to={`/${username}/shop/collections/${product.pro_collections.slug}`}
                className="hover:text-white transition-colors font-medium"
              >
                {product.pro_collections.title}
              </Link>
            </>
          )}

          <ChevronRight className="w-4 h-4 mx-2 opacity-50" />
          <span className="text-white truncate">{product.title}</span>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 py-12">
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-20">
          {/* LEFT: IMAGE GALLERY (Sticky) */}
          <div className="w-full lg:w-1/2 flex flex-col space-y-4 lg:sticky lg:top-24 lg:h-max">
            <div className="aspect-square bg-black/50 border border-white/10 rounded-2xl overflow-hidden flex items-center justify-center relative group">
              {images[activeImgIndex]?.match(/\.(mp4|webm|mov)$/i) ? (
                <video src={images[activeImgIndex]} autoPlay loop muted playsInline className="w-full h-full object-cover animate-in fade-in duration-500" />
              ) : (
                <img
                  src={images[activeImgIndex]}
                  alt={product.title}
                  className="w-full h-full object-cover animate-in fade-in duration-500"
                />
              )}
              {product.compare_at_price > product.price && (
                <Badge className="absolute top-4 left-4 bg-primary text-black font-bold uppercase tracking-widest text-[10px] px-3 py-1 shadow-lg z-10 border-none">
                  Sale
                </Badge>
              )}
              {images.length > 1 && (
                <>
                  <button type="button" onClick={() => setActiveImgIndex((prev) => (prev - 1 + images.length) % images.length)} className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/70 text-white p-2.5 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 z-20 backdrop-blur-sm">
                    <ChevronLeft size={20} />
                  </button>
                  <button type="button" onClick={() => setActiveImgIndex((prev) => (prev + 1) % images.length)} className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/70 text-white p-2.5 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 z-20 backdrop-blur-sm">
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
                        : "border-transparent opacity-50 hover:opacity-100 border-white/10"
                    )}
                  >
                    {img?.match(/\.(mp4|webm|mov)$/i) ? (
                      <video src={img} className="w-full h-full object-cover" muted />
                    ) : (
                      <img
                        src={img}
                        className="w-full h-full object-cover"
                        alt={`Thumbnail ${idx}`}
                      />
                    )}
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
                  <h2 className="text-3xl font-bold mb-2 text-white">
                    Order Confirmed!
                  </h2>
                  <p className="text-neutral-400 max-w-md mx-auto leading-relaxed">
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
                  className="-ml-4 mb-6 text-neutral-400 hover:text-white hover:bg-white/5"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" /> Back to Product
                </Button>
                <h2 className="text-3xl font-bold mb-2 text-white">
                  {formTemplate?.title || "Shipping Details"}
                </h2>
                {formTemplate?.subheadline && <p className="text-sm text-neutral-400 mb-6">{formTemplate.subheadline}</p>}

                <div className="space-y-6 bg-neutral-900/50 p-6 md:p-8 rounded-2xl border border-white/10 shadow-xl">
                  {isLoadingForm ? (
                    <div className="py-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
                  ) : formTemplate?.fields ? (
                    <form onSubmit={handleConfirmOrder} className="space-y-6">
                      <div className="grid grid-cols-1 sm:grid-cols-6 gap-4">
                        {formTemplate.fields.filter((f: any) => f.enabled !== false).map((field: any, idx: number) => {
                          const widthClass = field.width === "third" ? "sm:col-span-2" : field.width === "half" ? "sm:col-span-3" : "sm:col-span-6";
                          const fieldOptions = parseOptions(field.options);
                          return (
                            <div key={idx} className={cn("space-y-2 col-span-1", widthClass)}>
                              <Label className="text-neutral-400 flex items-center gap-2 text-xs uppercase tracking-widest font-bold ml-1">
                                {getFieldIcon(field.type)} {field.label} {field.required && <span className="text-primary">*</span>}
                              </Label>
                              {field.type === "textarea" ? (
                                <Textarea required={field.required} placeholder={field.placeholder} className="bg-black/50 border-white/10 text-white min-h-[100px] resize-none rounded-xl p-4 focus:border-primary/50" value={formValues[field.id] || ""} onChange={(e) => setFormValues?.({ ...formValues, [field.id]: e.target.value })} />
                              ) : field.type === "select" ? (
                                <select required={field.required} className="w-full bg-black/50 border border-white/10 text-white h-12 rounded-xl px-4 text-sm appearance-none outline-none focus:border-primary/50" value={formValues[field.id] || ""} onChange={(e) => setFormValues?.({ ...formValues, [field.id]: e.target.value })}>
                                  <option value="" disabled className="text-neutral-900">Select...</option>
                                  {fieldOptions.map((opt: string, i: number) => (
                                    <option key={i} value={opt} className="text-neutral-900">{opt}</option>
                                  ))}
                                </select>
                              ) : field.type === "radio" ? (
                                <div className="flex flex-col gap-2 pt-1">
                                  {fieldOptions.map((opt: string, i: number) => (
                                    <label key={i} className="flex items-center gap-3 cursor-pointer group p-3 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/5 transition-colors has-[:checked]:bg-primary/5 has-[:checked]:border-primary/30">
                                      <div className="relative flex items-center justify-center w-5 h-5 rounded-full border border-white/20 group-hover:border-primary bg-white/5">
                                        <input type="radio" name={field.id} value={opt} required={field.required} className="peer sr-only" onChange={(e) => setFormValues?.({ ...formValues, [field.id]: e.target.value })} />
                                        <div className="w-2.5 h-2.5 rounded-full bg-primary opacity-0 peer-checked:opacity-100 transition-all scale-50 peer-checked:scale-100" />
                                      </div>
                                      <span className="text-neutral-300 text-sm font-medium">{opt}</span>
                                    </label>
                                  ))}
                                </div>
                              ) : (
                                <Input required={field.required} type={field.type === "email" ? "email" : field.type === "tel" ? "tel" : field.type === "date" ? "date" : "text"} placeholder={field.placeholder} className={cn("bg-black/50 border-white/10 text-white h-12 rounded-xl focus:border-primary/50", field.type === "date" && "[color-scheme:dark]")} value={formValues[field.id] || ""} onChange={(e) => setFormValues?.({ ...formValues, [field.id]: e.target.value })} />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </form>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <Label className="text-neutral-400 uppercase tracking-wider text-xs">Full Name</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-3.5 h-5 w-5 text-neutral-500" />
                          <Input value={clientInfo.name} onChange={(e) => setClientInfo({ ...clientInfo, name: e.target.value })} placeholder="Your Name" className="bg-black/50 border-white/10 pl-11 h-12 text-base text-white focus:border-primary/50 transition-colors" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-neutral-400 uppercase tracking-wider text-xs">Phone Number</Label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-3.5 h-5 w-5 text-neutral-500" />
                          <Input value={clientInfo.phone} onChange={(e) => setClientInfo({ ...clientInfo, phone: e.target.value })} placeholder="+1 234 567 890" className="bg-black/50 border-white/10 pl-11 h-12 text-base text-white focus:border-primary/50 transition-colors" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-neutral-400 uppercase tracking-wider text-xs">Delivery Address</Label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-3.5 h-5 w-5 text-neutral-500" />
                          <Input value={clientInfo.address} onChange={(e) => setClientInfo({ ...clientInfo, address: e.target.value })} placeholder="Street, City, Zip Code" className="bg-black/50 border-white/10 pl-11 h-12 text-base text-white focus:border-primary/50 transition-colors" />
                        </div>
                      </div>
                    </>
                  )}

                  <div className="pt-6 border-t border-white/10">
                    <div className="flex justify-between items-center mb-6 bg-black/30 p-4 rounded-xl border border-white/5">
                      <span className="text-lg text-neutral-400">
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
                          ? "bg-green-600 hover:bg-green-500 text-white"
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

                <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 leading-tight text-white">
                  {product.title}
                </h1>

                <div className="flex items-center gap-4 mb-8">
                  <span className="text-3xl font-bold text-white">
                    ${currentPrice.toFixed(2)}
                  </span>
                  {product.compare_at_price > currentPrice && (
                    <span className="text-xl text-neutral-500 line-through">
                      ${product.compare_at_price.toFixed(2)}
                    </span>
                  )}
                </div>
              
              {product.short_description && (
                <p className="text-neutral-400 text-lg mb-6 leading-relaxed animate-in fade-in">
                  {product.short_description}
                </p>
              )}

                {/* DYNAMIC OPTIONS / VARIANTS */}
                {product.options?.length > 0 && (
                  <div className="space-y-6 mb-8 border-y border-white/10 py-8">
                    {product.options.map((opt: any) => (
                      <div key={opt.name} className="space-y-3">
                        <div className="flex justify-between items-center">
                          <Label className="text-sm uppercase tracking-widest text-neutral-400 font-bold">
                            {opt.name}
                          </Label>
                          <span className="text-xs text-primary font-medium">
                            {selectedVariants[opt.name]?.label}
                            {selectedVariants[opt.name]?.price ? ` (+$${selectedVariants[opt.name].price})` : ''}

                          </span>
                        </div>
                        <div className="flex flex-wrap gap-3">
                          {opt.values.map((val: any) => {
                            const isSelected =
                              selectedVariants[opt.name]?.label === val.label;
                            const isRound = opt.visual_shape !== 'square';

                            if (opt.visual_type === 'color') {
                              return (
                                <button
                                  key={val.label}
                                  onClick={() => setSelectedVariants((prev) => ({ ...prev, [opt.name]: val }))}
                                  title={val.label + (val.price ? ` (+$${val.price})` : '')}
                                  className={cn(
                                    "relative transition-all duration-200 border-2 flex items-center justify-center bg-neutral-900",
                                    isRound ? "rounded-full" : "rounded-lg",
                                    isSelected ? "border-primary shadow-[0_0_15px_rgba(var(--primary),0.3)] scale-105" : "border-transparent hover:scale-105 hover:border-white/30",
                                    opt.visual_show_label ? "h-10 pl-2 pr-4 gap-2 w-max" : "w-10 h-10"
                                  )}
                                >
                                  <span className={cn("block shadow-sm border border-white/10 shrink-0", isRound ? "rounded-full" : "rounded-[4px]", opt.visual_show_label ? "w-5 h-5" : "w-7 h-7")} style={{ backgroundColor: val.visual_value || '#000000' }} />
                                  {opt.visual_show_label && <span className="text-sm font-medium">{val.label}</span>}
                                </button>
                              )
                            }

                            if (opt.visual_type === 'image') {
                              return (
                                <button
                                  key={val.label}
                                  onClick={() => setSelectedVariants((prev) => ({ ...prev, [opt.name]: val }))}
                                  title={val.label + (val.price ? ` (+$${val.price})` : '')}
                                  className={cn(
                                    "relative transition-all duration-200 border-2 bg-neutral-900 flex items-center justify-center",
                                    isRound ? "rounded-full" : "rounded-xl",
                                    isSelected ? "border-primary shadow-[0_0_15px_rgba(var(--primary),0.3)] z-10 scale-105" : "border-white/10 hover:scale-105 hover:border-white/30",
                                    opt.visual_show_label ? "h-14 pl-1.5 pr-5 gap-3 w-max" : "w-14 h-14 p-0.5 overflow-hidden"
                                  )}
                                >
                                  <span className={cn(
                                      "shrink-0 overflow-hidden flex items-center justify-center", 
                                      isRound ? "rounded-full" : "rounded-lg", 
                                      opt.visual_show_label ? "w-11 h-11" : "w-full h-full"
                                  )}>
                                    {val.visual_value ? (
                                      <img src={val.visual_value} alt={val.label} className="w-full h-full object-cover" />
                                    ) : (
                                      <span className="text-[10px] text-neutral-500 font-medium px-2 text-center leading-tight bg-neutral-800 w-full h-full flex items-center justify-center">{val.label}</span>
                                    )}
                                  </span>
                                  {opt.visual_show_label && <span className="text-sm font-medium">{val.label}</span>}
                                </button>
                              )
                            }

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
                                    ? "border-primary bg-primary/10 text-white"
                                    : "border-white/10 text-neutral-400 hover:border-white/30 hover:bg-white/5 bg-neutral-900/50"
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
                    <div className="flex items-center justify-between border border-white/10 rounded-xl px-4 h-14 w-full sm:w-1/3 bg-black/50 text-white">
                      <button
                        className="text-neutral-400 hover:text-white transition-colors"
                        onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      >
                        <Minus size={20} />
                      </button>
                      <span className="font-mono text-lg font-bold">
                        {quantity}
                      </span>
                      <button
                        disabled={product.track_inventory && quantity >= product.stock_count}
                        className="text-neutral-400 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
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
                        ? "bg-neutral-800 text-neutral-500 cursor-not-allowed shadow-none" 
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
                  <div className="flex items-center gap-2 text-sm bg-neutral-900/50 w-fit px-4 py-2 rounded-full border border-white/5">
                    <div
                      className={cn(
                        "w-2 h-2 rounded-full",
                        product.stock_count > 5
                          ? "bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]"
                          : "bg-orange-500 animate-pulse shadow-[0_0_10px_rgba(249,115,22,0.5)]"
                      )}
                    />
                    <span className="text-neutral-400 font-medium">
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
                <div className="mt-8 pt-6 border-t border-white/10 flex flex-wrap gap-x-6 gap-y-3 text-sm text-neutral-400 animate-in fade-in duration-500">
                  {product.sku && <div className="flex items-center gap-2"><Tag size={16} className="text-neutral-500" /> <span className="uppercase tracking-wider text-[10px] font-bold">SKU:</span> <span className="text-white font-mono">{product.sku}</span></div>}
                  {product.product_type && <div className="flex items-center gap-2"><Layers size={16} className="text-neutral-500" /> <span className="uppercase tracking-wider text-[10px] font-bold">Tag:</span> <span className="text-white capitalize">{product.product_type}</span></div>}
                  {product.requires_shipping && product.weight > 0 && <div className="flex items-center gap-2"><Box size={16} className="text-neutral-500" /> <span className="uppercase tracking-wider text-[10px] font-bold">Weight:</span> <span className="text-white">{product.weight} kg</span></div>}
                </div>
              )}
              
              {/* DYNAMIC ACCORDIONS (FAQs, Shipping Policies, Size Guides) */}
              {product.accordions && product.accordions.length > 0 && (
                <div className="mt-8 space-y-3 border-t border-white/10 pt-8 animate-in fade-in duration-500">
                  {product.accordions.map((acc: any, i: number) => (
                    <details key={i} className="group border border-white/10 bg-neutral-900/30 rounded-xl overflow-hidden transition-all duration-300 open:bg-neutral-900/60">
                      <summary className="flex cursor-pointer items-center justify-between p-5 font-bold text-white hover:text-primary transition-colors select-none">
                        {acc.title}
                        <span className="transition-transform duration-300 group-open:rotate-180 text-neutral-500 group-hover:text-primary">
                          <ChevronDown size={18} />
                        </span>
                      </summary>
                      <div className="p-5 pt-0 text-sm text-neutral-400 leading-relaxed whitespace-pre-wrap border-t border-white/5 mx-5 mt-2">
                        {acc.content}
                      </div>
                    </details>
                  ))}
                </div>
              )}
              </div>
            )}
          </div>
        </div>

        {/* THE LONG DESCRIPTION (Below the fold) */}
        {product.description && (
          <div className="mt-20 pt-16 border-t border-white/10 w-full animate-in fade-in duration-500">
            <h3 className="text-3xl font-bold text-white tracking-tight mb-10 text-center">Product Details</h3>
            <div 
              className="prose prose-invert prose-lg max-w-4xl mx-auto text-neutral-300 leading-relaxed prose-img:rounded-2xl prose-img:shadow-2xl prose-a:text-primary prose-a:font-bold prose-headings:text-white" 
              dangerouslySetInnerHTML={{ __html: product.description }} 
            />
          </div>
        )}

        {/* RELATED PRODUCTS */}
        {themeConfig?.store_related_products !== false && relatedProducts && relatedProducts.length > 0 && (
          <div className="mt-20 pt-16 border-t border-white/10 w-full animate-in fade-in duration-500">
            <h3 className="text-3xl font-bold text-white tracking-tight mb-10 text-center">You might also like</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
              {relatedProducts.map((rel: any) => (
                <Link
                  key={rel.id}
                  to={`/${username}/product/${rel.slug || rel.id}`}
                  className="group flex flex-col bg-neutral-900/50 border border-white/10 rounded-2xl overflow-hidden hover:border-primary/50 hover:shadow-[0_0_30px_rgba(var(--primary),0.1)] transition-all duration-300"
                >
                  <div className="aspect-[4/3] bg-black/50 relative overflow-hidden">
                    {rel.images?.[0] ? (
                      rel.images[0].match(/\.(mp4|webm|mov)$/i) ? (
                        <video src={rel.images[0]} autoPlay loop muted playsInline className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                      ) : (
                        <img src={rel.images[0]} alt={rel.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                      )
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-neutral-700">
                        <ShoppingBag size={48} opacity={0.5} />
                      </div>
                    )}
                    {rel.compare_at_price > rel.price && (
                      <Badge className="absolute top-3 left-3 bg-primary text-black font-bold uppercase tracking-widest text-[10px] px-3 py-1 shadow-lg z-10 border-none">Sale</Badge>
                    )}
                    <div className="absolute top-3 right-3 flex flex-col gap-2 items-end">
                      <Badge className="bg-black/70 backdrop-blur-md text-white border-white/10 font-bold px-3 py-1 text-sm shadow-xl">${rel.price.toFixed(2)}</Badge>
                    </div>
                  </div>
                  <div className="p-5 flex flex-col flex-1">
                    {rel.pro_collections?.title && <span className="text-[10px] uppercase tracking-widest text-primary font-bold mb-2 block">{rel.pro_collections.title}</span>}
                    <h3 className="font-bold text-lg leading-tight mb-2 group-hover:text-primary transition-colors text-white line-clamp-2">{rel.title}</h3>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {showReviews && (
          <div className="mt-20 pt-16 border-t border-white/10 max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
               <div>
                 <h3 className="text-3xl font-bold text-white tracking-tight">Customer Reviews</h3>
                 <p className="text-neutral-400 mt-2">See what others are saying about this product.</p>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
              <div className="md:col-span-7 space-y-6">
                {product.reviews && product.reviews.length > 0 ? (
                  product.reviews.map((r: any) => (
                    <div key={r.id} className="bg-white/5 p-6 rounded-2xl border border-white/10">
                       <div className="flex items-center justify-between mb-4">
                         <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold">
                               {(r.pro_customers?.name || "C").charAt(0).toUpperCase()}
                            </div>
                            <div>
                               <div className="font-bold text-sm text-white">{r.pro_customers?.name || "Customer"}</div>
                               <div className="text-[10px] text-neutral-500">{new Date(r.created_at).toLocaleDateString()}</div>
                            </div>
                         </div>
                         <div className="flex gap-1">
                           {[...Array(5)].map((_, i) => <Star key={i} size={14} className={cn(i < r.rating ? "text-amber-500 fill-amber-500" : "text-neutral-700")} />)}
                         </div>
                       </div>
                       {r.title && <h4 className="font-bold mb-2 text-white">{r.title}</h4>}
                       <p className="text-sm text-neutral-300 leading-relaxed">"{r.content}"</p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-16 bg-white/5 rounded-2xl border border-white/10 text-neutral-400">
                     <Star className="w-10 h-10 mx-auto mb-4 opacity-20" />
                     <p className="font-medium">No reviews yet.</p>
                     <p className="text-sm opacity-60 mt-1">Be the first to review this product!</p>
                  </div>
                )}
              </div>

              <div className="md:col-span-5">
                <div className="bg-neutral-900/50 p-6 md:p-8 rounded-2xl border border-white/10 sticky top-24">
                  <h4 className="text-xl font-bold text-white mb-6">Write a Review</h4>
                  {customer ? (
                    reviewSuccess ? (
                      <div className="text-center py-8">
                        <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
                        <p className="font-bold text-white">Review Submitted!</p>
                        <p className="text-sm text-neutral-400 mt-2">Thank you! Your review is pending approval.</p>
                      </div>
                    ) : (
                      <form onSubmit={handleReviewSubmit} className="space-y-4">
                        <div className="space-y-2">
                          <Label className="text-neutral-400 text-xs uppercase tracking-widest font-bold">Rating</Label>
                          <div className="flex gap-1">
                            {[1,2,3,4,5].map(num => (
                              <Star key={num} size={24} className={cn("cursor-pointer transition-all hover:scale-110", reviewForm?.rating >= num ? "text-amber-500 fill-amber-500" : "text-neutral-600")} onClick={() => setReviewForm?.({...reviewForm, rating: num})} />
                            ))}
                          </div>
                        </div>
                        <Input placeholder="Review Title" required value={reviewForm?.title} onChange={e => setReviewForm?.({...reviewForm, title: e.target.value})} className="bg-black/50 border-white/10 text-white" />
                        <Textarea placeholder="Share your experience..." required value={reviewForm?.content} onChange={e => setReviewForm?.({...reviewForm, content: e.target.value})} className="bg-black/50 border-white/10 text-white min-h-[100px] resize-none" />
                        <Button type="submit" disabled={isSubmittingReview} className="w-full bg-primary text-black hover:bg-primary/90 font-bold">
                          {isSubmittingReview ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <MessageSquare className="w-4 h-4 mr-2"/>} Submit Review
                        </Button>
                      </form>
                    )
                  ) : (
                    <div className="text-center py-6">
                      <p className="text-sm text-neutral-400 mb-4">You must be logged in to leave a review.</p>
                      <Button asChild variant="outline" className="w-full border-white/20 text-white hover:bg-white/10">
                        <Link to={`/${username ? username + '/' : ''}login`}>Log in to Account</Link>
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
