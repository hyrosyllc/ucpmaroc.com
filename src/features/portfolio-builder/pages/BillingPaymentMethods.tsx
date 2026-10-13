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
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Loader2, Plus, Star, Trash2, CreditCard, ExternalLink, Lock } from "lucide-react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { useBillingData } from "@/hooks/useBillingData";

const stripePromise = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)
  : Promise.resolve(null);

interface PaymentMethod {
  id: string;
  brand?: string;
  last4?: string;
  expMonth?: number;
  expYear?: number;
  isDefault: boolean;
}

const AddCardForm = ({ onSuccess }: { onSuccess: () => void }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setIsSaving(true);
    const { error } = await stripe.confirmSetup({
      elements,
      redirect: "if_required",
    });
    if (!error) {
      onSuccess();
    }
    setIsSaving(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement options={{ layout: "tabs" }} />
      <Button type="submit" disabled={!stripe || isSaving} className="w-full h-11 font-bold">
        {isSaving ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Lock className="mr-2 h-4 w-4" />}
        Save card
      </Button>
    </form>
  );
};

export default function BillingPaymentMethods() {
  const { actorData } = useOutletContext<ActorDashboardContextType>();
  const { data, refetch } = useBillingData(actorData?.id);
  const [isAddCardOpen, setIsAddCardOpen] = useState(false);
  const [cardSetupSecret, setCardSetupSecret] = useState<string | null>(null);
  const [busyMethodId, setBusyMethodId] = useState<string | null>(null);

  const handleOpenAddCard = async () => {
    setIsAddCardOpen(true);
    setCardSetupSecret(null);
    const { data: result } = await supabase.functions.invoke("stripe-billing", {
      body: { action: "create_setup_intent", actorId: actorData.id },
    });
    if (result?.clientSecret) {
      setCardSetupSecret(result.clientSecret);
    }
  };

  const handleRemoveCard = async (paymentMethodId: string) => {
    setBusyMethodId(paymentMethodId);
    try {
      await supabase.functions.invoke("stripe-billing", {
        body: { action: "detach_payment_method", actorId: actorData.id, paymentMethodId },
      });
      refetch();
    } finally {
      setBusyMethodId(null);
    }
  };

  const handleSetDefaultCard = async (paymentMethodId: string) => {
    setBusyMethodId(paymentMethodId);
    try {
      await supabase.functions.invoke("stripe-billing", {
        body: { action: "set_default_payment_method", actorId: actorData.id, paymentMethodId },
      });
      refetch();
    } finally {
      setBusyMethodId(null);
    }
  };

  return (
    <>
      <div className="w-full max-w-8xl md:p-4">
        <div className="px-4 py-6 md:py-8">
          <div className="space-y-1 mb-6">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">Payment Methods</h1>
            <p className="text-muted-foreground text-sm md:text-base">
              Manage your saved payment methods for subscriptions and credit top-ups.
            </p>
          </div>
        </div>

        <div className="px-4">
          <Card className="rounded-xl shadow-sm border-border/60">
            <CardHeader className="pb-3 flex flex-row items-center justify-between gap-4">
              <div>
                <CardTitle className="text-base">Saved cards</CardTitle>
            <CardDescription>Used for subscriptions and credit top-ups.</CardDescription>
          </div>
          <Button size="sm" onClick={handleOpenAddCard} className="font-semibold shrink-0">
            <Plus size={14} className="mr-1.5" /> Add card
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {data.paymentMethods.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">No saved cards yet.</div>
          ) : (
            data.paymentMethods.map((pm: PaymentMethod) => (
              <div key={pm.id} className="flex items-center justify-between gap-3 rounded-lg border border-border/60 p-3">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
                    <CreditCard size={16} />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-foreground capitalize flex items-center gap-2">
                      {pm.brand} •••• {pm.last4}
                      {pm.isDefault && <Badge variant="outline" className="text-[9px]">Default</Badge>}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Expires {pm.expMonth}/{pm.expYear}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {!pm.isDefault && (
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={busyMethodId === pm.id}
                      onClick={() => handleSetDefaultCard(pm.id)}
                    >
                      <Star size={14} className="mr-1.5" /> Make default
                    </Button>
                  )}
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-destructive hover:bg-destructive/10"
                    disabled={busyMethodId === pm.id}
                    onClick={() => handleRemoveCard(pm.id)}
                    aria-label={`Remove card ending in ${pm.last4}`}
                  >
                    {busyMethodId === pm.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 size={16} />
                    )}
                  </Button>
                </div>
              </div>
            ))
          )}
          <a
            href="#"
            onClick={async (e) => {
              e.preventDefault();
              const { data: result } = await supabase.functions.invoke("create-portal-session", {
                body: { actorId: actorData.id, returnUrl: window.location.href },
              });
              if (result?.url) window.location.href = result.url;
            }}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground pt-2"
          >
            Manage invoices & receipts in Stripe <ExternalLink size={12} />
          </a>
          </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={isAddCardOpen} onOpenChange={setIsAddCardOpen}>
        <DialogContent className="w-[90vw] rounded-2xl sm:max-w-md">
          <DialogTitle>Add a payment method</DialogTitle>
          <DialogDescription>Your card is securely stored by Stripe.</DialogDescription>
          {!import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ? (
            <div className="text-center py-8 text-destructive">
              <p>Stripe is not configured. Please contact support.</p>
            </div>
          ) : !cardSetupSecret ? (
            <div className="flex justify-center py-8">
              <Loader2 className="animate-spin text-primary" />
            </div>
          ) : (
            <Elements stripe={stripePromise} options={{ clientSecret: cardSetupSecret }}>
              <AddCardForm
                onSuccess={() => {
                  setIsAddCardOpen(false);
                  refetch();
                }}
              />
            </Elements>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
