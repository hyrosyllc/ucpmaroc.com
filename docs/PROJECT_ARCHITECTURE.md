# Project Architecture

Last source-tree review: 2026-10-13. This describes the checked-out workspace, not a claim that every feature or migration is deployed. Billing files had substantial local changes during the review; confirm Git and Supabase deployment state separately.

## Application Shape

UCP Maroc is a React 18, TypeScript, Vite single-page application backed by Supabase. It combines the public platform and talent marketplace, an actor workspace, a portfolio/site builder, tenant storefronts, ecommerce, theme tooling, and an admin console. Vercel serves the web app and SEO endpoint; Supabase provides Auth, Postgres, Storage, Realtime, and Edge Functions.

## Startup and Routing

- `src/main.tsx` mounts React Strict Mode, a global error boundary, Helmet, the `next-themes` provider, and `src/index.css`.
- `src/App.tsx` creates the React Query client, browser router, global navigation/footer, lazy route boundaries, and toast host.
- Platform-host routes render marketing and platform features. `MAIN_DOMAINS` in `src/App.tsx` determines recognized platform hosts; other hostnames enter the custom-domain route branch.
- `/pro/:slug/*` serves a published portfolio and its store on the platform domain. The custom-domain branch serves the same portfolio layout from `/` and resolves the tenant using the hostname.
- The admin route tree is wrapped in `ProtectedRoute` for the `admin` role. `ActorDashboardLayout` loads the signed-in actor profile itself. `CustomerDashboardLayout` checks the signed-in user and a store-specific `pro_customers` record. Client pages have their own page-level behavior; do not assume every route is guarded by the same wrapper.
- `vercel.json` rewrites app paths to the SPA and sends matching bot user agents through `api/edge-seo.ts`.

## Feature Ownership

| Area | Source location | Main responsibility |
| --- | --- | --- |
| Authentication | `src/features/auth/` | Actor sign-in/sign-up, client auth, profile creation prompts |
| Talent marketplace | `src/features/talent-marketplace/` | Actor profiles, favorites/shortlists, service listings/workspaces, demos, orders, earnings and payout settings |
| Portfolio builder | `src/features/portfolio-builder/` | Portfolio editing, sections/forms/media, preview, publishing/layout, dynamic pages and billing-related pages |
| Ecommerce | `src/features/ecommerce/` | Products, collections, coupons, markets, shipping, orders, customers, reviews, leads, analytics, checkout and storefront chat |
| Messaging | `src/features/messaging/` | Conversations, chat boxes, communication dock and admin chat sheet |
| Admin core | `src/features/admin-core/` | Admin overview, actors/clients, orders, domains, payouts, marketplace settings and themes |
| Theme studio | `src/features/theme-studio/` | Theme editor, developer hub and studio preview |
| Shared UI | `src/components/`, `src/components/ui/` | Global navigation, dashboard primitives, reusable controls and Radix/shadcn-style UI |
| Role layouts | `src/layouts/` | Actor, admin and storefront-customer navigation/context |

`src/App.tsx` is the route registry. Feature folders own their domain pages and local UI; shared role shells remain in `src/layouts/`. Route registration and feature ownership are related but not identical: some portfolio pages are imported directly from feature folders, and global components are mounted outside individual route branches.

## Main Route Groups

- Public platform: `/`, `/for-talents`, `/for-clients`, `/market`, `/market/service/:actorSlug/:serviceId`, `/Voiceover`, and `/features/*`.
- Actor workspace: `/dashboard/*`, including analytics, portfolio, marketplace services, job orders, store operations, settings, billing, and Theme Studio.
- Client workspace: `/client-auth`, `/client-dashboard`, `/order/:orderId`, and `/my-shortlist`.
- Admin: `/admin/*`, including actors, clients, orders, domains, payouts, themes, and marketplace settings.
- Direct messaging: `/messages` and `/messages/:conversationId`.
- Portfolio preview/editor: `/builder-preview` and `/studio-preview`.
- Tenant storefront: `/pro/:slug/*` or `/` on a custom domain; includes portfolio pages, shop/product, checkout, thank-you, customer login, orders, and messages.

See `src/App.tsx` for the exact route tree and lazy-loaded page components.

## Tenant and State Flows

### Portfolio and themes

`PortfolioLayout` calls `usePortfolio` with either a route slug or custom hostname. `usePortfolio` queries published `portfolios` and then the owning actor profile. `PortfolioLayout` resolves `theme_config.templateId` through `src/themes/registry.ts` and renders section components using `resolveThemeComponent` and `SECTION_COMPONENT_MAP`.

The registered themes are `modern`, `modern_bright`, `cinematic`, and `cupertino`, with shared contracts in `src/themes/types.ts`. Theme implementations are in `src/themes/<theme>/`. The builder's mutable sections and theme configuration live in `src/store/useBuilderStore.ts`; `BuilderPreview` and `PortfolioLayout` are the key preview/render boundaries. The portfolio builder also has precompiled/dynamic theme hooks and the `compile-theme` Edge Function.

