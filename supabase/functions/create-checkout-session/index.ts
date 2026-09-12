import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import Stripe from "https://esm.sh/stripe@12.0.0?target=deno";
import { getOrCreateStripeCustomer } from "../_shared/stripeCustomer.ts";
import { requireActorForRequest } from "../_shared/actorAuth.ts";
import {
  asUuid,
  resolveSubscriptionPrice,
  validateStripeRecurringPrice,
} from "../_shared/billingConfig.ts";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
  apiVersion: "2022-11-15",
  httpClient: Stripe.createFetchHttpClient(),
});

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );
  let attemptId: string | null = null;
  let checkoutCreated = false;
  let checkoutRequestStarted = false;

  try {
    const { actorId, portfolioId, planId, durationMonths } = await req.json();
    const trustedActorId = asUuid(actorId, "actorId");
    const trustedPortfolioId = asUuid(portfolioId, "portfolioId");
    await requireActorForRequest(req, supabase, trustedActorId);

    const { data: portfolio, error: portfolioError } = await supabase
      .from("portfolios")
      .select("id, actor_id")
      .eq("id", trustedPortfolioId)
      .maybeSingle();
    if (portfolioError) throw portfolioError;
    if (!portfolio || portfolio.actor_id !== trustedActorId) {
      throw new Error("Portfolio does not belong to the authenticated actor.");
    }

    const configured = resolveSubscriptionPrice(planId, durationMonths);
    const stripePrice = await stripe.prices.retrieve(configured.stripePriceId);
    validateStripeRecurringPrice(stripePrice, configured);

    const { data: currentSubscription, error: subscriptionError } = await supabase
      .from("subscriptions")
      .select("status, payment_method, current_period_end, stripe_subscription_id")
      .eq("portfolio_id", trustedPortfolioId)
      .maybeSingle();
    if (subscriptionError) throw subscriptionError;
    if (
      currentSubscription?.payment_method === "stripe" &&
      currentSubscription?.stripe_subscription_id &&
      ["active", "trialing", "past_due", "unpaid"].includes(currentSubscription.status)
    ) {
      throw new Error("This website already has a Stripe subscription. Manage or change it from Billing.");
    }

    attemptId = crypto.randomUUID();
    const metadata = {
      billing_attempt_id: attemptId,
      billing_purpose: "subscription",
      actor_id: trustedActorId,
      portfolio_id: trustedPortfolioId,
      plan_id: configured.planId,
      duration_months: String(configured.durationMonths),
    };

    const { error: attemptError } = await supabase.from("billing_payment_attempts").insert({
      id: attemptId,
      actor_id: trustedActorId,
      provider: "stripe",
      purpose: "subscription",
      status: "pending",
      currency: "usd",
      expected_amount_cents: configured.amountCents,
      plan_id: configured.planId,
      portfolio_id: trustedPortfolioId,
      metadata: { duration_months: configured.durationMonths, stripe_price_id: configured.stripePriceId },
    });
    if (attemptError) throw attemptError;

    const customerId = await getOrCreateStripeCustomer(supabase, stripe, trustedActorId);
    const appUrl = Deno.env.get("APP_URL")?.replace(/\/$/, "");
    if (!appUrl) throw new Error("Missing APP_URL in Supabase Edge Function secrets.");

    checkoutRequestStarted = true;
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription",
      line_items: [{ price: configured.stripePriceId, quantity: 1 }],
      metadata,
      customer: customerId,
      subscription_data: { metadata },
      success_url: `${appUrl}/dashboard/settings?tab=billing&checkout=success`,
      cancel_url: `${appUrl}/dashboard/settings?tab=billing&checkout=canceled`,
      client_reference_id: attemptId,
    }, { idempotencyKey: `subscription-checkout-${attemptId}` });
    checkoutCreated = true;

    const { error: updateError } = await supabase
      .from("billing_payment_attempts")
      .update({ provider_reference: session.id, updated_at: new Date().toISOString() })
      .eq("id", attemptId);
    if (updateError) throw updateError;

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    if (attemptId && !checkoutCreated && !checkoutRequestStarted) {
      await supabase.from("billing_payment_attempts").update({
        status: "failed",
        failure_code: "checkout_creation_failed",
        updated_at: new Date().toISOString(),
      }).eq("id", attemptId).eq("status", "pending");
    }
    console.error("Subscription checkout error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
