-- Durable provider-neutral payment attempts. Stripe and NOWPayments callbacks
-- complete these records; the browser is never authoritative for money or credits.
create table if not exists public.billing_payment_attempts (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid not null references public.actors(id),
  provider text not null check (provider in ('stripe', 'nowpayments', 'bank_transfer')),
  purpose text not null check (purpose in ('credit_topup', 'subscription')),
  status text not null default 'pending'
    check (status in ('pending', 'processing', 'succeeded', 'failed', 'canceled', 'disputed')),
  currency text not null,
  expected_amount_cents integer not null check (expected_amount_cents > 0),
  amount_paid_cents integer,
  credits_amount integer check (credits_amount is null or credits_amount > 0),
  plan_id text,
  portfolio_id uuid references public.portfolios(id) on delete set null,
  provider_reference text,
  provider_payment_reference text,
  failure_code text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);

create unique index if not exists billing_payment_attempts_provider_reference_idx
  on public.billing_payment_attempts(provider, provider_reference)
  where provider_reference is not null;

create unique index if not exists billing_payment_attempts_provider_payment_reference_idx
  on public.billing_payment_attempts(provider, provider_payment_reference)
  where provider_payment_reference is not null;

create index if not exists billing_payment_attempts_actor_created_idx
  on public.billing_payment_attempts(actor_id, created_at desc);

alter table public.billing_payment_attempts enable row level security;

drop policy if exists billing_attempts_actor_read on public.billing_payment_attempts;
create policy billing_attempts_actor_read
  on public.billing_payment_attempts
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.actors
      where actors.id = billing_payment_attempts.actor_id
        and actors.user_id = auth.uid()
    )
  );

revoke insert, update, delete on public.billing_payment_attempts from anon, authenticated;
grant select on public.billing_payment_attempts to authenticated;

alter table public.wallet_transactions
  add column if not exists billing_attempt_id uuid references public.billing_payment_attempts(id);

create unique index if not exists wallet_transactions_billing_attempt_type_idx
  on public.wallet_transactions(billing_attempt_id, type)
  where billing_attempt_id is not null;

create or replace function public.complete_billing_credit_topup(
  p_attempt_id uuid,
  p_provider_payment_reference text,
  p_amount_paid_cents integer,
  p_currency text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_attempt public.billing_payment_attempts%rowtype;
begin
  select *
  into v_attempt
  from public.billing_payment_attempts
  where id = p_attempt_id
    and purpose = 'credit_topup'
  for update;

  if not found then
    raise exception 'Unknown billing payment attempt';
  end if;

  if v_attempt.status = 'succeeded' then
    return false;
  end if;

  if v_attempt.status not in ('pending', 'processing') then
    raise exception 'Billing payment attempt cannot be completed from status %', v_attempt.status;
  end if;

  if lower(p_currency) <> lower(v_attempt.currency)
     or p_amount_paid_cents <> v_attempt.expected_amount_cents
     or (
       v_attempt.provider_payment_reference is not null
       and v_attempt.provider_payment_reference <> p_provider_payment_reference
     ) then
    update public.billing_payment_attempts
    set status = 'failed',
        amount_paid_cents = p_amount_paid_cents,
        provider_payment_reference = coalesce(v_attempt.provider_payment_reference, p_provider_payment_reference),
        failure_code = 'amount_or_currency_mismatch',
        updated_at = now()
    where id = p_attempt_id;
    return false;
  end if;

  update public.actors
  set wallet_balance = coalesce(wallet_balance, 0) + v_attempt.credits_amount
  where id = v_attempt.actor_id;

  if not found then
    raise exception 'Billing actor no longer exists';
  end if;

  insert into public.wallet_transactions (
    actor_id,
    amount,
    type,
    status,
    description,
    stripe_payment_intent_id,
    amount_paid_cents,
    billing_attempt_id
  )
  values (
    v_attempt.actor_id,
    v_attempt.credits_amount,
    'purchase',
    'completed',
    format('%s Platform Credits purchased via %s', v_attempt.credits_amount, v_attempt.provider),
    format('%s_%s', v_attempt.provider, p_provider_payment_reference),
    p_amount_paid_cents,
    p_attempt_id
  );

  update public.billing_payment_attempts
  set status = 'succeeded',
      amount_paid_cents = p_amount_paid_cents,
      provider_payment_reference = p_provider_payment_reference,
      failure_code = null,
      completed_at = now(),
      updated_at = now()
  where id = p_attempt_id;

  return true;
end;
$$;

create or replace function public.reverse_billing_credit_topup(
  p_attempt_id uuid,
  p_provider_payment_reference text,
  p_amount_cents integer,
  p_reason text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_attempt public.billing_payment_attempts%rowtype;
begin
  select *
  into v_attempt
  from public.billing_payment_attempts
  where id = p_attempt_id
    and purpose = 'credit_topup'
  for update;

  if not found then
    raise exception 'Unknown billing payment attempt';
  end if;

  if v_attempt.status = 'disputed' then
    return false;
  end if;

  if v_attempt.status <> 'succeeded'
     or v_attempt.provider_payment_reference <> p_provider_payment_reference then
    raise exception 'Only a matching successful top-up can be reversed';
  end if;

  update public.actors
  set wallet_balance = coalesce(wallet_balance, 0) - v_attempt.credits_amount,
      is_suspended = true,
      suspended_reason = p_reason
  where id = v_attempt.actor_id;

  insert into public.wallet_transactions (
    actor_id,
    amount,
    type,
    status,
    description,
    stripe_payment_intent_id,
    amount_paid_cents,
    billing_attempt_id
  )
  values (
    v_attempt.actor_id,
    -v_attempt.credits_amount,
    'chargeback',
    'reversed',
    p_reason,
    format('%s_%s', v_attempt.provider, p_provider_payment_reference),
    p_amount_cents,
    p_attempt_id
  );

  update public.billing_payment_attempts
  set status = 'disputed',
      failure_code = 'chargeback',
      updated_at = now()
  where id = p_attempt_id;

  return true;
end;
$$;

revoke all on function public.complete_billing_credit_topup(uuid, text, integer, text) from public, anon, authenticated;
revoke all on function public.reverse_billing_credit_topup(uuid, text, integer, text) from public, anon, authenticated;
grant execute on function public.complete_billing_credit_topup(uuid, text, integer, text) to service_role;
grant execute on function public.reverse_billing_credit_topup(uuid, text, integer, text) to service_role;
