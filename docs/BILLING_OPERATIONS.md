# Billing operations

## Payment boundaries

| Flow | Money provider | Stripe account | Webhook |
| --- | --- | --- | --- |
| Platform subscriptions | Stripe Billing | Platform | `stripe-webhook` |
| Platform Credit card top-ups | Stripe Payments | Platform | `stripe-webhook` |
| Portfolio/store card orders | Stripe Connect direct charge | Actor's connected account | `stripe-connect-webhook` |
| Platform Credit crypto top-ups | NOWPayments only | None | `crypto-webhook` |
| Platform Credit bank top-ups | Wise/local bank, manually verified | None | No provider webhook |

Stripe Connect credentials and events must never grant platform subscriptions or
Platform Credits. NOWPayments is the only crypto processor in this application.

## Deployment order

1. Apply all Supabase migrations through
   `20260912070000_billing_reconciliation_queue.sql`.
2. Set the secrets below in **Supabase Edge Function secrets**.
3. Deploy the Edge Functions.
4. Deploy the web application.
5. Run the test-mode matrix below before switching to live Stripe Price IDs.

Vercel variables and a local `.env.local` are not visible to a function running
at `*.supabase.co/functions/v1/*`. The same server secrets must be configured in
the Supabase project.

## Required Supabase secrets

- `STRIPE_SECRET_KEY`: the platform Stripe secret key.
- `STRIPE_WEBHOOK_SECRET`: signing secret for the platform-account
  `stripe-webhook` destination.
- `STRIPE_CONNECT_WEBHOOK_SECRET`: signing secret for the connected-accounts
  `stripe-connect-webhook` destination.
- `APP_URL`: canonical production origin, without a trailing slash.
- `NOWPAYMENTS_API_KEY` and `NOWPAYMENTS_IPN_SECRET`.
- `STRIPE_PRICE_STARTER_1M`, `STRIPE_PRICE_STARTER_3M`,
  `STRIPE_PRICE_STARTER_6M`, `STRIPE_PRICE_STARTER_12M`.
- `STRIPE_PRICE_ECOMMERCE_1M`, `STRIPE_PRICE_ECOMMERCE_3M`,
  `STRIPE_PRICE_ECOMMERCE_6M`, `STRIPE_PRICE_ECOMMERCE_12M`.
- `STRIPE_PRICE_PRO_1M`, `STRIPE_PRICE_PRO_3M`,
  `STRIPE_PRICE_PRO_6M`, `STRIPE_PRICE_PRO_12M`.

Each Stripe Price must be active, USD, and recurring at the matching interval.
The amount must match the server catalog in
`supabase/functions/_shared/billingConfig.ts`. Checkout rejects a mismatched
amount, currency, interval, or unrecognized Price ID.

Configure the Stripe Customer Portal to allow payment-method updates, invoice
history, and cancellation, but disable portal-side plan switching. Plan changes
must start in the application so they receive a server-authoritative billing
attempt and portfolio entitlement.

## Platform webhook events

The platform-account destination should send:

- `checkout.session.completed`
- `checkout.session.async_payment_succeeded`
- `checkout.session.expired`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.paid`
- `invoice.payment_failed`
- `invoice.payment_action_required`
- `payment_intent.succeeded`
- `charge.dispute.created`

The connected-accounts destination remains separate and receives connected
account payment/dispute events.

## Reconciliation rules

- A browser never supplies an authoritative price, credit quantity, Stripe Price
  ID, actor entitlement, or callback URL.
- Every platform money operation first creates a
  `billing_payment_attempts` row.
- Provider callbacks are signature-verified and deduplicated before side effects.
- Credit grants and reversals use row-locked database functions and a unique
  billing-attempt ledger key.
- Usage is written to `billing_usage_records` with a product dimension and
  idempotency key, then atomically charged to Platform Credits.
- Operations should poll `billing_reconciliation_queue` and alert on every row;
  it exposes stale provider callbacks, disputes, failures, and missing ledgers.
- Bank transfers remain pending until an operator verifies cleared funds. A
  trusted service completes one with `complete_billing_credit_topup`, using the
  attempt ID, bank reference, exact USD cents, and `usd`.

## Test-mode release matrix

1. Complete each plan/duration checkout and verify one subscription row per
   portfolio.
2. Cancel and resume at period end; verify Stripe and the billing page agree.
3. Buy every fixed credit pack and one custom amount; verify exact cents and
   credits.
4. Replay successful Stripe and NOWPayments callbacks; verify no duplicate credit
   or inventory movement.
5. Send an altered amount/credit payload; verify checkout or reconciliation
   rejects it.
6. Create and complete a bank-transfer attempt; verify its reference and one
   credit ledger row.
7. Create a dispute in Stripe test mode; verify one reversal and suspension.
8. Complete a connected-store order; verify it never changes platform credits or
   subscriptions.
