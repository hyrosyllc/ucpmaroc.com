import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, ArrowLeft, Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { ProductLayoutProps } from "../../features/ecommerce/product-layouts/types";

export default function MinimalProductLayout({
  product,
  username,
  currentPrice,
  quantity,
  setQuantity,
  selectedVariants,
  setSelectedVariants,
  activeImgIndex,
  step,
  setStep,
  clientInfo,
  setClientInfo,
  isSubmitting,
  handleMainAction,
  handleConfirmOrder,
}: ProductLayoutProps) {
  const images = product.images?.length
    ? product.images
    : ["https://via.placeholder.com/1200x800?text=No+Image"];

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-foreground selection:text-background">
      {/* MINIMAL NAV (Floats over the image) */}
      <nav className="absolute top-0 w-full p-6 z-50 flex justify-between items-center mix-blend-difference text-white">
        <Link
          to={`/${username}/shop`}
          className="flex items-center text-sm uppercase tracking-widest font-semibold hover:opacity-70 transition-opacity"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Shop
        </Link>
      </nav>

      {step === "details" && (
        <div className="animate-in fade-in duration-700">
          {/* MASSIVE EDGE-TO-EDGE SLIDER */}
          <div className="w-full h-[60vh] md:h-[75vh] flex overflow-x-auto snap-x snap-mandatory hide-scrollbar relative bg-muted">
            {images.map((img: string, idx: number) => (
              <div
                key={idx}
                className="min-w-full w-full h-full snap-center relative"
              >
                <img
                  src={img}
                  className="w-full h-full object-cover"
                  alt={`Slide ${idx}`}
                />
              </div>
            ))}

            {/* Scroll Indicator */}
            {images.length > 1 && (
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-10 bg-black/20 backdrop-blur-md px-3 py-2 rounded-full">
                {images.map((_: any, idx: React.Key | null | undefined) => (
                  <div
                    key={idx}
                    className={cn(
                      "w-2 h-2 rounded-full transition-all",
                      activeImgIndex === idx
                        ? "bg-white scale-125"
                        : "bg-white/50"
                    )}
                  />
                ))}
              </div>
            )}
          </div>

          {/* CENTERED MINIMAL INFO */}
          <div className="max-w-3xl mx-auto px-6 py-16 text-center">
            {product.pro_collections?.title && (
              <p className="text-xs uppercase tracking-widest text-muted-foreground mb-4">
                {product.pro_collections.title}
              </p>
            )}

            <h1 className="text-4xl md:text-6xl font-light tracking-tight mb-6">
              {product.title}
            </h1>
            <p className="text-2xl font-medium mb-12">
              ${currentPrice.toFixed(2)}
            </p>

            {/* Elegant Variant Selection */}
            {product.options?.length > 0 && (
              <div className="space-y-8 mb-12">
                {product.options.map((opt: any) => (
                  <div
                    key={opt.name}
                    className="flex flex-col items-center space-y-4"
                  >
                    <span className="text-xs uppercase tracking-widest text-muted-foreground">
                      {opt.name}
                    </span>
                    <div className="flex flex-wrap justify-center gap-2">
                      {opt.values.map((val: any) => (
                        <button
                          key={val.label}
                          onClick={() =>
                            setSelectedVariants((prev) => ({
                              ...prev,
                              [opt.name]: val,
                            }))
                          }
                          className={cn(
                            "px-6 py-2 rounded-full text-sm transition-all border",
                            selectedVariants[opt.name]?.label === val.label
                              ? "border-foreground bg-foreground text-background"
                              : "border-border text-muted-foreground hover:border-foreground hover:text-foreground"
                          )}
                        >
                          {val.label}{" "}
                          {val.price && (
                            <span className="opacity-70 ml-1">
                              +${val.price}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4 max-w-md mx-auto">
              {product.action_type !== "link" && (
                <div className="flex items-center justify-between border rounded-full px-6 h-14 w-full sm:w-32 bg-background">
                  <button
                    className="text-muted-foreground hover:text-foreground"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  >
                    <Minus size={16} />
                  </button>
                  <span className="font-mono">{quantity}</span>
                  <button
                    className="text-muted-foreground hover:text-foreground"
                    onClick={() => setQuantity((q) => q + 1)}
                  >
                    <Plus size={16} />
                  </button>
                </div>
              )}
              <Button
                size="lg"
                className="h-14 w-full rounded-full text-lg font-normal tracking-wide uppercase"
                onClick={handleMainAction}
              >
                {product.action_type === "link"
                  ? "Buy Now"
                  : product.action_type === "cart"
                  ? "Add to Cart"
                  : "Order Now"}
              </Button>
            </div>

            <div className="mt-16 text-muted-foreground leading-relaxed font-serif text-lg max-w-2xl mx-auto text-left">
              {product.description
                .split("\n")
                .map((line: string, i: number) => (
                  <p key={i} className="mb-4">
                    {line}
                  </p>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* MINIMAL FORM STATE */}
      {step === "form" && (
        <div className="max-w-xl mx-auto px-6 py-32 text-center animate-in fade-in">
          <Button
            variant="ghost"
            onClick={() => setStep("details")}
            className="mb-8 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
          <h2 className="text-3xl font-light mb-12">Complete your order</h2>
          <div className="space-y-6 text-left">
            <Input
              value={clientInfo.name}
              onChange={(e) =>
                setClientInfo({ ...clientInfo, name: e.target.value })
              }
              placeholder="Full Name"
              className="h-14 bg-transparent border-0 border-b rounded-none px-0 text-xl focus-visible:ring-0 focus-visible:border-foreground"
            />
            <Input
              value={clientInfo.phone}
              onChange={(e) =>
                setClientInfo({ ...clientInfo, phone: e.target.value })
              }
              placeholder="Phone"
              className="h-14 bg-transparent border-0 border-b rounded-none px-0 text-xl focus-visible:ring-0 focus-visible:border-foreground"
            />
            <Input
              value={clientInfo.address}
              onChange={(e) =>
                setClientInfo({ ...clientInfo, address: e.target.value })
              }
              placeholder="Address"
              className="h-14 bg-transparent border-0 border-b rounded-none px-0 text-xl focus-visible:ring-0 focus-visible:border-foreground"
            />
            <Button
              size="lg"
              className="w-full h-14 rounded-full mt-8 text-lg uppercase tracking-wider font-light"
              disabled={isSubmitting}
              onClick={handleConfirmOrder}
            >
              {isSubmitting ? (
                <Loader2 className="animate-spin mx-auto" />
              ) : (
                "Confirm Purchase"
              )}
            </Button>
          </div>
        </div>
      )}

      {step === "success" && (
        <div className="max-w-xl mx-auto px-6 py-32 text-center animate-in fade-in zoom-in">
          <h2 className="text-4xl font-light mb-4">Thank you.</h2>
          <p className="text-muted-foreground text-lg mb-12">
            Your order has been received. We will contact you shortly.
          </p>
          <Button
            variant="outline"
            className="rounded-full h-12 px-8 uppercase tracking-widest text-sm"
            asChild
          >
            <Link to={`/${username}/shop`}>Return to Shop</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
