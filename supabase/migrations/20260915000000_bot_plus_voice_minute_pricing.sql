-- Adds a dedicated per-minute metered product for Bot+ live voice calls
-- (OpenAI Realtime sessions), priced separately from a single text/chat
-- "bot_plus_action" since a live voice call runs far longer than one chat
-- turn and costs meaningfully more against the upstream Realtime API.
--
-- NOTE: 6 credits/minute (= $0.12/min at CREDIT_UNIT_USD = $0.02) is a
-- starting estimate. Verify it against the current OpenAI Realtime API
-- pricing (audio input + audio output rates) before relying on it for
-- margin, and adjust this function if it needs to change.
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
