import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Charges a saved card (default payment method) for an off-session transaction.
// Used for subscription renewals and auto top-ups. Amount is in USD.
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { amount, customerId, actor_id } = await req.json();

    if (!customerId || !amount || typeof amount !== "number" || amount <= 0) {
      throw new Error("Missing or invalid amount/customerId");
    }

    if (!STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY not configured");
    }

    // Charge the saved card via Stripe PaymentIntent (off-session).
    // Amount must be in cents, currency is USD.
    const amountCents = Math.round(amount * 100);
    const stripeApiUrl = "https://api.stripe.com/v1/payment_intents";

    const body = new URLSearchParams({
      amount: amountCents.toString(),
      currency: "usd",
      customer: customerId,
      confirm: "true",
      off_session: "true",
      payment_method_types: "card",
      description: actor_id ? `Auto top-up for actor ${actor_id}` : "Platform charge",
    });

    const response = await fetch(stripeApiUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${STRIPE_SECRET_KEY}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Stripe charge failed", { status: response.status, error: data.error });
      throw new Error(data.error?.message || `Charge failed (${response.status})`);
    }

    // Log the charge attempt in the database if actor_id provided.
    if (actor_id) {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
      );

      await supabase.from("wallet_transactions").insert({
        actor_id,
        amount: 0, // Credits added separately by auto-topup-charge
        type: "purchase",
        status: "completed",
        description: `Stripe charge: $${amount.toFixed(2)} USD (Intent: ${data.id})`,
      }).catch((err) => {
        console.error("Failed to log charge transaction", err);
        // Non-blocking: charge already succeeded
      });
    }

    return new Response(JSON.stringify({
      success: true,
      payment_intent_id: data.id,
      amount_usd: amount,
      status: data.status,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("charge-saved-card error:", error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});