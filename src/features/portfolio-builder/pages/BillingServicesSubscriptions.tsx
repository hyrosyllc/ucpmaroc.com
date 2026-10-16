import React, { useState } from "react";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Loader2, ArrowRight, AlertCircle } from "lucide-react";
import { useBillingData } from "@/hooks/useBillingData";
import { SITE_PLANS } from "@/config/plans";

const CheckoutDialog = ({
  isOpen,
  onClose,
  site,
  selectedPlan,
  onSelectPlan,
  busyCheckout,
  onCheckout,
}: any) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[90vw] rounded-2xl sm:max-w-md">
        <DialogTitle>Subscribe to {site?.site_name || "your site"}</DialogTitle>
        <DialogDescription>Choose a plan and proceed to checkout.</DialogDescription>
        <div className="space-y-3 py-4">
          {SITE_PLANS.filter((p) => p.id !== "free").map((plan) => (
            <button
              key={plan.id}
              onClick={() => onSelectPlan(plan.id)}
              className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                selectedPlan === plan.id
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <div className="font-semibold text-sm">{plan.name}</div>
              <div className="text-xs text-muted-foreground mt-1">{plan.description}</div>
              <div className="font-bold text-primary mt-2">${(plan.price_cents / 100).toFixed(2)}/month</div>
            </button>
          ))}
        </div>
        <Button
          className="w-full"
          disabled={!selectedPlan || busyCheckout}
          onClick={() => onCheckout()}
        >
          {busyCheckout ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Redirecting...
            </>
          ) : (
            <>
              Proceed to checkout <ArrowRight className="h-4 w-4 ml-2" />
            </>
          )}
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default function BillingServicesSubscriptions() {
  const { actorData } = useOutletContext<ActorDashboardContextType>();
  const { loading, data, refetch } = useBillingData(actorData?.id);
  const [busySubscriptionId, setBusySubscriptionId] = useState<string | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutSiteId, setCheckoutSiteId] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [busyCheckout, setBusyCheckout] = useState(false);

  const currentCheckoutSite = data.portfolios.find((s) => s.id === checkoutSiteId);

  const handleSubscriptionRenewal = async (subscription: any) => {
    if (!subscription?.portfolio_id) return;
    setBusySubscriptionId(subscription.portfolio_id);
    try {
      const action = subscription.cancel_at_period_end ? "resume_subscription" : "cancel_subscription";
      await supabase.functions.invoke("stripe-billing", {
        body: {
          action,
          actorId: actorData.id,
          portfolioId: subscription.portfolio_id,
        },
      });
      refetch();
    } finally {
      setBusySubscriptionId(null);
    }
  };

  const handleOpenCheckout = (siteId: string) => {
    setCheckoutSiteId(siteId);
    setSelectedPlan(null);
    setIsCheckoutOpen(true);
  };

  const handleCheckout = async () => {
    if (!selectedPlan || !checkoutSiteId) return;
    setBusyCheckout(true);
    try {
      const { data: result } = await supabase.functions.invoke("create-checkout-session", {
        body: {
          action: "create_checkout",
          portfolioId: checkoutSiteId,
          planId: selectedPlan,
          actorId: actorData.id,
        },
      });
      if (result?.url) {
        window.location.href = result.url;
      }
    } finally {
      setBusyCheckout(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <CheckoutDialog
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        site={currentCheckoutSite}
        selectedPlan={selectedPlan}
        onSelectPlan={setSelectedPlan}
        busyCheckout={busyCheckout}
        onCheckout={handleCheckout}
      />

      <div className="w-full max-w-8xl md:p-4">
        <div className="px-4 py-6 md:py-8">
          <div className="space-y-1 mb-6">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">Services & Subscriptions</h1>
            <p className="text-muted-foreground text-sm md:text-base">
              Manage your subscriptions across all websites.
            </p>
          </div>
        </div>

        <div className="px-4">
          <Card className="rounded-xl shadow-sm border-border/60 overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Your Websites</CardTitle>
              <CardDescription>All active subscriptions and services across your websites.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {data.portfolios.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground text-sm">No websites yet.</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Site</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Renews / expires</TableHead>
                      <TableHead>Payment method</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.portfolios.map((site) => {
                      const sub = data.subscriptions[site.id];
                      const isPro = sub && sub.status === "active" && new Date(sub.current_period_end) > new Date();
                      const plan = SITE_PLANS.find((p) => p.id === sub?.plan_id);
                      const isCancelPending = sub?.cancel_at_period_end;

                      return (
                        <TableRow key={site.id}>
                          <TableCell className="font-medium">{site.site_name || "Untitled"}</TableCell>
                          <TableCell>{isPro ? plan?.name || "Pro" : "Trial / Free"}</TableCell>
                          <TableCell>
                            {isCancelPending && (
                              <Badge variant="secondary" className="text-[10px]">
                                Canceling
                              </Badge>
                            )}
                            {!isCancelPending && (
                              <Badge variant={isPro ? "default" : "outline"} className="text-[10px]">
                                {isPro ? "Active" : "Not subscribed"}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {isPro ? new Date(sub.current_period_end).toLocaleDateString() : "—"}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground capitalize">
                            {sub?.payment_method || "—"}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2 flex-wrap">
                              {!isPro && (
                                <Button
                                  size="sm"
                                  className="font-semibold"
                                  onClick={() => handleOpenCheckout(site.id)}
                                >
                                  Subscribe
                                </Button>
                              )}
                              {isPro && (
                                <Button size="sm" variant="outline" asChild>
                                  <a href={`/dashboard/settings?tab=websites&siteId=${site.id}`}>
                                    Edit site
                                  </a>
                                </Button>
                              )}
                              {isPro && sub?.payment_method === "stripe" && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  disabled={busySubscriptionId === sub.portfolio_id}
                                  onClick={() => handleSubscriptionRenewal(sub)}
                                  className="text-xs"
                                >
                                  {busySubscriptionId === sub.portfolio_id ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : isCancelPending ? (
                                    "Resume"
                                  ) : (
                                    "Cancel"
                                  )}
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
