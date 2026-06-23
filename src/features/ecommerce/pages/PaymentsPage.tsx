import React, { useEffect, useState } from "react";
import { supabase } from "@/supabaseClient";
import { useOutletContext, useNavigate } from "react-router-dom";
import { ActorDashboardContextType } from "@/layouts/ActorDashboardLayout"; "@/features/talent-marketplace";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Loader2,
  Globe,
  Store,
  Lock,
  CreditCard,
  Zap,
  Landmark,
  Bitcoin,
  CheckCircle2,
  AlertCircle,
  Package,
  Plus,
  X,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  NotificationContainer,
  Notification,
} from "@/components/ui/NotificationToast";
import { useSubscription } from "@/context/SubscriptionContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const PaymentsPage = () => {
  const { actorData, selectedSiteId, setSelectedSiteId } = useOutletContext<ActorDashboardContextType>();
  const { plan: currentPlanId } = useSubscription();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>({});
  const [portfolios, setPortfolios] = useState<any[]>([]);

  const [isConnectingStripe, setIsConnectingStripe] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Dynamic Payment Settings State
  const [codEnabled, setCodEnabled] = useState(true);
  const [bankEnabled, setBankEnabled] = useState(false);
  const [banks, setBanks] = useState<{name: string, holder: string, iban: string}[]>([{ name: "", holder: "", iban: "" }]);
  const [activeBankIndex, setActiveBankIndex] = useState<number | null>(0);
  const [cryptoEnabled, setCryptoEnabled] = useState(false);
  const [cryptoWallet, setCryptoWallet] = useState("");
  
  const [isSavingPayment, setIsSavingPayment] = useState<string | null>(null);

  // Check if they are on the Pro plan (assuming 'pro' is the ID for the top tier)
  const isPro = currentPlanId === "pro";

  const notify = (
    type: "success" | "error" | "info",
    title: string,
    message?: string
  ) => {
    const id = Math.random().toString(36).substring(7);
    setNotifications((prev) => [...prev, { id, type, title, message }]);
  };

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const fetchData = async () => {
    if (!actorData?.id) return;
    setLoading(true);

    const { data: actor } = await supabase
      .from("actors")
      .select("*")
      .eq("id", actorData.id)
      .single();

    if (actor) {
      setProfile(actor);
      // Load existing crypto wallet if available
      if (actor.crypto_wallet) setCryptoWallet(actor.crypto_wallet);
    }

    const { data: sites } = await supabase
      .from("portfolios")
      .select("*")
      .eq("actor_id", actorData.id)
      .order("created_at", { ascending: false });

    if (sites) {
      setPortfolios(sites);
      if (sites.length > 0) {
        if (!selectedSiteId || selectedSiteId === "all" || !sites.find(s => s.id === selectedSiteId)) {
           setSelectedSiteId(sites[0].id);
        }
      }
    }

    setLoading(false);
  };

  // Sync local form state when context switches
  useEffect(() => {
    if (!loading && portfolios.length > 0 && selectedSiteId && selectedSiteId !== "all") {
      const source = portfolios.find(p => p.id === selectedSiteId);
      const pConfig = source?.theme_config?.payments || {};

      setCodEnabled(pConfig.cod?.enabled ?? true);
      setBankEnabled(pConfig.bank?.enabled ?? false);
      
      let loadedBanks = [];
      if (pConfig.bank?.accounts && Array.isArray(pConfig.bank.accounts)) {
        loadedBanks = pConfig.bank.accounts;
      } else if (pConfig.bank?.name) {
        loadedBanks = [{ name: pConfig.bank.name, holder: pConfig.bank.holder, iban: pConfig.bank.iban }];
      }
      if (loadedBanks.length === 0) loadedBanks = [{ name: "", holder: "", iban: "" }];
      setBanks(loadedBanks);
      
      setCryptoEnabled(pConfig.crypto?.enabled ?? false);
      setCryptoWallet(pConfig.crypto?.wallet ?? "");
    }
  }, [selectedSiteId, portfolios, profile, loading]);

  useEffect(() => {
    fetchData();
  }, [actorData.id]);

  // --- STRIPE EXPRESS LOGIC (MANAGED PAYMENTS) ---
  const handleConnectExpress = async () => {
    if (!actorData?.id || !selectedSiteId || selectedSiteId === "all") return;
    setIsConnectingStripe(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        "stripe-connect",
        {
          body: {
            actorId: actorData.id,
            portfolioId: selectedSiteId,
            returnUrl: window.location.origin + "/dashboard/payments",
          },
        }
      );
      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      notify("error", "Stripe Error", err.message);
      setIsConnectingStripe(false);
    }
  };

  // --- STRIPE STANDARD LOGIC (BRING YOUR OWN) ---
  const handleConnectStandard = () => {
    if (!isPro) {
      navigate("/dashboard/settings?tab=billing");
      return;
    }

    if (!actorData?.id || !selectedSiteId || selectedSiteId === "all") return;

    const clientId = import.meta.env.VITE_STRIPE_CLIENT_ID;
    const stateString = btoa(
      JSON.stringify({ actorId: actorData.id, portfolioId: selectedSiteId })
    );

    const stripeOAuthUrl = `https://connect.stripe.com/oauth/authorize?response_type=code&client_id=${clientId}&scope=read_write&state=${stateString}`;
    window.location.href = stripeOAuthUrl;
  };

  // --- DYNAMIC PAYMENT SAVING ---
  const handleSavePaymentMethod = async (type: 'cod' | 'bank' | 'crypto') => {
    if (!selectedSiteId || selectedSiteId === "all") {
      notify("error", "Save Failed", "Please select a website first.");
      return;
    }
    setIsSavingPayment(type);
    try {
      const paymentSettings = {
        cod: { enabled: codEnabled },
        bank: { enabled: bankEnabled, accounts: banks.filter(b => b.name || b.holder || b.iban) },
        crypto: { enabled: cryptoEnabled, wallet: cryptoWallet }
      };

      const p = portfolios.find(port => port.id === selectedSiteId);
      if (p) {
        const newConfig = { ...p.theme_config, payments: paymentSettings };
        await supabase.from("portfolios").update({ theme_config: newConfig }).eq("id", p.id);
      }
      
      notify("success", "Settings Saved", `Your ${type.toUpperCase()} settings have been updated.`);
      fetchData();
    } catch (err: any) {
      notify("error", "Save Failed", err.message);
    }
    setIsSavingPayment(null);
  };

  if (loading)
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="animate-spin text-primary" />
      </div>
    );

  // --- DETERMINE ACTIVE STATE ---
  const activePortfolio = portfolios.find((p) => p.id === selectedSiteId);

  const activeStripeId = activePortfolio?.stripe_account_id;
  const activeStripeType = activePortfolio?.stripe_account_type;

  // Determine which card should show the Green "Active" state
  const isStandardActive = activeStripeId && activeStripeType === "standard";
  const isExpressActive = activeStripeId && activeStripeType !== "standard";

  return (
    <div className="p-4 md:p-8 space-y-8 w-full max-w-8xl mx-auto ">
      <NotificationContainer
        notifications={notifications}
        removeNotification={removeNotification}
      />

      {/* --- HEADER --- */}
      <div className="px-4 py-6 md:py-8 space-y-6">
        <div className="flex flex-col md:flex-row justify-between md:items-end gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl md:text-4xl font-black tracking-tight text-foreground">
              Payments & Integrations
            </h1>
            <p className="text-muted-foreground text-base md:text-lg">
              Route your money perfectly.
            </p>
          </div>
        </div>

        {/* --- CONTEXT SWITCHER --- */}
        <div className="bg-card p-4 rounded-2xl border shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <Label className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1 block">
              Configuring Settings For
            </Label>
          <Select value={selectedSiteId} onValueChange={setSelectedSiteId}>
              <SelectTrigger className="w-full sm:w-[300px] h-11 border-2 font-semibold bg-background">
                <SelectValue placeholder={portfolios.length > 0 ? "Select a site to configure" : "No sites available"} />
              </SelectTrigger>
              <SelectContent>
                {portfolios.map((site) => (
                  <SelectItem key={site.id} value={site.id}>
                    <div className="flex items-center gap-2">
                      <Store size={16} className="text-slate-500" />{" "}
                      {site.site_name || "Untitled Site"}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="text-sm text-muted-foreground sm:max-w-xs sm:text-right">
          {selectedSiteId && selectedSiteId !== "all" ? (
              <span className="flex items-center sm:justify-end gap-1.5 text-indigo-600 dark:text-indigo-400 font-medium">
                <Zap size={16} /> Payment Settings for this Site
              </span>
            ) : (
              "Select a site to configure its payment methods."
            )}
          </div>
        </div>

        {/* --- INTEGRATION GRID --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mt-8">
          {/* 1. STRIPE EXPRESS (MANAGED) */}
          <Card
            className={cn(
              "flex flex-col border-2 overflow-hidden transition-all",
              isExpressActive
                ? "border-green-500/30 bg-green-50/10 dark:bg-green-950/10"
                : "border-border",
              isStandardActive && "opacity-50 grayscale" // Dim if they are using Standard
            )}
          >
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start mb-1">
                <div className="h-10 w-10 bg-[#635BFF]/10 rounded-xl flex items-center justify-center">
                  <Zap size={20} className="text-[#635BFF] fill-[#635BFF]/20" />
                </div>
                {isExpressActive && (
                  <Badge
                    variant="outline"
                    className="bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-400 dark:border-green-800"
                  >
                    Active
                  </Badge>
                )}
              </div>
              <CardTitle className="text-xl">Managed Payouts</CardTitle>
              <CardDescription>
                The easiest way to get paid. Connect your bank and we handle the
                tax forms, compliance, and fraud.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow pb-4">
              <div className="flex items-center gap-2 text-sm font-semibold bg-muted/50 w-fit px-3 py-1.5 rounded-lg border">
                <span className="text-muted-foreground line-through">
                  2.9% + 30¢
                </span>
                <span className="text-foreground">5% Platform Fee</span>
              </div>
            </CardContent>
            <CardFooter className="pt-0">
              {isExpressActive ? (
                <div className="w-full flex items-center justify-between p-3 bg-green-500/10 border border-green-500/20 rounded-xl text-green-700 dark:text-green-400">
                  <div className="flex items-center gap-2 font-mono text-xs">
                    <CheckCircle2 size={16} /> ID: {activeStripeId}
                  </div>
                  <Button
                    variant="link"
                    size="sm"
                    className="h-auto p-0 text-green-700 dark:text-green-400"
                    onClick={handleConnectExpress}
                  >
                    Dashboard
                  </Button>
                </div>
              ) : (
                <Button
                  className="w-full font-bold bg-[#635BFF] hover:bg-[#635BFF]/90 text-white"
                  onClick={handleConnectExpress}
                  disabled={isConnectingStripe || isStandardActive}
                >
                  {isConnectingStripe ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <CreditCard className="w-4 h-4 mr-2" />
                  )}
                  {isStandardActive
                    ? "Disabled (Using Standard)"
                    : "Connect Bank Account"}
                </Button>
              )}
            </CardFooter>
          </Card>

          {/* 2. STRIPE STANDARD (BYO) - PADLOCKED UPSELL */}
          <Card
            className={cn(
              "flex flex-col border-2 overflow-hidden transition-all relative",
              isStandardActive
                ? "border-green-500/30 bg-green-50/10 dark:bg-green-950/10"
                : !isPro
                ? "bg-muted/30 border-dashed"
                : "border-border",
              isExpressActive && "opacity-50 grayscale" // Dim if they are using Express
            )}
          >
            {!isPro && !isStandardActive && (
              <div className="absolute inset-0 bg-background/40 backdrop-blur-[1px] z-10 flex items-start justify-end p-5 pointer-events-none">
                <div className="bg-background border shadow-sm rounded-full p-2 text-muted-foreground">
                  <Lock size={18} />
                </div>
              </div>
            )}
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start mb-1">
                <div className="h-10 w-10 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center">
                  <CreditCard
                    size={20}
                    className="text-slate-700 dark:text-slate-300"
                  />
                </div>
                <div className="flex gap-2">
                  {isPro && !isStandardActive && (
                    <Badge variant="secondary">Pro Only</Badge>
                  )}
                  {isStandardActive && (
                    <Badge
                      variant="outline"
                      className="bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-400 dark:border-green-800"
                    >
                      Active
                    </Badge>
                  )}
                </div>
              </div>
              <CardTitle className="text-xl">Bring Your Own Stripe</CardTitle>
              <CardDescription>
                Connect your existing standard Stripe account. You keep 100% of
                your sales and manage your own tax compliance.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow pb-4">
              <div className="flex items-center gap-2 text-sm font-semibold bg-muted/50 w-fit px-3 py-1.5 rounded-lg border">
                <span className="text-foreground">0% Platform Fee</span>
              </div>
            </CardContent>
            <CardFooter className="pt-0 relative z-20">
              {isStandardActive ? (
                <div className="w-full flex items-center justify-between p-3 bg-green-500/10 border border-green-500/20 rounded-xl text-green-700 dark:text-green-400">
                  <div className="flex items-center gap-2 font-mono text-xs">
                    <CheckCircle2 size={16} /> ID: {activeStripeId}
                  </div>
                  <a
                    href="https://dashboard.stripe.com"
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm font-bold hover:underline text-green-700 dark:text-green-400"
                  >
                    Stripe Dashboard
                  </a>
                </div>
              ) : !isPro ? (
                <Button
                  variant="outline"
                  className="w-full font-bold border-indigo-500/30 text-indigo-600 hover:bg-indigo-50"
                  onClick={handleConnectStandard}
                  disabled={isExpressActive}
                >
                  Upgrade to Pro to Unlock
                </Button>
              ) : (
                <Button
                  variant="outline"
                  className="w-full font-bold"
                  onClick={handleConnectStandard}
                  disabled={isExpressActive}
                >
                  {isExpressActive
                    ? "Disabled (Using Express)"
                    : "Connect Standard Account"}
                </Button>
              )}
            </CardFooter>
          </Card>

          {/* 3. CRYPTO / USDC */}
          <Card
            className={cn(
              "flex flex-col border-2 transition-all",
              profile?.crypto_wallet
                ? "border-amber-500/30 bg-amber-50/5 dark:bg-amber-950/10"
                : "border-border"
            )}
          >
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start mb-1">
                <div className="h-10 w-10 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center mb-1">
                  <Bitcoin
                    size={20}
                    className="text-amber-600 dark:text-amber-400"
                  />
                </div>
                <Switch checked={cryptoEnabled} onCheckedChange={setCryptoEnabled} />
              </div>
              <CardTitle className="text-lg">Crypto (USDC / SOL)</CardTitle>
              <CardDescription>
                Receive stablecoins directly to your Web3 wallet. Bypass Stripe
                entirely with zero chargeback risk.
              </CardDescription>
            </CardHeader>
            {cryptoEnabled && (
              <CardContent className="flex-grow animate-in fade-in zoom-in-95 duration-200">
                <Label className="text-xs font-semibold mb-1.5 block">
                  Wallet Address (EVM or Solana)
                </Label>
                <Input
                  placeholder="0x... or Solana address"
                  value={cryptoWallet}
                  onChange={(e) => setCryptoWallet(e.target.value)}
                  className="font-mono text-sm"
                />
              </CardContent>
            )}
            <CardFooter className="mt-auto">
              <Button
                variant={cryptoEnabled ? "default" : "outline"}
                className={cn("w-full font-bold", cryptoEnabled && "bg-amber-500 hover:bg-amber-600 text-white")}
                onClick={() => handleSavePaymentMethod('crypto')}
                disabled={isSavingPayment === 'crypto'}
              >
                {isSavingPayment === 'crypto' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Save Crypto Settings"
                )}
              </Button>
            </CardFooter>
          </Card>

          {/* 4. MANUAL BANK TRANSFER */}
          <Card className={cn("flex flex-col border-2 transition-all", bankEnabled ? "border-blue-500/30 bg-blue-50/5 dark:bg-blue-950/10" : "border-border")}>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start mb-1">
                <div className="h-10 w-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center mb-1">
                  <Landmark size={20} className="text-blue-600 dark:text-blue-400" />
                </div>
                <Switch checked={bankEnabled} onCheckedChange={setBankEnabled} />
              </div>
              <CardTitle className="text-lg">Manual Bank Transfer</CardTitle>
              <CardDescription>
                Display your local bank or Wise details to fans. Manage order
                fulfillment manually.
              </CardDescription>
            </CardHeader>
            {bankEnabled && (
              <CardContent className="flex-grow space-y-4 animate-in fade-in zoom-in-95 duration-200">
                {banks.map((bank, index) => {
                  const isExpanded = activeBankIndex === index;
                  return (
                  <div key={index} className="space-y-0 bg-muted/30 rounded-lg border relative overflow-hidden transition-all duration-200">
                    <div 
                      className={cn("p-4 flex items-center justify-between cursor-pointer hover:bg-muted/50 transition-colors", isExpanded && "border-b border-border bg-muted/10")}
                      onClick={() => setActiveBankIndex(isExpanded ? null : index)}
                    >
                      <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider cursor-pointer">
                        {bank.name ? `Account ${index + 1}: ${bank.name}` : `Account ${index + 1}`}
                      </Label>
                      <div className="flex items-center gap-2">
                        {banks.length > 1 && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6 text-muted-foreground hover:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              const newBanks = banks.filter((_, i) => i !== index);
                              setBanks(newBanks);
                              if (activeBankIndex === index) setActiveBankIndex(null);
                              else if (activeBankIndex !== null && activeBankIndex > index) setActiveBankIndex(activeBankIndex - 1);
                            }}
                          >
                            <X size={14} />
                          </Button>
                        )}
                        {isExpanded ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
                      </div>
                    </div>
                    {isExpanded && (
                      <div className="p-4 space-y-3 animate-in slide-in-from-top-2 fade-in duration-200 pt-3">
                        <Input placeholder="Bank Name (e.g. Wise)" value={bank.name} onChange={e => {
                          const newBanks = [...banks]; newBanks[index].name = e.target.value; setBanks(newBanks);
                        }} />
                        <Input placeholder="Account Holder Name" value={bank.holder} onChange={e => {
                          const newBanks = [...banks]; newBanks[index].holder = e.target.value; setBanks(newBanks);
                        }} />
                        <Input placeholder="IBAN / Account Number" value={bank.iban} onChange={e => {
                          const newBanks = [...banks]; newBanks[index].iban = e.target.value; setBanks(newBanks);
                        }} />
                      </div>
                    )}
                  </div>
                )})}
                {banks.length < 5 && (
                  <Button variant="outline" size="sm" className="w-full border-dashed" onClick={() => {
                    setBanks([...banks, { name: "", holder: "", iban: "" }]);
                    setActiveBankIndex(banks.length);
                  }}>
                    <Plus size={14} className="mr-2" /> Add Another Bank Account
                  </Button>
                )}
              </CardContent>
            )}
            <CardFooter className="mt-auto">
              <Button 
                variant={bankEnabled ? "default" : "outline"} 
                className="w-full font-bold" 
                onClick={() => handleSavePaymentMethod('bank')}
                disabled={isSavingPayment === 'bank'}
              >
                {isSavingPayment === 'bank' ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Bank Settings"}
              </Button>
            </CardFooter>
          </Card>

          {/* 5. CASH ON DELIVERY */}
          <Card className={cn("flex flex-col border-2 transition-all", codEnabled ? "border-emerald-500/30 bg-emerald-50/5 dark:bg-emerald-950/10" : "border-border")}>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start mb-1">
                <div className="h-10 w-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center mb-1">
                  <Package size={20} className="text-emerald-600 dark:text-emerald-400" />
                </div>
                <Switch checked={codEnabled} onCheckedChange={setCodEnabled} />
              </div>
              <CardTitle className="text-lg">Cash on Delivery</CardTitle>
              <CardDescription>
                Allow customers to place an order and pay in cash when the product or service is delivered.
              </CardDescription>
            </CardHeader>
            <CardFooter className="mt-auto">
              <Button 
                variant={codEnabled ? "default" : "outline"} 
                className={cn("w-full font-bold", codEnabled && "bg-emerald-600 hover:bg-emerald-700 text-white")}
                onClick={() => handleSavePaymentMethod('cod')}
                disabled={isSavingPayment === 'cod'}
              >
                {isSavingPayment === 'cod' ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save COD Settings"}
              </Button>
            </CardFooter>
          </Card>

        </div>
      </div>
    </div>
  );
};

export default PaymentsPage;
