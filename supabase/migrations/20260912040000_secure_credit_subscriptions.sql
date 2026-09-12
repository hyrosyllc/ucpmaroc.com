-- Server-authoritative Platform Credit purchases and subscription entitlements.
-- Public clients may read their billing rows, but all mutations go through checked RPCs.
alter table public.subscriptions enable row level security;

drop policy if exists subscriptions_actor_read on public.subscriptions;
create policy subscriptions_actor_read
  on public.subscriptions
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.actors
      where actors.id = subscriptions.actor_id
        and actors.user_id = auth.uid()
    )
  );

revoke insert, update, delete on public.subscriptions from anon, authenticated;
grant select on public.subscriptions to authenticated;

create or replace function public.billing_plan_credit_cost(
  p_plan_id text,
  p_duration_months integer
)
returns integer
language sql
immutable
strict
set search_path = public
as $$
  select case lower(p_plan_id)
    when 'starter' then case p_duration_months when 1 then 150 when 3 then 425 when 6 then 800 when 12 then 1500 end
    when 'ecommerce' then case p_duration_months when 1 then 450 when 3 then 1250 when 6 then 2400 when 12 then 4500 end
    when 'pro' then case p_duration_months when 1 then 950 when 3 then 2700 when 6 then 5100 when 12 then 9500 end
  end;
$$;

create or replace function public.billing_plan_tier(p_plan_id text)
returns integer
language sql
immutable
strict
set search_path = public
as $$
  select case lower(p_plan_id)
    when 'starter' then 1
    when 'ecommerce' then 2
    when 'pro' then 3
  end;
$$;

do $$
declare
  v_function regprocedure;
begin
  for v_function in
    select oid::regprocedure
    from pg_proc
    where pronamespace = 'public'::regnamespace
      and proname = 'purchase_subscription_with_wallet'
  loop
    execute format('drop function %s', v_function);
  end loop;
end;
$$;

