export type PlanId = "starter" | "ecommerce" | "pro";
export type BillingDurationMonths = 1 | 3 | 6 | 12;

type SubscriptionPrice = {
  planId: PlanId;
  durationMonths: BillingDurationMonths;
  amountCents: number;
  creditCost: number;
  stripePriceEnv: string;
};

const SUBSCRIPTION_PRICES: SubscriptionPrice[] = [
  { planId: "starter", durationMonths: 1, amountCents: 300, creditCost: 150, stripePriceEnv: "STRIPE_PRICE_STARTER_1M" },
  { planId: "starter", durationMonths: 3, amountCents: 855, creditCost: 425, stripePriceEnv: "STRIPE_PRICE_STARTER_3M" },
  { planId: "starter", durationMonths: 6, amountCents: 1620, creditCost: 800, stripePriceEnv: "STRIPE_PRICE_STARTER_6M" },
  { planId: "starter", durationMonths: 12, amountCents: 3000, creditCost: 1500, stripePriceEnv: "STRIPE_PRICE_STARTER_12M" },
  { planId: "ecommerce", durationMonths: 1, amountCents: 900, creditCost: 450, stripePriceEnv: "STRIPE_PRICE_ECOMMERCE_1M" },
  { planId: "ecommerce", durationMonths: 3, amountCents: 2500, creditCost: 1250, stripePriceEnv: "STRIPE_PRICE_ECOMMERCE_3M" },
  { planId: "ecommerce", durationMonths: 6, amountCents: 4800, creditCost: 2400, stripePriceEnv: "STRIPE_PRICE_ECOMMERCE_6M" },
  { planId: "ecommerce", durationMonths: 12, amountCents: 9000, creditCost: 4500, stripePriceEnv: "STRIPE_PRICE_ECOMMERCE_12M" },
  { planId: "pro", durationMonths: 1, amountCents: 1900, creditCost: 950, stripePriceEnv: "STRIPE_PRICE_PRO_1M" },
  { planId: "pro", durationMonths: 3, amountCents: 5400, creditCost: 2700, stripePriceEnv: "STRIPE_PRICE_PRO_3M" },
  { planId: "pro", durationMonths: 6, amountCents: 10200, creditCost: 5100, stripePriceEnv: "STRIPE_PRICE_PRO_6M" },
  { planId: "pro", durationMonths: 12, amountCents: 19000, creditCost: 9500, stripePriceEnv: "STRIPE_PRICE_PRO_12M" },
];

const CREDIT_PACKS = {
  handful: { credits: 250, amountCents: 500, name: "Starter Pack" },
  bag: { credits: 550, amountCents: 1000, name: "Popular Pack" },
  chest: { credits: 1200, amountCents: 2000, name: "Growth Pack" },
  handful_lg: { credits: 1500, amountCents: 2600, name: "Business Pack" },
  bag_lg: { credits: 3000, amountCents: 5400, name: "Scale Pack" },
  chest_lg: { credits: 8000, amountCents: 15300, name: "Enterprise Pack" },
} as const;

export const MIN_CUSTOM_CREDITS = 50;
export const MAX_CUSTOM_CREDITS = 100_000;
export const CUSTOM_CREDIT_UNIT_CENTS = 2;

function isPlanId(value: unknown): value is PlanId {
  return value === "starter" || value === "ecommerce" || value === "pro";
}

function isDuration(value: number): value is BillingDurationMonths {
  return value === 1 || value === 3 || value === 6 || value === 12;
}

export function resolveSubscriptionPrice(planValue: unknown, durationValue: unknown) {
  const duration = Number(durationValue);
  if (!isPlanId(planValue) || !isDuration(duration)) {
    throw new Error("Unknown subscription plan or billing duration.");
  }

  const configured = SUBSCRIPTION_PRICES.find(
    (item) => item.planId === planValue && item.durationMonths === duration,
  );
  if (!configured) throw new Error("Subscription price is not configured.");

  const stripePriceId = Deno.env.get(configured.stripePriceEnv)?.trim();
  if (!stripePriceId) {
    throw new Error(`Missing ${configured.stripePriceEnv} in Supabase Edge Function secrets.`);
  }

  return { ...configured, stripePriceId };
}

export function resolveSubscriptionPriceByStripeId(stripePriceId: string) {
  for (const configured of SUBSCRIPTION_PRICES) {
    if (Deno.env.get(configured.stripePriceEnv)?.trim() === stripePriceId) {
      return { ...configured, stripePriceId };
    }
  }
  throw new Error("Stripe subscription uses a price that is not in the platform billing catalog.");
}

export function validateStripeRecurringPrice(
  price: any,
  configured: SubscriptionPrice,
  requireActive = true,
) {
  const recurring = price?.recurring;
  const validInterval = configured.durationMonths === 12
    ? (recurring?.interval === "year" && recurring?.interval_count === 1) ||
      (recurring?.interval === "month" && recurring?.interval_count === 12)
    : recurring?.interval === "month" && recurring?.interval_count === configured.durationMonths;

  if (
    (requireActive && !price?.active) ||
    price?.currency?.toLowerCase() !== "usd" ||
    price?.unit_amount !== configured.amountCents ||
    !validInterval
  ) {
    throw new Error("Stripe Price configuration does not match the platform billing catalog.");
  }
}

export function resolveCreditPurchase(packValue: unknown, creditsValue: unknown) {
  const packId = typeof packValue === "string" ? packValue : "";
  if (packId && packId !== "custom") {
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
