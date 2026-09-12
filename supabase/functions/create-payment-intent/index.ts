import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import Stripe from "https://esm.sh/stripe@12.0.0?target=deno";
import { requireActorForRequest } from "../_shared/actorAuth.ts";
import { asUuid, resolveCreditPurchase } from "../_shared/billingConfig.ts";
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

async function resolveStoreCheckout(supabase: any, input: any) {
  const portfolioId = asUuid(input?.portfolioId, "storeCheckout.portfolioId");
  const requestedItems = Array.isArray(input?.items) ? input.items : [];
  if (requestedItems.length < 1 || requestedItems.length > 100) {
    throw new Error("Store checkout must contain between 1 and 100 items.");
  }

  const normalizedItems = requestedItems.map((item: any) => {
    const id = asUuid(item?.id, "storeCheckout item id");
    const quantity = Number(item?.quantity);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 100) {
      throw new Error("Store item quantity is invalid.");
    }
    return { id, quantity, variant: typeof item?.variant === "string" ? item.variant : "default" };
  });
  if (
    new Set(normalizedItems.map((item: any) => `${item.id}:${item.variant}`)).size !==
    normalizedItems.length
  ) {
    throw new Error("Duplicate store item variants must be combined before checkout.");
  }
  const productIds = [...new Set(normalizedItems.map((item: any) => item.id))];

  const { data: portfolio, error: portfolioError } = await supabase
    .from("portfolios")
    .select("id, actor_id, stripe_account_id")
    .eq("id", portfolioId)
    .maybeSingle();
  if (portfolioError) throw portfolioError;
  if (!portfolio?.stripe_account_id) throw new Error("SELLER_NOT_CONNECTED");

  const { data: products, error: productError } = await supabase
    .from("pro_products")
    .select("id, actor_id, portfolio_id, title, images, price, options, status, product_type, collection_id, requires_shipping, delivery_type, weight, track_inventory, stock_count")
    .in("id", productIds);
  if (productError) throw productError;
  if (!products || products.length !== productIds.length) {
    throw new Error("One or more store products no longer exist.");
  }

  let subtotalCents = 0;
  let totalWeight = 0;
  let requiresShipping = false;
  const pricedItems = normalizedItems.map((requested: any) => {
    const product = products.find((candidate: any) => candidate.id === requested.id);
    if (
      !product ||
      product.actor_id !== portfolio.actor_id ||
      (product.portfolio_id && product.portfolio_id !== portfolioId) ||
      product.status !== "active"
    ) {
      throw new Error("A store product is not available for this website.");
    }
    if (
      product.track_inventory &&
      Number.isFinite(Number(product.stock_count)) &&
      Number(product.stock_count) <
        normalizedItems
          .filter((item: any) => item.id === requested.id)
          .reduce((sum: number, item: any) => sum + item.quantity, 0)
    ) {
      throw new Error("A store product does not have enough stock.");
    }

    const selections = new Map<string, string>();
    if (requested.variant && requested.variant !== "default") {
      for (const entry of requested.variant.split(",")) {
        const separator = entry.indexOf(":");
        if (separator > 0) {
          selections.set(entry.slice(0, separator).trim(), entry.slice(separator + 1).trim());
        }
      }
    }
    const variantPrices: number[] = [];
    for (const option of Array.isArray(product.options) ? product.options : []) {
      const selectedLabel = selections.get(String(option.name));
      if (Array.isArray(option.values) && option.values.length > 0 && !selectedLabel) {
        throw new Error("A required product variant was not selected.");
      }
      if (!selectedLabel) continue;
      const selectedValue = Array.isArray(option.values)
        ? option.values.find((value: any) => String(value.label) === selectedLabel)
        : null;
      if (!selectedValue) throw new Error("A selected product variant is no longer available.");
      const optionPrice = Number(selectedValue.price);
      if (Number.isFinite(optionPrice) && optionPrice > 0) variantPrices.push(optionPrice);
    }

    const unitPrice = variantPrices.length
      ? variantPrices.reduce((sum, value) => sum + value, 0)
      : Number(product.price);
    if (!Number.isFinite(unitPrice) || unitPrice < 0) throw new Error("A store product has an invalid price.");
    const unitAmountCents = Math.round(unitPrice * 100);
    subtotalCents += unitAmountCents * requested.quantity;
    if (product.delivery_type === "physical" || product.requires_shipping) {
      requiresShipping = true;
      totalWeight += Number(product.weight || 0) * requested.quantity;
    }
    return { ...requested, product, unitAmountCents };
  });

  let discountCents = 0;
  let couponId: string | null = null;
  const couponCode = typeof input?.couponCode === "string" ? input.couponCode.trim().toUpperCase() : "";
  if (couponCode) {
    const { data: coupons, error: couponError } = await supabase
      .from("pro_coupons")
      .select("*")
      .eq("code", couponCode)
      .eq("is_active", true);
    if (couponError) throw couponError;
    const coupon = coupons?.find((candidate: any) =>
      candidate.actor_id === portfolio.actor_id &&
      (!candidate.portfolio_id || candidate.portfolio_id === portfolioId)
    );
    const now = Date.now();
    if (
      !coupon ||
      (coupon.start_date && new Date(coupon.start_date).getTime() > now) ||
      (coupon.end_date && new Date(coupon.end_date).getTime() < now) ||
      (coupon.usage_limit && Number(coupon.times_used || 0) >= Number(coupon.usage_limit)) ||
      (coupon.min_order_amount_cents && subtotalCents < Number(coupon.min_order_amount_cents))
    ) {
      throw new Error("Coupon is invalid or no longer available.");
    }

    const targetIds = Array.isArray(coupon.target_ids) ? coupon.target_ids : [];
    const eligibleCents = pricedItems.reduce((sum: number, item: any) => {
      const applies = !coupon.applies_to || coupon.applies_to === "all" ||
        (coupon.applies_to === "products" && targetIds.includes(item.id)) ||
        (coupon.applies_to === "collections" && targetIds.includes(item.product.collection_id)) ||
        (coupon.applies_to === "types" && targetIds.includes(item.product.product_type));
      return sum + (applies ? item.unitAmountCents * item.quantity : 0);
    }, 0);
    if (coupon.type === "percentage") {
      discountCents = Math.round(eligibleCents * Number(coupon.value_amount) / 100);
    } else if (coupon.type === "fixed") {
      discountCents = Math.min(eligibleCents, Number(coupon.value_amount));
    }
    couponId = coupon.id;
  }

  const discountedSubtotalCents = Math.max(0, subtotalCents - discountCents);
  let shippingCents = 0;
  let shippingRateId: string | null = null;
  if (requiresShipping) {
    shippingRateId = asUuid(input?.shippingRateId, "storeCheckout.shippingRateId");
    const { data: rate, error: rateError } = await supabase
      .from("pro_shipping_rates")
      .select("*")
      .eq("id", shippingRateId)
      .maybeSingle();
    if (rateError) throw rateError;
    const country = typeof input?.country === "string" ? input.country : "";
    const countries = Array.isArray(rate?.countries) ? rate.countries : [];
    if (
      !rate ||
      rate.actor_id !== portfolio.actor_id ||
      (rate.portfolio_id && rate.portfolio_id !== portfolioId) ||
      (countries.length > 0 && !countries.includes(country)) ||
      (rate.type === "free_over" && rate.min_order_amount_cents && discountedSubtotalCents < rate.min_order_amount_cents) ||
      (rate.type === "weight" && rate.min_weight && totalWeight < Number(rate.min_weight)) ||
      (rate.type === "weight" && rate.max_weight && totalWeight > Number(rate.max_weight))
    ) {
      throw new Error("Shipping rate is not valid for this order.");
    }
    shippingCents = rate.type === "free_over" ? 0 : Number(rate.rate_cents || 0);
  }

  const amountCents = discountedSubtotalCents + shippingCents;
  if (!Number.isSafeInteger(amountCents) || amountCents <= 0) {
    throw new Error("Store order does not have a payable card amount.");
  }
  return {
    portfolioId,
    connectedAccountId: portfolio.stripe_account_id as string,
    amountCents,
    couponId,
    shippingRateId,
    quote: {
      items: pricedItems.map((item: any) => ({
        id: item.id,
        title: item.product.title,
        image: Array.isArray(item.product.images) ? item.product.images[0] ?? null : null,
        quantity: item.quantity,
        variant: item.variant,
        price: item.unitAmountCents / 100,
        unit_amount_cents: item.unitAmountCents,
      })),
      subtotal_cents: subtotalCents,
      discount_cents: discountCents,
      shipping_cents: shippingCents,
      coupon_id: couponId,
      shipping_rate_id: shippingRateId,
    },
  };
}

