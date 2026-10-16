# Portfolio, Ecommerce, Themes, and UCP SDK

This document describes the intended separation of responsibilities and the actual connections found in the checked-out source. It also records important gaps between builder preview, public storefront routes, built-in themes, and marketplace themes. Source review: 2026-10-13.

## Intended Ownership

- **Portfolio Builder** owns the tenant site: identity (`public_slug`, `custom_domain`), home `sections`, custom `pro_pages`, shared `theme_config`, publication, editor/preview, and site-level options. Persisted content is data, not a copy of theme source.
- **Ecommerce** owns the store domain: product/catalog/order management, coupons, shipping, checkout, customer portal, reviews, store inbox, and analytics. It is separate so the store workflow does not become a monolithic builder page.
- **Built-in themes** in `src/themes/` own the visual implementation of portfolio section components and theme views. The common contract and registry live in `src/themes/types.ts` and `src/themes/registry.ts`.
- **UCP SDK** in `src/lib/ucp-sdk/` exposes reusable platform behavior/components to themes, such as inline editing, cart access, navigation, galleries, forms, and content utilities.
- **Theme Studio** owns authoring, preview, review, and database compilation of developer-authored marketplace theme files. It is not the built-in theme registry or the normal portfolio section editor.

## Built-In Theme and Section Contract

`THEME_REGISTRY` maps a theme ID to a `PortfolioThemeDefinition`. `PortfolioHome` reads the portfolio's `theme_config.templateId`, resolves that built-in object, then renders visible `PortfolioSection` records through `SECTION_COMPONENT_MAP` and `resolveThemeComponent`. Each section receives `data`, `settings`, `id`, `allSections`, `actorId`, `portfolioId`, and `isPreview`.

Theme-specific control schemas are looked up by `SectionEditor` from `ActiveTheme.schemas[componentKey]` or a component's exported `schema`. The built-in `ModernTheme` keeps its schema arrays alongside the registry object; `CupertinoTheme` imports each component schema and publishes a combined schema map. This is how the builder exposes theme-specific settings without moving the actual section content into the builder.

### Section Data, Settings, and Editing

The persisted section record is `PortfolioSection { id, type, isVisible, data, settings? }` from `src/features/portfolio-builder/types/portfolio.ts`; `data` and `settings` are both generic records. `data` is site-owner content and block configuration (copy, images, manual product entries, form fields). `settings` is the active theme's design controls (variants, layout, colors, toggles). `SectionEditor` writes schema controls into `settings`; content inputs write into `data`. `useBuilderStore.updateSection` deep-merges these objects so a single field edit preserves sibling values.

New sections are created by `PortfolioBuilderPage` with a UUID-backed ID, a section type, `isVisible=true`, and a generated title; default component behavior supplies any missing content. New portfolios instead load `DEFAULT_PORTFOLIO_SECTIONS`. That default includes both `shop` (manual product/action data) and `dynamic_store` (database products), which are distinct models.

The type boundary is split across `PortfolioSection` in `types/portfolio.ts`, `BlockProps`/`PortfolioThemeDefinition` in `src/themes/types.ts`, and specific `BaseSectionProps`/data interfaces in `src/features/portfolio-builder/types/sections.ts`. The registry renderer uses the loose theme-level `BlockProps`; only a small subset of Cupertino components imports the specific section interfaces. `types/sections.ts` is therefore not a single enforced contract for all built-in/custom themes.

### Section Data, Settings, and Editing

The persisted section model is `PortfolioSection { id, type, isVisible, data, settings? }` from `src/features/portfolio-builder/types/portfolio.ts`; both `data` and `settings` are currently generic records. `data` is authored content/block configuration (text, images, manual products, form fields); `settings` contains theme-specific design controls. `useBuilderStore.updateSection` deep-merges both objects so a field edit preserves sibling values.

