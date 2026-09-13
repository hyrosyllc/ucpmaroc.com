-- Operator-facing reconciliation queue. This does not mutate money; monitoring
-- can poll it and alert when provider callbacks or ledger side effects are stale.
create or replace view public.billing_reconciliation_queue
with (security_invoker = true)
as
  select
    'platform'::text as billing_scope,
    attempt.id,
    attempt.provider,
    attempt.purpose,
    attempt.status,
    attempt.provider_reference,
    attempt.expected_amount_cents,
    attempt.currency,
    attempt.created_at,
    case
      when attempt.status = 'failed' then coalesce(attempt.failure_code, 'failed')
      when attempt.status = 'disputed' then 'disputed'
      when attempt.status = 'pending'
        and attempt.provider = 'stripe'
        and attempt.created_at < now() - interval '30 minutes'
        then 'stripe_confirmation_overdue'
      when attempt.status = 'pending'
        and attempt.provider = 'nowpayments'
        and attempt.created_at < now() - interval '24 hours'
        then 'crypto_confirmation_overdue'
      when attempt.status = 'pending'
        and attempt.provider = 'bank_transfer'
        and attempt.created_at < now() - interval '7 days'
        then 'bank_transfer_overdue'
      when attempt.status = 'succeeded'
        and attempt.purpose = 'credit_topup'
        and not exists (
          select 1 from public.wallet_transactions wallet_tx
          where wallet_tx.billing_attempt_id = attempt.id
            and wallet_tx.type = 'purchase'
        )
        then 'credit_ledger_missing'
    end as issue
  from public.billing_payment_attempts attempt
  where attempt.status in ('failed', 'disputed')
     or (
       attempt.status = 'pending'
       and (
         (attempt.provider = 'stripe' and attempt.created_at < now() - interval '30 minutes')
         or (attempt.provider = 'nowpayments' and attempt.created_at < now() - interval '24 hours')
         or (attempt.provider = 'bank_transfer' and attempt.created_at < now() - interval '7 days')
       )
     )
     or (
       attempt.status = 'succeeded'
       and attempt.purpose = 'credit_topup'
       and not exists (
         select 1 from public.wallet_transactions wallet_tx
         where wallet_tx.billing_attempt_id = attempt.id
           and wallet_tx.type = 'purchase'
       )
     )

  union all

  select
    'stripe_connect'::text,
    attempt.id,
    'stripe'::text,
    'store_order'::text,
    attempt.status,
    attempt.stripe_payment_intent_id,
    attempt.expected_amount_cents,
    attempt.currency,
    attempt.created_at,
    case
      when attempt.status = 'failed' then 'store_payment_failed'
      when attempt.status = 'disputed' then 'store_payment_disputed'
      else 'store_fulfillment_overdue'
    end
  from public.store_payment_attempts attempt
  where attempt.status in ('failed', 'disputed')
     or (
       attempt.status = 'pending'
       and attempt.created_at < now() - interval '1 hour'
     );

revoke all on public.billing_reconciliation_queue from public, anon, authenticated;
grant select on public.billing_reconciliation_queue to service_role;
