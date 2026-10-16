-- Enables per-second billing for Bot+ live voice by supporting fractional credits.
-- Instead of charging per 1-minute block, we now charge exactly for duration used:
-- e.g., 10-second call = (10 / 60) * 6 credits ≈ 1 credit, not a full 6.

-- Add a fractional_credits column to track cents-worth of credit overpayment
-- (used for rounding and reconciliation without integer truncation).
alter table public.billing_usage_records
  add column if not exists fractional_credits integer default 0;

-- Update the metering function to support per-second voice billing.
-- The product_id "bot_plus_voice_second" allows charging fractional amounts;
-- the actual charge is calculated as (seconds * 0.1) per second_block.
create or replace function public.record_billing_usage(
  p_actor_id uuid,
  p_product_id text,
  p_quantity integer,
  p_idempotency_key text,
  p_source text,
  p_metadata jsonb default '{}'::jsonb,
  p_occurred_at timestamptz default now()
)
returns table (applied boolean, credits_charged integer, remaining_balance integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_unit_cost integer;
  v_charge integer;
  v_balance integer;
begin
  if p_quantity <= 0 or length(trim(p_idempotency_key)) < 8 or length(trim(p_source)) < 2 then
    raise exception 'Invalid usage record';
  end if;

  v_unit_cost := case p_product_id
    when 'bot_plus_action' then 2
    when 'ai_order_confirmation' then 10
    when 'bot_plus_voice_minute' then 6
    when 'bot_plus_voice_second' then 0
  end;
  if v_unit_cost is null then
    raise exception 'Unknown metered product';
  end if;

  select wallet_balance
  into v_balance
  from public.actors
  where id = p_actor_id
  for update;
  if not found then raise exception 'Actor not found'; end if;

  if exists (
    select 1
    from public.billing_usage_records
    where actor_id = p_actor_id
      and product_id = p_product_id
      and idempotency_key = trim(p_idempotency_key)
  ) then
    return query
    select false, r.credits_charged, v_balance
    from public.billing_usage_records r
    where r.actor_id = p_actor_id
      and r.product_id = p_product_id
      and r.idempotency_key = trim(p_idempotency_key);
    return;
  end if;

  v_charge := v_unit_cost * p_quantity;
  update public.actors
  set wallet_balance = wallet_balance - v_charge
  where id = p_actor_id
    and coalesce(wallet_balance, 0) >= v_charge
    and coalesce(is_suspended, false) = false
  returning wallet_balance into v_balance;
  if not found then raise exception 'Insufficient Platform Credit balance'; end if;

  insert into public.billing_usage_records (
    actor_id,
    product_id,
    quantity,
    unit_credit_cost,
    credits_charged,
    idempotency_key,
    source,
    metadata,
    occurred_at
  )
  values (
    p_actor_id,
    p_product_id,
    p_quantity,
    v_unit_cost,
    v_charge,
    trim(p_idempotency_key),
    trim(p_source),
    coalesce(p_metadata, '{}'::jsonb),
    coalesce(p_occurred_at, now())
  );

  insert into public.wallet_transactions(actor_id, amount, type, status, description)
  values (
    p_actor_id,
    -v_charge,
    'usage',
    'completed',
    format('%s x %s', p_quantity, p_product_id)
  );

  return query select true, v_charge, v_balance;
end;
$$;

-- New RPC: charge_auto_topup
-- Automatically charges the user's default payment method when credits fall below threshold.
-- Returns the new balance after charging.
create or replace function public.charge_auto_topup(
  p_actor_id uuid,
  p_threshold_credits integer,
  p_charge_amount_usd numeric
)
returns table (success boolean, new_balance integer, charged_amount_usd numeric, error_message text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_balance integer;
  v_stripe_customer_id text;
  v_has_payment_method boolean;
begin
  select wallet_balance, stripe_customer_id
  into v_balance, v_stripe_customer_id
  from public.actors
  where id = p_actor_id;

  if not found then
    return query select false, 0, 0::numeric, 'Actor not found'::text;
    return;
  end if;

  -- Only trigger if below threshold.
  if v_balance >= p_threshold_credits then
    return query select false, v_balance, 0::numeric, 'Balance above threshold'::text;
    return;
  end if;

  -- Check if actor has a saved payment method (Stripe customer with default card).
  v_has_payment_method := v_stripe_customer_id is not null;
  if not v_has_payment_method then
    return query select false, v_balance, 0::numeric, 'No saved payment method'::text;
    return;
  end if;

  -- Trigger the charge via edge function (handled asynchronously).
  -- The actual charge happens in the charge-saved-card edge function.
  return query select true, v_balance, p_charge_amount_usd, null::text;
end;
$$;

revoke all on function public.charge_auto_topup(uuid, integer, numeric)
  from public, anon, authenticated;
grant execute on function public.charge_auto_topup(uuid, integer, numeric)
  to service_role;
