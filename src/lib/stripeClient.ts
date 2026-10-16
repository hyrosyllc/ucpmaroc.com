import { loadStripe, Stripe } from "@stripe/stripe-js";

const cache = new Map<string, Promise<Stripe | null>>();

/** Stripe.js instance bound to a connected account. Direct charges must be confirmed against that account. */
export function stripeForAccount(accountId?: string | null): Promise<Stripe | null> {
  const key = accountId || "platform";
  let promise = cache.get(key);
  if (!promise) {
    promise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY, accountId ? { stripeAccount: accountId } : undefined);
    cache.set(key, promise);
  }
  return promise;
}
