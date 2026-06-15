// In src/pages/ClientAuthPage.tsx

import React, { useState, useEffect } from "react";
import { supabase } from "@/supabaseClient";
import { useLocation, useNavigate } from "react-router-dom";
import { UserCircle, RefreshCw, KeyRound, ArrowLeft } from "lucide-react";
import { useTranslation } from "react-i18next";

// --- shadcn/ui Imports ---
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";

const ClientAuthPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  // --- Auth States ---
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState(location.state?.email || "");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  // --- OTP States ---
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [otpToken, setOtpToken] = useState("");

  // --- SECURE AAA+ SESSION CHECK ---
  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (user && !error) {
        const { data: actorProfile } = await supabase
          .from("actors")
          .select("id, role, is_p2p_enabled")
          .eq("user_id", user.id)
          .maybeSingle();

        if (actorProfile) {
          if (actorProfile.role === "admin") navigate("/admin");
          else if (actorProfile.is_p2p_enabled) navigate("/dashboard");
          else navigate("/dashboard/portfolio");
        } else {
          const { data: clientProfile } = await supabase
            .from("clients")
            .select("id")
            .eq("user_id", user.id)
            .maybeSingle();

          if (clientProfile) navigate("/client-dashboard");
        }
      }
    };
    checkSession();
  }, [navigate]);

  // --- STANDARD AUTH ACTION (Login / Initial Signup) ---
  const handleAuthAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    if (isSignUp) {
      if (name.trim() === "") {
        setMessage("Error: Please enter your full name.");
        setLoading(false);
        return;
      }

      const { data: authData, error: signUpError } = await supabase.auth.signUp(
        {
          email,
          password,
          options: {
            data: { full_name: name, role: "client" },
          },
        }
      );

      if (signUpError) {
        setMessage(`Error: ${signUpError.message}`);
      } else if (authData.user?.identities?.length === 0) {
        setMessage("Error: Email already registered. Please log in.");
      } else {
        // Transition to OTP Screen
        setShowOtpInput(true);
        setMessage("Verification code sent! Please check your email.");
      }
    } else {
      // Login Flow
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setMessage(`Error: ${error.message}`);
      } else if (authData.user) {
        const { data: actorProfile } = await supabase
          .from("actors")
          .select("role, is_p2p_enabled")
          .eq("user_id", authData.user.id)
          .maybeSingle();

        if (actorProfile) {
          if (actorProfile.role === "admin") navigate("/admin");
          else if (actorProfile.is_p2p_enabled) navigate("/dashboard");
          else navigate("/dashboard/portfolio");
        } else {
          navigate("/client-dashboard");
        }
      }
    }
    setLoading(false);
  };

  // --- OTP VERIFICATION ACTION ---
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const {
      data: { session },
      error,
    } = await supabase.auth.verifyOtp({
      email,
      token: otpToken,
      type: "signup",
    });

    if (error) {
      setMessage(`Error: ${error.message}`);
      setLoading(false);
      return;
    }

    if (session) {
      // Successfully verified and logged in.
      navigate("/client-dashboard");
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2 bg-background text-foreground pt-20">
      {/* 1. Left Branding Column */}
      <div className="hidden md:flex flex-col justify-center items-center p-12 bg-gradient-to-br from-purple-900 via-slate-900 to-slate-900 border-r border-border">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 rounded-full mb-6 border border-foreground/20 shadow-xl">
            <UserCircle size={40} className="text-white" />
          </div>
          <h1 className="text-5xl font-bold mb-4 tracking-tight text-white">
            {t("auth.clientPortal")}
          </h1>
          <p className="text-slate-300 max-w-sm text-lg">
            {t("auth.accessOrders")}
          </p>
        </div>
      </div>

      {/* 2. Right Form Column */}
      <div className="flex flex-col justify-center items-center p-8 bg-background relative">
        {showOtpInput && (
          <Button
            variant="ghost"
            className="absolute top-8 left-8 text-muted-foreground"
            onClick={() => setShowOtpInput(false)}
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
        )}

        <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* HEADER DYNAMICS */}
          <div className="mb-8 text-center md:text-left">
            <h2 className="text-4xl font-bold mb-2 tracking-tight">
              {showOtpInput
                ? "Check your email"
                : isSignUp
                ? t("auth.createClientAccount")
                : t("auth.logInBtn")}
            </h2>
            <p className="text-muted-foreground">
              {showOtpInput
                ? `We sent a 6-digit code to ${email}`
                : isSignUp
                ? t("auth.accessOrders")
                : "Welcome back! Enter your details."}
            </p>
          </div>

          {/* ALERTS */}
          {message && (
            <Alert
              variant={message.includes("Error") ? "destructive" : "default"}
              className="mb-6"
            >
              <AlertDescription className="font-medium">
                {message}
              </AlertDescription>
            </Alert>
          )}

          {/* FORMS */}
          {showOtpInput ? (
            // --- OTP FORM ---
            <form onSubmit={handleVerifyOtp} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="otp" className="sr-only">
                  Verification Code
                </Label>
                <div className="relative">
                  <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-6 h-6" />
                  <Input
                    id="otp"
                    type="text"
                    value={otpToken}
                    onChange={(e) =>
                      setOtpToken(e.target.value.replace(/\D/g, ""))
                    }
                    required
                    placeholder="000000"
                    maxLength={6}
                    className="pl-14 py-8 text-center text-3xl tracking-[0.5em] font-mono rounded-xl bg-muted/50 border-2 focus-visible:border-primary transition-all"
                  />
                </div>
              </div>
              <Button
                type="submit"
                disabled={loading || otpToken.length < 6}
                className="w-full py-6 text-lg rounded-xl shadow-lg"
              >
                {loading && <RefreshCw className="mr-2 h-5 w-5 animate-spin" />}
                {loading ? "Verifying..." : "Verify Code"}
              </Button>
            </form>
          ) : (
            // --- STANDARD FORM ---
            <form onSubmit={handleAuthAction} className="space-y-5">
              {isSignUp && (
                <div className="space-y-2">
                  <Label htmlFor="name">{t("auth.fullName")}</Label>
                  <Input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="e.g., Jane Doe"
                    className="py-5"
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">{t("auth.email")}</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                  className="py-5"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">{t("auth.password")}</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="py-5"
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full py-6 text-lg rounded-xl shadow-lg mt-2"
              >
                {loading && <RefreshCw className="mr-2 h-5 w-5 animate-spin" />}
                {loading
                  ? "Processing..."
                  : isSignUp
                  ? t("auth.createAccountBtn")
                  : t("auth.logInBtn")}
              </Button>
            </form>
          )}

          {/* FOOTER TOGGLES (Hidden during OTP) */}
          {!showOtpInput && (
            <>
              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                  <Separator />
                </div>
                <div className="relative flex justify-center text-xs uppercase font-bold tracking-widest">
                  <span className="bg-background px-3 text-muted-foreground">
                    {t("auth.orContinueWith")}
                  </span>
                </div>
              </div>
              <div className="text-center mt-4">
                <Button
                  variant="ghost"
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="text-muted-foreground hover:text-primary"
                >
                  {isSignUp
                    ? t("auth.alreadyHaveAccount")
                    : t("auth.needAccount")}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClientAuthPage;
