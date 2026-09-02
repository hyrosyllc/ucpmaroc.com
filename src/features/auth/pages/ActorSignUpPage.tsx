// In src/pages/ActorSignUpPage.tsx

import React, { useState, useEffect } from "react";
import { supabase } from "@/supabaseClient";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Loader2, ArrowLeft, KeyRound, ArrowRightLeft } from "lucide-react";

// --- shadcn/ui Imports ---
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const GoogleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="22" height="22">
    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);

const AppleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
    <path d="M17.05 20.28c-.98.95-2.05 1.8-3.08 1.8-1.09 0-1.44-.67-2.73-.67-1.3 0-1.72.65-2.71.65-1.07 0-2.19-.92-3.13-1.92-1.98-2.12-3.41-6.04-2.39-8.99.5-1.45 1.58-2.5 2.86-3.08 1.25-.56 2.6-.47 3.65-.47 1.09 0 2.23.27 3.25.75.76.36 1.42.87 1.89 1.49-.13.08-1.89 1.08-1.89 3.09 0 2.37 2.12 3.21 2.25 3.26-.03.09-.37 1.25-1.15 2.37-.62.91-1.34 1.84-2.32 1.84M15.17 4.79c.72-.94 1.15-2.16 1.02-3.35-1.07.05-2.39.75-3.16 1.7-.63.78-1.15 2.05-.98 3.26 1.2.1 2.38-.64 3.12-1.61z" />
  </svg>
);

const FacebookIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
    <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
  </svg>
);

const ActorSignUpPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const signupType =
    searchParams.get("type") === "creative" ? "creative" : "actor";

  // --- Auth States ---
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [country, setCountry] = useState("");

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
          .select("id, is_p2p_enabled, role")
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

  // --- STANDARD SIGNUP ACTION ---
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    if (!country) {
      setMessage("Please select your country.");
      setLoading(false);
      return;
    }

    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
          signup_type: signupType,
          role: "actor",
          country: country,
        },
      },
    });

    if (signUpError) {
      console.error("Supabase Auth Error:", signUpError);
      // Catch 500 errors to give the developer/user a much clearer reason why it failed
      if (signUpError.status === 500 || signUpError.message.includes("500")) {
        setMessage("Internal Server Error: This is usually caused by Supabase's email rate limit (3/hour on free tier) or a syntax error in your Email Template.");
      } else {
        setMessage(`Error: ${signUpError.message}`);
      }
      setLoading(false);
      return;
    }

    const user = authData.user;
    if (!user) {
      setMessage("Error: An unknown error occurred.");
      setLoading(false);
      return;
    }

    // Pre-create actor profile
    const isActor = signupType === "actor";
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const cleanSlug = name
      ? `${name.toLowerCase().replace(/[^a-z0-9]/g, "-")}-${randomSuffix}`
      : `user-${user.id.slice(0, 8)}`;

    // Upsert ensures the profile is created with required default values
    // even if a database trigger is missing, delayed, or incomplete.
    await supabase
      .from("actors")
      .upsert({
        user_id: user.id,
        is_p2p_enabled: isActor,
        ActorName: name,
        ActorEmail: email,
        slug: cleanSlug,
        country: country,
        role: "actor",
        Language: 'English (US)', 
        Gender: 'Male',
        Tags: 'Conversational',
        BaseRate_per_Word: 1,
        revisions_allowed: 2,
        WebMultiplier: 1.5,
        BroadcastMultiplier: 3
      }, { onConflict: "user_id" });

    // Check if user already existed
    if (user.identities && user.identities.length === 0) {
      setMessage("Error: Email already registered. Please log in.");
    } else {
      setShowOtpInput(true);
      setMessage("Verification code sent! Please check your email.");
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
      if (signupType === "actor") navigate("/dashboard");
      else navigate("/dashboard/portfolio");
    }
  };

  // --- OAuth Handler ---
  const handleOAuthSignIn = async (
    provider: "google" | "facebook" | "apple"
  ) => {
    setLoading(true);
    setMessage("");
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/dashboard` },
    });
    if (error) {
      setMessage(`Error signing in with ${provider}: ${error.message}`);
      setLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen lg:grid lg:grid-cols-2 bg-background">
      {/* LEFT COLUMN - BRANDING (Hidden on Mobile) */}
      <div className="hidden lg:flex flex-col justify-between relative bg-zinc-950 p-10 lg:p-16 text-white overflow-hidden">
        <div className="absolute inset-0 z-0">
           {/* Abstract Aura */}
           <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(120,119,198,0.15),transparent_50%),radial-gradient(circle_at_bottom_left,rgba(56,189,248,0.15),transparent_50%)]" />
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-primary/20 blur-[120px] rounded-[100%] opacity-50 rotate-45 pointer-events-none" />
           <div className="absolute inset-0 bg-zinc-950/[0.02] backdrop-blur-[1px]" />
           <div className="absolute inset-0 bg-gradient-to-b from-transparent via-zinc-950/10 to-zinc-950" />
        </div>
        <div className="relative z-10 flex items-center justify-between mt-4">
           <Link to="/">
             <img src="https://pub-c6d2173b02a643659ef133753f7ee574.r2.dev/identity/ucp%20logo%20t%20b%20(7).png" alt="UCP Logo" className="h-8 brightness-0 invert hover:opacity-80 transition-opacity" />
           </Link>
           <div className="flex items-center gap-6 text-sm font-bold text-zinc-400">
             <Link to="/" className="hover:text-white transition-colors">Home</Link>
             <Link to="/client-auth" className="flex items-center gap-1.5 hover:text-white transition-colors">
               <ArrowRightLeft size={14} /> Client Portal
             </Link>
           </div>
        </div>
        <div className="relative z-10 mt-auto max-w-lg mb-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
           <h2 className="text-3xl lg:text-4xl font-bold tracking-tight mb-4">Turn Your Talent Into a Business.</h2>
           <p className="text-lg text-zinc-400 font-medium leading-relaxed">Join the industry's fastest-growing network. Build your digital storefront and start monetizing your skills today.</p>
        </div>
      </div>

      {/* RIGHT COLUMN - FORM */}
      <div className="flex items-center justify-center p-6 pt-28 sm:p-12 sm:pt-32 lg:p-16 relative">
        <div className="w-full max-w-[450px] mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          <div className="space-y-2 text-center lg:text-left relative">
            {showOtpInput && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute -top-10 lg:-top-8 left-0 lg:-left-3 text-muted-foreground hover:text-foreground"
                onClick={() => setShowOtpInput(false)}
              >
                <ArrowLeft className="mr-1 h-4 w-4" /> Back
              </Button>
            )}
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              {showOtpInput ? "Check your email" : "Join as a Talent"}
            </h1>
            <p className="text-muted-foreground text-sm font-medium">
              {showOtpInput
                ? `We sent a 6-digit code to ${email}`
                : "Create your talent account to build your storefront and start monetizing your skills."}
            </p>
          </div>

          {message && (
            <Alert variant={message.includes("Error") ? "destructive" : "default"} className={cn("rounded-xl", message.includes("Error") ? "bg-red-500/10 text-red-500 border-red-500/50" : "")}>
              <AlertDescription className="font-medium text-sm">
                {message}
              </AlertDescription>
            </Alert>
          )}

          {showOtpInput ? (
            // --- OTP FORM ---
            <form onSubmit={handleVerifyOtp} className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              <div className="space-y-2">
                <Label htmlFor="otp" className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
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
                    className="pl-14 h-16 text-center text-3xl tracking-[0.5em] font-mono rounded-2xl bg-background border-input focus-visible:ring-primary transition-all shadow-sm"
                  />
                </div>
              </div>
              <Button
                type="submit"
                disabled={loading || otpToken.length < 6}
                className="w-full h-14 text-base rounded-xl font-bold bg-foreground text-background hover:bg-foreground/90 transition-all shadow-sm"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Verify Code"}
              </Button>
            </form>
          ) : (
            // --- STANDARD SIGNUP FORM ---
            <div className="animate-in slide-in-from-left-4 duration-300">
              <form onSubmit={handleSignUp} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Full Name</Label>
                  <Input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="e.g., John Doe"
                    className="h-12 bg-background border-input focus-visible:ring-primary rounded-xl transition-colors shadow-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="you@example.com"
                    className="h-12 bg-background border-input focus-visible:ring-primary rounded-xl transition-colors shadow-sm"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      placeholder="••••••••"
                      className="h-12 bg-background border-input focus-visible:ring-primary rounded-xl transition-colors shadow-sm"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="country" className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Country</Label>
                    <Select value={country} onValueChange={setCountry} required>
                      <SelectTrigger className="h-12 bg-background border-input focus-visible:ring-primary rounded-xl transition-colors shadow-sm">
                        <SelectValue placeholder="Location" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-border">
                        <SelectItem value="Morocco">Morocco</SelectItem>
                        <SelectItem value="United States">United States</SelectItem>
                        <SelectItem value="United Kingdom">United Kingdom</SelectItem>
                        <SelectItem value="Canada">Canada</SelectItem>
                        <SelectItem value="France">France</SelectItem>
                        <SelectItem value="Spain">Spain</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 rounded-xl font-bold text-base bg-foreground text-background hover:bg-foreground/90 transition-all shadow-sm mt-2"
                >
                    {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Get Started"}
                </Button>
              </form>

              <div className="flex items-center gap-4 my-8">
                <div className="flex-1 h-px bg-border"></div>
                <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Or sign up with</span>
                <div className="flex-1 h-px bg-border"></div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <Button variant="outline" type="button" onClick={() => handleOAuthSignIn("google")} disabled={loading} className="h-12 rounded-xl shadow-sm border-border hover:bg-muted/50">
                  <GoogleIcon />
                </Button>
                <Button variant="outline" type="button" onClick={() => handleOAuthSignIn("apple")} disabled={loading} className="h-12 rounded-xl shadow-sm border-border hover:bg-muted/50">
                  <AppleIcon />
                </Button>
                <Button variant="outline" type="button" onClick={() => handleOAuthSignIn("facebook")} disabled={loading} className="h-12 rounded-xl shadow-sm border-border hover:bg-muted/50">
                  <FacebookIcon />
                </Button>
              </div>
            </div>
          )}

          {!showOtpInput && (
            <div className="text-center pt-4">
              <p className="text-sm text-muted-foreground font-medium">
                Already have an account?{" "}
                <Link to="/actor-login" className="text-primary font-bold hover:underline">
                  Log in
                </Link>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ActorSignUpPage;
