import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import Stripe from "https://esm.sh/stripe@12.0.0?target=deno";
import {
  asUuid,
  resolveSubscriptionPriceByStripeId,
  validateStripeRecurringPrice,
} from "../_shared/billingConfig.ts";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
  apiVersion: "2022-11-15",
  httpClient: Stripe.createFetchHttpClient(),
});
const cryptoProvider = Stripe.createSubtleCryptoProvider();

async function claimEvent(supabase: any, eventId: string, eventType: string) {
  const { data, error } = await supabase.rpc("claim_processed_stripe_event", {
    p_event_id: eventId,
    p_event_type: eventType,
  });
  if (error) throw error;
  const result = data?.[0];
  if (result?.claimed) return true;
  if (result?.event_status === "completed") return false;
  throw new Error("This webhook event is already being processed; please retry.");
}

function objectId(value: any) {
  return typeof value === "string" ? value : value?.id;
}

async function syncSubscription(
  supabase: any,
  subscription: any,
  fallbackMetadata: Record<string, string> = {},
) {
  if (!subscription?.id) throw new Error("Stripe subscription id is missing.");
  if (!Array.isArray(subscription.items?.data) || subscription.items.data.length !== 1) {
    throw new Error("Platform subscriptions must have exactly one Stripe line item.");
  }

  const itemPriceValue = subscription.items.data[0].price;
  const price = typeof itemPriceValue === "string"
    ? await stripe.prices.retrieve(itemPriceValue)
    : itemPriceValue;
  const configured = resolveSubscriptionPriceByStripeId(price.id);
  validateStripeRecurringPrice(price, configured, false);

  const { data: existingByStripe, error: stripeLookupError } = await supabase
    .from("subscriptions")
    .select("id, actor_id, portfolio_id, plan_id, metadata")
    .eq("stripe_subscription_id", subscription.id)
    .maybeSingle();
  if (stripeLookupError) throw stripeLookupError;

  const metadata = { ...fallbackMetadata, ...(subscription.metadata ?? {}) };
  const rawAttemptId = metadata.billing_attempt_id;
  let attempt: any = null;
  if (rawAttemptId) {
    const attemptId = asUuid(rawAttemptId, "billing_attempt_id");
    const { data, error } = await supabase
      .from("billing_payment_attempts")
      .select("id, actor_id, portfolio_id, plan_id, provider, purpose, status, metadata, completed_at")
      .eq("id", attemptId)
      .maybeSingle();
    if (error) throw error;
    if (!data || data.provider !== "stripe" || data.purpose !== "subscription") {
      throw new Error("Stripe subscription does not match a platform billing attempt.");
    }
    attempt = data;
  } else if (!existingByStripe) {
    throw new Error("A new Stripe subscription must reference a platform billing attempt.");
  }

  const actorId = attempt?.actor_id ?? existingByStripe?.actor_id;
  const portfolioId = attempt?.portfolio_id ?? existingByStripe?.portfolio_id;
  if (!actorId || !portfolioId) throw new Error("Subscription owner is missing.");
  if (configured.planId !== (attempt?.plan_id ?? existingByStripe?.plan_id)) {
    throw new Error("Stripe Price does not match the purchased platform plan.");
  }

  const { data: portfolio, error: portfolioError } = await supabase
    .from("portfolios")
    .select("id, actor_id")
    .eq("id", portfolioId)
    .maybeSingle();
  if (portfolioError) throw portfolioError;
  if (!portfolio || portfolio.actor_id !== actorId) {
    throw new Error("Subscription portfolio does not belong to its actor.");
  }

  const { data: actor, error: actorError } = await supabase
    .from("actors")
    .select("id, stripe_customer_id")
    .eq("id", actorId)
    .maybeSingle();
  if (actorError) throw actorError;
  const stripeCustomerId = objectId(subscription.customer);
  if (!actor || !actor.stripe_customer_id || actor.stripe_customer_id !== stripeCustomerId) {
    throw new Error("Stripe Customer does not match the platform actor.");
  }

  if (!subscription.current_period_start || !subscription.current_period_end) {
    throw new Error("Stripe subscription period is incomplete.");
  }
  const values = {
    actor_id: actorId,
    portfolio_id: portfolioId,
    plan_id: configured.planId,
    status: subscription.status,
    payment_method: "stripe",
    current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
    current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    auto_renew: !subscription.cancel_at_period_end,
    cancel_at_period_end: Boolean(subscription.cancel_at_period_end),
    stripe_subscription_id: subscription.id,
    metadata: {
      ...(existingByStripe?.metadata ?? {}),
      billing_attempt_id: attempt?.id ?? rawAttemptId ?? null,
      duration_months: configured.durationMonths,
      stripe_price_id: configured.stripePriceId,
    },
    updated_at: new Date().toISOString(),
  };

  const { data: existingByPortfolio, error: portfolioLookupError } = await supabase
    .from("subscriptions")
    .select("id, stripe_subscription_id, payment_method, status, current_period_end, updated_at")
    .eq("portfolio_id", portfolioId)
    .maybeSingle();
  if (portfolioLookupError) throw portfolioLookupError;
  if (existingByPortfolio?.payment_method === "credits" && attempt?.status === "succeeded") {
    const creditRowIsNewer = !attempt.completed_at ||
      new Date(existingByPortfolio.updated_at).getTime() > new Date(attempt.completed_at).getTime();
    if (creditRowIsNewer) return;
  }
  if (
    existingByPortfolio?.stripe_subscription_id &&
    existingByPortfolio.stripe_subscription_id !== subscription.id &&
    ["active", "trialing", "past_due", "unpaid"].includes(existingByPortfolio.status) &&
    new Date(existingByPortfolio.current_period_end).getTime() > Date.now()
  ) {
    throw new Error("Portfolio is already bound to another active Stripe subscription.");
  }

  const { error: syncError } = existingByPortfolio
    ? await supabase.from("subscriptions").update(values).eq("id", existingByPortfolio.id)
    : await supabase.from("subscriptions").insert(values);
  if (syncError) throw syncError;

  if (attempt && ["active", "trialing"].includes(subscription.status)) {
    const { error: attemptUpdateError } = await supabase
      .from("billing_payment_attempts")
      .update({
        status: "succeeded",
        provider_payment_reference: subscription.id,
        amount_paid_cents: configured.amountCents,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", attempt.id)
      .in("status", ["pending", "processing"]);
    if (attemptUpdateError) throw attemptUpdateError;
  }
}

async function syncSubscriptionById(
  supabase: any,
  subscriptionId: string,
  fallbackMetadata: Record<string, string> = {},
) {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
    expand: ["items.data.price"],
  });
  await syncSubscription(supabase, subscription, fallbackMetadata);
}