async function resolveDomainCheckout(supabase: any, input: any) {
  const domainId = asUuid(input?.domainId, "domainCheckout.domainId");
  const option = input?.option;
  const billingCycle = input?.billingCycle === "yearly" ? "yearly" : "monthly";
  if (!["buy", "rent_standard", "rent_deal"].includes(option)) {
    throw new Error("Unknown domain purchase option.");
  }

  const { data: domain, error } = await supabase
    .from("store_domains")
    .select("id, price_buy, price_rent_standard, price_rent_deal, fee_web_dev")
    .eq("id", domainId)
    .maybeSingle();
  if (error) throw error;
  if (!domain) throw new Error("Domain offer was not found.");

  let amount = 0;
  let selectedOption = option;
  if (option === "buy") amount = Number(domain.price_buy);
  if (option === "rent_deal") {
    amount = Number(domain.fee_web_dev || 0) + Number(domain.price_rent_deal || 0) * 12;
  }
  if (option === "rent_standard" && billingCycle === "yearly") {
    amount = Math.round(Number(domain.price_rent_standard || 0) * 12 * 0.9);
    selectedOption = "rent_standard_yearly";
  } else if (option === "rent_standard") {
    amount = Number(domain.price_rent_standard);
    selectedOption = "rent_standard_monthly";
  }
  const amountCents = Math.round(amount * 100);
  if (!Number.isSafeInteger(amountCents) || amountCents <= 0) {
    throw new Error("Domain offer has an invalid price.");
  }
  return { domainId, selectedOption, amountCents };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const supabaseAdmin = createClient(
    supabaseUrl,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );
  let attemptId: string | null = null;
  let storeAttemptId: string | null = null;
  let providerObjectCreated = false;
  let providerRequestStarted = false;

  try {
    const payload = await req.json();
    const {
      amount,
      email,
      name,
      setup_future_usage,
      currency,
      metadata,
      orderId,
      portfolioId,
      topUp,
      storeCheckout,
      domainCheckout,
    } = payload;

    if (!stripeSecretKey) throw new Error("Stripe secret key configuration error.");
    if (
      !topUp &&
      metadata &&
      (metadata.type === "top_up" || Object.keys(metadata).some((key) => key.startsWith("billing_")))
    ) {
      throw new Error("Reserved platform billing metadata is not accepted.");
    }
    if (topUp && (portfolioId || orderId || storeCheckout || domainCheckout)) {
      throw new Error("Platform Credit top-ups cannot be combined with marketplace payments.");
    }

    let trustedAmount = amount;
    let trustedCurrency = currency || "mad";
    let trustedEmail = email;
    let trustedName = name;
    let trustedMetadata: Record<string, string> = {};
    let connectedAccountId: string | null = null;
    let customerId: string | null = null;

    if (topUp) {
      const actorId = asUuid(topUp.actorId, "topUp.actorId");
      const actor = await requireActorForRequest(req, supabaseAdmin, actorId);
      const purchase = resolveCreditPurchase(topUp.packId, topUp.credits);

      trustedAmount = purchase.amountCents / 100;
      trustedCurrency = "usd";
      trustedEmail = actor.ActorEmail;
      trustedName = actor.ActorName;
      attemptId = crypto.randomUUID();
      trustedMetadata = {
        billing_attempt_id: attemptId,
        billing_purpose: "credit_topup",
        type: "top_up",
        actor_id: actorId,
        credits_amount: String(purchase.credits),
        expected_amount_cents: String(purchase.amountCents),
        pack_id: purchase.packId,
      };

      const { error: attemptError } = await supabaseAdmin
        .from("billing_payment_attempts")
        .insert({
          id: attemptId,
          actor_id: actorId,
          provider: "stripe",
          purpose: "credit_topup",
          status: "pending",
          currency: "usd",
          expected_amount_cents: purchase.amountCents,
          credits_amount: purchase.credits,
          metadata: { pack_id: purchase.packId },
        });
      if (attemptError) throw attemptError;

      customerId = await getOrCreateStripeCustomer(supabaseAdmin, stripe, actorId);
    } else {
      trustedMetadata = Object.fromEntries(
        Object.entries(metadata ?? {}).map(([key, value]) => [key, String(value)]),
      );
    }

    // Storefront payments are direct charges on the seller's connected account.
    // They remain isolated from platform billing and are delivered only to the
    // connected-account webhook.
    let trustedPortfolioId = portfolioId;
    if (storeCheckout) {
      const store = await resolveStoreCheckout(supabaseAdmin, storeCheckout);
      trustedAmount = store.amountCents / 100;
      trustedCurrency = "usd";
      trustedPortfolioId = store.portfolioId;
      connectedAccountId = store.connectedAccountId;
      storeAttemptId = crypto.randomUUID();
      trustedMetadata = {
        store_checkout: "true",
        store_payment_attempt_id: storeAttemptId,
        expected_amount_cents: String(store.amountCents),
        ...(store.couponId ? { coupon_id: store.couponId } : {}),
        ...(store.shippingRateId ? { shipping_rate_id: store.shippingRateId } : {}),
      };
      const { error: storeAttemptError } = await supabaseAdmin
        .from("store_payment_attempts")
        .insert({
          id: storeAttemptId,
          portfolio_id: store.portfolioId,
          connected_account_id: store.connectedAccountId,
          status: "pending",
          currency: "usd",
          expected_amount_cents: store.amountCents,
          quote: store.quote,
        });
      if (storeAttemptError) throw storeAttemptError;
    } else if (portfolioId) {
      throw new Error("Legacy store checkout requests are no longer accepted.");
    }

    if (domainCheckout) {
      const domainPurchase = await resolveDomainCheckout(supabaseAdmin, domainCheckout);
      trustedAmount = domainPurchase.amountCents / 100;
      trustedCurrency = "mad";
      trustedEmail = domainCheckout.email;
      trustedName = domainCheckout.name;
      trustedMetadata = {
        payment_scope: "domain_marketplace",
        domain_id: domainPurchase.domainId,
        selected_option: domainPurchase.selectedOption,
        expected_amount_cents: String(domainPurchase.amountCents),
      };
    }

    // Talent marketplace orders are priced from the stored order, not the browser.
    if (orderId) {
      const authorization = req.headers.get("Authorization");
      if (!authorization) throw new Error("Authentication is required.");
      const supabaseUser = createClient(
        supabaseUrl,
        Deno.env.get("SUPABASE_ANON_KEY") ?? "",
        { global: { headers: { Authorization: authorization } } },
      );
      const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
      if (userError || !user) throw new Error("Authentication is required.");

      const { data: client, error: clientError } = await supabaseAdmin
        .from("clients")
        .select("id, email, full_name")
        .eq("user_id", user.id)
        .maybeSingle();
      if (clientError) throw clientError;
      if (!client) throw new Error("A client profile is required to pay for this order.");

      const { data: order, error: orderError } = await supabaseAdmin
        .from("orders")
        .select("id, client_id, client_email, client_name, total_price, status")
        .eq("id", orderId)
        .maybeSingle();
      if (orderError) throw orderError;
      if (!order || order.client_id !== client.id) throw new Error("Order not found.");
      if (!order.total_price || order.total_price <= 0) throw new Error("Order has no payable amount.");
      if (["Completed", "Cancelled"].includes(order.status)) {
        throw new Error("This order cannot be paid.");
      }
      trustedAmount = Number(order.total_price);
      trustedEmail = order.client_email || client.email;
      trustedName = order.client_name || client.full_name;
    }

    if (typeof trustedAmount !== "number" || !Number.isFinite(trustedAmount) || trustedAmount <= 0) {
      throw new Error("Invalid or missing amount.");
    }

    const stripeHeaders: Record<string, string> = {
      Authorization: `Bearer ${stripeSecretKey}`,
    };
    if (connectedAccountId) stripeHeaders["Stripe-Account"] = connectedAccountId;

    if (!customerId && trustedEmail) {
      const searchParams = new URLSearchParams({ email: trustedEmail, limit: "1" });
      const searchRes = await fetch(
        `https://api.stripe.com/v1/customers?${searchParams.toString()}`,
        { headers: stripeHeaders },
      );
      const searchData = await searchRes.json();
      if (!searchRes.ok) throw new Error(searchData.error?.message || "Could not find Stripe customer.");

      if (searchData.data?.length) {
        customerId = searchData.data[0].id;
      } else {
        const createBody = new URLSearchParams({ email: trustedEmail });
        if (trustedName) createBody.append("name", trustedName);
        const createRes = await fetch("https://api.stripe.com/v1/customers", {
          method: "POST",
          headers: { ...stripeHeaders, "Content-Type": "application/x-www-form-urlencoded" },
          body: createBody.toString(),
        });
        const createData = await createRes.json();
        if (!createRes.ok) throw new Error(createData.error?.message || "Could not create Stripe customer.");
        customerId = createData.id;
      }
    }

    const amountInCents = Math.round(trustedAmount * 100);
    const body = new URLSearchParams({
      amount: amountInCents.toString(),
      currency: trustedCurrency,
      "automatic_payment_methods[enabled]": "true",
    });
    if (customerId) body.append("customer", customerId);
    if (setup_future_usage) body.append("setup_future_usage", setup_future_usage);
    for (const [key, value] of Object.entries(trustedMetadata)) {
      body.append(`metadata[${key}]`, value);
    }
    if (orderId) body.append("metadata[order_id]", String(orderId));
    if (trustedPortfolioId) body.append("metadata[portfolio_id]", String(trustedPortfolioId));
    if (connectedAccountId) body.append("metadata[connected_account_id]", connectedAccountId);

    providerRequestStarted = true;
    const response = await fetch("https://api.stripe.com/v1/payment_intents", {
      method: "POST",
      headers: {
        ...stripeHeaders,
        "Content-Type": "application/x-www-form-urlencoded",
        ...(attemptId
          ? { "Idempotency-Key": `credit-topup-${attemptId}` }
          : storeAttemptId
            ? { "Idempotency-Key": `store-payment-${storeAttemptId}` }
            : {}),
      },
      body: body.toString(),
    });
    const responseData = await response.json();
    if (!response.ok) {
      throw new Error(responseData.error?.message || `Stripe API request failed with status ${response.status}`);
    }
    providerObjectCreated = true;

    if (attemptId) {
      const { error: updateError } = await supabaseAdmin
        .from("billing_payment_attempts")
        .update({
          provider_reference: responseData.id,
          provider_payment_reference: responseData.id,
          updated_at: new Date().toISOString(),
        })
        .eq("id", attemptId);
      if (updateError) throw updateError;
    }
    if (storeAttemptId) {
      const { error: storeUpdateError } = await supabaseAdmin
        .from("store_payment_attempts")
        .update({
          stripe_payment_intent_id: responseData.id,
          updated_at: new Date().toISOString(),
        })
        .eq("id", storeAttemptId);
      if (storeUpdateError) throw storeUpdateError;
    }

    return new Response(JSON.stringify({
      clientSecret: responseData.client_secret,
      client_secret: responseData.client_secret,
      customerId,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error: any) {
    if (attemptId && !providerObjectCreated && !providerRequestStarted) {
      await supabaseAdmin.from("billing_payment_attempts").update({
        status: "failed",
        failure_code: "payment_intent_creation_failed",
        updated_at: new Date().toISOString(),
      }).eq("id", attemptId).eq("status", "pending");
    }
    if (storeAttemptId && !providerObjectCreated && !providerRequestStarted) {
      await supabaseAdmin.from("store_payment_attempts").update({
        status: "failed",
        updated_at: new Date().toISOString(),
      }).eq("id", storeAttemptId).eq("status", "pending");
    }
    console.error("Payment intent error:", error);
    return new Response(JSON.stringify({ error: error.message || "An unexpected error occurred." }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
