import React from "react";
import { useSearchParams } from "react-router-dom";
import { useOutletContext } from "react-router-dom";
import { ActorDashboardContextType } from "@/layouts/ActorDashboardLayout";
import { Button } from "@/components/ui/button";
import { Coins, Plus } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { NotificationContainer, Notification } from "@/components/ui/NotificationToast";
import { TopUpModal } from "@/features/portfolio-builder";
import { BillingLayout } from "./BillingLayout";
import BillingDashboard from "./BillingDashboard";
import BillingServicesSubscriptions from "./BillingServicesSubscriptions";
import BillingUsageActivity from "./BillingUsageActivity";
import BillingPaymentMethods from "./BillingPaymentMethods";

export default function Billing() {
  const { actorData } = useOutletContext<ActorDashboardContextType>();
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "dashboard";
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const walletBalance = actorData?.wallet_balance ?? 0;

  const removeNotification = (id: string) =>
    setNotifications((prev) => prev.filter((n) => n.id !== id));

  const renderTabContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <BillingDashboard />;
      case "services":
        return <BillingServicesSubscriptions />;
      case "usage":
        return <BillingUsageActivity />;
      case "payment-methods":
        return <BillingPaymentMethods />;
      default:
        return <BillingDashboard />;
    }
  };

  return (
    <div className="w-full max-w-8xl md:p-4">
      <NotificationContainer notifications={notifications} removeNotification={removeNotification} />
      <TopUpModal
        isOpen={isTopUpOpen}
        onOpenChange={setIsTopUpOpen}
        actorData={actorData}
        profile={actorData}
        onSuccess={() => setIsTopUpOpen(false)}
        notify={() => {}}
      />

      <div className="px-4 py-6 md:py-8 space-y-6">
        <div className="flex flex-col md:flex-row justify-between md:items-end gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">Billing</h1>
            <p className="text-muted-foreground text-sm md:text-base">
              Manage your Platform Credits, subscriptions, usage, and payment methods.
            </p>
          </div>
          <Button onClick={() => setIsTopUpOpen(true)} className="font-semibold shrink-0">
            <Plus size={16} className="mr-1.5" /> Top up credits
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
        </div>
      </div>

      <BillingLayout>
        {renderTabContent()}
      </BillingLayout>
    </div>
  );
}
