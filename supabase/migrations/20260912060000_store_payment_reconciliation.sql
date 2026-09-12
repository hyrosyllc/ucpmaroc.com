-- Stripe Connect store orders have their own quote/fulfillment ledger. They do
-- not share platform billing attempts or platform credit/subscription logic.
create table if not exists public.store_payment_attempts (
  id uuid primary key default gen_random_uuid(),
  portfolio_id uuid not null references public.portfolios(id) on delete cascade,
  connected_account_id text not null,
  status text not null default 'pending'
    check (status in ('pending', 'succeeded', 'failed', 'disputed')),
  currency text not null,
  expected_amount_cents integer not null check (expected_amount_cents > 0),
  stripe_payment_intent_id text,
  quote jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);

create unique index if not exists store_payment_attempts_intent_idx
  on public.store_payment_attempts(stripe_payment_intent_id)
  where stripe_payment_intent_id is not null;

alter table public.store_payment_attempts enable row level security;
revoke all on public.store_payment_attempts from anon, authenticated;

create or replace function public.complete_store_order_payment(
  p_attempt_id uuid,
  p_stripe_payment_intent_id text,
  p_connected_account_id text,
  p_amount_paid_cents integer,
  p_currency text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_attempt public.store_payment_attempts%rowtype;
  v_order public.pro_orders%rowtype;
  v_item jsonb;
  v_product record;
  v_quantity integer;
  v_coupon_id uuid;
  v_coupon record;
begin
  select * into v_attempt
  from public.store_payment_attempts
  where id = p_attempt_id
  for update;
  if not found then raise exception 'Unknown store payment attempt'; end if;
  if v_attempt.status = 'succeeded' then return false; end if;
  if v_attempt.status <> 'pending' then raise exception 'Store payment attempt is not pending'; end if;

  if v_attempt.connected_account_id <> p_connected_account_id
     or lower(v_attempt.currency) <> lower(p_currency)
     or v_attempt.expected_amount_cents <> p_amount_paid_cents
     or (
       v_attempt.stripe_payment_intent_id is not null
       and v_attempt.stripe_payment_intent_id <> p_stripe_payment_intent_id
     ) then
    raise exception 'Store payment does not match its server quote';
  end if;

  select * into v_order
  from public.pro_orders
  where stripe_payment_intent_id = p_stripe_payment_intent_id
  for update;
  if not found then raise exception 'Store order has not been recorded yet'; end if;
  if v_order.portfolio_id <> v_attempt.portfolio_id then
    raise exception 'Store order portfolio does not match its payment quote';
  end if;

  for v_item in select value from jsonb_array_elements(v_attempt.quote -> 'items')
  loop
    v_quantity := (v_item ->> 'quantity')::integer;
    select id, track_inventory, stock_count
    into v_product
    from public.pro_products
    where id = (v_item ->> 'id')::uuid
    for update;
    if found and coalesce(v_product.track_inventory, false) then
      update public.pro_products
      set stock_count = greatest(0, coalesce(stock_count, 0) - v_quantity)
      where id = v_product.id;
    end if;
  end loop;

  if nullif(v_attempt.quote ->> 'coupon_id', '') is not null then
    v_coupon_id := (v_attempt.quote ->> 'coupon_id')::uuid;
    select id, times_used, usage_limit
    into v_coupon
    from public.pro_coupons
    where id = v_coupon_id
    for update;
    if found then
      update public.pro_coupons
      set times_used = coalesce(times_used, 0) + 1
      where id = v_coupon_id;
    end if;
  end if;

  update public.pro_orders
  set status = 'paid',
      amount_cents = v_attempt.expected_amount_cents,
      items = v_attempt.quote -> 'items'
  where id = v_order.id;

  update public.store_payment_attempts
  set status = 'succeeded',
      stripe_payment_intent_id = p_stripe_payment_intent_id,
      completed_at = now(),
      updated_at = now()
  where id = p_attempt_id;

  return true;
end;
$$;

revoke all on function public.complete_store_order_payment(uuid, text, text, integer, text)
  from public, anon, authenticated;
grant execute on function public.complete_store_order_payment(uuid, text, text, integer, text)
  to service_role;
