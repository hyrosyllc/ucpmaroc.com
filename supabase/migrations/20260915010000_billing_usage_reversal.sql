-- Adds a reversal path for metered usage charges: if a Bot+ live voice session is
-- charged for its first minute but the call never actually connects (WebRTC
-- negotiation failure after the OpenAI Realtime session was minted), the store
-- owner should get that minute back rather than pay for nothing.

alter table public.billing_usage_records
  add column if not exists reversed_at timestamptz;

-- Widen the wallet_transactions.type check constraint (added in
-- 20260912000000_wallet_transactions_stripe_columns.sql) to also allow
-- 'usage_reversal', following the same pattern used there instead of guessing
-- at the constraint's current name.
do $$
declare
  v_conname text;
  v_condef text;
begin
  for v_conname, v_condef in
    select conname, pg_get_constraintdef(oid)
    from pg_constraint
    where conrelid = 'public.wallet_transactions'::regclass
      and contype = 'c'
  loop
    if v_condef ilike '%type%' and v_condef ilike '%purchase%' and v_condef not ilike '%usage_reversal%' then
      execute format('alter table public.wallet_transactions drop constraint %I', v_conname);
      execute format(
        'alter table public.wallet_transactions add constraint %I check (type in (%L, %L, %L, %L, %L))',
        v_conname, 'purchase', 'redeem_code', 'chargeback', 'usage', 'usage_reversal'
      );
    end if;
  end loop;
end;
$$;

create or replace function public.reverse_billing_usage(
  p_actor_id uuid,
  p_product_id text,
  p_idempotency_key text,
  p_reason text default 'reversal'
)
returns table (applied boolean, credits_reversed integer, remaining_balance integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_record record;
  v_balance integer;
begin
  if length(trim(p_idempotency_key)) < 8 or length(trim(p_reason)) < 2 then
    raise exception 'Invalid reversal request';
  end if;

  select *
  into v_record
  from public.billing_usage_records
  where actor_id = p_actor_id
    and product_id = p_product_id
    and idempotency_key = trim(p_idempotency_key)
  for update;

  if not found then
    raise exception 'Usage record not found';
  end if;

  -- Idempotent: replaying the same reversal request (e.g. a retried network call)
  -- must not credit the actor twice.
  if v_record.reversed_at is not null then
    select wallet_balance into v_balance from public.actors where id = p_actor_id;
    return query select false, 0, v_balance;
    return;
  end if;

  update public.billing_usage_records
  set reversed_at = now()
  where id = v_record.id;

  update public.actors
  set wallet_balance = wallet_balance + v_record.credits_charged
  where id = p_actor_id
  returning wallet_balance into v_balance;
  if not found then raise exception 'Actor not found'; end if;

  insert into public.wallet_transactions(actor_id, amount, type, status, description)
  values (
    p_actor_id,
    v_record.credits_charged,
    'usage_reversal',
    'completed',
    format('Reversal: %s x %s (%s)', v_record.quantity, v_record.product_id, trim(p_reason))
  );

  return query select true, v_record.credits_charged, v_balance;
end;
$$;

revoke all on function public.reverse_billing_usage(uuid, text, text, text)
  from public, anon, authenticated;
grant execute on function public.reverse_billing_usage(uuid, text, text, text)
  to service_role;