`PortfolioBuilderPage` creates sections with a UUID ID, visibility enabled, and a generated title; component fallbacks supply the rest of the content. It loads `DEFAULT_PORTFOLIO_SECTIONS` for a new site. The starter includes two distinct shop section types: `shop` holds manually embedded product/action data; `dynamic_store` represents database-backed `pro_products` and connects to the shared cart. They are not interchangeable schemas.

The type contract is split across `PortfolioSection` in `types/portfolio.ts`, `BlockProps`/`PortfolioThemeDefinition` in `src/themes/types.ts`, and specific `BaseSectionProps`/data types in `src/features/portfolio-builder/types/sections.ts`. The registry renderer uses the loose theme-level `BlockProps`; only a small subset of Cupertino components import specific `types/sections.ts` props. That file is not currently the single enforced contract for every section.

### Actual SDK Adoption

The intended rule is that built-in themes remain directly authored and are not converted wholesale to SDK-based implementations. The code largely follows that: `modern`, `modern-bright`, and `cinematic` do not import `@ucp/sdk`. `cupertino` is the deliberate exception/testbed: it uses SDK APIs to verify the developer-facing contract and supplies the initial files used by Theme Studio. Keep that distinction explicit when making future changes.

- The `modern`, `modern-bright`, and `cinematic` theme sources contain their own presentation/interaction logic.
- The `cupertino` theme intentionally imports `UCP` in About, Contact, Gallery, Header, Hero, LeadForm, Map, Pricing, Shop, and Team. It is an SDK integration example, not a requirement that other defaults migrate.
- Theme Studio seeds its starter files from selected Cupertino components, making Cupertino the practical SDK contract test fixture.
- `UCP` is exported by `src/lib/ucp-sdk/index.ts`; `vite.config.ts` and `tsconfig.json` map `@ucp/sdk` to that source. `types.d.ts` gives Monaco the import/type surface, while actual runtime behavior comes from `index.ts` and the implementations in `components/` and `hooks/`.

The currently exported SDK includes `Text`, `useScrollObserver`, `useCart`, `useNavigationTree`, `useDeviceSize`, `useGallery`, `useCarousel`, `useLeadForm`, `usePricingForm`, `useShopOrderForm`, and `utils`. Their scope is mixed: some are presentation helpers, some call the shared cart or Supabase directly. The SDK is not a separate API server and does not make its callers server-authoritative by itself.

Notable behavior differences:

- `UCP.Text` uses `InlineEdit` when the section is in preview with an ID; outside that case it renders the supplied value as HTML.
- `UCP.useCart` wraps `useCartStore` (`cartCount`/`openCart`); it does not provide the public checkout controller.
- `UCP.usePricingForm` inserts leads. `UCP.useShopOrderForm` handles its theme-level WhatsApp/form-order interactions and may insert `pro_orders` directly; it is not the same path as the public cart checkout's Stripe/connected-account flow.
- `UCP.useGallery`, `useCarousel`, `useNavigationTree`, and utility helpers encapsulate interactions/content transformations, while the theme still owns layout, styles, schema, and visual behavior.

The standard builder inline-edit handshake works as follows: `UCP.Text` delegates to `InlineEdit` in preview; `InlineEdit` posts `INLINE_EDIT` with `{sectionId, fieldKey, value}`; `PortfolioBuilderPage` receives it and updates the section's `data`. Studio Preview currently has a different listener contract: it listens for `UCP_INLINE_EDIT` with flat `field`/`value`, so the same SDK `Text` helper does not complete an inline edit there.

Thus, the SDK is a reusable capability layer intended for developer-authored/custom themes. Cupertino validates that layer; the other defaults remain independently authored implementations by design.

### SDK Runtime (resolved)

The legacy sibling `src/lib/ucp-sdk.tsx` was removed. `@ucp/sdk` and `@/lib/ucp-sdk` now both resolve to `src/lib/ucp-sdk/index.ts`, and the single module allowlist for custom themes lives in `src/lib/theme-runtime/modules.ts`. The SDK now also covers FAQ, counters, sliders, video, reviews, services, store products, header state, booking, and an HTML sandbox; see `src/lib/ucp-sdk/types.d.ts` (the same typings Monaco loads in Studio).

