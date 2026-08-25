import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ArrowLeft, Mail, Lock, User } from "lucide-react";

export default function ModernLoginLayout({
  portfolio,
  name,
  setName,
  email,
  setEmail,
  password,
  setPassword,
  isSignUp,
  setIsSignUp,
  isLoading,
  error,
  successMessage,
  handleAuth,
  navigate,
  shopUrl,
}: any) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background font-sans text-foreground p-4 pt-24 selection:bg-primary/30 selection:text-primary-foreground relative overflow-hidden">
      {/* Subtle Background Atmosphere */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg h-[400px] bg-primary/10 blur-[120px] rounded-full pointer-events-none z-0" />

      <div className="w-full max-w-md relative z-10">
        {/* Back to Shop Link */}
        <Button
          variant="ghost"
          className="mb-6 text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-colors"
          onClick={() => navigate(shopUrl)}
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to {portfolio.site_name || "Shop"}
        </Button>

        {/* Login Card */}
        <div className="bg-card/60 backdrop-blur-xl rounded-3xl p-8 border border-border shadow-2xl">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4 border border-primary/20">
              <Lock size={28} />
            </div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">
              {isSignUp ? "Create an Account" : "Customer Portal"}
            </h1>
            <p className="text-sm text-muted-foreground mt-2 font-medium leading-relaxed">
              {isSignUp
                ? "Sign up to track your orders and manage your account."
                : "Sign in to track your orders and manage your account."}
            </p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-500 dark:text-red-400 text-sm font-medium p-3 rounded-xl mb-6 text-center animate-in fade-in">
              {error}
            </div>
          )}
          
          {successMessage && (
            <div className="bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 text-sm font-medium p-3 rounded-xl mb-6 text-center animate-in fade-in">
              {successMessage}
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-5 animate-in slide-in-from-right-4 duration-500">
            {isSignUp && (
              <div className="space-y-2 animate-in fade-in zoom-in duration-300">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input type="text" placeholder="Jane Doe" value={name} onChange={(e) => setName(e.target.value)} className="pl-10 h-12 bg-background/50 border-border focus:border-primary text-foreground transition-colors rounded-xl" required />
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10 h-12 bg-background/50 border-border focus:border-primary text-foreground transition-colors rounded-xl" required />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10 h-12 bg-background/50 border-border focus:border-primary text-foreground transition-colors rounded-xl" required minLength={6} />
              </div>
            </div>
            <Button type="submit" className="w-full h-12 font-bold text-base rounded-xl bg-primary text-primary-foreground hover:brightness-110 shadow-[0_0_20px_rgba(var(--primary),0.2)] transition-all" disabled={isLoading}>
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isSignUp ? "Sign Up" : "Log In")}
            </Button>
            <div className="mt-4 text-center">
              <Button type="button" variant="ghost" className="text-muted-foreground hover:text-foreground text-sm" onClick={() => setIsSignUp(!isSignUp)} disabled={isLoading}>
                {isSignUp ? "Already have an account? Log In" : "Don't have an account? Sign Up"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}