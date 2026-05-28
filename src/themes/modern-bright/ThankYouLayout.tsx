import React from "react";
import { Outlet, Link, useOutletContext } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { isCustomDomain as checkIsCustomDomain } from "./utils";

const ThankYouLayout = () => {
  const { portfolio } = useOutletContext<{ portfolio: any }>();

  const isCustomDomain = checkIsCustomDomain();
  const shopUrl = isCustomDomain ? '/shop' : `/pro/${portfolio.public_slug}/shop`;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col relative pt-20 md:pt-24 font-sans selection:bg-primary selection:text-primary-foreground print:bg-white print:text-black print:pt-0">
      {/* Background Atmosphere */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay pointer-events-none z-0 print:hidden"></div>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-[400px] bg-primary/10 blur-[100px] rounded-full pointer-events-none z-0 print:hidden" />

      {/* Distraction-Free Header */}
      <div className="w-full max-w-6xl mx-auto px-4 py-6 md:px-8 flex justify-between items-center border-b border-border/40 relative z-10 print:hidden">
        <Link
          to={shopUrl}
          className="flex items-center text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={16} className="mr-2" />
          Back to Shop
        </Link>
      </div>

      <main className="flex-grow w-full h-full relative z-10 pb-20">
        <Outlet context={{ portfolio }} />
      </main>
    </div>
  );
};

export default ThankYouLayout;