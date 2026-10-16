import { useMemo, useState } from "react";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { stripeForAccount } from "@/lib/stripeClient";
import { formatPrice } from "./api";

function PayForm({ label, onPaid }: { label: string; onPaid: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setBusy(true);
    setError(null);
    const { error: payError, paymentIntent } = await stripe.confirmPayment({ elements, redirect: "if_required" });
    if (payError) {
      setError(payError.message || "Payment failed.");
      setBusy(false);
    } else if (paymentIntent?.status === "succeeded" || paymentIntent?.status === "processing") {
      onPaid();
    } else {
      setError("Payment was not completed.");
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <PaymentElement />
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <button
        type="submit"
        disabled={busy || !stripe || !elements}
        className="w-full rounded-full bg-primary px-5 py-2.5 font-semibold text-primary-foreground disabled:opacity-60"
      >
        {busy ? "Processing…" : label}
      </button>
    </form>
  );
}

interface Props {
  clientSecret: string;
  connectedAccountId: string;
  amountDueCents: number;
  currency: string;
  holdMinutes: number;
  onPaid: () => void;
}

export function BookingPayment({ clientSecret, connectedAccountId, amountDueCents, currency, holdMinutes, onPaid }: Props) {
  const stripePromise = useMemo(() => stripeForAccount(connectedAccountId), [connectedAccountId]);
  const amount = formatPrice(amountDueCents, currency);
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Your time is held for {holdMinutes} minutes while you pay.</p>
      <Elements stripe={stripePromise} options={{ clientSecret }}>
        <PayForm label={`Pay ${amount}`} onPaid={onPaid} />
      </Elements>
    </div>
  );
}
