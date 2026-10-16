-- Allow null stripe_price_id for credit-based subscriptions
-- When users pay with Platform Credits, there's no Stripe price

alter table public.subscriptions
  alter column stripe_price_id drop not null;
