-- Make webhook idempotency retry-safe. An event is only considered complete after
-- its database side effects succeed; failed/stale claims can be retried.
alter table public.processed_stripe_events
  add column if not exists status text not null default 'completed';

alter table public.processed_stripe_events
  drop constraint if exists processed_stripe_events_status_check;

alter table public.processed_stripe_events
  add constraint processed_stripe_events_status_check
  check (status in ('processing', 'completed', 'failed'));

-- Rows created by the earlier implementation were written only after a webhook
-- entered the handler, so preserve them as completed rather than replaying them.
update public.processed_stripe_events
set status = 'completed'
where status is null;

create or replace function public.claim_processed_stripe_event(
  p_event_id text,
  p_event_type text
)
returns table (claimed boolean, event_status text)
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.processed_stripe_events (event_id, event_type, status, processed_at)
  values (p_event_id, p_event_type, 'processing', now())
  on conflict (event_id) do nothing;

  if found then
    return query select true, 'processing'::text;
    return;
  end if;

  update public.processed_stripe_events
  set status = 'processing', event_type = p_event_type, processed_at = now()
  where event_id = p_event_id
    and (
      status = 'failed'
      or processed_at < now() - interval '10 minutes'
    )
  returning true into claimed;

  if claimed is true then
    return query select true, 'processing'::text;
  end if;

  return query
  select false, coalesce(status, 'processing')
  from public.processed_stripe_events
  where event_id = p_event_id;
end;
$$;

create or replace function public.complete_processed_stripe_event(p_event_id text)
returns void
language sql
security definer
set search_path = public
as $$
  update public.processed_stripe_events
  set status = 'completed', processed_at = now()
  where event_id = p_event_id;
$$;

create or replace function public.fail_processed_stripe_event(p_event_id text)
returns void
language sql
security definer
set search_path = public
as $$
  update public.processed_stripe_events
  set status = 'failed', processed_at = now()
  where event_id = p_event_id;
$$;

revoke all on function public.claim_processed_stripe_event(text, text) from public, anon, authenticated;
revoke all on function public.complete_processed_stripe_event(text) from public, anon, authenticated;
revoke all on function public.fail_processed_stripe_event(text) from public, anon, authenticated;
grant execute on function public.claim_processed_stripe_event(text, text) to service_role;
grant execute on function public.complete_processed_stripe_event(text) to service_role;
grant execute on function public.fail_processed_stripe_event(text) to service_role;

-- A successful top-up can be safely recognized after a crashed webhook retry.
-- The webhook checks this key before invoking the credit RPC again.
drop index if exists public.wallet_transactions_stripe_payment_intent_unique_idx;

create unique index if not exists wallet_transactions_stripe_payment_intent_type_unique_idx
  on public.wallet_transactions (stripe_payment_intent_id, type)
  where stripe_payment_intent_id is not null;

create unique index if not exists subscriptions_stripe_subscription_id_unique_idx
  on public.subscriptions (stripe_subscription_id)
  where stripe_subscription_id is not null;
