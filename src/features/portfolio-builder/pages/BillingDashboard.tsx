import React, { useState, useEffect } from "react";
import { supabase } from "@/supabaseClient";
import { useOutletContext } from "react-router-dom";
import { ActorDashboardContextType } from "@/layouts/ActorDashboardLayout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Coins,
  Globe,
  CreditCard,
  ArrowDownRight,
  Gift,
  RotateCcw,
  Zap,
  Plus,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useBillingData } from "@/hooks/useBillingData";
import { TopUpModal } from "@/features/portfolio-builder";

const TXN_TYPE_META: Record<string, { label: string; icon: any; tone: string }> = {
  purchase: { label: "Purchase", icon: ArrowDownRight, tone: "text-foreground" },
  redeem_code: { label: "Redeemed code", icon: Gift, tone: "text-emerald-600" },
  chargeback: { label: "Chargeback", icon: RotateCcw, tone: "text-destructive" },
  usage: { label: "Usage", icon: Zap, tone: "text-foreground" },
  usage_reversal: { label: "Usage refund", icon: RotateCcw, tone: "text-emerald-600" },
};

export default function BillingDashboard() {
  const { actorData } = useOutletContext<ActorDashboardContextType>();
  const { loading, data, refetch } = useBillingData(actorData?.id);
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [autoTopUpLoading, setAutoTopUpLoading] = useState(false);
  const [autoTopUpEnabled, setAutoTopUpEnabled] = useState(data.autoTopUpSettings.enabled);
  const [autoTopUpThreshold, setAutoTopUpThreshold] = useState(data.autoTopUpSettings.threshold);
  const [autoTopUpAmount, setAutoTopUpAmount] = useState(data.autoTopUpSettings.amount);

  const walletBalance = actorData?.wallet_balance ?? 0;

  useEffect(() => {
    refetch();
  }, [actorData?.id, refetch]);

  const totalTodayCredits = Object.values(
    data.todayUsageRecords.reduce<Record<string, number>>((acc, record) => {
      acc[record.product_id] = (acc[record.product_id] || 0) + record.credits_charged;
      return acc;
    }, {})
  ).reduce((sum, credits) => sum + credits, 0);

  const activeSitesCount = data.portfolios.filter((site) => {
    const sub = data.subscriptions[site.id];
    return sub && sub.status === "active" && new Date(sub.current_period_end) > new Date();
  }).length;

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <TopUpModal
        isOpen={isTopUpOpen}
        onOpenChange={setIsTopUpOpen}
        actorData={actorData}
        profile={actorData}
        onSuccess={() => {
          setIsTopUpOpen(false);
          refetch();
        }}
        notify={() => {}}
      />

      <div className="w-full max-w-8xl md:p-4">
        <div className="px-4 py-6 md:py-8">
          <div className="space-y-1 mb-6">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">Billing Overview</h1>
            <p className="text-muted-foreground text-sm md:text-base">
              View your Platform Credits, usage, and auto top-up settings.
            </p>
          </div>
        </div>

        <div className="px-4 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-card p-4">
            <div>
              <span className="text-xs text-muted-foreground font-medium">Platform Credits</span>
              <div className={cn("text-xl font-bold mt-0.5", walletBalance < 0 ? "text-destructive" : "text-foreground")}>
                {walletBalance.toLocaleString()}
              </div>
            </div>
            <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center", walletBalance < 0 ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary")}>
              <Coins size={18} />
            </div>
          </div>
          <div className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-card p-4">
            <div>
              <span className="text-xs text-muted-foreground font-medium">Active services</span>
              <div className="text-xl font-bold text-foreground mt-0.5">{activeSitesCount} / {data.portfolios.length}</div>
            </div>
            <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Globe size={18} />
            </div>
          </div>
          <div className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-card p-4">
            <div>
              <span className="text-xs text-muted-foreground font-medium">Saved payment methods</span>
              <div className="text-xl font-bold text-foreground mt-0.5">{data.paymentMethods.length}</div>
            </div>
            <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <CreditCard size={18} />
            </div>
          </div>
        </div>

        {/* Alerts */}
        {actorData?.is_suspended && (
          <div role="alert" className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-destructive">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <AlertTriangle size={16} className="shrink-0" />
              {actorData.suspended_reason || "Your account is suspended due to a negative balance."}
            </div>
            <Button size="sm" variant="destructive" onClick={() => setIsTopUpOpen(true)} className="shrink-0">
              Settle balance
            </Button>
          </div>
        )}

        {/* Today's Usage */}
        {totalTodayCredits > 0 && (
          <Card className="rounded-xl shadow-sm border-border/60 bg-gradient-to-r from-primary/5 to-transparent">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Today's usage</CardTitle>
              <CardDescription>Credits burned in the last 24 hours.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between gap-3 rounded-lg border border-primary/20 bg-primary/5 p-3">
                <span className="text-sm font-medium text-foreground">Total today</span>
                <span className="text-lg font-bold text-primary">{totalTodayCredits.toLocaleString()} credits</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Auto Top-Up */}
        <Card className="rounded-xl shadow-sm border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Auto top-up</CardTitle>
            <CardDescription>Automatically refill your wallet when credits run low.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="autoTopUp"
                checked={autoTopUpEnabled}
                onChange={(e) => setAutoTopUpEnabled(e.target.checked)}
                className="rounded border border-border"
              />
              <label htmlFor="autoTopUp" className="text-sm font-medium text-foreground">
                Enable auto top-up
              </label>
            </div>
            {autoTopUpEnabled && (
              <div className="space-y-3 pt-2 border-t border-border/60">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">When credits drop below</label>
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="number"
                      min="10"
                      max="1000"
                      value={autoTopUpThreshold}
                      onChange={(e) => setAutoTopUpThreshold(Math.max(10, Number(e.target.value)))}
                      className="flex-1 px-3 py-2 text-sm border border-border rounded-lg bg-background"
                    />
                    <span className="text-sm font-medium text-foreground">credits</span>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Automatically charge</label>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm font-medium text-foreground">$</span>
                    <input
                      type="number"
                      min="5"
                      max="500"
                      step="5"
                      value={autoTopUpAmount}
                      onChange={(e) => setAutoTopUpAmount(Math.max(5, Number(e.target.value)))}
                      className="flex-1 px-3 py-2 text-sm border border-border rounded-lg bg-background"
                    />
                  </div>
                </div>
                <Button
                  className="w-full"
                  size="sm"
                  disabled={autoTopUpLoading}
                  onClick={async () => {
                    setAutoTopUpLoading(true);
                    try {
                      const { error } = await supabase
                        .from("actors")
                        .update({
                          auto_topup_enabled: autoTopUpEnabled,
                          auto_topup_threshold: autoTopUpThreshold,
                          auto_topup_amount: autoTopUpAmount,
                        })
                        .eq("id", actorData.id);
                      if (!error) {
                        refetch();
                      }
                    } finally {
                      setAutoTopUpLoading(false);
                    }
                  }}
                >
                  {autoTopUpLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                  Save settings
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="rounded-xl shadow-sm border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Recent activity</CardTitle>
            <CardDescription>Your last 5 credit transactions.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {data.transactions.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground text-sm">No transactions yet.</div>
            ) : (
              <div className="divide-y">
                {data.transactions.slice(0, 5).map((tx) => {
                  const meta = TXN_TYPE_META[tx.type] || TXN_TYPE_META.purchase;
                  const Icon = meta.icon;
                  return (
                    <div key={tx.id} className="flex items-center justify-between gap-3 p-4">
                      <div className="flex items-center gap-3">
                        <div className={cn("h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0", meta.tone)}>
                          <Icon size={14} />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-foreground">{tx.description || meta.label}</div>
                          <div className="text-[11px] text-muted-foreground">{new Date(tx.created_at).toLocaleDateString()}</div>
                        </div>
                      </div>
                      <div className={cn("font-semibold text-sm whitespace-nowrap", tx.amount > 0 ? "text-emerald-600" : "text-foreground")}>
                        {tx.amount > 0 ? "+" : ""}{tx.amount}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
        </div>
      </div>
    </>
  );
}
