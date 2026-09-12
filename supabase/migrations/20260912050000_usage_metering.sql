-- Usage metering is separate from payment reconciliation, following the same
-- pattern used by large consumption platforms: immutable usage dimensions feed
-- an atomic credit charge, while payment attempts reconcile money providers.
create table if not exists public.billing_usage_records (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid not null references public.actors(id),
  product_id text not null,
  quantity integer not null check (quantity > 0),
  unit_credit_cost integer not null check (unit_credit_cost >= 0),
  credits_charged integer not null check (credits_charged >= 0),
  idempotency_key text not null,
  source text not null,
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null,
  recorded_at timestamptz not null default now(),
  unique (actor_id, product_id, idempotency_key)
);

create index if not exists billing_usage_records_actor_occurred_idx
  on public.billing_usage_records(actor_id, occurred_at desc);

alter table public.billing_usage_records enable row level security;

drop policy if exists billing_usage_actor_read on public.billing_usage_records;
create policy billing_usage_actor_read
  on public.billing_usage_records
  for select
  to authenticated
  using (
    exists (
      select 1 from public.actors
      where actors.id = billing_usage_records.actor_id
        and actors.user_id = auth.uid()
    )
  );

revoke insert, update, delete on public.billing_usage_records from anon, authenticated;
grant select on public.billing_usage_records to authenticated;

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

revoke all on function public.record_billing_usage(uuid, text, integer, text, text, jsonb, timestamptz)
  from public, anon, authenticated;
grant execute on function public.record_billing_usage(uuid, text, integer, text, text, jsonb, timestamptz)
  to service_role;

-- Legacy mutation helpers are internal billing operations, never browser RPCs.
revoke all on function public.deduct_platform_credits(uuid, integer, text)
  from public, anon, authenticated;
grant execute on function public.deduct_platform_credits(uuid, integer, text)
  to service_role;

revoke all on function public.handle_charge_dispute(uuid, integer, text, integer, text)
  from public, anon, authenticated;
grant execute on function public.handle_charge_dispute(uuid, integer, text, integer, text)
  to service_role;
