export type PlanId = "starter" | "ecommerce" | "pro";
export type BillingDurationMonths = 1 | 3 | 6 | 12;

export type SubscriptionPrice = {
  id?: string;
  stripe_price_id: string;
  plan_id: PlanId;
  duration_months: BillingDurationMonths;
  amount_cents: number;
  credit_cost: number;
};

export const MIN_CUSTOM_CREDITS = 50;
export const MAX_CUSTOM_CREDITS = 100_000;
export const CUSTOM_CREDIT_UNIT_CENTS = 2;

function isPlanId(value: unknown): value is PlanId {
  return value === "starter" || value === "ecommerce" || value === "pro";
}

function isDuration(value: number): value is BillingDurationMonths {
  return value === 1 || value === 3 || value === 6 || value === 12;
}

// Query subscription price from database by plan and duration.
// Replaces env var lookups to allow price updates without redeployment.
export async function resolveSubscriptionPrice(
  supabase: any,
  planValue: unknown,
  durationValue: unknown
): Promise<SubscriptionPrice> {
  const duration = Number(durationValue);
  if (!isPlanId(planValue) || !isDuration(duration)) {
    throw new Error("Unknown subscription plan or billing duration.");
  }

  const { data, error } = await supabase.rpc('get_billing_price_by_plan', {
    p_plan_id: planValue,
    p_duration_months: duration,
  });

  if (error || !data || data.length === 0) {
    throw new Error("Subscription price not found in database.");
  }

  const price = data[0];
  return {
    id: price.id,
    stripe_price_id: price.stripe_price_id,
    plan_id: price.plan_id,
    duration_months: price.duration_months,
    amount_cents: price.amount_cents,
    credit_cost: price.credit_cost,
  };
}

// Query subscription price from database by Stripe Price ID.
export async function resolveSubscriptionPriceByStripeId(
  supabase: any,
  stripePriceId: string
): Promise<SubscriptionPrice> {
  const { data, error } = await supabase.rpc('get_billing_price', {
    p_stripe_price_id: stripePriceId,
  });

  if (error || !data || data.length === 0) {
    throw new Error("Stripe subscription uses a price that is not in the platform billing catalog.");
  }

  const price = data[0];
  return {
    id: price.id,
    stripe_price_id: price.stripe_price_id,
    plan_id: price.plan_id,
    duration_months: price.duration_months,
    amount_cents: price.amount_cents,
    credit_cost: price.credit_cost,
  };
}

export function validateStripeRecurringPrice(
  price: any,
  configured: SubscriptionPrice,
  requireActive = true,
) {
  const recurring = price?.recurring;
  const validInterval = configured.duration_months === 12
    ? (recurring?.interval === "year" && recurring?.interval_count === 1) ||
      (recurring?.interval === "month" && recurring?.interval_count === 12)
    : recurring?.interval === "month" && recurring?.interval_count === configured.duration_months;

  if (
    (requireActive && !price?.active) ||
    price?.currency?.toLowerCase() !== "usd" ||
    price?.unit_amount !== configured.amount_cents ||
    !validInterval
  ) {
    throw new Error("Stripe Price configuration does not match the platform billing catalog.");
  }
}

export function resolveCreditPurchase(packValue: unknown, creditsValue: unknown) {
  const packId = typeof packValue === "string" ? packValue : "";
  if (packId && packId !== "custom") {
    const CREDIT_PACKS = {
      handful: { credits: 250, amountCents: 500, name: "Starter Pack" },
      bag: { credits: 550, amountCents: 1000, name: "Popular Pack" },
      chest: { credits: 1200, amountCents: 2000, name: "Growth Pack" },
      handful_lg: { credits: 1500, amountCents: 2600, name: "Business Pack" },
      bag_lg: { credits: 3000, amountCents: 5400, name: "Scale Pack" },
      chest_lg: { credits: 8000, amountCents: 15300, name: "Enterprise Pack" },
    } as const;

    const pack = CREDIT_PACKS[packId as keyof typeof CREDIT_PACKS];
    if (!pack) throw new Error("Unknown credit pack.");
    return { packId, ...pack };
  }

  const credits = Number(creditsValue);
  if (!Number.isInteger(credits) || credits < MIN_CUSTOM_CREDITS || credits > MAX_CUSTOM_CREDITS) {
    throw new Error(`Custom credit amount must be an integer between ${MIN_CUSTOM_CREDITS} and ${MAX_CUSTOM_CREDITS}.`);
  }

  return {
    packId: "custom",
    credits,
    amountCents: credits * CUSTOM_CREDIT_UNIT_CENTS,
    name: "Custom credit amount",
  };
}

export function asUuid(value: unknown, fieldName: string) {
  const text = typeof value === "string" ? value : "";
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(text)) {
    throw new Error(`${fieldName} must be a valid UUID.`);
  }
  return text;
}
