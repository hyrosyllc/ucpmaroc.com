# Billing System Architecture

## Two Independent Billing Modes

Your platform supports **two separate billing systems** that work independently:

### 1. **Credits (Prepaid Wallet)**
**What it is:** A prepaid balance that users buy on-demand.

**How it works:**
- User buys 250 credits for $5 → Balance becomes 250 credits
- API calls, voice minutes deduct from balance
- User can "top-up" anytime to buy more credits
- No recurring charges

**Example flow:**
```
1. User has 100 credits
2. User starts 10-second voice call
3. Call costs 1 credit (10 sec / 60 * 6)
4. User now has 99 credits
5. When balance → 0, user can top-up or account has $0 wallet
```

**Implementation:**
- Frontend: `TopUpModal.tsx` (buy credit packs)
- Backend: `create-payment-intent` (one-time charge)
- Database: `billing_usage_records`, `wallet_transactions`
- Webhook: `stripe-webhook` → `payment_intent.succeeded`

---

### 2. **Subscriptions (Recurring Monthly/Yearly Plans)**
**What it is:** Automatic recurring billing for a plan (Starter, eCommerce, Pro).

**How it works:**
- User subscribes to "Pro" plan for $19/month
- Stripe charges automatically every month (on subscription renewal date)
- User gets access to that plan's features
- User can cancel anytime (cancel_at_period_end)

**Stripe handles the recurring part** — we just:
1. Create subscription in Stripe
2. Track it in database
3. Listen to webhooks for status changes

**Example flow:**
```
Day 1:  User subscribes to Pro plan ($19/month)
        ↓ Create subscription in Stripe
        ↓ Store in subscriptions table
Day 1:  Stripe charges $19 immediately
        ↓ Webhook: subscription.created/updated
        ↓ Update subscriptions.status = 'active'
Day 31: Stripe charges $19 again (auto-renewal)
        ↓ Webhook: invoice.paid
        ↓ Update subscriptions.current_period_end
```

**Implementation:**
- Frontend: SubscriptionsPage (upgrade to plan)
- Backend: `create-subscription` edge function (initiates subscription)
- Database: `subscriptions` table (tracks active plans)
- Webhook: `stripe-webhook` handles:
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `invoice.paid`
  - `invoice.payment_failed`

---

## Key Differences

| Aspect | Credits | Subscriptions |
|--------|---------|---------------|
| **Billing cycle** | On-demand / no cycle | Automatic, monthly/yearly |
| **Charge trigger** | User initiates ("top-up") | Stripe auto-charges on renewal date |
| **Cancellation** | No cancellation (always active) | User can cancel (stops auto-charging) |
| **Price changes** | Can change CREDIT_PACKS anytime | New prices require new Stripe Price IDs |
| **Stripe handles** | Nothing (we create one-time PaymentIntent) | Everything (subscription management) |
| **Database tracking** | `billing_usage_records` | `subscriptions` table |

---

## Pricing Management

### Credits (One-Time Purchases)
Defined in `supabase/functions/_shared/billingConfig.ts`:
```typescript
const CREDIT_PACKS = {
  handful: { credits: 250, amountCents: 500, name: "Starter Pack" },
  bag: { credits: 550, amountCents: 1000, name: "Popular Pack" },
  // ...
};
```
✅ Can change anytime without redeployment (in code)

### Subscriptions (Recurring Plans)
Stored in `billing_prices` table:
```sql
SELECT * FROM billing_prices;
-- plan_id: "starter", "ecommerce", "pro"
-- duration_months: 1, 3, 6, 12
-- stripe_price_id: "price_1RWRBr..." (from Stripe)
-- amount_cents: 300, 900, 1900 (for 1-month durations)
```
✅ Update in database without redeployment (no env vars!)

**Process to change subscription price:**
1. Open Supabase dashboard → `billing_prices` table
2. Update `amount_cents` for existing price OR
3. Create new Stripe Price in Stripe dashboard
4. Add new row to `billing_prices` table
5. All new subscriptions use new price automatically

---

## How to Combine Credits + Subscriptions

**Scenario:** User has a Pro subscription AND credits

```
Pro Plan benefit: 1000 API calls/month, 1 hour voice/month included
Overage: If user exceeds quota, credits are deducted

Example:
- User has Pro plan + 100 credits
- User makes 1500 API calls (500 over limit)
- 500 overage calls cost 50 credits
- User now has 50 credits remaining
```

