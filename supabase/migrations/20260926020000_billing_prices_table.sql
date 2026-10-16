-- Database-driven pricing table for flexible price management.
-- Replaces hardcoded STRIPE_PRICE_* environment variables.
-- Allows prices to be updated without redeploying edge functions.

create table if not exists public.billing_prices (
  id uuid primary key default gen_random_uuid(),
  stripe_price_id text unique not null,
  plan_id text not null, -- "starter", "ecommerce", "pro"
  duration_months integer not null, -- 1, 3, 6, 12
  amount_cents integer not null check (amount_cents > 0),
  credit_cost integer not null check (credit_cost > 0),
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  constraint valid_plan_id check (plan_id in ('starter', 'ecommerce', 'pro')),
  constraint valid_duration check (duration_months in (1, 3, 6, 12)),
  unique (plan_id, duration_months)
);

create index if not exists billing_prices_stripe_price_id_idx
  on public.billing_prices(stripe_price_id);

create index if not exists billing_prices_plan_duration_idx
  on public.billing_prices(plan_id, duration_months);

create index if not exists billing_prices_active_idx
  on public.billing_prices(is_active);

-- RLS: allow public read (published prices), service role write
alter table public.billing_prices enable row level security;

drop policy if exists billing_prices_read on public.billing_prices;
create policy billing_prices_read
  on public.billing_prices
  for select
  using (is_active = true);

drop policy if exists billing_prices_write on public.billing_prices;
create policy billing_prices_write
  on public.billing_prices
  for all
  to service_role
  using (true)
  with check (true);

-- Seed initial prices from current billing config.
-- The amount_cents and credit_cost should match billingConfig.ts and plans.ts
insert into public.billing_prices (stripe_price_id, plan_id, duration_months, amount_cents, credit_cost)
values
  -- Starter plan
  ('price_starter_1m', 'starter', 1, 300, 150),
  ('price_starter_3m', 'starter', 3, 855, 425),
  ('price_starter_6m', 'starter', 6, 1620, 800),
  ('price_starter_12m', 'starter', 12, 3000, 1500),

  -- eCommerce plan
  ('price_ecommerce_1m', 'ecommerce', 1, 900, 450),
  ('price_ecommerce_3m', 'ecommerce', 3, 2500, 1250),
  ('price_ecommerce_6m', 'ecommerce', 6, 4800, 2400),
  ('price_ecommerce_12m', 'ecommerce', 12, 9000, 4500),

  -- Pro plan
  ('price_pro_1m', 'pro', 1, 1900, 950),
  ('price_pro_3m', 'pro', 3, 5400, 2700),
  ('price_pro_6m', 'pro', 6, 10200, 5100),
  ('price_pro_12m', 'pro', 12, 19000, 9500)
on conflict (stripe_price_id) do update set
  amount_cents = excluded.amount_cents,
  credit_cost = excluded.credit_cost,
  is_active = true;

-- Helper function to look up price by Stripe Price ID
create or replace function public.get_billing_price(p_stripe_price_id text)
returns table (
  stripe_price_id text,
  plan_id text,
  duration_months integer,
  amount_cents integer,
  credit_cost integer
)
language sql
security definer
set search_path = public
as $$
  select stripe_price_id, plan_id, duration_months, amount_cents, credit_cost
  from public.billing_prices
  where stripe_price_id = p_stripe_price_id and is_active = true
  limit 1;
$$;

-- Helper function to look up price by plan and duration
create or replace function public.get_billing_price_by_plan(p_plan_id text, p_duration_months integer)
returns table (
  stripe_price_id text,
  plan_id text,
  duration_months integer,
  amount_cents integer,
  credit_cost integer
)
language sql
security definer
set search_path = public
as $$
  select stripe_price_id, plan_id, duration_months, amount_cents, credit_cost
  from public.billing_prices
  where plan_id = p_plan_id and duration_months = p_duration_months and is_active = true
  limit 1;
$$;
