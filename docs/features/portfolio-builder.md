# Portfolio Builder Feature

## Responsibility

The portfolio-builder feature creates and publishes tenant websites. It owns portfolio identity, editable sections, custom pages, site configuration, builder preview, portfolio rendering/layout, theme access, custom-domain registration, and several billing pages. Ecommerce supplies store-management controls and storefront features embedded into the builder; Theme Studio owns third-party theme authoring.

## Entry Points and Core Files

- Actor editor: `/dashboard/portfolio` → `src/features/portfolio-builder/pages/PortfolioBuilderPage.tsx`.
- Isolated editor preview: `/builder-preview` → `BuilderPreview.tsx`.
- Studio preview: `/studio-preview` → `src/features/theme-studio/pages/StudioPreview.tsx`.
- Public tenant site: `/pro/:slug/*` or root on a custom domain → `PortfolioLayout.tsx`, `PortfolioHome.tsx`, `DynamicPage.tsx`.
- Shared contract/types: `types/portfolio.ts`, `types/sections.ts`, `types/portfolio-themes.ts`.
- Editor state: `src/store/useBuilderStore.ts`.
- Data hooks: `hooks/usePortfolio.ts`, `usePrecompiledTheme.ts`, `useDynamicThemeCompiler.ts`.
- Per-feature exports: `src/features/portfolio-builder/index.ts`.

## Editing and Persistence

`PortfolioBuilderPage` reads actor/site context from `ActorDashboardLayout`, loads the actor's portfolios and active site's sections/theme config, and initializes `useBuilderStore`. The store owns sections, theme settings, unsaved state, and undo/redo history (up to 50 snapshots); it is not persisted by its own Zustand middleware.

Section add/reorder/update operations mutate the builder store. A debounced autosave writes home sections and `theme_config` to `portfolios`; custom-page sections are stored in `pro_pages` while the shared site theme config remains on `portfolios`. Manual save follows the same split. Creating/deleting custom pages changes `pro_pages`; page paths resolve through the public `DynamicPage` route.

The editor also controls publication state, visual theme selection/purchases, site identity, store-page options, and custom domains. Theme purchases use the `purchase_theme` RPC and actor wallet/site ownership. Plan/site information comes from `SubscriptionProvider`/`src/config/plans.ts`; do not assume UI limits alone enforce server authorization.

## Preview and Live Render Contract

The builder posts `UPDATE_PREVIEW` data (sections, theme config, actor/portfolio IDs and preview mode) to the iframe. `BuilderPreview` listens for this and acknowledges with `PREVIEW_READY`; it can also respond to `SCROLL_TO_SECTION`. Store preview modes can seed sample cart data.

For live tenant sites, `usePortfolio` selects a published portfolio by public slug or custom hostname and then fetches actor presentation data. `PortfolioLayout` resolves a built-in theme through `THEME_REGISTRY`/`SECTION_COMPONENT_MAP`, injects theme CSS variables, renders visible section components, and mounts storefront-level cart/chat features. This is the primary bridge to ecommerce and theme implementations.

Theme implementations are under `src/themes/`: `modern`, `modern-bright` (registry key `modern_bright`), `cinematic`, and `cupertino`. The live and preview palette dictionaries currently define `modern` and `cinematic`, falling back to Modern palette values for other registered themes; verify intended light/dark behavior before changing registry support.

## Custom Domains

The editor stores `public_slug`/`custom_domain` on the portfolio. `manage-domains` handles adding/removing a domain and polling DNS/configuration status. `vercel.json` routes app URLs to the SPA, while `App.tsx` chooses the public-slug versus custom-host route branch. This creator custom-domain feature remains active; it is not part of the retired domain-sales marketplace.

## Billing and Cross-Feature Ownership

Portfolio-builder currently contains billing dashboard, subscriptions, payment-method and usage pages because they are actor workspace routes. Billing state/config is shared with `src/hooks/useBillingData.ts`, `src/config/plans.ts`, `src/context/SubscriptionContext.tsx`, Supabase billing functions, and billing migrations. Payment infrastructure and operational status are documented in `docs/BILLING_OPERATIONS.md`; page placement here does not mean the billing subsystem is wholly owned by the builder.

Ecommerce `CreateSiteModal` creates new portfolios. Store tabs in the builder control storefront configuration but do not replace ecommerce's product/order controllers. Theme Studio submissions use `marketplace_themes`, a separate system from built-in `THEME_REGISTRY` themes.

The detailed cross-feature contract and current custom-theme/live-commerce gaps are documented in [Portfolio, Ecommerce, Themes, and UCP SDK](../PORTFOLIO_ECOMMERCE_THEMES.md). In particular, `BuilderPreview` can render a compiled marketplace theme, but the public `PortfolioLayout` currently resolves only built-in `THEME_REGISTRY` themes.

## Maintenance Notes

- Keep editor and preview message contracts synchronized; a renamed message type can silently break the iframe.
- Preserve the distinction between `portfolios.sections` (home), `pro_pages.sections` (custom pages), and `portfolios.theme_config` (shared site settings).
- Publish, domain, subscription, slot, and theme ownership checks require server/database enforcement in addition to UI controls.
- `usePortfolio` only loads `is_published=true`; preview mode intentionally uses Zustand instead of the public data query.
- Verify custom-domain customer dashboard paths separately: the custom-domain route branch mounts customer account pages without providing the `slug` parameter those pages currently read.

## Complete Module File Map

- `src/features/portfolio-builder/index.ts`
- `src/features/portfolio-builder/components/FormManager.tsx`
- `src/features/portfolio-builder/components/PortfolioMediaManager.tsx`
- `src/features/portfolio-builder/components/ProductManagerModal.tsx`
- `src/features/portfolio-builder/components/SectionEditor.tsx`
- `src/features/portfolio-builder/components/SectionEditor-backup.tsx` (backup; not imported by the active builder)
- `src/features/portfolio-builder/components/TopUpModal.tsx`
- `src/features/portfolio-builder/config/html-templates.ts`
- `src/features/portfolio-builder/config/templates.ts`
- `src/features/portfolio-builder/hooks/useDynamicThemeCompiler.ts`
- `src/features/portfolio-builder/hooks/usePortfolio.ts`
- `src/features/portfolio-builder/hooks/usePrecompiledTheme.ts`
- `src/features/portfolio-builder/layouts/PortfolioLayout.tsx`
- `src/features/portfolio-builder/pages/Billing.tsx`
- `src/features/portfolio-builder/pages/BillingDashboard.tsx`
- `src/features/portfolio-builder/pages/BillingLayout.tsx`
- `src/features/portfolio-builder/pages/BillingPage.tsx`
- `src/features/portfolio-builder/pages/BillingPaymentMethods.tsx`
- `src/features/portfolio-builder/pages/BillingServicesSubscriptions.tsx`
- `src/features/portfolio-builder/pages/BillingUsageActivity.tsx`
- `src/features/portfolio-builder/pages/BuilderPreview.tsx`
- `src/features/portfolio-builder/pages/DynamicPage.tsx`
- `src/features/portfolio-builder/pages/PortfolioBuilderPage.tsx`
- `src/features/portfolio-builder/pages/PortfolioHome.tsx`
- `src/features/portfolio-builder/pages/SettingsPage.tsx`
- `src/features/portfolio-builder/types/portfolio-themes.ts`
- `src/features/portfolio-builder/types/portfolio.ts`
- `src/features/portfolio-builder/types/sections.ts`