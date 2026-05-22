import React, { useEffect } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import { CheckCircle2, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/store/useCartStore";

const MAIN_DOMAINS = [
  "ucpmaroc.com",
  "www.ucpmaroc.com",
  "localhost",
  "127.0.0.1",
  "symmetrical-acorn-697wxxq4r74j3jpj-5173.app.github.dev",
];

const PublicThankYouPage = () => {
  const { portfolio } = useOutletContext<{ portfolio: any }>();
  const navigate = useNavigate();
  const clearCart = useCartStore((state) => state.clearCart);

  useEffect(() => {
    clearCart();
  }, [clearCart]);

  const isCustomDomain = !MAIN_DOMAINS.some((domain) => window.location.hostname.includes(domain));
  const homeUrl = isCustomDomain ? '/' : `/pro/${portfolio.public_slug}`;
  const shopUrl = isCustomDomain ? '/shop' : `/pro/${portfolio.public_slug}/shop`;

  return (
    <div className="max-w-xl mx-auto mt-12 pt-12 md:pt-20 px-4 md:px-8 text-center space-y-8 animate-in fade-in zoom-in duration-500">
      <div className="w-24 h-24 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mx-auto ring-1 ring-green-500/50 shadow-[0_0_30px_rgba(34,197,94,0.2)]">
        <CheckCircle2 size={48} className="animate-in zoom-in duration-500 delay-150" />
      </div>
      
      <div className="space-y-3">
        <h1 className="text-4xl md:text-5xl font-black text-foreground tracking-tight">
          Order Confirmed!
        </h1>
        <p className="text-lg text-muted-foreground">
          Thank you for your purchase. A receipt has been sent to your email, and the seller has been notified of your order.
        </p>
      </div>

      <div className="p-8 bg-muted/10 border border-border/40 rounded-3xl mt-8 shadow-inner">
        <p className="text-sm font-bold text-muted-foreground mb-5 uppercase tracking-widest">What's next?</p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={() => navigate(homeUrl)}
            className="flex-1 h-14 font-bold text-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all hover:scale-[1.02] shadow-lg rounded-xl"
          >
            Return Home
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate(shopUrl)}
            className="flex-1 h-14 font-bold text-lg hover:bg-muted/50 transition-all rounded-xl"
          >
            <ShoppingBag className="w-5 h-5 mr-2" /> Browse Shop
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PublicThankYouPage;