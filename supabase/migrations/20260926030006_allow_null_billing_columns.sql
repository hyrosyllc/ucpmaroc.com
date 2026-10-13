-- Allow null values for billing columns only needed for Stripe subscriptions
-- Credit-based subscriptions don't use these Stripe-specific fields

alter table public.subscriptions
  alter column duration_months drop not null;

alter table public.subscriptions
  alter column amount_cents drop not null;