create or replace function public.purchase_subscription_with_wallet(
  p_actor_id uuid,
  p_portfolio_id uuid,
  p_plan_id text,
  p_amount integer,
  p_duration_months integer
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor public.actors%rowtype;
  v_current public.subscriptions%rowtype;
  v_base_cost integer;
  v_final_cost integer;
  v_current_duration integer;
  v_current_paid_cost integer;
  v_unused_value integer := 0;
  v_remaining_fraction numeric := 0;
begin
  if auth.uid() is null then
    return jsonb_build_object('success', false, 'message', 'Authentication is required.');
  end if;

  select *
  into v_actor
  from public.actors
  where id = p_actor_id
    and user_id = auth.uid()
  for update;
  if not found then
    return jsonb_build_object('success', false, 'message', 'Actor not found.');
  end if;

  if not exists (
    select 1 from public.portfolios
    where id = p_portfolio_id and actor_id = p_actor_id
  ) then
    return jsonb_build_object('success', false, 'message', 'Website does not belong to this actor.');
  end if;

  v_base_cost := public.billing_plan_credit_cost(p_plan_id, p_duration_months);
  if v_base_cost is null then
    return jsonb_build_object('success', false, 'message', 'Unknown plan or billing duration.');
  end if;

  select *
  into v_current
  from public.subscriptions
  where portfolio_id = p_portfolio_id
  for update;

  if found and v_current.payment_method = 'stripe'
     and v_current.status in ('active', 'trialing', 'past_due', 'unpaid')
     and v_current.current_period_end > now() then
    return jsonb_build_object(
      'success', false,
      'message', 'Cancel the Stripe renewal and wait for its paid period to end before switching to Platform Credits.'
    );
  end if;

  v_final_cost := v_base_cost;
  if found
     and v_current.payment_method = 'credits'
     and v_current.status = 'active'
     and v_current.current_period_end > now()
     and v_current.current_period_start is not null then
    v_current_duration := case
      when v_current.current_period_end - v_current.current_period_start > interval '300 days' then 12
      when v_current.current_period_end - v_current.current_period_start > interval '150 days' then 6
      when v_current.current_period_end - v_current.current_period_start > interval '75 days' then 3
      else 1
    end;

    if public.billing_plan_tier(p_plan_id) = public.billing_plan_tier(v_current.plan_id)
       and p_duration_months = v_current_duration then
      return jsonb_build_object(
        'success', false,
        'message', 'This exact subscription is already active for the current paid period.'
      );
    end if;

    if public.billing_plan_tier(p_plan_id) < public.billing_plan_tier(v_current.plan_id)
       or (
         public.billing_plan_tier(p_plan_id) = public.billing_plan_tier(v_current.plan_id)
         and p_duration_months < v_current_duration
       ) then
      return jsonb_build_object(
        'success', false,
        'message', 'A downgrade can only be scheduled for the end of the current paid period.'
      );
    end if;

    v_current_paid_cost := public.billing_plan_credit_cost(v_current.plan_id, v_current_duration);
    v_remaining_fraction := greatest(
      0,
      extract(epoch from (v_current.current_period_end - now())) /
      nullif(extract(epoch from (v_current.current_period_end - v_current.current_period_start)), 0)
    );
    v_unused_value := floor(coalesce(v_current_paid_cost, 0) * v_remaining_fraction);
    v_final_cost := greatest(0, v_base_cost - v_unused_value);
  end if;

  update public.actors
  set wallet_balance = wallet_balance - v_final_cost
  where id = p_actor_id
    and coalesce(wallet_balance, 0) >= v_final_cost
    and coalesce(is_suspended, false) = false;
  if not found then
    return jsonb_build_object('success', false, 'message', 'Insufficient Platform Credit balance.');
  end if;

  insert into public.wallet_transactions(actor_id, amount, type, status, description)
  values (
    p_actor_id,
    -v_final_cost,
    'usage',
    'completed',
    format('%s subscription for %s month(s)', initcap(lower(p_plan_id)), p_duration_months)
  );

  insert into public.subscriptions (
    actor_id,
    portfolio_id,
    plan_id,
    status,
    payment_method,
    current_period_start,
    current_period_end,
    auto_renew,
    cancel_at_period_end,
    stripe_subscription_id,
    metadata,
    updated_at
  )
  values (
    p_actor_id,
    p_portfolio_id,
    lower(p_plan_id),
    'active',
    'credits',
    now(),
    now() + make_interval(months => p_duration_months),
    false,
    false,
    null,
    jsonb_build_object(
      'duration_months', p_duration_months,
      'credits_charged', v_final_cost,
      'unused_credit_applied', v_unused_value
    ),
    now()
  )
  on conflict (portfolio_id) do update
  set actor_id = excluded.actor_id,
      plan_id = excluded.plan_id,
      status = excluded.status,
      payment_method = excluded.payment_method,
      current_period_start = excluded.current_period_start,
      current_period_end = excluded.current_period_end,
      auto_renew = excluded.auto_renew,
      cancel_at_period_end = excluded.cancel_at_period_end,
      stripe_subscription_id = null,
      metadata = excluded.metadata,
      updated_at = now();

  return jsonb_build_object(
    'success', true,
    'credits_charged', v_final_cost,
    'remaining_balance', v_actor.wallet_balance - v_final_cost
  );
end;
$$;

drop function if exists public.schedule_credit_subscription_downgrade(uuid, uuid, text);
drop function if exists public.schedule_credit_subscription_downgrade(uuid, uuid, text, integer);

create or replace function public.schedule_credit_subscription_downgrade(
  p_actor_id uuid,
  p_portfolio_id uuid,
  p_next_plan_id text,
  p_next_duration_months integer
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_current public.subscriptions%rowtype;
  v_current_duration integer;
begin
  if auth.uid() is null or not exists (
    select 1 from public.actors where id = p_actor_id and user_id = auth.uid()
  ) then
    return jsonb_build_object('success', false, 'message', 'Authentication failed.');
  end if;

  select * into v_current
  from public.subscriptions
  where portfolio_id = p_portfolio_id and actor_id = p_actor_id
  for update;

  if not found or v_current.payment_method <> 'credits' or v_current.status <> 'active' then
    return jsonb_build_object('success', false, 'message', 'No active credit-paid subscription was found.');
  end if;
  if public.billing_plan_credit_cost(p_next_plan_id, p_next_duration_months) is null then
    return jsonb_build_object('success', false, 'message', 'Unknown plan or billing duration.');
  end if;

  v_current_duration := case
    when v_current.current_period_end - v_current.current_period_start > interval '300 days' then 12
    when v_current.current_period_end - v_current.current_period_start > interval '150 days' then 6
    when v_current.current_period_end - v_current.current_period_start > interval '75 days' then 3
    else 1
  end;
  if not (
    public.billing_plan_tier(p_next_plan_id) < public.billing_plan_tier(v_current.plan_id)
    or (
      public.billing_plan_tier(p_next_plan_id) = public.billing_plan_tier(v_current.plan_id)
      and p_next_duration_months < v_current_duration
    )
  ) then
    return jsonb_build_object('success', false, 'message', 'The requested plan is not a downgrade.');
  end if;

  update public.subscriptions
  set cancel_at_period_end = true,
      auto_renew = false,
      metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
        'next_plan_id', lower(p_next_plan_id),
        'next_duration_months', p_next_duration_months
      ),
      updated_at = now()
  where id = v_current.id;

  return jsonb_build_object(
    'success', true,
    'message', 'Downgrade preference saved. The current plan remains active through its paid period.'
  );
end;
$$;

drop function if exists public.cancel_credit_subscription_downgrade(uuid, uuid);

create or replace function public.cancel_credit_subscription_downgrade(
  p_actor_id uuid,
  p_portfolio_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or not exists (
    select 1 from public.actors where id = p_actor_id and user_id = auth.uid()
  ) then
    return jsonb_build_object('success', false, 'message', 'Authentication failed.');
  end if;

  update public.subscriptions
  set cancel_at_period_end = false,
      metadata = coalesce(metadata, '{}'::jsonb) - 'next_plan_id' - 'next_duration_months',
      updated_at = now()
  where portfolio_id = p_portfolio_id
    and actor_id = p_actor_id
    and payment_method = 'credits';

  if not found then
    return jsonb_build_object('success', false, 'message', 'Credit subscription not found.');
  end if;
  return jsonb_build_object('success', true);
end;
$$;

do $$
declare
  v_function regprocedure;
begin
  for v_function in
    select oid::regprocedure
    from pg_proc
    where pronamespace = 'public'::regnamespace
      and proname = 'buy_portfolio_slot'
  loop
    execute format('drop function %s', v_function);
  end loop;
end;
$$;

create or replace function public.buy_portfolio_slot(
  p_actor_id uuid,
  p_cost integer
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cost constant integer := 500;
  v_balance integer;
begin
  if auth.uid() is null then
    return jsonb_build_object('success', false, 'message', 'Authentication is required.');
  end if;

  update public.actors
  set wallet_balance = wallet_balance - v_cost,
      purchased_portfolio_slots = coalesce(purchased_portfolio_slots, 0) + 1
  where id = p_actor_id
    and user_id = auth.uid()
    and coalesce(wallet_balance, 0) >= v_cost
    and coalesce(is_suspended, false) = false
  returning wallet_balance into v_balance;

  if v_balance is null then
    return jsonb_build_object('success', false, 'message', 'Insufficient Platform Credit balance.');
  end if;

  insert into public.wallet_transactions(actor_id, amount, type, status, description)
  values (p_actor_id, -v_cost, 'usage', 'completed', 'Additional website slot');
  return jsonb_build_object('success', true, 'remaining_balance', v_balance);
end;
$$;

revoke all on function public.billing_plan_credit_cost(text, integer) from public, anon, authenticated;
revoke all on function public.billing_plan_tier(text) from public, anon, authenticated;
revoke all on function public.purchase_subscription_with_wallet(uuid, uuid, text, integer, integer) from public, anon;
revoke all on function public.schedule_credit_subscription_downgrade(uuid, uuid, text, integer) from public, anon;
revoke all on function public.cancel_credit_subscription_downgrade(uuid, uuid) from public, anon;
revoke all on function public.buy_portfolio_slot(uuid, integer) from public, anon;
grant execute on function public.purchase_subscription_with_wallet(uuid, uuid, text, integer, integer) to authenticated;
grant execute on function public.schedule_credit_subscription_downgrade(uuid, uuid, text, integer) to authenticated;
grant execute on function public.cancel_credit_subscription_downgrade(uuid, uuid) to authenticated;
grant execute on function public.buy_portfolio_slot(uuid, integer) to authenticated;
