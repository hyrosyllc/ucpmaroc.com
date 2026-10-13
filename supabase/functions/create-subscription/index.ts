import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@12.0.0?target=deno";
import { requireActorForRequest } from "../_shared/actorAuth.ts";
import { resolveSubscriptionPrice, asUuid } from "../_shared/billingConfig.ts";
import { getOrCreateStripeCustomer } from "../_shared/stripeCustomer.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY") ?? "";
const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2022-11-15",
  httpClient: Stripe.createFetchHttpClient(),
});

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const supabaseAdmin = createClient(
    supabaseUrl,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );

  try {
    const { planId, durationMonths, actorId: rawActorId } = await req.json();

    if (!stripeSecretKey) throw new Error("Stripe secret key configuration error.");
    if (typeof planId !== "string" || !planId) throw new Error("Invalid or missing planId.");
    if (!Number.isInteger(durationMonths) || ![1, 3, 6, 12].includes(durationMonths)) {
      throw new Error("Invalid billing duration (must be 1, 3, 6, or 12 months).");
    }

    const actorId = asUuid(rawActorId, "actorId");
    const actor = await requireActorForRequest(req, supabaseAdmin, actorId);

    // Resolve price from database
    const price = await resolveSubscriptionPrice(supabaseAdmin, planId, durationMonths);

    // Get or create Stripe customer
    const customerId = await getOrCreateStripeCustomer(supabaseAdmin, stripe, actorId);

    // Check if actor already has an active subscription
    const { data: existing, error: existingError } = await supabaseAdmin
      .from("subscriptions")
      .select("id, stripe_subscription_id, status")
      .eq("actor_id", actorId)
      .eq("status", "active")
      .maybeSingle();

    if (existingError) throw existingError;
    if (existing) {
      throw new Error(
        "You already have an active subscription. Please cancel it first or upgrade your existing plan."
      );
    }

    // Create Stripe subscription
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: price.stripe_price_id }],
      payment_behavior: "default_incomplete",
      expand: ["latest_invoice.payment_intent"],
    });

    // Store subscription in database
    const { error: dbError } = await supabaseAdmin.from("subscriptions").insert({
      actor_id: actorId,
      stripe_subscription_id: subscription.id,
      stripe_price_id: price.stripe_price_id,
      plan_id: price.plan_id,
      duration_months: price.duration_months,
      amount_cents: price.amount_cents,
      status: subscription.status,
      payment_method: "stripe",
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    });

    if (dbError) throw dbError;

    const latestInvoice = subscription.latest_invoice as any;
    const clientSecret = latestInvoice?.payment_intent?.client_secret;

    return new Response(
      JSON.stringify({
        success: true,
        subscription_id: subscription.id,
        status: subscription.status,
        client_secret: clientSecret,
        current_period_end: subscription.current_period_end,
        plan_id: price.plan_id,
        amount_usd: price.amount_cents / 100,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("create-subscription error:", error);
    return new Response(
      JSON.stringify({
        error: error.message || "An unexpected error occurred.",
      }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
