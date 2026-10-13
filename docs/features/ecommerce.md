# Ecommerce Feature

## Responsibility

Ecommerce owns actor-managed store operations, public tenant shopping/checkout, and post-purchase customer features. It shares the portfolio tenant and theme system with the portfolio builder, but owns store catalog/order schemas distinct from the talent marketplace's `orders` table.

## Entry Points

Actor-side routes are nested under `/dashboard/*` in `src/App.tsx`: analytics, products, collections, shipping, coupons, forms, markets, orders, order details, leads, payments/Stripe callback, customers, reviews, Store Inbox, and store-bot settings. Public storefront routes are nested under `/pro/:slug/*` and at `/` for a custom domain: shop, product, checkout, thank-you, customer login, and customer dashboard/order/messages.

## Store Operations

- `ProductsPage` reads `actorData` and `selectedSiteId` from `ActorDashboardLayout`, loads the actor's `pro_products`, collections, portfolios, and checkout forms, then writes product data directly to Supabase. Product images and digital assets use the `portfolio-assets` Storage bucket.
- Products may be portfolio-specific or global (`portfolio_id IS NULL`). Storefront queries require matching `actor_id`, `status='active'`, and either the active portfolio ID or a global record.
- Product configuration includes variants, inventory, product/action type, linked form, delivery type, media, related products, SEO, and accordion content. Digital delivery disables inventory tracking in the editor; physical products use shipping/weight data.
- `CollectionsPage`, `CouponsPage`, `ShippingRatesPage`, `MarketsPage`, and `FormsPage` own their corresponding `pro_collections`, `pro_coupons`, `pro_shipping_rates`, `portfolios.theme_config`, and `forms` operations.
- `OrdersPage` and `ProOrderDetailPage` operate on `pro_orders`; lead management uses `leads`; customer/review administration uses `pro_customers`, `pro_product_reviews`, and `pro_site_reviews`.

## Public Store and Checkout Flow

1. `PortfolioLayout` resolves a published portfolio from `public_slug` or `custom_domain` and passes it through the route outlet context.
2. `PublicShopPage` loads active actor products and collections for that portfolio plus global products, then passes filtered data to a theme shop layout.
3. `PublicProductPage` validates actor/product/store association, reads product form/review/related-product data, and places cart items in `useCartStore`. Cart context is switched by portfolio ID so one tenant's items/coupon do not become another store's checkout.
4. `PublicCheckoutPage` loads the cart's form, product shipping flags, rates, and coupons. It asks `create-payment-intent` to resolve the server-authoritative product prices, variants, coupon, shipping rate, and seller Connect account for card checkout. The browser should not be treated as the source of payable totals.
5. The page creates a `pro_orders` record with structured items and contact/payment details, then confirms Stripe Elements payment. The card webhook/confirmation path handles payment finalization and inventory changes; manual/free paths call `decrement_stock` themselves.
6. Successful checkout navigates to the tenant's thank-you route with an order ID. `PublicThankYouPage` reloads the `pro_orders` row and product data for the receipt/download experience.

Other product action types include direct checkout URL, WhatsApp, and form-order flows; not every product action uses the cart/Stripe lifecycle.

## Cart and Theme Integration

`src/features/ecommerce/store/useCartStore.ts` persists as `portfolio-cart-storage` and maintains `items`, `allCarts`, `coupon`, and `allCoupons` by store ID. `CartDrawerContainer` applies store context and chooses the cart presentation. The current implementation falls back to the Modern cart drawer; changing theme routing requires checking both the live storefront and builder preview.

Public page controllers load/store data; presentation components are in `src/themes/<theme>/`. Theme-specific checkout and thank-you layouts wrap the ecommerce controllers. Theme settings (for example allowed countries and store behavior) are read from `portfolios.theme_config`.

## Customer Portal and Store Messaging

