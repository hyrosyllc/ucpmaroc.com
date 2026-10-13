-- Add unique constraint on portfolio_id for subscriptions table
-- This enables the ON CONFLICT clause used in purchase_subscription_with_wallet RPC

create unique index if not exists subscriptions_portfolio_id_unique_idx
  on public.subscriptions(portfolio_id);
