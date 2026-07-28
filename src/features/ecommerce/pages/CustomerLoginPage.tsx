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
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"email" | "verify">("email");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
      const isCustomDomain = !MAIN_DOMAINS.some((domain) => window.location.hostname.includes(domain));
      const dashboardUrl = isCustomDomain ? '/dashboard' : `/pro/${portfolio.public_slug}/dashboard`;
      navigate(dashboardUrl);
    }
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
    otp,
    setOtp,
    step,
    isLoading,
    error,
    handleSendCode,
    handleVerifyCode,
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