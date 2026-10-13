# Feature Catalog

This catalog reflects the route registry and feature ownership in the checked-out tree as of 2026-10-13. A route or component being present does not establish that it is deployed or production-validated.

For the complete source/backend/agent-resource inventory, see [Repository Catalog](REPOSITORY_CATALOG.md).

## Developer Guides

Each guide follows a feature module through its routes, ownership, data, backend calls, and connections to other modules. Read the architecture map first for app-wide routing and state context.

- [Authentication](features/auth.md)
- [Admin Core](features/admin-core.md)
- [Ecommerce](features/ecommerce.md)
- [Messaging](features/messaging.md)
- [Portfolio Builder](features/portfolio-builder.md)
- [Talent Marketplace](features/talent-marketplace.md)
- [Theme Studio](features/theme-studio.md)

| Feature | User-facing routes | Owning code |
| --- | --- | --- |
| Public platform and marketing | `/`, `/for-talents`, `/for-clients`, `/Voiceover`, `/features/*`, `/contact`, policy/terms pages | `src/pages/`, `src/components/`, `src/App.tsx` |
| Actor/client authentication | `/actor-login`, `/actor-signup`, `/client-auth`, `/create-profile` | `src/features/auth/` |
| Talent discovery and marketplace | `/market`, `/actor/:actorName`, `/market/service/:actorSlug/:serviceId`, `/my-favorites`, `/my-shortlist` | `src/features/talent-marketplace/` |
| Actor workspace | `/dashboard/*` | `src/layouts/ActorDashboardLayout.tsx`, `src/features/talent-marketplace/`, `src/features/ecommerce/`, `src/features/portfolio-builder/`, `src/features/theme-studio/` |
| Client workspace and orders | `/client-dashboard`, `/order/:orderId` | `src/features/talent-marketplace/pages/ClientDashboardPage.tsx`, `ClientOrderPage.tsx` |
| Portfolio/site builder | `/dashboard/portfolio`, `/builder-preview`, `/pro/:slug/*` | `src/features/portfolio-builder/`, `src/store/useBuilderStore.ts` |
| Store operations and ecommerce | `/dashboard/products`, `/dashboard/collections`, `/dashboard/orders`, `/dashboard/leads`, `/dashboard/store-inbox`, `/dashboard/forms`, `/dashboard/shipping`, `/dashboard/markets`, `/dashboard/coupons`, `/dashboard/payments`, `/dashboard/customers`, `/dashboard/reviews` | `src/features/ecommerce/` |
| Public storefront and customer portal | `/pro/:slug/shop`, `/pro/:slug/product/:productSlug`, `/pro/:slug/checkout`, `/pro/:slug/thank-you`, `/pro/:slug/login`, `/pro/:slug/dashboard/*`; equivalent root paths on custom domains | `src/features/ecommerce/`, `src/features/portfolio-builder/layouts/PortfolioLayout.tsx`, `src/layouts/CustomerDashboardLayout.tsx`, `src/themes/` |
| Messaging and live chat | `/messages`, `/messages/:conversationId`, store inbox and storefront chat | `src/features/messaging/`, `src/features/ecommerce/components/store-chat/` |
| Billing and Platform Credits | `/dashboard/billing`, `/dashboard/billing-services`, `/dashboard/billing-payment-methods`, `/dashboard/billing-usage`; top-up modal | `src/features/portfolio-builder/pages/Billing*.tsx`, `src/hooks/useBillingData.ts`, `src/config/plans.ts`, `supabase/functions/`, `supabase/migrations/` |
| Theme Studio and developer tooling | `/dashboard/studio`, `/dashboard/creator-hub`, `/studio-preview` | `src/features/theme-studio/`, `src/lib/ucp-sdk/`, `src/features/portfolio-builder/hooks/` |
| Platform administration | `/admin/*` | `src/features/admin-core/`, `src/layouts/AdminDashboardLayout.tsx`, `src/components/ProtectedRoute.tsx` |

## Dashboard Route Families

`/dashboard` is the actor workspace, not the admin console. It includes:

- Overview and analytics; profile; messages.
- Marketplace services, service workspaces, job orders, demos, library, earnings, payout settings, favorites/shortlist.
- Portfolio editor, settings, billing, products, collections, orders, customers, leads, reviews, forms, payments, shipping, markets, coupons, and store chat settings.
- Theme Studio and Creator Hub.

`/admin` is separately wrapped with the admin role guard and covers platform-level actor/client management, payouts, theme administration, and marketplace settings.

## Backend Capabilities

Supabase Edge Functions are in `supabase/functions/`; they handle payments/webhooks, order confirmation, Stripe Connect and standard OAuth, subscriptions/credits, domain management, account deletion/status, AI/chat/voice/audio workflows, and notifications. Database changes are incremental SQL under `supabase/migrations/`. Vercel SEO handling is in `api/edge-seo.ts`.

For routing and data-flow details, see [Project Architecture](PROJECT_ARCHITECTURE.md). For billing deployment and operational safety, see [Billing Operations](BILLING_OPERATIONS.md).