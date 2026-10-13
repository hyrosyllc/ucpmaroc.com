# Talent Marketplace Feature

## Responsibility

Talent Marketplace covers actor discovery/profiles, service listings, client quotes/orders, actor workspaces for demos and deliveries, client order views, earnings, and payout settings. Its commercial orders use `orders`, distinct from ecommerce store orders in `pro_orders`.

## Entry Points

- Public discovery/profile: `/market`, `/actor/:actorName`, `/market/service/:actorSlug/:serviceId`.
- Favorites/shortlist: `/my-favorites`, `/my-shortlist`.
- Actor workspace pages under `/dashboard`: profile, demos, library, job-orders, services/workspaces, earnings, payout settings.
- Client pages: `/client-dashboard` and `/order/:orderId`.

Route wiring is in `src/App.tsx`; actor pages typically receive `actorData`, role, and site context from `ActorDashboardLayout`. The feature's service catalog, quote registry, types, components, and exports live under `src/features/talent-marketplace/`.

## Service Catalog and Listings

`serviceCatalog.ts` defines available service IDs and labels. Allowed service IDs are read from `marketplace_settings.allowed_service_ids`, with browser local storage as fallback/cache. Actor-specific listings are rows in `actor_services` keyed by actor/service; they contain copy, media, offers, enabled state, and moderation status.

`ServicesHubPage` applies for categories by inserting a draft listing. `DashboardServices` edits it and uploads listing media; `AdminMarketplaceSettingsPage` approves/rejects listings. Public `PortfolioPage`/actor profile pages show enabled/approved services. `serviceRegistry.ts` maps supported service IDs to their workspace routes/components; catalog entries do not all imply a dedicated workspace page.

## Quote and Order Lifecycle

1. Public actor/service views open `QuoteCalculatorModal`, which selects a service-specific definition from `components/quote/quoteRegistry.ts` and gathers requirements.
2. Voice-over can be priced from word count/usage; scriptwriting/video editing and other quote-based categories can submit an `awaiting_offer` request.
3. The modal requires a client session, creates PaymentIntent data when paying by card, and invokes `create-order` with the actor/service and order information.
4. `supabase/functions/create-order/index.ts` revalidates the client identity, actor active state, and approved/enabled `actor_services` listing. For paid voice-over it recomputes price from actor rate/multipliers and verifies Stripe PaymentIntent currency/status/amount before inserting `orders`.
5. Client `/order/:orderId` and actor `/dashboard/job-orders` operate on the same order. Order detail can confirm/payment, exchange messages, and submit a review; payment confirmation uses `confirm-order-payment` where applicable.

Chat-originated offers are a related but different path: `ConversationChatBox` sends a structured offer and acceptance calls `accept_chat_offer_and_create_order`, then navigates to the client order page.

## Actor Media and Fulfillment

Actor profile, demos, scripts, videos, and recordings use `actors`, `demos`, `script_demos`, `video_demos`, and `actor_recordings`, with assets in buckets such as `avatars`, `demos`, `video-demos`, and `recordings`. Audio cleanup/transcription helpers include `clean-audio` and `poll-audo-status`. `DashboardLibrary` and `DashboardDemos` manage uploads and associated rows; deliveries attach to orders and display in actor/client order workflows.

## Earnings and Payouts

`ActorEarningsPage` summarizes completed actor orders. `ActorPayoutSettingsPage` maintains actor bank methods in `actor_payout_methods`; the admin payout page reads active methods and unpaid completed orders, then invokes `mark_actor_payouts_as_paid` after an operator confirms payment. This UI tracks payout operations; it does not itself send the bank transfer.

## Connections and Maintenance

- Auth creates the global `actors`/`clients` profiles used for marketplace identity.
- Messaging owns direct conversation and order-message components; talent pages embed/link to those flows.
- Admin Core moderates actor accounts, service listing visibility, and payouts.
- Ecommerce has separate `pro_orders`, customers, and billing; do not share order types/status logic without an explicit mapping.
- Server order creation is authoritative for actor/service eligibility and voice-over card price; keep those checks server-side.
- Verify RLS for `orders`, `actor_services`, profile/media rows, payout methods, and storage buckets independently.

## Complete Module File Map

- `src/features/talent-marketplace/index.ts`
- `src/features/talent-marketplace/serviceCatalog.ts`
- `src/features/talent-marketplace/components/ActorCard.tsx`
- `src/features/talent-marketplace/components/OrderDetailsModal.tsx`
- `src/features/talent-marketplace/components/QuoteCalculatorModal.tsx`
- `src/features/talent-marketplace/components/RecordingModal.tsx`
- `src/features/talent-marketplace/components/ServiceOfferCard.tsx`
- `src/features/talent-marketplace/components/TalentCard.tsx`
- `src/features/talent-marketplace/components/quote/ServiceRequirementsForm.tsx`
- `src/features/talent-marketplace/components/quote/quoteRegistry.ts`
- `src/features/talent-marketplace/components/quote/quoteTypes.ts`
- `src/features/talent-marketplace/pages/ActorDashboardPage.tsx`
- `src/features/talent-marketplace/pages/ActorProfilePage.tsx`
- `src/features/talent-marketplace/pages/ClientDashboardPage.tsx`
- `src/features/talent-marketplace/pages/ClientOrderPage.tsx`
- `src/features/talent-marketplace/pages/DashboardDemos.tsx`
- `src/features/talent-marketplace/pages/DashboardLibrary.tsx`
- `src/features/talent-marketplace/pages/DashboardOrders.tsx`
- `src/features/talent-marketplace/pages/DashboardProfile.tsx`
- `src/features/talent-marketplace/pages/DashboardServices.tsx`
- `src/features/talent-marketplace/pages/FavoriteActorsPage.tsx`
- `src/features/talent-marketplace/pages/MyShortlistPage.tsx`
- `src/features/talent-marketplace/pages/PortfolioPage.tsx`
- `src/features/talent-marketplace/pages/ServiceDetailsPage.tsx`
- `src/features/talent-marketplace/pages/services/DeliveryServicePage.tsx`
- `src/features/talent-marketplace/pages/services/ScriptwritingServicePage.tsx`
- `src/features/talent-marketplace/pages/services/ServiceWorkspacePage.tsx`
- `src/features/talent-marketplace/pages/services/ServicesHubPage.tsx`
- `src/features/talent-marketplace/pages/services/VideoEditingServicePage.tsx`
- `src/features/talent-marketplace/pages/services/VoiceOverServicePage.tsx`
- `src/features/talent-marketplace/pages/services/serviceRegistry.ts`
- `src/features/talent-marketplace/pages/services/types.ts`
- `src/features/talent-marketplace/payouts/pages/ActorEarningsPage.tsx`
- `src/features/talent-marketplace/payouts/pages/ActorPayoutSettingsPage.tsx`