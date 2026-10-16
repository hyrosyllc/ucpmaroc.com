-- Fix subscriptions table schema - ensure all required columns exist

alter table if exists public.subscriptions add column if not exists portfolio_id uuid;
alter table if exists public.subscriptions add column if not exists actor_id uuid;
alter table if exists public.subscriptions add column if not exists stripe_subscription_id text;
alter table if exists public.subscriptions add column if not exists stripe_price_id text;
alter table if exists public.subscriptions add column if not exists plan_id text;
alter table if exists public.subscriptions add column if not exists status text;
alter table if exists public.subscriptions add column if not exists payment_method text;
alter table if exists public.subscriptions add column if not exists current_period_start timestamptz;
alter table if exists public.subscriptions add column if not exists current_period_end timestamptz;
alter table if exists public.subscriptions add column if not exists auto_renew boolean;
alter table if exists public.subscriptions add column if not exists cancel_at_period_end boolean;
alter table if exists public.subscriptions add column if not exists duration_months integer;
alter table if exists public.subscriptions add column if not exists amount_cents integer;
alter table if exists public.subscriptions add column if not exists metadata jsonb;
alter table if exists public.subscriptions add column if not exists created_at timestamptz;
alter table if exists public.subscriptions add column if not exists updated_at timestamptz;
