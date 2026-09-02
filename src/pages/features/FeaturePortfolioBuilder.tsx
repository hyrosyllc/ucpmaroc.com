import React from "react";
import { Link } from "react-router-dom";
import { 
  LayoutTemplate, 
  Layers, 
  Smartphone, 
  Palette, 
  ArrowRight, 
  CheckCircle2, 
  Globe,
  MousePointerClick
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function FeaturePortfolioBuilder() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden pt-20 font-sans selection:bg-primary/20 selection:text-primary">
      
      {/* 🚀 HERO SECTION */}
      <section className="relative pt-24 pb-32 flex flex-col items-center justify-center text-center px-4">
        {/* SaaS Abstract Grid Background */}
        <div className="absolute inset-0 z-0 pointer-events-none">
           <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:32px_32px]" />
           <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[800px] h-[600px] rounded-full bg-primary/20 blur-[150px]" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-sm font-bold tracking-widest uppercase">
            <LayoutTemplate size={14} /> Portfolio Builder
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-tight">
            Build Your Digital <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-400">Empire.</span>
          </h1>
          <p className="text-xl text-muted-foreground font-medium max-w-2xl mx-auto leading-relaxed">
            A real-time, drag-and-drop canvas designed specifically for creatives. Launch a breathtaking, high-converting portfolio in minutes.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Button asChild size="lg" className="h-14 px-8 text-lg font-bold rounded-full shadow-lg hover:scale-105 transition-transform">
              <Link to="/actor-signup">
                Start Building Free <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </Button>
          </div>
        </div>

        {/* Dashboard Preview Graphic */}
        <div className="relative z-10 w-full max-w-6xl mx-auto mt-20 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-200">
           <div className="rounded-2xl border border-border/50 bg-card shadow-2xl overflow-hidden aspect-[16/9] relative group">
             <div className="absolute inset-0 flex items-center justify-center bg-muted/20">
                {/* Placeholder for actual dashboard screenshot */}
                <div className="text-center text-muted-foreground opacity-50">
                  <LayoutTemplate className="w-20 h-20 mx-auto mb-4" />
                  <p className="font-bold text-xl">Drag & Drop Interface Graphic Here</p>
                </div>
             </div>
           </div>
        </div>
      </section>

      {/* 🚀 CORE FEATURES BENTO GRID */}
      <section className="py-24 bg-card/30 border-y border-border/50 relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">Unmatched Flexibility.</h2>
            <p className="text-muted-foreground text-lg">Everything you need to showcase your talent, no coding required.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="bg-background border border-border p-8 rounded-3xl shadow-sm hover:border-primary/50 transition-colors col-span-1 md:col-span-2 lg:col-span-2 flex flex-col justify-center overflow-hidden relative">
              <div className="absolute right-0 top-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px]" />
              <div className="relative z-10">
                <div className="w-14 h-14 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-6">
                  <MousePointerClick size={28} />
                </div>
                <h3 className="text-2xl font-bold mb-3">Live Interactive Canvas</h3>
                <p className="text-muted-foreground leading-relaxed max-w-md">
                  Experience true WYSIWYG (What You See Is What You Get). Drag sections, rearrange content, and see the exact mobile or desktop view update instantly in real-time.
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="bg-background border border-border p-8 rounded-3xl shadow-sm hover:border-primary/50 transition-colors">
              <div className="w-14 h-14 bg-blue-500/10 text-blue-500 rounded-2xl flex items-center justify-center mb-6">
                <Palette size={28} />
              </div>
              <h3 className="text-xl font-bold mb-3">AAA+ Themes</h3>
              <p className="text-muted-foreground leading-relaxed">
                Apply premium themes like "Cinematic Dark" or "Cupertino" with a single click. Our global design engine inherits your brand colors effortlessly.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-background border border-border p-8 rounded-3xl shadow-sm hover:border-primary/50 transition-colors">
              <div className="w-14 h-14 bg-purple-500/10 text-purple-500 rounded-2xl flex items-center justify-center mb-6">
                <Layers size={28} />
              </div>
              <h3 className="text-xl font-bold mb-3">Pre-Built Blocks</h3>
              <p className="text-muted-foreground leading-relaxed">
                Over 15+ professionally designed sections including Video Sliders, E-Commerce Grids, Pricing Tables, and Lead Capture Forms.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-background border border-border p-8 rounded-3xl shadow-sm hover:border-primary/50 transition-colors">
              <div className="w-14 h-14 bg-green-500/10 text-green-500 rounded-2xl flex items-center justify-center mb-6">
                <Globe size={28} />
              </div>
              <h3 className="text-xl font-bold mb-3">Custom Domains</h3>
              <p className="text-muted-foreground leading-relaxed">
                Connect your own domain (e.g., yourname.com) directly from the dashboard. We handle the SSL certificates and global CDN hosting automatically.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-background border border-border p-8 rounded-3xl shadow-sm hover:border-primary/50 transition-colors">
              <div className="w-14 h-14 bg-orange-500/10 text-orange-500 rounded-2xl flex items-center justify-center mb-6">
                <Smartphone size={28} />
              </div>
              <h3 className="text-xl font-bold mb-3">Mobile Optimized</h3>
              <p className="text-muted-foreground leading-relaxed">
                Every block and theme is rigorously tested to ensure flawless typography, padding, and performance on all mobile devices.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 🚀 FINAL CTA */}
      <section className="py-32 relative z-10 px-4 text-center">
        <div className="absolute inset-0 bg-primary/5 pointer-events-none" />
        <div className="max-w-3xl mx-auto space-y-8 relative z-10">
          <LayoutTemplate className="w-16 h-16 text-primary mx-auto opacity-80" />
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight">Stop renting space on social media.</h2>
          <p className="text-xl text-muted-foreground">
            Own your digital storefront and stand out from the competition.
          </p>
          <div className="flex items-center justify-center gap-6 mt-8">
             <ul className="text-sm font-medium text-muted-foreground text-left space-y-2">
               <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-primary"/> Free 14-Day Pro Trial</li>
               <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-primary"/> No Credit Card Required</li>
             </ul>
             <Button asChild size="lg" className="h-14 px-10 text-lg font-bold rounded-full shadow-xl hover:scale-105 transition-transform">
               <Link to="/actor-signup">Get Started</Link>
             </Button>
          </div>
        </div>
      </section>
    </div>
  );
}