import React from "react";
import { Outlet, Link, useOutletContext } from "react-router-dom";
import { ArrowLeft, Lock, ShieldCheck } from "lucide-react";
import { isCustomDomain as checkIsCustomDomain } from "./utils";

const CheckoutLayout = () => {
  // Grab the portfolio context passed down from the root PublicPortfolioLayout
  const { portfolio } = useOutletContext<{ portfolio: any }>();

  const isCustomDomain = checkIsCustomDomain();
  const shopUrl = isCustomDomain ? '/shop' : `/pro/${portfolio.public_slug}/shop`;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col relative pt-20 md:pt-24 font-sans selection:bg-primary selection:text-primary-foreground">
      {/* Background Atmosphere */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay pointer-events-none z-0"></div>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-[400px] bg-primary/10 blur-[100px] rounded-full pointer-events-none z-0" />

      {/* THEME DEV AREA: CUSTOM CHECKOUT HEADER 
        Often in e-commerce, the main navigation is hidden during checkout to reduce 
        distractions. This adds a dedicated, minimal checkout header.
      */}
      <div className="w-full max-w-6xl mx-auto px-4 py-6 md:px-8 flex justify-between items-center border-b border-border/40 relative z-10">
        <Link
          to={shopUrl}
          className="flex items-center text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={16} className="mr-2" />
          Back to Shop
        </Link>

        <div className="flex items-center gap-2 text-sm font-bold text-foreground bg-card/50 border border-border/40 px-4 py-1.5 rounded-full backdrop-blur-md shadow-sm">
          <Lock size={14} className="text-primary" /> Secure Checkout
        </div>
      </div>

      {/* THEME DEV AREA: MAIN CONTENT WRAPPER 
        This is where the theme developer controls the padding, max-width, 
        and background patterns of the checkout area.
      */}
      <main className="flex-grow w-full h-full relative z-10 pb-20">
        {/* The Stripe logic from PublicCheckoutPage.tsx is injected right here */}
        <Outlet context={{ portfolio }} />
      </main>

      {/* THEME DEV AREA: TRUST FOOTER 
        A minimal footer to reinforce security before they put their card in.
      */}
      <footer className="py-8 border-t border-border/40 bg-card/50 backdrop-blur-md text-center text-sm text-muted-foreground relative z-10">
        <div className="flex items-center justify-center gap-2 mb-2">
          <ShieldCheck size={18} className="text-primary" />
          <span className="font-medium text-foreground/80">
            Payments processed securely by Stripe
          </span>
        </div>
        <p>All transactions are secure and encrypted.</p>
      </footer>
    </div>
  );
};

export default CheckoutLayout;
