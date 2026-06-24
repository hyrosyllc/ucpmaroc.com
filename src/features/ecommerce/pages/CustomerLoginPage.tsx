import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ArrowLeft, Mail, Lock, ShoppingBag, CheckCircle2 } from "lucide-react";

export default function CustomerLoginPage() {
  const { slug } = useParams<{ slug?: string }>();
  const navigate = useNavigate();

  const [portfolio, setPortfolio] = useState<any>(null);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"email" | "verify">("email");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPortfolio = async () => {
      if (!slug) return;
      const { data } = await supabase
        .from("portfolios")
        .select("id, site_name, theme_config")
        .eq("public_slug", slug)
        .maybeSingle();

      if (data) setPortfolio(data);
      else navigate("/not-found");
    };
    fetchPortfolio();
  }, [slug, navigate]);

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setIsLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
      },
    });

    setIsLoading(false);
    if (error) {
      setError(error.message);
    } else {
      setStep("verify");
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp) return;
    setIsLoading(true);
    setError(null);

    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: "email",
    });

    if (error) {
      setError(error.message);
      setIsLoading(false);
    } else if (data.session) {
      // Success! The CustomerDashboardLayout will handle creating the bridging pro_customers record.
      navigate(`/pro/${slug}/dashboard`);
    }
  };

  if (!portfolio) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-muted/20 p-4 pt-24">
      <div className="w-full max-w-md">
        {/* Back to Shop Link */}
        <Button
          variant="ghost"
          className="mb-6 text-muted-foreground hover:text-foreground"
          onClick={() => navigate(`/pro/${slug}`)}
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to {portfolio.site_name || "Shop"}
        </Button>

        {/* Login Card */}
        <div className="bg-background rounded-3xl p-8 border border-border shadow-xl">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
              {step === "email" ? <ShoppingBag size={28} /> : <Lock size={28} />}
            </div>
            <h1 className="text-2xl font-black text-foreground tracking-tight">
              {step === "email" ? "Customer Portal" : "Enter Verification Code"}
            </h1>
            <p className="text-sm text-muted-foreground mt-2 font-medium">
              {step === "email"
                ? "Enter your email to track your orders and manage your account."
                : `We sent a 6-digit code to ${email}`}
            </p>
          </div>

          {error && (
            <div className="bg-destructive/10 text-destructive text-sm font-bold p-3 rounded-xl mb-6 text-center">
              {error}
            </div>
          )}

          {step === "email" ? (
            <form onSubmit={handleSendCode} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9 h-12 bg-muted/50 border-transparent focus:border-primary focus:bg-background transition-colors"
                    required
                  />
                </div>
              </div>
              <Button type="submit" className="w-full h-12 font-bold text-base rounded-xl" disabled={isLoading}>
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Send Login Code"}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerifyCode} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">6-Digit Code</Label>
                <Input
                  type="text"
                  placeholder="000000"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className="h-14 text-center text-2xl tracking-[0.5em] font-mono font-black bg-muted/50 border-transparent focus:border-primary focus:bg-background transition-colors"
                  required
                />
              </div>
              <Button type="submit" className="w-full h-12 font-bold text-base rounded-xl" disabled={isLoading || otp.length < 6}>
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Verify & Log In"}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}