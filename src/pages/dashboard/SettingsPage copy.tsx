import React, { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";
import { useOutletContext } from "react-router-dom";
import { ActorDashboardContextType } from "../../layouts/ActorDashboardLayout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Loader2,
  Globe,
  User,
  Plus,
  ExternalLink,
  LayoutTemplate,
  Check,
  CreditCard,
  ArrowUpRight,
  Coins,
  Gift,
  AlertTriangle,
  CalendarDays,
  Clock,
  Trash2,
  Sparkles,
  MessageCircle,
  Star,
  ShoppingCart,
  Zap,
  Box,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { PORTFOLIO_TEMPLATES } from "../../lib/templates";
import { cn } from "@/lib/utils";
import {
  NotificationContainer,
  Notification,
} from "@/components/ui/NotificationToast";
// 1. IMPORT THE CONTEXT
import { useSubscription } from "../../context/SubscriptionContext";

type PlanDuration = 1 | 3 | 6 | 12;

// --- CONFIGURATION ---

const SLOT_COST = 500; // Cost in coins to buy 1 extra site slot

// 2. RENAMED PLANS (Starter / eCommerce / Pro)
const PLANS = [
  {
    id: "starter",
    tier: 1,
    name: "Starter",
    description: "Perfect for personal portfolios.",
    features: ["100MB Storage", "Standard Support", "UCP Branding"],
    pricing: {
      1: {
        stripePriceId: "price_starter_1m",
        stripeCost: 3.0,
        coinCost: 150,
        label: null,
      },
      3: {
        stripePriceId: "price_starter_3m",
        stripeCost: 8.55,
        coinCost: 425,
        label: "5% OFF",
      },
      6: {
        stripePriceId: "price_starter_6m",
        stripeCost: 16.2,
        coinCost: 800,
        label: "10% OFF",
      },
      12: {
        stripePriceId: "price_STARTER_YEARLY",
        stripeCost: 30.0,
        coinCost: 1500,
        label: "17% OFF",
      },
    },
  },
  {
    id: "ecommerce", // Was 'pro'
    tier: 2,
    name: "eCommerce",
    popular: true,
    description: "For selling digital products.",
    features: [
      "500MB Storage",
      "Custom Domain",
      "Online Shop",
      "Leads Dashboard",
    ],
    pricing: {
      1: {
        stripePriceId: "price_ECOMMERCE_1M",
        stripeCost: 9.0,
        coinCost: 450,
        label: null,
      },
      3: {
        stripePriceId: "price_ECOMMERCE_3M",
        stripeCost: 25.0,
        coinCost: 1250,
        label: "5% OFF",
      },
      6: {
        stripePriceId: "price_ECOMMERCE_6M",
        stripeCost: 48.0,
        coinCost: 2400,
        label: "11% OFF",
      },
      12: {
        stripePriceId: "price_ECOMMERCE_1Y",
        stripeCost: 90.0,
        coinCost: 4500,
        label: "17% OFF",
      },
    },
  },
  {
    id: "pro", // Was 'agency'
    tier: 3,
    name: "Pro",
    description: "Ultimate power and storage.",
    features: [
      "2GB Storage",
      "Priority Support",
      "Bookings / Appointments",
      "White Label",
    ],
    pricing: {
      1: {
        stripePriceId: "price_PRO_1M",
        stripeCost: 19.0,
        coinCost: 950,
        label: null,
      },
      3: {
        stripePriceId: "price_PRO_3M",
        stripeCost: 54.0,
        coinCost: 2700,
        label: "5% OFF",
      },
      6: {
        stripePriceId: "price_PRO_6M",
        stripeCost: 102.0,
        coinCost: 5100,
        label: "10% OFF",
      },
      12: {
        stripePriceId: "price_PRO_1Y",
        stripeCost: 190.0,
        coinCost: 9500,
        label: "25% OFF",
      },
    },
  },
];

const COIN_PACKS = [
  {
    id: "handful",
    name: "Handful of Coins",
    coins: 250,
    cost: 5,
    bonus: "",
    rarity: 3,
  },
  {
    id: "bag",
    name: "Bag of Coins",
    coins: 550,
    cost: 10,
    bonus: "+50 Free!",
    popular: true,
    rarity: 4,
  },
  {
    id: "chest",
    name: "Chest of Coins",
    coins: 1200,
    cost: 20,
    bonus: "+200 Free!",
    rarity: 5,
  },
  {
    id: "handful_lg",
    name: "Sack of Coins",
    coins: 1500,
    cost: 26,
    bonus: "+200 Free!",
    rarity: 4,
  },
  {
    id: "bag_lg",
    name: "Treasury",
    coins: 3000,
    cost: 54,
    bonus: "+300 Free!",
    popular: true,
    rarity: 5,
  },
  {
    id: "chest_lg",
    name: "Vault of Coins",
    coins: 8000,
    cost: 153,
    bonus: "+350 Free!",
    rarity: 5,
  },
];

const SettingsPage = () => {
  const { actorData } = useOutletContext<ActorDashboardContextType>();

  // 3. USE CONTEXT
  const {
    plan: currentPlanId,
    siteSlots,
    refreshSubscription,
    isLoading: isSubLoading,
  } = useSubscription();

  const [loading, setLoading] = useState(true);

  // Data State
  const [portfolios, setPortfolios] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>({});
  const [walletBalance, setWalletBalance] = useState(0);
  const [subscriptions, setSubscriptions] = useState<Record<string, any>>({});
  const [transactions, setTransactions] = useState<any[]>([]);

  // UI State
  const [isSaving, setIsSaving] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<string | null>(
    null
  );

  // Delete State
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteConfirmationName, setDeleteConfirmationName] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  // Upgrade Modal UI State
  const [billingDuration, setBillingDuration] = useState<PlanDuration>(1);

  const [selectedTemplate, setSelectedTemplate] = useState<string>(
    PORTFOLIO_TEMPLATES[0].id
  );
  const [newSiteName, setNewSiteName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [processingPlan, setProcessingPlan] = useState<string | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Redeem State
  const [redeemCode, setRedeemCode] = useState("");
  const [isRedeeming, setIsRedeeming] = useState(false);

  // Notification & Confirmation
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: React.ReactNode;
    action: () => void;
    confirmText?: string;
    isDestructive?: boolean;
  } | null>(null);

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

  const openConfirmation = (
    title: string,
    message: React.ReactNode,
    action: () => void,
    confirmText = "Confirm",
    isDestructive = false
  ) => {
    setConfirmDialog({
      isOpen: true,
      title,
      message,
      action,
      confirmText,
      isDestructive,
    });
  };

  const fetchData = async () => {
    if (!actorData?.id) return;
    setLoading(true);

    const { data: sites } = await supabase
      .from("portfolios")
      .select("*")
      .eq("actor_id", actorData.id)
      .order("created_at", { ascending: false });
    if (sites) setPortfolios(sites);

    const { data: actor } = await supabase
      .from("actors")
      .select("*")
      .eq("id", actorData.id)
      .single();
    if (actor) {
      setProfile(actor);
      setWalletBalance(actor.wallet_balance || 0);
    }

    const { data: subs } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("actor_id", actorData.id);
    if (subs) {
      const subMap: Record<string, any> = {};
      subs.forEach((s) => (subMap[s.portfolio_id] = s));
      setSubscriptions(subMap);
    }

    const { data: txs } = await supabase
      .from("wallet_transactions")
      .select("*")
      .eq("actor_id", actorData.id)
      .order("created_at", { ascending: false })
      .limit(5);
    if (txs) setTransactions(txs);

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [actorData.id]);

  // --- SAFE PRORATION LOGIC ---
  const calculateProration = (targetPlanId: string) => {
    if (!selectedPortfolioId || !subscriptions[selectedPortfolioId])
      return { cost: 0, isUpgrade: true, unusedValue: 0, activeDuration: 0 };

    const currentSub = subscriptions[selectedPortfolioId];
    if (currentSub.payment_method === "stripe")
      return {
        cost: 0,
        isUpgrade: true,
        unusedValue: 0,
        isStripe: true,
        activeDuration: 0,
      };

    const currentPlan = PLANS.find((p) => p.id === currentSub.plan_id);
    const targetPlan = PLANS.find((p) => p.id === targetPlanId);

    if (!currentPlan || !targetPlan)
      return { cost: 0, isUpgrade: true, unusedValue: 0, activeDuration: 0 };

    const start = new Date(currentSub.current_period_start).getTime();
    const end = new Date(currentSub.current_period_end).getTime();
    const now = new Date().getTime();

    const daysDuration = Math.round((end - start) / (1000 * 60 * 60 * 24));

    let activeDuration: PlanDuration = 1;
    if (daysDuration > 300) activeDuration = 12;
    else if (daysDuration > 150) activeDuration = 6;
    else if (daysDuration > 75) activeDuration = 3;

    const isHigherTier = targetPlan.tier > currentPlan.tier;
    const isSameTier = targetPlan.tier === currentPlan.tier;
    const isLongerDuration = billingDuration > activeDuration;

    const isUpgrade = isHigherTier || (isSameTier && isLongerDuration);
    const isDowngrade =
      !isUpgrade && !(isSameTier && billingDuration === activeDuration);

    if (now > end)
      return {
        cost: targetPlan.pricing[billingDuration].coinCost,
        isUpgrade: true,
        unusedValue: 0,
        activeDuration,
      };

    const totalDurationMs = end - start;
    const remainingDurationMs = end - now;
    const percentageRemaining = Math.max(
      0,
      remainingDurationMs / totalDurationMs
    );

    const originalPaidCost = currentPlan.pricing[activeDuration]?.coinCost || 0;
    const unusedValue = Math.floor(originalPaidCost * percentageRemaining);

    let finalCost = targetPlan.pricing[billingDuration].coinCost;

    if (isUpgrade) {
      finalCost = Math.max(0, finalCost - unusedValue);
    }

    return {
      cost: finalCost,
      originalPrice: targetPlan.pricing[billingDuration].coinCost,
      unusedValue,
      isUpgrade,
      isDowngrade,
      activeDuration,
    };
  };

  // --- ACTIONS ---

  // 4. NEW: HANDLE BUY SLOT
  const handleBuySlot = () => {
    if (walletBalance < SLOT_COST) {
      openConfirmation(
        "Insufficient Balance",
        <p>
          You need <strong>{SLOT_COST} Coins</strong> to buy a slot. You have{" "}
          {walletBalance}.
        </p>,
        () => {
          setConfirmDialog(null);
          setIsTopUpOpen(true);
        },
        "Top Up Now"
      );
      return;
    }

    openConfirmation(
      "Buy Portfolio Slot",
      <div className="space-y-2">
        <p>
          Purchase <strong>1 Additional Website Slot</strong> for{" "}
          <strong>{SLOT_COST} Coins</strong>?
        </p>
        <p className="text-xs text-muted-foreground">
          This is a one-time purchase. You will own this slot forever.
        </p>
      </div>,
      async () => {
        setConfirmDialog(null);
        // Call the RPC function we created
        const { data, error } = await supabase.rpc("buy_portfolio_slot", {
          p_actor_id: actorData.id,
          p_cost: SLOT_COST,
        });

        if (error || (data && !data.success)) {
          notify("error", "Purchase Failed", data?.message || error?.message);
        } else {
          notify(
            "success",
            "Slot Purchased",
            "You can now create another website."
          );
          // Refresh EVERYTHING
          await refreshSubscription();
          await fetchData();
        }
      },
      "Pay 500 Coins"
    );
  };

  const handleCreateSite = async () => {
    if (!newSiteName.trim()) {
      notify("error", "Missing Name", "Please enter a site name");
      return;
    }
    if (!actorData?.id) return;

    // 5. CHECK SLOTS BEFORE CREATING
    if (siteSlots.remaining <= 0) {
      notify(
        "error",
        "No Slots Available",
        "You have used all your portfolio slots."
      );
      // Optionally auto-trigger the buy flow here
      handleBuySlot();
      return;
    }

    setIsCreating(true);
    const template =
      PORTFOLIO_TEMPLATES.find((t) => t.id === selectedTemplate) ||
      PORTFOLIO_TEMPLATES[0];
    const baseSlug = newSiteName.toLowerCase().replace(/[^a-z0-9]/g, "-");
    const uniqueSlug = `${baseSlug}-${Date.now().toString().slice(-4)}`;

    const { error } = await supabase.from("portfolios").insert({
      actor_id: actorData.id,
      site_name: newSiteName,
      public_slug: uniqueSlug,
      is_published: false,
      sections: template.sections,
      theme_config: {
        templateId: template.id === "blank" ? "modern" : template.id,
        primaryColor: "violet",
        font: "sans",
      },
    });

    if (error)
      notify(
        "error",
        "Creation Failed",
        "Could not create website. Please try again."
      );
    else {
      notify(
        "success",
        "Website Created",
        `Your new site "${newSiteName}" is ready.`
      );
      setIsCreateOpen(false);
      setNewSiteName("");
      fetchData();
      refreshSubscription(); // Update usage count
    }
    setIsCreating(false);
  };

  const handleDeleteSite = async () => {
    if (!selectedPortfolioId) return;
    const site = portfolios.find((p) => p.id === selectedPortfolioId);

    if (deleteConfirmationName !== site?.site_name) {
      notify(
        "error",
        "Name Mismatch",
        "Website name does not match. Please type it exactly."
      );
      return;
    }

    setIsDeleting(true);
    const { error } = await supabase
      .from("portfolios")
      .delete()
      .eq("id", selectedPortfolioId);

    if (error) {
      notify("error", "Deletion Failed", error.message);
    } else {
      notify(
        "success",
        "Website Deleted",
        "The website and its data have been removed."
      );
      setIsDeleteOpen(false);
      setDeleteConfirmationName("");
      fetchData();
      refreshSubscription(); // Release slot
    }
    setIsDeleting(false);
  };

  const handleUpdateProfile = async () => {
    if (!actorData?.id) return;
    setIsSaving(true);
    const { error } = await supabase
      .from("actors")
      .update({ ActorName: profile.ActorName, bio: profile.bio })
      .eq("id", actorData.id);
    if (error)
      notify("error", "Update Failed", "Could not save profile changes.");
    else
      notify(
        "success",
        "Profile Updated",
        "Your changes have been saved successfully."
      );
    setIsSaving(false);
  };

  // --- PAYMENT LOGIC ---
  const handleBuyWithWallet = async (plan: (typeof PLANS)[0]) => {
    if (!selectedPortfolioId || !actorData?.id) return;

    const calc = calculateProration(plan.id);

    // LOGIC A: DOWNGRADE
    if (calc.isDowngrade) {
      const sub = subscriptions[selectedPortfolioId];
      const endDate = sub
        ? new Date(sub.current_period_end).toLocaleDateString()
        : "cycle end";

      openConfirmation(
        `Downgrade to ${plan.name}`,
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>
            Changes will take effect at the end of your current billing cycle (
            <strong>{endDate}</strong>).
          </p>
          <p>
            You will retain your current features until then. No coins will be
            charged today.
          </p>
        </div>,
        async () => {
          setProcessingPlan(plan.id);
          const { error } = await supabase
            .from("subscriptions")
            .update({
              cancel_at_period_end: true,
              metadata: { ...sub?.metadata, next_plan_id: plan.id },
            })
            .eq("portfolio_id", selectedPortfolioId);

          if (error) {
            notify("error", "Downgrade Failed", error.message);
          } else {
            notify(
              "success",
              "Downgrade Scheduled",
              `Your plan will switch to ${plan.name} after ${endDate}`
            );
            fetchData();
            refreshSubscription();
            setIsUpgradeOpen(false);
          }
          setProcessingPlan(null);
          setConfirmDialog(null);
        },
        "Schedule Downgrade"
      );
      return;
    }

    // LOGIC B: UPGRADE
    const costToPay = calc.cost || 0;
    if (walletBalance < costToPay) {
      openConfirmation(
        "Insufficient Balance",
        <p className="text-sm text-muted-foreground">
          You need <strong>{costToPay} Coins</strong> but have{" "}
          <strong>{walletBalance}</strong>. Please top up your wallet.
        </p>,
        () => {
          setIsUpgradeOpen(false);
          setIsTopUpOpen(true);
          setConfirmDialog(null);
        },
        "Go to Shop"
      );
      return;
    }

    let message = (
      <p className="text-sm text-muted-foreground">
        Spend <strong>{costToPay} Coins</strong> for{" "}
        <strong>{billingDuration} month(s)</strong> access?
      </p>
    );

    if (calc.unusedValue > 0) {
      message = (
        <div className="text-sm space-y-2 bg-muted/50 p-3 rounded-md">
          <div className="flex justify-between">
            <span>New Plan Cost ({billingDuration}m):</span>
            <span>{calc.originalPrice}</span>
          </div>
          <div className="flex justify-between text-green-600">
            <span>Unused Credit:</span>
            <span>-{calc.unusedValue}</span>
          </div>
          <div className="border-t pt-2 mt-2 flex justify-between font-bold">
            <span>Pay Now:</span>
            <span>{costToPay} Coins</span>
          </div>
        </div>
      );
    }

    openConfirmation(
      `Confirm ${calc.isUpgrade ? "Upgrade" : "Purchase"}`,
      message,
      async () => {
        setConfirmDialog(null);
        setProcessingPlan(plan.id);
        const { data, error } = await supabase.rpc(
          "purchase_subscription_with_wallet",
          {
            p_actor_id: actorData.id,
            p_portfolio_id: selectedPortfolioId,
            p_plan_id: plan.id,
            p_amount: costToPay,
            p_duration_months: billingDuration,
          }
        );

        if (error || (data && !data.success)) {
          notify(
            "error",
            "Transaction Failed",
            data?.message || error?.message || "Unknown error"
          );
        } else {
          notify(
            "success",
            "Plan Activated!",
            `You have successfully subscribed to ${plan.name}.`
          );
          fetchData();
          refreshSubscription();
          setIsUpgradeOpen(false);
        }
        setProcessingPlan(null);
      },
      "Confirm Payment"
    );
  };

  const handleDirectStripe = async (plan: (typeof PLANS)[0]) => {
    if (!actorData?.id || !selectedPortfolioId) return;
    const details = plan.pricing[billingDuration as PlanDuration];

    if (!details.stripePriceId) {
      notify(
        "error",
        "Unavailable",
        "This plan duration is not available via card yet."
      );
      return;
    }

    setIsRedirecting(true);
    const { data, error } = await supabase.functions.invoke(
      "create-checkout-session",
      {
        body: {
          mode: "subscription",
          priceId: details.stripePriceId,
          metadata: {
            type: "subscription",
            actor_id: actorData.id,
            portfolio_id: selectedPortfolioId,
            plan_id: plan.id,
            interval: billingDuration === 12 ? "yearly" : "monthly",
            duration_months: billingDuration,
          },
          successUrl:
            window.location.origin + "/dashboard/settings?success=true",
          cancelUrl:
            window.location.origin + "/dashboard/settings?canceled=true",
        },
      }
    );
    if (error || !data?.url) {
      notify("error", "Checkout Error", "Could not start payment session.");
      setIsRedirecting(false);
    } else window.location.href = data.url;
  };

  const handleManageStripeSub = async () => {
    if (!actorData?.id) return;
    setIsRedirecting(true);
    const { data, error } = await supabase.functions.invoke(
      "create-portal-session",
      { body: { returnUrl: window.location.origin + "/dashboard/settings" } }
    );
    if (error || !data?.url) {
      notify("error", "Portal Error", "Could not load billing portal.");
      setIsRedirecting(false);
    } else window.location.href = data.url;
  };

  const handleTopUpStripe = async (pack: (typeof COIN_PACKS)[0]) => {
    if (!actorData?.id) return;
    setIsRedirecting(true);
    const { data, error } = await supabase.functions.invoke(
      "create-checkout-session",
      {
        body: {
          mode: "payment",
          amount: pack.cost * 100,
          name: `${pack.coins} UCP Coins`,
          metadata: {
            type: "top_up",
            actor_id: actorData.id,
            coins_amount: pack.coins,
          },
          successUrl:
            window.location.origin + "/dashboard/settings?topup=success",
          cancelUrl:
            window.location.origin + "/dashboard/settings?topup=canceled",
        },
      }
    );
    if (error || !data?.url) {
      notify("error", "Checkout Failed", "Could not start payment session.");
      setIsRedirecting(false);
    } else window.location.href = data.url;
  };

  const handleBankTransfer = (pack: (typeof COIN_PACKS)[0]) => {
    if (!actorData?.ActorName) return;
    const userEmail = profile.email || (actorData as any).email || "No Email";
    const message = `Hello, I would like to purchase the "${pack.name}" (${pack.coins} Coins) for $${pack.cost} via Bank Transfer.\n\nMy Details:\nName: ${actorData.ActorName}\nEmail: ${userEmail} (ID: ${actorData.id})\n\nPlease provide the bank details.`;
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/212695121176?text=${encodedMessage}`;
    window.open(whatsappUrl, "_blank");
  };

  const handleRedeemCode = async () => {
    if (!redeemCode.trim() || !actorData?.id) return;
    setIsRedeeming(true);
    const { data, error } = await supabase.rpc("redeem_gift_code", {
      p_actor_id: actorData.id,
      p_code: redeemCode.trim(),
    });
    if (error || (data && !data.success)) {
      notify("error", "Redeem Failed", data?.message || error?.message);
    } else {
      notify("success", "Coins Added!", "Gift code redeemed.");
      setRedeemCode("");
      fetchData();
    }
    setIsRedeeming(false);
  };

  const openDeleteDialog = (portfolioId: string) => {
    setSelectedPortfolioId(portfolioId);
    setDeleteConfirmationName("");
    setIsDeleteOpen(true);
  };

  if (loading)
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="animate-spin text-primary" />
      </div>
    );

  return (
    <div className="min-h-screen bg-background pb-24 relative">
      <NotificationContainer
        notifications={notifications}
        removeNotification={removeNotification}
      />

      {/* --- HEADER SECTION --- */}
      <div className="px-4 pt-6 pb-2 md:pt-12 md:pb-8 md:px-8 max-w-6xl mx-auto space-y-6">
        {/* Title & Subtitle */}
        <div className="flex flex-col md:flex-row justify-between md:items-end gap-4 pt-20">
          <div className="space-y-1">
            <h1 className="text-2xl md:text-4xl font-black tracking-tight text-foreground">
              Settings & Billing
            </h1>
            <p className="text-muted-foreground text-base md:text-lg">
              Manage your digital presence.
            </p>
          </div>
        </div>

        {/* --- STATS WIDGETS (Grid on Mobile for Native Feel) --- */}
        <div className="grid grid-cols-2 md:flex md:flex-wrap items-stretch gap-3">
          {/* SITE SLOTS WIDGET */}
          <div className="col-span-1 md:w-auto flex flex-col justify-between bg-card p-3 md:p-2 md:pl-4 rounded-xl border shadow-sm min-h-[80px] md:min-h-[60px] md:flex-row md:items-center md:gap-3">
            <div className="flex flex-col items-start">
              <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest leading-none mb-1.5">
                Slots
              </span>
              <span className="text-xl md:text-lg font-black leading-none">
                {isSubLoading ? "..." : `${siteSlots.used}/${siteSlots.total}`}
              </span>
            </div>
            <Button
              size="sm"
              variant="ghost"
              className="mt-2 md:mt-0 h-8 md:h-9 w-full md:w-auto px-0 md:px-3 border-t md:border-t-0 md:border-l border-dashed hover:bg-primary/5 hover:text-primary justify-center md:justify-start text-xs md:text-sm text-muted-foreground"
              onClick={handleBuySlot}
            >
              <Plus size={14} className="mr-1 md:mr-0" />{" "}
              <span className="md:hidden">Add Slot</span>
            </Button>
          </div>

          {/* WALLET WIDGET */}
          <div className="col-span-1 md:w-auto flex flex-col justify-between bg-gradient-to-br from-amber-50 to-orange-50/50 p-3 md:p-2 md:pl-4 rounded-xl border border-amber-200/50 shadow-sm min-h-[80px] md:min-h-[60px] md:flex-row md:items-center md:gap-3">
            <div className="flex flex-col items-start">
              <span className="text-[10px] text-amber-600/80 uppercase font-bold tracking-widest leading-none mb-1.5">
                Balance
              </span>
              <span className="text-xl md:text-xl font-black text-amber-600 leading-none break-all">
                {walletBalance.toLocaleString()}
              </span>
            </div>
            <Button
              size="sm"
              onClick={() => setIsTopUpOpen(true)}
              className="mt-2 md:mt-0 h-8 md:h-10 w-full md:w-auto text-xs md:text-sm rounded-lg bg-amber-500 hover:bg-amber-600 text-white shadow-sm font-bold active:scale-95 transition-transform"
            >
              <Plus size={14} className="mr-1" /> Top Up
            </Button>
          </div>
        </div>
      </div>

      <Tabs defaultValue="websites" className="w-full max-w-6xl mx-auto">
        {/* --- STICKY NATIVE TABS --- */}
        <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border/40 px-4 md:px-8 py-2 mb-6">
          <TabsList className="w-full flex h-auto p-1 bg-muted/50 rounded-xl">
            <TabsTrigger
              value="websites"
              className="flex-1 py-2 rounded-lg text-xs md:text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
            >
              <Globe size={16} className="mr-2 hidden sm:block" /> Websites
            </TabsTrigger>
            <TabsTrigger
              value="history"
              className="flex-1 py-2 rounded-lg text-xs md:text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
            >
              <CreditCard size={16} className="mr-2 hidden sm:block" /> History
            </TabsTrigger>
            <TabsTrigger
              value="account"
              className="flex-1 py-2 rounded-lg text-xs md:text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
            >
              <User size={16} className="mr-2 hidden sm:block" /> Profile
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="px-4 md:px-8">
          {/* --- TAB 1: WEBSITES --- */}
          <TabsContent
            value="websites"
            className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 mt-0"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {/* CREATE CARD (Native Touch Feedback) */}
              <div
                role="button"
                tabIndex={0}
                className={cn(
                  "relative flex flex-col items-center justify-center gap-4 min-h-[220px] md:min-h-[280px] rounded-2xl border-2 border-dashed p-6 transition-all duration-200 outline-none",
                  "active:scale-[0.98] md:hover:scale-[1.01]", // Native touch feel
                  siteSlots.remaining > 0
                    ? "border-muted-foreground/20 bg-card hover:border-primary/50 hover:bg-primary/5 cursor-pointer"
                    : "border-muted/50 opacity-75 bg-muted/20"
                )}
                onClick={() => {
                  if (siteSlots.remaining > 0) setIsCreateOpen(true);
                  else handleBuySlot();
                }}
              >
                <div
                  className={cn(
                    "w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center shadow-sm transition-all",
                    siteSlots.remaining > 0
                      ? "bg-muted text-muted-foreground group-hover:text-primary"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {siteSlots.remaining > 0 ? (
                    <Plus size={28} />
                  ) : (
                    <Box size={28} />
                  )}
                </div>
                <div className="text-center z-10">
                  <span className="block font-bold text-lg text-foreground mb-1">
                    {siteSlots.remaining > 0 ? "New Website" : "No Slots"}
                  </span>
                  <span className="text-xs md:text-sm text-muted-foreground block">
                    {siteSlots.remaining > 0
                      ? `${siteSlots.remaining} slot${
                          siteSlots.remaining > 1 ? "s" : ""
                        } available`
                      : "Tap to purchase a slot"}
                  </span>
                </div>
              </div>

              {portfolios.map((site) => {
                const sub = subscriptions[site.id];
                const currentPlanObj =
                  PLANS.find((p) => p.id === sub?.plan_id) || PLANS[0];
                const isPro =
                  sub &&
                  sub.status === "active" &&
                  new Date(sub.current_period_end) > new Date();

                let badgeColor = "bg-primary";
                if (sub?.plan_id === "starter") badgeColor = "bg-blue-500";
                if (sub?.plan_id === "ecommerce") badgeColor = "bg-indigo-600";
                if (sub?.plan_id === "pro") badgeColor = "bg-purple-600";

                return (
                  <Card
                    key={site.id}
                    className="group flex flex-col overflow-hidden rounded-2xl border-border/60 shadow-sm hover:shadow-md transition-all active:scale-[0.99] md:hover:scale-[1.01]"
                  >
                    <CardHeader className="pb-3 p-5">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex flex-wrap gap-2">
                          <Badge
                            variant={
                              site.is_published ? "default" : "secondary"
                            }
                            className="rounded-md px-2 h-5 text-[10px] uppercase tracking-wide"
                          >
                            {site.is_published ? "Live" : "Draft"}
                          </Badge>
                          {isPro ? (
                            <Badge
                              className={cn(
                                "border-0 text-white rounded-md h-5 text-[10px] uppercase tracking-wide",
                                badgeColor
                              )}
                            >
                              {currentPlanObj.name}
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="border-amber-500 text-amber-600 bg-amber-50 rounded-md h-5 text-[10px] uppercase tracking-wide"
                            >
                              Trial
                            </Badge>
                          )}
                        </div>
                        {/* Hit area larger for mobile */}
                        <div className="h-8 w-8 flex items-center justify-center -mr-2 -mt-1">
                          <a
                            href={`/pro/${site.public_slug}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-muted-foreground hover:text-foreground p-2"
                          >
                            <ExternalLink size={18} />
                          </a>
                        </div>
                      </div>
                      <CardTitle className="truncate text-lg font-bold leading-tight">
                        {site.site_name || "Untitled"}
                      </CardTitle>
                      <CardDescription className="truncate text-xs font-medium opacity-80 mt-1">
                        {site.custom_domain || `${site.public_slug}.ucp.com`}
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="px-5 py-2 flex-grow">
                      {isPro ? (
                        <div className="text-[11px] font-medium text-foreground/70 bg-muted/50 p-3 rounded-lg flex justify-between items-center border border-border/50">
                          <span>
                            Renews{" "}
                            {new Date(
                              sub.current_period_end
                            ).toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                          <span className="uppercase text-[9px] bg-background px-1.5 py-0.5 rounded border">
                            {sub.payment_method}
                          </span>
                        </div>
                      ) : (
                        <div className="text-xs text-amber-800 bg-amber-50 p-3 rounded-lg border border-amber-100 flex items-center gap-2">
                          <AlertTriangle size={14} className="shrink-0" />
                          <span className="font-semibold">Trial Active</span>
                        </div>
                      )}
                    </CardContent>

                    <CardFooter className="p-4 pt-2 grid grid-cols-[1fr_auto_auto] gap-2">
                      {isPro && sub?.payment_method === "stripe" ? (
                        <Button
                          variant="secondary"
                          size="sm"
                          className="w-full font-semibold h-9"
                          onClick={handleManageStripeSub}
                          disabled={isRedirecting}
                        >
                          {isRedirecting ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            "Manage"
                          )}
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          className={cn(
                            "w-full font-bold h-9 shadow-sm",
                            isPro
                              ? "bg-amber-500 hover:bg-amber-600 text-white"
                              : "bg-primary text-primary-foreground"
                          )}
                          onClick={() => {
                            setSelectedPortfolioId(site.id);
                            setIsUpgradeOpen(true);
                          }}
                        >
                          {isPro ? "Extend" : "Upgrade"}
                        </Button>
                      )}

                      <Button
                        size="icon"
                        variant="outline"
                        className="h-9 w-9 border-muted-foreground/20"
                        asChild
                      >
                        <a href={`/dashboard/portfolio?id=${site.id}`}>
                          <LayoutTemplate size={16} />
                        </a>
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-9 w-9 text-red-400 hover:bg-red-50"
                        onClick={() => openDeleteDialog(site.id)}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="history" className="mt-0">
            <Card className="rounded-2xl shadow-sm border-border/60">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Transactions</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {transactions.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground text-sm">
                    No transactions yet.
                  </div>
                ) : (
                  <div className="divide-y">
                    {transactions.map((tx) => (
                      <div
                        key={tx.id}
                        className="flex justify-between items-center p-4 hover:bg-muted/30 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              "h-8 w-8 rounded-full flex items-center justify-center shrink-0",
                              tx.amount > 0
                                ? "bg-green-100 text-green-600"
                                : "bg-red-100 text-red-600"
                            )}
                          >
                            {tx.amount > 0 ? (
                              <ArrowUpRight size={14} />
                            ) : (
                              <CreditCard size={14} />
                            )}
                          </div>
                          <div>
                            <div className="font-semibold text-sm">
                              {tx.description}
                            </div>
                            <div className="text-[11px] text-muted-foreground">
                              {new Date(tx.created_at).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <div
                          className={cn(
                            "font-bold text-sm whitespace-nowrap",
                            tx.amount > 0 ? "text-green-600" : ""
                          )}
                        >
                          {tx.amount > 0 ? "+" : ""}
                          {tx.amount}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="account" className="mt-0">
            <Card className="rounded-2xl shadow-sm border-border/60">
              <CardHeader>
                <CardTitle className="text-lg">Profile</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input
                    value={profile.ActorName || ""}
                    onChange={(e) =>
                      setProfile({ ...profile, ActorName: e.target.value })
                    }
                    className="h-10 text-base"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    disabled
                    value={profile.email || ""}
                    className="bg-muted h-10 text-base"
                  />
                </div>
                <Button
                  onClick={handleUpdateProfile}
                  disabled={isSaving}
                  className="w-full h-11 font-bold md:w-auto"
                >
                  {isSaving && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}{" "}
                  Save Changes
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </div>
      </Tabs>

      {/* --- CONFIRMATION --- */}
      <Dialog
        open={!!confirmDialog}
        onOpenChange={(open) => !open && setConfirmDialog(null)}
      >
        <DialogContent className="w-[90vw] rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{confirmDialog?.title}</DialogTitle>
            <DialogDescription className="py-2">
              {confirmDialog?.message}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              className="h-10"
              onClick={() => setConfirmDialog(null)}
            >
              Cancel
            </Button>
            <Button
              variant={confirmDialog?.isDestructive ? "destructive" : "default"}
              className="h-10"
              onClick={confirmDialog?.action}
            >
              {confirmDialog?.confirmText || "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- TOP UP MODAL (FULL SCREEN ON MOBILE) --- */}
      <Dialog open={isTopUpOpen} onOpenChange={setIsTopUpOpen}>
        {/* Native Mobile Feel: h-[100dvh] (dynamic viewport height), rounded-none on mobile */}
        <DialogContent className="w-full h-[100dvh] sm:h-[85vh] sm:max-w-[950px] p-0 gap-0 bg-zinc-50 dark:bg-zinc-900 border-none shadow-2xl sm:rounded-2xl flex flex-col">
          <Tabs defaultValue="packs" className="w-full h-full flex flex-col">
            {/* Header with Back Button logic feel */}
            <div className="p-4 md:p-8 shrink-0 bg-background sm:bg-transparent border-b sm:border-0 z-20">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex justify-between items-center">
                  <div className="space-y-1">
                    <DialogTitle className="text-xl md:text-2xl font-black tracking-tight flex items-center gap-2">
                      <Coins className="text-amber-500 fill-amber-500" /> Coin
                      Shop
                    </DialogTitle>
                    <DialogDescription className="text-sm">
                      Top up to purchase upgrades.
                    </DialogDescription>
                  </div>
                  {/* Close button is handled by DialogPrimitive usually, but on full screen mobile we sometimes want a specific UI */}
                </div>
                <TabsList className="bg-muted/50 p-1 w-full md:w-fit grid grid-cols-2 md:flex">
                  <TabsTrigger value="packs">Packs</TabsTrigger>
                  <TabsTrigger value="redeem">Redeem</TabsTrigger>
                </TabsList>
              </div>
            </div>

            <TabsContent
              value="packs"
              className="mt-0 flex-grow overflow-y-auto px-4 py-4 md:px-8 md:pb-8 custom-scrollbar bg-zinc-50/50"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-12 sm:pb-0">
                {COIN_PACKS.map((pack) => {
                  // ... (Gradient logic same as before)
                  let bgGradient = "from-slate-800 to-slate-900";
                  let borderColor = "border-slate-600";
                  let glowColor = "bg-slate-500/20";
                  let textColor = "text-slate-100";
                  let starColor = "text-slate-400";

                  if (pack.rarity === 3) {
                    bgGradient = "from-[#1e3a8a] to-[#172554]";
                    borderColor = "border-blue-400/50";
                    glowColor = "bg-blue-500/20";
                    textColor = "text-blue-50";
                    starColor = "text-blue-300";
                  } else if (pack.rarity === 4) {
                    bgGradient = "from-[#581c87] to-[#3b0764]";
                    borderColor = "border-purple-400/50";
                    glowColor = "bg-purple-500/20";
                    textColor = "text-purple-50";
                    starColor = "text-purple-300";
                  } else if (pack.rarity === 5) {
                    bgGradient = "from-[#d97706] to-[#78350f]";
                    borderColor = "border-amber-300";
                    glowColor = "bg-amber-500/30";
                    textColor = "text-amber-50";
                    starColor = "text-yellow-300";
                  }

                  return (
                    <div
                      key={pack.id}
                      className={cn(
                        "relative rounded-xl border-2 overflow-hidden transition-all duration-200 active:scale-[0.98] sm:hover:scale-[1.02] cursor-pointer flex flex-col shadow-lg",
                        borderColor,
                        "bg-gradient-to-br",
                        bgGradient
                      )}
                    >
                      {/* Simplified internal structure for brevity */}
                      <div className="p-3 flex justify-between relative z-10">
                        <div className="flex gap-0.5">
                          {[...Array(pack.rarity)].map((_, i) => (
                            <Star
                              key={i}
                              size={12}
                              className={cn("fill-current", starColor)}
                            />
                          ))}
                        </div>
                        {pack.bonus && (
                          <Badge className="bg-white/90 text-black text-[9px] font-bold h-5">
                            BONUS
                          </Badge>
                        )}
                      </div>
                      <div className="flex-grow flex flex-col items-center justify-center py-2 relative">
                        <div
                          className={cn(
                            "absolute inset-0 blur-3xl rounded-full opacity-60",
                            glowColor
                          )}
                        />
                        <Coins
                          size={40}
                          className={cn(
                            "relative z-10 drop-shadow-lg",
                            textColor
                          )}
                        />
                        <h3
                          className={cn(
                            "mt-2 font-black text-xl tracking-wide relative z-10",
                            textColor
                          )}
                        >
                          {pack.coins}
                        </h3>
                      </div>
                      <div className="p-3 bg-black/40 backdrop-blur-md border-t border-white/10 relative z-10">
                        <Button
                          className="w-full bg-white text-black hover:bg-white/90 font-bold h-10 shadow-lg"
                          onClick={() => handleTopUpStripe(pack)}
                          disabled={isRedirecting}
                        >
                          {isRedirecting ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            `$${pack.cost.toFixed(2)}`
                          )}
                        </Button>
                        {pack.coins >= 550 && (
                          <div
                            onClick={() => handleBankTransfer(pack)}
                            className={cn(
                              "mt-2 text-center text-[10px] opacity-70 flex items-center justify-center gap-1 py-1 cursor-pointer active:opacity-100",
                              textColor
                            )}
                          >
                            <MessageCircle size={10} /> Bank Transfer
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent
              value="redeem"
              className="mt-0 flex-grow overflow-y-auto px-4 pb-8"
            >
              {/* Same redeem logic, just ensure spacing */}
              <div className="bg-white dark:bg-zinc-800 p-6 rounded-2xl shadow-sm flex flex-col gap-4 mt-4">
                {/* ... redeem content ... */}
                <div className="flex w-full items-center gap-2">
                  <Input
                    className="text-center font-mono uppercase text-lg h-12"
                    placeholder="CODE"
                    value={redeemCode}
                    onChange={(e) => setRedeemCode(e.target.value)}
                  />
                </div>
                <Button
                  onClick={handleRedeemCode}
                  disabled={isRedeeming}
                  className="w-full h-12 font-bold text-lg"
                >
                  {isRedeeming ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    "Redeem"
                  )}
                </Button>
              </div>
            </TabsContent>
          </Tabs>

          {/* Mobile Close Button Footer if needed, or rely on top X */}
          <div className="sm:hidden p-4 bg-background border-t">
            <Button
              variant="outline"
              className="w-full h-12 text-base"
              onClick={() => setIsTopUpOpen(false)}
            >
              Close Shop
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* --- DELETE MODAL --- */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="w-[90vw] rounded-2xl sm:max-w-md">
          {/* Content same as previous, just ensure w-[90vw] for mobile margins */}
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" /> Delete Website
            </DialogTitle>
            <DialogDescription>This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="p-3 bg-red-50 text-red-900 rounded-lg text-sm border border-red-100">
              Confirm deletion of{" "}
              <strong>
                {
                  portfolios.find((p) => p.id === selectedPortfolioId)
                    ?.site_name
                }
              </strong>
              .
            </div>
            <Input
              value={deleteConfirmationName}
              onChange={(e) => setDeleteConfirmationName(e.target.value)}
              placeholder="Type website name"
              className="h-11"
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="ghost"
              className="h-11"
              onClick={() => setIsDeleteOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="h-11"
              onClick={handleDeleteSite}
              disabled={isDeleting}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- UPGRADE MODAL (FULL SCREEN MOBILE) --- */}
      <Dialog open={isUpgradeOpen} onOpenChange={setIsUpgradeOpen}>
        <DialogContent className="w-full h-[100dvh] sm:h-[90vh] sm:max-w-[1000px] p-0 flex flex-col bg-background sm:rounded-2xl border-none">
          <div className="p-4 border-b shrink-0 flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl font-bold">
                Manage Plan
              </DialogTitle>
              <DialogDescription className="text-xs">
                Upgrade your website.
              </DialogDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsUpgradeOpen(false)}
              className="sm:hidden"
            >
              <X size={20} />
            </Button>
          </div>

          <div className="flex-grow overflow-y-auto p-4 custom-scrollbar">
            {/* Billing Cycle Selector - Horizontal Scroll on Mobile */}
            <div className="flex justify-start sm:justify-center mb-6 overflow-x-auto no-scrollbar pb-2">
              <div className="bg-muted p-1 rounded-xl flex gap-1 border shrink-0">
                {[1, 3, 6, 12].map((duration) => {
                  const isActive = billingDuration === duration;
                  return (
                    <button
                      key={duration}
                      onClick={() =>
                        setBillingDuration(duration as PlanDuration)
                      }
                      className={cn(
                        "px-4 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap",
                        isActive
                          ? "bg-white shadow-sm text-foreground"
                          : "text-muted-foreground"
                      )}
                    >
                      {duration === 1 ? "Monthly" : `${duration} Months`}
                      {duration > 1 && (
                        <span className="text-[9px] bg-green-500 text-white px-1.5 rounded-full">
                          SAVE
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-12">
              {PLANS.map((plan) => {
                // ... (Plan Logic same as before)
                const details = plan.pricing[billingDuration as PlanDuration];
                const proration = calculateProration(plan.id);
                const isCurrentPlanId =
                  subscriptions[selectedPortfolioId || ""]?.plan_id === plan.id;
                const isExactlyCurrent =
                  isCurrentPlanId &&
                  billingDuration === proration.activeDuration;

                return (
                  <Card
                    key={plan.id}
                    className={cn(
                      "flex flex-col border-2 overflow-hidden",
                      isExactlyCurrent ? "border-primary bg-primary/5" : ""
                    )}
                  >
                    <CardHeader className="pb-3 p-5">
                      <CardTitle className="flex justify-between">
                        {plan.name} {isExactlyCurrent && <Badge>Active</Badge>}
                      </CardTitle>
                      <div className="text-2xl font-black mt-2">
                        ${details.stripeCost}
                        <span className="text-sm text-muted-foreground font-medium">
                          /mo
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent className="flex-grow p-5 pt-0 space-y-4">
                      <div className="bg-amber-50 p-3 rounded-lg text-center border border-amber-100">
                        <div className="text-[10px] text-amber-700 font-bold uppercase mb-1">
                          Coin Price
                        </div>
                        <div className="flex items-center justify-center gap-1.5 text-amber-900 font-black text-lg">
                          <Coins
                            size={16}
                            className="fill-amber-500 text-amber-600"
                          />{" "}
                          {proration.isUpgrade && proration.unusedValue > 0
                            ? proration.cost
                            : details.coinCost}
                        </div>
                      </div>
                      <ul className="space-y-2">
                        {plan.features.map((f) => (
                          <li
                            key={f}
                            className="flex items-center gap-3 text-xs font-medium text-muted-foreground"
                          >
                            <Check size={14} className="text-green-600" /> {f}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                    <CardFooter className="p-5 pt-0 flex flex-col gap-3">
                      {!isExactlyCurrent && (
                        <Button
                          className="w-full font-bold h-11"
                          onClick={() => handleBuyWithWallet(plan)}
                          disabled={!!processingPlan}
                        >
                          {processingPlan === plan.id ? (
                            <Loader2 className="animate-spin" />
                          ) : (
                            "Use Coins"
                          )}
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        className="w-full h-8 text-xs"
                        onClick={() => handleDirectStripe(plan)}
                      >
                        Pay with Card
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Modal - Also Mobile Full Screen */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="w-[95vw] rounded-2xl sm:max-w-[600px] max-h-[85vh] flex flex-col p-0">
          {/* ... similar full screen mobile structure ... */}
          <DialogHeader className="p-6 pb-2">
            <DialogTitle>New Website</DialogTitle>
            <DialogDescription>Pick a template to start.</DialogDescription>
          </DialogHeader>
          <div className="flex-grow overflow-y-auto px-6 py-2">
            <Label>Name</Label>
            <Input
              placeholder="My Portfolio"
              value={newSiteName}
              onChange={(e) => setNewSiteName(e.target.value)}
              className="mb-4 mt-1 h-11"
            />
            <Label>Template</Label>
            <div className="grid grid-cols-1 gap-3 mt-2 pb-4">
              {PORTFOLIO_TEMPLATES.map((template) => (
                <div
                  key={template.id}
                  onClick={() => setSelectedTemplate(template.id)}
                  className={cn(
                    "flex items-center gap-4 p-3 border-2 rounded-xl cursor-pointer active:scale-95 transition-transform",
                    selectedTemplate === template.id
                      ? "border-primary bg-primary/5"
                      : "border-border"
                  )}
                >
                  <div className="h-10 w-10 bg-muted rounded-lg flex items-center justify-center shrink-0">
                    <LayoutTemplate size={20} />
                  </div>
                  <div>
                    <div className="font-bold text-sm">{template.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {template.description}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter className="p-4 border-t gap-2 sm:gap-0">
            <Button
              variant="outline"
              className="h-11"
              onClick={() => setIsCreateOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="h-11"
              onClick={handleCreateSite}
              disabled={isCreating}
            >
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SettingsPage;