- `CustomerLoginPage` resolves the active portfolio from slug or custom hostname, signs the buyer into Supabase Auth, and creates/loads a `pro_customers` row scoped by `portfolio_id`. It also tries to associate matching guest `pro_orders` with the customer's record.
- `CustomerDashboardLayout` loads the store portfolio and customer bridge, then exposes order history, order details, and messages. It currently depends on a route `slug`; custom-domain parity must be tested because that branch does not supply `:slug`.
- `StorefrontChatWidget` and `StoreInboxPage` are cross-feature integrations: visitor messages use `store_conversations`/`store_messages`, `createVisitorSupabase` session headers, Realtime, and AI/voice Edge Functions. Details live in `docs/features/messaging.md`.

## Backend and Ownership

Key tables: `portfolios`, `pro_products`, `pro_collections`, `pro_coupons`, `pro_shipping_rates`, `forms`, `pro_orders`, `pro_customers`, `pro_order_messages`, review tables, leads, and store chat tables. Key functions include `create-payment-intent`, payment confirmation/webhooks, `stripe-connect`/`stripe-connect-webhook`, `abandoned-cart-recovery`, and store AI/voice functions. Exact JWT and secret configuration is in `supabase/config.toml`; financial logic must remain server-authoritative.

## Maintenance Notes

- Keep actor and portfolio constraints in store queries; an actor can own multiple storefronts and product rows may be global.
- Keep cart isolation by `portfolio_id`, including coupon state and checkout redirect URLs.
- Treat a successful browser payment callback and a persisted order as separate facts; preserve webhook/idempotent recovery when changing order creation.
- Verify inventory behavior for card, bank, cash/manual, free, and digital/service products independently.
- Distinguish ecommerce `pro_orders`/`pro_order_messages` from talent-marketplace `orders`/`order_messages`.

## Complete Module File Map

- `src/features/ecommerce/index.ts`
- `src/features/ecommerce/checkout/PublicCheckoutPage.tsx`
- `src/features/ecommerce/checkout/PublicThankYouPage.tsx`
- `src/features/ecommerce/checkout/StripeCheckoutForm.tsx`
- `src/features/ecommerce/components/CartDrawerContainer.tsx`
- `src/features/ecommerce/components/CreateSiteModal.tsx`
- `src/features/ecommerce/components/ProductModalContainer.tsx`
- `src/features/ecommerce/components/store-chat/StorefrontChatWidget.tsx`
- `src/features/ecommerce/pages/AnalyticsPage.tsx`
- `src/features/ecommerce/pages/CollectionsPage.tsx`
- `src/features/ecommerce/pages/CouponsPage.tsx`
- `src/features/ecommerce/pages/CustomerDashboardOverview.tsx`
- `src/features/ecommerce/pages/CustomerLoginPage.tsx`
- `src/features/ecommerce/pages/CustomerMessagesPage.tsx`
- `src/features/ecommerce/pages/CustomerOrderDetailPage.tsx`
- `src/features/ecommerce/pages/CustomerOrdersPage.tsx`
- `src/features/ecommerce/pages/CustomersPage.tsx`
- `src/features/ecommerce/pages/FormsPage.tsx`
- `src/features/ecommerce/pages/LeadsPage.tsx`
- `src/features/ecommerce/pages/MarketsPage.tsx`
- `src/features/ecommerce/pages/OrdersPage.tsx`
- `src/features/ecommerce/pages/PaymentsPage.tsx`
- `src/features/ecommerce/pages/ProOrderDetailPage.tsx`
- `src/features/ecommerce/pages/ProductsPage.tsx`
- `src/features/ecommerce/pages/PublicProductPage.tsx`
- `src/features/ecommerce/pages/PublicShopPage.tsx`
- `src/features/ecommerce/pages/ReviewsPage.tsx`
- `src/features/ecommerce/pages/ShippingRatesPage.tsx`
- `src/features/ecommerce/pages/StripeCallbackPage.tsx`
- `src/features/ecommerce/pages/store-inbox/StoreInboxPage.tsx`
- `src/features/ecommerce/pages/store-settings/StoreBotSettingsPage.tsx`
- `src/features/ecommerce/product-layouts/types.ts`
- `src/features/ecommerce/store/useCartStore.ts`