**Implementation:** You'd add logic in API handlers:
```typescript
// Check if user's subscription supports this quota
const sub = await supabase.rpc('get_active_subscription', { p_actor_id: userId });
if (sub && sub.status === 'active') {
  // User has active subscription, deduct from their quota
  quotaRemaining--;
} else {
  // User has no subscription, deduct from credits
  creditsRemaining--;
}
```

---

## Database Schema

### `subscriptions` (existing table, enhanced)
```sql
id, actor_id, plan_id, status, payment_method
current_period_start, current_period_end, cancel_at_period_end
stripe_subscription_id, stripe_price_id (new)
duration_months, amount_cents (new)  -- pricing details
canceled_at, ended_at (new)           -- audit trail
```

### `billing_prices` (new, replaces env vars)
```sql
id, stripe_price_id, plan_id, duration_months
amount_cents, credit_cost, is_active
created_at, updated_at
```

### `billing_usage_records` (existing, for credits metering)
```sql
id, actor_id, product_type, quantity, credits_charged
transaction_date, reversed_at
```

---

## Edge Functions (Updated)

### `create-subscription/index.ts` (NEW)
- Creates Stripe subscription when user chooses a plan
- Calls `stripe.subscriptions.create()` with price ID
- Stores subscription in database
- Returns `client_secret` if payment confirmation needed

### `stripe-webhook/index.ts` (UPDATED)
- Now handles subscription webhooks
- Syncs subscription status from Stripe to database
- Calls `resolveSubscriptionPriceByStripeId()` to look up pricing from database

### `billingConfig.ts` (UPDATED)
- `resolveSubscriptionPrice()` → queries `billing_prices` table (async)
- `resolveSubscriptionPriceByStripeId()` → queries `billing_prices` by Stripe ID (async)
- No more env var lookups for prices!

---

## Workflow: User Subscribes to Plan

```
1. User clicks "Upgrade to Pro"
2. Frontend: supabase.functions.invoke("create-subscription", { planId, durationMonths })
3. Backend: create-subscription/index.ts
   - Get user's Stripe customer ID
   - Query billing_prices for plan + duration
   - Create subscription in Stripe
   - Store in subscriptions table
   - Return client_secret (if payment confirmation needed)
4. Frontend: Show Stripe payment confirmation dialog (if needed)
5. Stripe: Charges customer on renewal date
6. Webhook: stripe-webhook receives customer.subscription.created
   - Verifies price matches billing_prices
   - Updates subscriptions.status = 'active'
7. Done! Subscription is now active
```

---

## Workflow: Stripe Charges on Renewal

```
Day 30 at 10am UTC (renewal date):
1. Stripe: Charges customer automatically
2. Stripe: Creates invoice.paid event
3. Webhook: stripe-webhook receives invoice.paid
   - Looks up subscription by ID
   - Updates current_period_end to +1 month
   - Confirms subscriptions.status = 'active'
4. User's access continues!

If payment fails:
1. Stripe: Creates invoice.payment_failed event
2. Webhook: Updates subscriptions.status = 'past_due'
3. Frontend: Shows "payment failed" message
4. User can retry payment or cancel
```

---

## Current Status

✅ Completed:
- `billing_prices` table with database-driven pricing
- `subscriptions` table with stripe_price_id, duration_months, amount_cents
- `billingConfig.ts` updated to query from database
- `stripe-webhook` updated to work with async queries
- `create-subscription` edge function ready

⏳ Next Steps:
1. Update frontend to show "Upgrade to Plan" button
2. Add subscriptions page showing active plan
3. Add cancel subscription functionality
4. Add ability to upgrade/downgrade plans
5. Test end-to-end: subscribe → Stripe charges → webhook syncs

---

## Quick Troubleshooting

**Question:** "If I change a price in the database, when do new subscriptions use it?"
**Answer:** Immediately! The `resolveSubscriptionPrice()` function queries the database each time, so next subscription uses the new price.

**Question:** "Can I change a price for an active subscription?"
**Answer:** No. Existing subscriptions keep their original Stripe Price. New subscriptions created after the price change use the new price. This is how Shopify works too.

**Question:** "Do credits and subscriptions interact?"
**Answer:** Not automatically. You need to implement logic in your API handlers to:
1. Check if user has active subscription (quota included)
2. Otherwise deduct from credits

**Question:** "Can a user have multiple subscriptions?"
**Answer:** The webhook prevents it (checks if actor already has 'active' subscription). Only 1 active subscription per user.

