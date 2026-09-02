import React from "react";
import { Link } from "react-router-dom";
import { 
  Users, 
  LayoutDashboard, 
  CreditCard, 
  ArrowRight, 
  ShieldCheck, 
  MessageSquare, 
  Building2 
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ClientLandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden pt-20">
      {/* HERO SECTION */}
      <section className="relative pt-24 pb-32 flex flex-col items-center justify-center text-center px-4">
        {/* SaaS Background Effects */}
        <div className="absolute inset-0 z-0 pointer-events-none">
           <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
           <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-600/20 blur-[120px]" />
           <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] rounded-full bg-purple-600/20 blur-[120px]" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 text-sm font-bold tracking-widest uppercase">
            <Building2 size={14} /> For Businesses & Clients
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-tight">
            Scale Your Vision With <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Elite Talent.</span>
          </h1>
          <p className="text-xl text-muted-foreground font-medium max-w-2xl mx-auto leading-relaxed">
            Discover world-class creatives, securely manage your bookings, and track every deliverable through a dedicated enterprise portal.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Button asChild size="lg" className="h-14 px-8 text-lg font-bold rounded-full shadow-lg bg-indigo-600 hover:bg-indigo-700 text-white hover:scale-105 transition-transform">
              <Link to="/client-auth">
                Create Client Account <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-14 px-8 text-lg font-bold rounded-full hover:bg-muted/50 border-border">
              <Link to="/client-auth">Log In</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* FEATURES GRID */}
      <section className="py-24 bg-card/30 border-y border-border/50 relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">A CRM Built for Creatives.</h2>
            <p className="text-muted-foreground text-lg">Manage all your commissioned projects in one secure place.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-background border border-border p-8 rounded-3xl shadow-sm hover:border-indigo-500/50 transition-colors">
              <div className="w-14 h-14 bg-indigo-500/10 text-indigo-500 rounded-2xl flex items-center justify-center mb-6">
                <Users size={28} />
              </div>
              <h3 className="text-xl font-bold mb-3">Global Talent Pool</h3>
              <p className="text-muted-foreground leading-relaxed">
                Browse verified portfolios, listen to high-quality audio demos, and connect directly with the talent you need. No agency middlemen required.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-background border border-border p-8 rounded-3xl shadow-sm hover:border-indigo-500/50 transition-colors">
              <div className="w-14 h-14 bg-green-500/10 text-green-500 rounded-2xl flex items-center justify-center mb-6">
                <LayoutDashboard size={28} />
              </div>
              <h3 className="text-xl font-bold mb-3">Order Management</h3>
              <p className="text-muted-foreground leading-relaxed">
                Your client dashboard tracks every order. From "Pending" to "Delivered", securely download your digital files and audio stems the second they are ready.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-background border border-border p-8 rounded-3xl shadow-sm hover:border-indigo-500/50 transition-colors">
              <div className="w-14 h-14 bg-amber-500/10 text-amber-500 rounded-2xl flex items-center justify-center mb-6">
                <MessageSquare size={28} />
              </div>
              <h3 className="text-xl font-bold mb-3">Direct Communication</h3>
              <p className="text-muted-foreground leading-relaxed">
                Each order features a dedicated live chat. Request revisions, clarify scripts, and communicate directly with your hired talent in real-time.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-32 relative z-10 px-4 text-center">
        <div className="max-w-3xl mx-auto space-y-8">
          <ShieldCheck className="w-16 h-16 text-indigo-500 mx-auto opacity-80" />
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight">Hire with confidence.</h2>
          <p className="text-xl text-muted-foreground">
            100% secure payments, verified professionals, and guaranteed delivery.
          </p>
          <Button asChild size="lg" className="h-14 px-10 text-lg font-bold rounded-full shadow-xl bg-indigo-600 hover:bg-indigo-700 text-white hover:scale-105 transition-transform mt-4">
            <Link to="/client-auth">
              Access Client Portal
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}