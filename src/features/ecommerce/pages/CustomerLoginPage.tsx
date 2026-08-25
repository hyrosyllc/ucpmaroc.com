import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/supabaseClient";
import { Loader2 } from "lucide-react";
import ModernLoginLayout from "@/themes/modern/LoginLayout";

// Ensure this matches App.tsx
const MAIN_DOMAINS = [
  "ucpmaroc.com",
  "www.ucpmaroc.com",
  "localhost",
  "127.0.0.1",
  "symmetrical-acorn-697wxxq4r74j3jpj-5173.app.github.dev",
    "psychic-cod-r74vrp5xx9gq2ppr7-5173.app.github.dev",
];

export default function CustomerLoginPage() {
  const { slug } = useParams<{ slug?: string }>();
  const navigate = useNavigate();

  const [portfolio, setPortfolio] = useState<any>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [theme, setTheme] = useState("modern");

  useEffect(() => {
    const fetchPortfolio = async () => {
      const currentHostname = window.location.hostname;
      const isCustomDomain = !MAIN_DOMAINS.some((domain) =>
        currentHostname.includes(domain)
      );

      let query = supabase.from("portfolios").select("id, site_name, public_slug, theme_config");
      
      if (isCustomDomain) {
        query = query.eq("custom_domain", currentHostname);
      } else if (slug) {
        query = query.eq("public_slug", slug);
      } else {
        navigate("/not-found");
        return;
      }

      const { data } = await query.maybeSingle();

      if (data) {
        setPortfolio(data);
        if (data.theme_config?.templateId) {
          setTheme(data.theme_config.templateId);
        }
      } else {
        navigate("/not-found");
      }
    };

    fetchPortfolio();
  }, [slug, navigate]);

  const handlePostAuth = async (user: any) => {
    if (!user || !portfolio?.id) return;

      // 🚀 CREATE/SYNC THE CUSTOMER RECORD
        const { data: existingCustomer } = await supabase
          .from("pro_customers")
          .select("id")
          .eq("user_id", user.id)
          .eq("portfolio_id", portfolio.id)
          .maybeSingle();

      if (!existingCustomer) {
        const fallbackName =
          name || user.user_metadata?.full_name || user.email?.split("@")[0] || "Customer";

        const { data: newCustomer, error: insertError } = await supabase
          .from("pro_customers")
          .insert({
            user_id: user.id,
            portfolio_id: portfolio.id,
            email: user.email,
            name: fallbackName,
          })
          .select()
          .single();

        if (insertError) {
          console.error("Error creating customer record:", insertError);
          setError(
            "Could not create your customer profile. Please contact support."
          );
          return;
        }

        // 🚀 Now, link past guest orders to this new customer account
        if (newCustomer) {
          await supabase
            .from("pro_orders")
            .update({ customer_id: newCustomer.id })
            .eq("portfolio_id", portfolio.id)
            .is("customer_id", null) // Only update orders that are still guests
            .ilike("notes", `%${user.email}%`);
        }
      } else {
        // Customer record already exists, but let's check for unlinked guest orders anyway.
        // This handles the case where a user logged in once, then made guest purchases later.
        await supabase
          .from("pro_orders")
          .update({ customer_id: existingCustomer.id })
          .eq("portfolio_id", portfolio.id)
          .is("customer_id", null)
          .ilike("notes", `%${user.email}%`);
      }

      const isCustomDomain = !MAIN_DOMAINS.some((domain) => window.location.hostname.includes(domain));
      const dashboardUrl = isCustomDomain ? '/dashboard' : `/pro/${portfolio.public_slug}/dashboard`;
      navigate(dashboardUrl);
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    if (isSignUp) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: name }
        }
      });

      if (error) {
        // Gracefully handle existing user error by attempting to sign them in
        if (error.message.toLowerCase().includes('user already registered')) {
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          if (signInError) {
            // If login fails (e.g. wrong password), show the original sign-up error
            setError("An account with this email already exists. Please log in instead.");
          } else if (signInData.session) {
            // On successful login, run the post-auth logic to create customer record
            await handlePostAuth(signInData.session.user);
          }
        } else {
          setError(error.message);
        }
      } else {
        if (data.session) {
          await handlePostAuth(data.session.user);
        } else {
          setSuccessMessage("Sign up successful! Please check your email to confirm your account.");
        }
      }
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
      } else if (data.session) {
        await handlePostAuth(data.session.user);
      }
    }
    setIsLoading(false);
  };

  if (!portfolio) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const isCustomDomain = !MAIN_DOMAINS.some((domain) => window.location.hostname.includes(domain));
  const shopUrl = isCustomDomain ? '/shop' : `/pro/${portfolio.public_slug}/shop`;

  const layoutProps = {
    portfolio,
    email,
    setEmail,
    name,
    setName,
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
  };

  return (
    <>
      {/* In the future, you could add: theme === 'cupertino' ? <CupertinoLoginLayout ... /> : <ModernLoginLayout ... /> */}
      <ModernLoginLayout {...layoutProps} />
    </>
  );
}