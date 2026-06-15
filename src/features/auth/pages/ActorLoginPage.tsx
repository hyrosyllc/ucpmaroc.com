// In src/pages/ActorLoginPage.tsx

import React, { useState, useEffect } from "react";
import { supabase } from "@/supabaseClient";
import { Link, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

// --- shadcn/ui Imports ---
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
// ---

const GoogleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="28" height="28">
    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);

const AppleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="28" height="28" fill="currentColor">
    <path d="M17.05 20.28c-.98.95-2.05 1.8-3.08 1.8-1.09 0-1.44-.67-2.73-.67-1.3 0-1.72.65-2.71.65-1.07 0-2.19-.92-3.13-1.92-1.98-2.12-3.41-6.04-2.39-8.99.5-1.45 1.58-2.5 2.86-3.08 1.25-.56 2.6-.47 3.65-.47 1.09 0 2.23.27 3.25.75.76.36 1.42.87 1.89 1.49-.13.08-1.89 1.08-1.89 3.09 0 2.37 2.12 3.21 2.25 3.26-.03.09-.37 1.25-1.15 2.37-.62.91-1.34 1.84-2.32 1.84M15.17 4.79c.72-.94 1.15-2.16 1.02-3.35-1.07.05-2.39.75-3.16 1.7-.63.78-1.15 2.05-.98 3.26 1.2.1 2.38-.64 3.12-1.61z" />
  </svg>
);

const FacebookIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="28" height="28" fill="currentColor">
    <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
  </svg>
);

const ActorLoginPage = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        // Fetch ID AND the Role column
        const { data: actorProfile } = await supabase
          .from("actors")
          .select("id, role")
          .eq("user_id", session.user.id)
          .maybeSingle();

        if (actorProfile) {
          // Route admins to the admin panel, actors to the dashboard
          if (actorProfile.role === "admin") {
            navigate("/admin");
          } else {
            navigate("/dashboard");
          }
        } else {
          // Not an actor/admin, check if they are a client
          const { data: clientProfile } = await supabase
            .from("clients")
            .select("id")
            .eq("user_id", session.user.id)
            .maybeSingle();

          if (clientProfile) {
            navigate("/client-dashboard");
          }
        }
      }
    };

    checkSession();
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    // On successful login, check their role to route them correctly
    if (authData.session) {
      const { data: actorProfile } = await supabase
        .from("actors")
        .select("role")
        .eq("user_id", authData.session.user.id)
        .maybeSingle();

      if (actorProfile?.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/dashboard");
      }
    }

    setLoading(false);
  };

  const handleOAuthSignIn = async (
    provider: "google" | "facebook" | "apple"
  ) => {
    setLoading(true);
    setMessage("");
    // OAuth automatically redirects to the URL provided.
    // Note: You may need a central routing handler on the /dashboard page
    // to bounce admins to /admin if they log in via OAuth.
    const { error } = await supabase.auth.signInWithOAuth({
      provider: provider,
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    });
    if (error) {
      setMessage(`Error signing in with ${provider}: ${error.message}`);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Abstract Background for Theme Style */}
      <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] pointer-events-none animate-pulse" style={{ animationDuration: '10s' }} />
      <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-blue-500/20 rounded-full blur-[120px] pointer-events-none animate-pulse" style={{ animationDuration: '12s', animationDelay: '2s' }} />

      <div className="w-full max-w-[400px] relative z-10 pt-10">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-semibold tracking-tight mb-2">Welcome back</h1>
          <p className="text-muted-foreground text-sm">Sign in to your UCP account</p>
        </div>

        <div className="bg-card/50 backdrop-blur-xl border border-border/50 shadow-2xl rounded-3xl p-8">
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="name@example.com"
                className="h-12 bg-background/50 border-muted-foreground/20 focus-visible:ring-primary rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Password</Label>
                <Link to="/forgot-password" className="text-xs text-primary hover:underline font-medium">Forgot?</Link>
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="h-12 bg-background/50 border-muted-foreground/20 focus-visible:ring-primary rounded-xl"
              />
            </div>

            {message && (
              <Alert variant="destructive" className="border-red-500/50 bg-red-500/10 text-red-500">
                <AlertDescription className="text-sm font-medium">{message}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-xl font-bold text-base shadow-lg hover:shadow-xl transition-all mt-2"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Sign In"}
            </Button>
          </form>

          <div className="flex items-center gap-4 my-8">
            <div className="flex-1 h-px bg-border/50"></div>
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Or continue with</span>
            <div className="flex-1 h-px bg-border/50"></div>
          </div>

          <div className="flex items-center justify-center gap-4">
            <Button
              variant="ghost"
              type="button"
              onClick={() => handleOAuthSignIn("google")}
              disabled={loading}
              className="h-16 w-16 rounded-2xl hover:bg-muted/80 transition-all flex items-center justify-center"
            >
              <GoogleIcon />
            </Button>
            <Button
              variant="ghost"
              type="button"
              onClick={() => handleOAuthSignIn("apple")}
              disabled={loading}
              className="h-16 w-16 rounded-2xl hover:bg-muted/80 transition-all flex items-center justify-center"
            >
              <AppleIcon />
            </Button>
            <Button
              variant="ghost"
              type="button"
              onClick={() => handleOAuthSignIn("facebook")}
              disabled={loading}
              className="h-16 w-16 rounded-2xl hover:bg-muted/80 transition-all flex items-center justify-center"
            >
              <FacebookIcon />
            </Button>
          </div>
        </div>

        <div className="text-center mt-8">
          <p className="text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link to="/actor-signup" className="text-primary font-semibold hover:underline">
              Sign up now
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ActorLoginPage;