## Portfolio Builder to Ecommerce

The builder and ecommerce feature are connected by a shared portfolio ID, not by merging their controllers:

1. `PortfolioBuilderPage` loads a portfolio and initializes `useBuilderStore` with `sections` and `theme_config`.
2. Builder edits save the home section array and theme config to `portfolios`; custom page section arrays are saved to `pro_pages`.
3. The Store tab changes portfolio-level storefront settings. Product/catalog records remain actor/portfolio-owned rows managed by ecommerce pages.
4. Published `PortfolioLayout` calls `usePortfolio` by slug or custom hostname, obtains the published portfolio and actor, then renders the site sections and nested routes.
5. The storefront controllers use that portfolio context to scope active products/collections, cart (`portfolio-cart-storage`, carts keyed by portfolio ID), checkout, customer accounts, reviews, and store chat.

The separation is sound in concept: builder owns site composition; ecommerce owns commerce data/transactions; themes provide views. It does not automatically make every ecommerce route use the selected theme.

### Section/Commerce Action Boundaries

- A `shop` section's embedded records and action modes (link, WhatsApp, form order) are legacy/manual block content. They can open an external checkout, create a `pro_orders` form order, or hand off to WhatsApp; they do not necessarily enter the shared cart.
- `dynamic_store` reads database catalog products, scopes them by actor and portfolio/global ownership, and its Modern implementation adds cart products with the `storeId` set to the portfolio. The public cart checkout later prices and validates the order through `create-payment-intent`.
- Cupertino `Shop` uses `UCP.useShopOrderForm` for its theme-level modal/WhatsApp/form-order path. That is a separate submission path from `PublicCheckoutPage` and its Stripe Elements flow.
- The separately routed `PublicShopPage`/`PublicProductPage` controllers own storefront browsing and checkout data. They do not render by simply taking a `shop` section from the portfolio's section array.

### Section Rendering Differences

`PortfolioHome` filters out `isVisible=false` sections and, on a live home page, omits the Header because `PortfolioLayout` renders it separately. `DynamicPage` resolves the same built-in registry but currently maps every `pageData.sections` record without checking `isVisible`; hidden custom-page sections may therefore render live. `BuilderPreview` is a third renderer with preview controls and custom-bundle handling. Verify changes in all paths.

## Current Theme Coverage of Ecommerce Routes

Current code has inconsistent theme dispatch across commerce surfaces:

| Surface | Current renderer/selector | Consequence |
| --- | --- | --- |
| Portfolio home sections | `PortfolioHome` + `THEME_REGISTRY` | Built-in theme component map is used per section |
| Embedded `shop`/`dynamic_store` sections | Theme registry component | Built-in section may vary by selected theme; Cupertino Shop uses SDK behavior |
| Public shop route | `PublicShopPage` renders `ModernShopLayout` directly | `theme` is loaded but does not select a theme-specific shop layout |
| Public product route | `PublicProductPage` selects Modern unless `theme === "minimal"` | Current registered IDs are `modern`, `modern_bright`, `cinematic`, `cupertino`; this check does not dispatch Cupertino by its registry ID |
| Global cart drawer | `CartDrawerContainer` always renders Modern drawer | Active theme does not select the drawer implementation |
| Checkout and thank-you | `App.tsx` routes through Modern checkout/thank-you layout imports | These wrappers are not selected from the portfolio theme registry |

Therefore, “the portfolio has ecommerce and the theme controls the entire storefront” is the intended shape but not the current implementation. A storefront can use the selected built-in theme for portfolio sections while shop/product/cart/checkout views remain Modern-bound or use a legacy ID check.

## Theme Studio and Custom Theme Pipeline

Current implemented path (see [docs/features/theme-studio.md](features/theme-studio.md) for detail):

