import React from "react";
import { Link } from "react-router-dom";
import { 
  Palette, 
  Store, 
  Globe, 
  ArrowRight, 
  LayoutTemplate, 
  Briefcase, 
  Zap 
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function TalentLandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden pt-20">
      {/* HERO SECTION */}
      <section className="relative pt-24 pb-32 flex flex-col items-center justify-center text-center px-4">
        {/* SaaS Background Effects */}
        <div className="absolute inset-0 z-0 pointer-events-none">
           <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:32px_32px] opacity-30" />
           <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full bg-primary/20 blur-[120px]" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-sm font-bold tracking-widest uppercase">
            <Zap size={14} /> For Creators & Talents
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-tight">
            Turn Your Talent Into an <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-400">Empire.</span>
          </h1>
          <p className="text-xl text-muted-foreground font-medium max-w-2xl mx-auto leading-relaxed">
            UCPMAROC gives you the ultimate toolkit. Build a stunning portfolio, sell your services, and connect with global clients directly.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Button asChild size="lg" className="h-14 px-8 text-lg font-bold rounded-full shadow-lg hover:scale-105 transition-transform">
              <Link to="/actor-signup">
                Create Free Account <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-14 px-8 text-lg font-bold rounded-full hover:bg-muted/50 border-border">
              <Link to="/actor-login">Log In to Portal</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* FEATURES GRID */}
      <section className="py-24 bg-card/30 border-y border-border/50 relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">Everything you need to scale.</h2>
            <p className="text-muted-foreground text-lg">One dashboard. Infinite possibilities.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-background border border-border p-8 rounded-3xl shadow-sm hover:border-primary/50 transition-colors">
              <div className="w-14 h-14 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-6">
                <Globe size={28} />
              </div>
              <h3 className="text-xl font-bold mb-3">Portfolio Builder</h3>
              <p className="text-muted-foreground leading-relaxed">
                Drag and drop your way to a breathtaking custom website. Showcase your galleries, reels, and services without writing a single line of code. Connect your own custom domain.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-background border border-border p-8 rounded-3xl shadow-sm hover:border-primary/50 transition-colors">
              <div className="w-14 h-14 bg-blue-500/10 text-blue-500 rounded-2xl flex items-center justify-center mb-6">
                <Store size={28} />
              </div>
              <h3 className="text-xl font-bold mb-3">E-Commerce Engine</h3>
              <p className="text-muted-foreground leading-relaxed">
                Sell digital files, physical merch, or bookable services directly from your profile. Seamlessly process payments via Stripe, Bank Transfer, or Crypto.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-background border border-border p-8 rounded-3xl shadow-sm hover:border-primary/50 transition-colors">
              <div className="w-14 h-14 bg-purple-500/10 text-purple-500 rounded-2xl flex items-center justify-center mb-6">
                <Palette size={28} />
              </div>
              <h3 className="text-xl font-bold mb-3">Theme Studio</h3>
              <p className="text-muted-foreground leading-relaxed">
                Are you a developer or designer? Build custom themes and HTML modules in the built-in IDE. Publish them to the marketplace and earn passive income.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-32 relative z-10 px-4 text-center">
        <div className="max-w-3xl mx-auto space-y-8">
          <Briefcase className="w-16 h-16 text-primary mx-auto opacity-80" />
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight">Ready to join the network?</h2>
          <p className="text-xl text-muted-foreground">
            Join thousands of creatives managing their careers on UCPMAROC.
          </p>
          <Button asChild size="lg" className="h-14 px-10 text-lg font-bold rounded-full shadow-xl hover:scale-105 transition-transform mt-4">
            <Link to="/actor-signup">
              Get Started for Free
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}