The live `PortfolioLayout` palette dictionary explicitly defines `modern` and `cinematic`; other registered theme IDs currently fall back to the `modern` palette in that layout. Verify whether that fallback is intentional before documenting per-theme light/dark palettes.

### Actor workspace

`ActorDashboardLayout` authenticates with Supabase, loads the actor row, supplies `actorData`, role, and `selectedSiteId` through the outlet context, and subscribes to actor wallet/suspension updates through Supabase Realtime. Its `SubscriptionProvider` loads the plan/site-slot summary. The selected site filter is a UI context shared with child pages; verify individual queries for tenant scoping rather than assuming the context automatically filters them.

### Storefront and cart

`PublicShopPage`, `PublicProductPage`, `PublicCheckoutPage`, and `PublicThankYouPage` own storefront data/checkout flows; layouts and theme views live in `src/themes/`. `useCartStore` persists under `portfolio-cart-storage` and tracks separate carts/coupons by store ID. `CartDrawerContainer` connects cart state to the active storefront. Customer accounts use Supabase Auth plus the `pro_customers` portfolio bridge.

**Custom-domain customer-portal verification:** the custom-domain route branch mounts `CustomerDashboardLayout` without a `:slug` route parameter, while that layout reads `slug` to look up the portfolio and build login/navigation URLs. Do not assume customer login/dashboard parity on custom domains until this path is tested or corrected.

### Shared client state

- TanStack React Query is configured in `src/App.tsx` (five-minute query stale time, one retry).
- `src/store/useBuilderStore.ts` holds builder edits and undo/redo history; it is not persisted by its Zustand store definition.
- `src/features/ecommerce/store/useCartStore.ts` persists cart state in browser storage.
- Theme preference is managed by `next-themes` with the `vite-ui-theme` key.
- Localization is initialized from `src/i18n.ts` and `public/locales/`.

## Backend and Data

- `src/supabaseClient.ts` creates the browser Supabase client from `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`; the visitor client adds a visitor-session header.
- `supabase/functions/` contains Edge Function entry points. They group into order/payment and Stripe flows; billing/credits/usage; domain management; admin actions; AI/chat/voice/audio; abandoned-cart and notification jobs. Shared server helpers belong in `_shared/`; `supabase/config.toml` controls local function configuration and JWT verification.
- `supabase/migrations/` contains incremental SQL migrations. The latest migration present at review was `20260926030007_fix_subscriptions_rls.sql`. These files are not a complete database snapshot; confirm the remote project's applied migration list before deployment.
- `store_domains` and `store_orders` remain referenced in the account-deletion cleanup migration for pre-existing records. The domain-sales UI was retired; those historical tables/data were not dropped.
- `src/lib/analytics.ts`, `src/lib/countries.ts`, `src/lib/utils.ts`, `src/config/plans.ts`, `src/context/SubscriptionContext.tsx`, and `src/hooks/` hold cross-feature helpers and client-side billing state.
- `api/edge-seo.ts` is the Vercel-side SEO response path; it is separate from Supabase Edge Functions.

## Billing State in This Workspace

The checked-out tree includes Platform Credits, usage/ledger and auto-top-up UI, billing pages, Stripe-related Edge Functions, and migrations for reconciliation, metering, database-backed subscription prices, actor-based subscriptions, and RLS. Subscription price resolution in `supabase/functions/_shared/billingConfig.ts` uses database RPCs; the migration `20260926020000_billing_prices_table.sql` creates `billing_prices` and seeds placeholder Stripe price identifiers.

This proves code and migrations are present locally, not that the database migration was applied, Stripe IDs/secrets are configured, functions were deployed, or end-to-end billing passed. Check `docs/BILLING_OPERATIONS.md` before operating or deploying billing. A code review also found different subscription-related entry points in the UI (`create-checkout-session` and `stripe-billing`) and an Edge Function named `create-subscription`; verify the intended canonical flow before changing it.

## Development Checks

The scripts in `package.json` are `npm run dev`, `npm run build`, `npm run lint`, and `npm run preview`. There is no package-level `test` script. Browser/API integrations and Supabase migrations require separate environment-backed verification.

## Documentation Index

- `README.md`: setup and top-level links.
- `docs/REPOSITORY_CATALOG.md`: exhaustive first-party directory, Edge Function, migration, agent-resource, and root-tool inventory.
- `docs/FEATURES.md`: current feature-to-route/source map.
- `docs/features/`: in-depth developer guides for each top-level feature module.
- `docs/BILLING_OPERATIONS.md`: billing boundaries, secrets, rollout and release checks.
- `BILLING_GUIDE.md`: billing design notes; confirm its current-status section before relying on it.
- `docs/DEVELOPMENT_RESOURCES.md`: installed agent skills and external catalogs.
- `resources/reference-repos/`: commit-pinned upstream repositories for offline browsing; see the development resources guide for initialization and license notes.
- `Documentation/FEATURES.md` and `PROJECT_GUIDE.md`: retained historical notes, not the canonical current map.