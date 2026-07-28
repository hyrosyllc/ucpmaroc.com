import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ArrowLeft, Mail, Lock, ShoppingBag } from "lucide-react";

export default function ModernLoginLayout({
  portfolio,
  email,
  setEmail,
  otp,
  setOtp,
  step,
  isLoading,
  error,
  handleSendCode,
  handleVerifyCode,
  navigate,
  shopUrl,
}: any) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-neutral-950 font-sans text-white p-4 pt-24 selection:bg-primary/30 selection:text-white relative overflow-hidden">
      {/* Subtle Background Atmosphere */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg h-[400px] bg-primary/10 blur-[120px] rounded-full pointer-events-none z-0" />

      <div className="w-full max-w-md relative z-10">
        {/* Back to Shop Link */}
        <Button
          variant="ghost"
          className="mb-6 text-neutral-400 hover:text-white hover:bg-white/5 transition-colors"
          onClick={() => navigate(shopUrl)}
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to {portfolio.site_name || "Shop"}
        </Button>

        {/* Login Card */}
        <div className="bg-neutral-900/60 backdrop-blur-xl rounded-3xl p-8 border border-white/10 shadow-2xl">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4 border border-primary/20">
              {step === "email" ? <ShoppingBag size={28} /> : <Lock size={28} />}
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              {step === "email" ? "Customer Portal" : "Verify Identity"}
            </h1>
            <p className="text-sm text-neutral-400 mt-2 font-medium leading-relaxed">
              {step === "email"
                ? "Enter your email to track your orders and manage your account."
                : `We sent a secure 6-digit code to ${email}`}
            </p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium p-3 rounded-xl mb-6 text-center animate-in fade-in">
              {error}
            </div>
          )}

          {step === "email" ? (
            <form onSubmit={handleSendCode} className="space-y-5 animate-in slide-in-from-right-4 duration-500">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-neutral-400">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
                  <Input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10 h-12 bg-black/50 border-white/10 focus:border-primary text-white transition-colors rounded-xl" required />
                </div>
              </div>
              <Button type="submit" className="w-full h-12 font-bold text-base rounded-xl bg-primary text-primary-foreground hover:brightness-110 shadow-[0_0_20px_rgba(var(--primary),0.2)] transition-all" disabled={isLoading}>
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Send Login Code"}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerifyCode} className="space-y-5 animate-in slide-in-from-right-4 duration-500">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-neutral-400">6-Digit Code</Label>
                <Input type="text" placeholder="000000" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))} className="h-14 text-center text-2xl tracking-[0.5em] font-mono font-black bg-black/50 border-white/10 focus:border-primary text-white transition-colors rounded-xl" required />
              </div>
              <Button type="submit" className="w-full h-12 font-bold text-base rounded-xl bg-primary text-primary-foreground hover:brightness-110 shadow-[0_0_20px_rgba(var(--primary),0.2)] transition-all" disabled={isLoading || otp.length < 6}>
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Verify & Log In"}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}