1. `DeveloperHubPage` creates a `marketplace_themes` draft; Studio seeds it with all Cupertino section files as starters.
2. `ThemeStudioPage` edits multiple files (create, rename, delete, relative imports), autosaves to `marketplace_themes.files`, and previews through `StudioPreview` using the shared runtime in `src/lib/theme-runtime/`.
3. Submission from Studio validates the files and sets `pending_review`. Admin review calls `compile-theme` (JWT plus `actors.role='admin'`), which checks imports, scans for risky patterns, compiles every file server-side, and writes `compiled_bundle` plus `approved`; rejection stores a reason.
4. `useActiveTheme` loads the approved bundle (via `marketplace_themes_public`) for `PortfolioHome`, `DynamicPage`, `PortfolioLayout`, `BuilderPreview`, and `SectionEditor`, so custom themes render live and their design schemas (array or legacy map, normalised) appear in the editor. Missing sections fall back to Modern.

### Current Completion Gaps

- **Commerce views do not use custom bundles:** the public shop, product, cart, and checkout views are not wired to a custom theme bundle (Phase 6 of the work plan; custom themes may style them but not change logic).
- **Single-version bundles:** no immutable versions or rollback; a re-approved update replaces the bundle.
- **Isolation:** reviewed-only policy; code runs through `new Function` with a module allowlist. Iframe sandbox/CSP evaluation is Spike 3.
- **Migration must be applied:** `20261016000000_theme_studio_hardening.sql` adds the write guard, private source reads, and the public bundle view; until then the loader falls back to the table.

## Recommended Target Contract

These are architectural recommendations, not existing behavior:

1. Keep built-in raw source as the reference implementation; do not refactor built-ins wholesale merely to satisfy the SDK.
2. Treat the SDK as the stable shared **capability** contract used by custom themes (inline editing, cart/navigation/form actions, product data/actions), and document which capabilities are safe in preview versus live.
3. Define one theme manifest contract covering section components, exported settings schemas, compatibility/version, and supported ecommerce views. Store/publish that manifest alongside compiled component code.
4. Add a server-authorized compile/publish operation with caller identity, ownership/admin checks, source validation, immutable versioning, and an explicit approval transition; compilation success alone must not approve code.
5. Use one runtime registry/resolver for built-in and approved marketplace themes in both builder preview and public `PortfolioLayout`; preserve a fallback only as an explicit failure state, not silent Modern rendering.
6. Route shop/product/cart/checkout/thank-you views through the active theme contract, or explicitly constrain plans/themes to the surfaces they actually implement.
7. Keep transaction authority in ecommerce backend functions. A custom theme may choose presentation and collect customer input, but must not set trusted prices, inventory, payment state, or entitlements in the browser.

## Primary Source Files

- Builder persistence and preview: `src/features/portfolio-builder/pages/PortfolioBuilderPage.tsx`, `BuilderPreview.tsx`, `PortfolioHome.tsx`, `layouts/PortfolioLayout.tsx`, `src/store/useBuilderStore.ts`.
- Ecommerce connection: `src/features/ecommerce/pages/PublicShopPage.tsx`, `PublicProductPage.tsx`, `checkout/PublicCheckoutPage.tsx`, `components/CartDrawerContainer.tsx`, `store/useCartStore.ts`.
- Built-in contract: `src/themes/types.ts`, `registry.ts`, `src/themes/modern/index.tsx`, `src/themes/cupertino/index.ts` and the Cupertino components.
- SDK: `src/lib/ucp-sdk/index.ts`, `components/Text.tsx`, `hooks/*`, `types.d.ts`, `ui.d.ts`, `vite.config.ts`, `tsconfig.json`.
- Custom authoring/compile: `src/features/theme-studio/pages/DeveloperHubPage.tsx`, `ThemeStudioPage.tsx`, `StudioPreview.tsx`, `src/features/portfolio-builder/hooks/usePrecompiledTheme.ts`, `supabase/functions/compile-theme/index.ts`, `src/features/admin-core/pages/AdminThemesPage.tsx`.