serve(async (request) => {
  let claimedEventId: string | null = null;
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );

  try {
    const signature = request.headers.get("Stripe-Signature");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    if (!signature || !webhookSecret) {
      return new Response("Webhook secret or signature missing", { status: 400 });
    }

    const event = await stripe.webhooks.constructEventAsync(
      await request.text(),
      signature,
      webhookSecret,
      undefined,
      cryptoProvider,
    );
    const eventId = `platform_${event.id}`;
    if (!(await claimEvent(supabase, eventId, event.type))) {
      return new Response(JSON.stringify({ received: true, deduped: true }), { status: 200 });
    }
    claimedEventId = eventId;

    if (
      event.type === "checkout.session.completed" ||
      event.type === "checkout.session.async_payment_succeeded"
    ) {
      const session = event.data.object as any;
      if (session.mode === "subscription" && session.subscription) {
        await syncSubscriptionById(supabase, objectId(session.subscription), session.metadata ?? {});
      }
    }

    if (event.type === "checkout.session.expired") {
      const session = event.data.object as any;
      const attemptId = session.metadata?.billing_attempt_id;
      if (attemptId) {
        const { error } = await supabase
          .from("billing_payment_attempts")
          .update({ status: "canceled", updated_at: new Date().toISOString() })
          .eq("id", asUuid(attemptId, "billing_attempt_id"))
          .eq("status", "pending");
        if (error) throw error;
      }
    }

    if (
      event.type === "customer.subscription.created" ||
      event.type === "customer.subscription.updated" ||
      event.type === "customer.subscription.deleted"
    ) {
      await syncSubscription(supabase, event.data.object as any);
    }

    if (
      event.type === "invoice.paid" ||
      event.type === "invoice.payment_failed" ||
      event.type === "invoice.payment_action_required"
    ) {
      const invoice = event.data.object as any;
      if (invoice.subscription) {
        await syncSubscriptionById(supabase, objectId(invoice.subscription));
      }
    }

    if (event.type === "payment_intent.succeeded") {
      const paymentIntent = event.data.object as any;
      if (paymentIntent.metadata?.billing_purpose === "credit_topup") {
        const attemptId = asUuid(paymentIntent.metadata.billing_attempt_id, "billing_attempt_id");
        const paidCents = Number(paymentIntent.amount_received || paymentIntent.amount);
        const { error } = await supabase.rpc("complete_billing_credit_topup", {
          p_attempt_id: attemptId,
          p_provider_payment_reference: paymentIntent.id,
          p_amount_paid_cents: paidCents,
          p_currency: paymentIntent.currency,
        });
        if (error) throw error;
      }
    }

    if (event.type === "charge.dispute.created") {
      const dispute = event.data.object as any;
      const paymentIntent = await stripe.paymentIntents.retrieve(objectId(dispute.payment_intent));
      if (paymentIntent.metadata?.billing_purpose === "credit_topup") {
        const attemptId = asUuid(paymentIntent.metadata.billing_attempt_id, "billing_attempt_id");
        const { error } = await supabase.rpc("reverse_billing_credit_topup", {
          p_attempt_id: attemptId,
          p_provider_payment_reference: paymentIntent.id,
          p_amount_cents: dispute.amount,
          p_reason: `Stripe chargeback on payment ${paymentIntent.id}`,
        });
        if (error) throw error;
      }
    }

    const { error: completeError } = await supabase.rpc("complete_processed_stripe_event", {
      p_event_id: eventId,
    });
    if (completeError) throw completeError;
    return new Response(JSON.stringify({ received: true }), { status: 200 });
  } catch (error: any) {
    if (claimedEventId) {
      await supabase.rpc("fail_processed_stripe_event", { p_event_id: claimedEventId });
    }
    console.error("Platform Stripe webhook error:", error);
    return new Response(`Webhook Error: ${error.message}`, { status: 400 });
  }
});
