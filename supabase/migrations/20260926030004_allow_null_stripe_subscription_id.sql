-- Allow null stripe_subscription_id for credit-based subscriptions
-- When users pay with Platform Credits, there's no Stripe subscription

alter table public.subscriptions
  alter column stripe_subscription_id drop not null;
