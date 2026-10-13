-- Extend subscriptions table to track Stripe subscription pricing and reconciliation.
-- Works with existing subscriptions schema (actor_id, plan_id, status, etc.)

-- Add columns to track Stripe pricing details if they don't exist
alter table public.subscriptions
  add column if not exists stripe_price_id text;

alter table public.subscriptions
  add column if not exists duration_months integer check (duration_months in (1, 3, 6, 12));

alter table public.subscriptions
  add column if not exists amount_cents integer check (amount_cents > 0);

alter table public.subscriptions
  add column if not exists canceled_at timestamptz;

alter table public.subscriptions
  add column if not exists ended_at timestamptz;

-- Ensure stripe_subscription_id is indexed for fast lookups
create index if not exists subscriptions_stripe_subscription_id_idx
  on public.subscriptions(stripe_subscription_id) where stripe_subscription_id is not null;

create index if not exists subscriptions_status_idx on public.subscriptions(status);
create index if not exists subscriptions_current_period_idx on public.subscriptions(current_period_end);

-- Helper function to get active subscription for an actor
create or replace function public.get_active_subscription(p_actor_id uuid)
returns table (
  id uuid,
  stripe_subscription_id text,
  plan_id text,
  duration_months integer,
  status text,
  current_period_end timestamptz
)
language sql
security definer
set search_path = public
as $$
  select id, stripe_subscription_id, plan_id, duration_months, status, current_period_end
  from public.subscriptions
  where actor_id = p_actor_id and status = 'active'
  order by created_at desc
  limit 1;
$$;

-- Helper function to list all subscriptions for an actor
create or replace function public.get_actor_subscriptions(p_actor_id uuid)
returns table (
  id uuid,
  stripe_subscription_id text,
  plan_id text,
  status text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  created_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select id, stripe_subscription_id, plan_id, status, current_period_start, current_period_end, created_at
  from public.subscriptions
  where actor_id = p_actor_id
  order by created_at desc;
$$;
