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

### Actual SDK Adoption

The principle “default themes are not converted wholesale into SDK components” mostly describes the code, but not every built-in theme is SDK-free:

- The `modern`, `modern-bright`, and `cinematic` theme sources do not import `@ucp/sdk` in the current tree; they contain their own presentation/interaction logic.
- The `cupertino` theme imports `UCP` in About, Contact, Gallery, Header, Hero, LeadForm, Map, Pricing, Shop, and Team. Theme Studio seeds its initial files from these Cupertino components, so new theme drafts start with SDK-based examples.
- `UCP` is exported by `src/lib/ucp-sdk/index.ts`; `vite.config.ts` and `tsconfig.json` map `@ucp/sdk` to that source. `types.d.ts` gives Monaco the import/type surface, while actual runtime behavior comes from `index.ts` and the implementations in `components/` and `hooks/`.

The currently exported SDK includes `Text`, `useScrollObserver`, `useCart`, `useNavigationTree`, `useDeviceSize`, `useGallery`, `useCarousel`, `useLeadForm`, `usePricingForm`, `useShopOrderForm`, and `utils`. Their scope is mixed: some are presentation helpers, some call the shared cart or Supabase directly. The SDK is not a separate API server and does not make its callers server-authoritative by itself.

Notable behavior differences:

- `UCP.Text` uses `InlineEdit` when the section is in preview with an ID; outside that case it renders the supplied value as HTML.
- `UCP.useCart` wraps `useCartStore` (`cartCount`/`openCart`); it does not provide the public checkout controller.
- `UCP.usePricingForm` inserts leads. `UCP.useShopOrderForm` handles its theme-level WhatsApp/form-order interactions and may insert `pro_orders` directly; it is not the same path as the public cart checkout's Stripe/connected-account flow.
- `UCP.useGallery`, `useCarousel`, `useNavigationTree`, and utility helpers encapsulate interactions/content transformations, while the theme still owns layout, styles, schema, and visual behavior.

Thus, the SDK appears to be a reusable extraction from theme/platform logic, but it is not yet a universal contract used by every built-in theme. The stated “never convert default themes” rule is a product constraint; current Cupertino SDK use is already in the source and should be preserved rather than misdocumented.

## Portfolio Builder to Ecommerce

The builder and ecommerce feature are connected by a shared portfolio ID, not by merging their controllers:

1. `PortfolioBuilderPage` loads a portfolio and initializes `useBuilderStore` with `sections` and `theme_config`.
2. Builder edits save the home section array and theme config to `portfolios`; custom page section arrays are saved to `pro_pages`.
3. The Store tab changes portfolio-level storefront settings. Product/catalog records remain actor/portfolio-owned rows managed by ecommerce pages.
4. Published `PortfolioLayout` calls `usePortfolio` by slug or custom hostname, obtains the published portfolio and actor, then renders the site sections and nested routes.
5. The storefront controllers use that portfolio context to scope active products/collections, cart (`portfolio-cart-storage`, carts keyed by portfolio ID), checkout, customer accounts, reviews, and store chat.

The separation is sound in concept: builder owns site composition; ecommerce owns commerce data/transactions; themes provide views. It does not automatically make every ecommerce route use the selected theme.

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

Current implemented path:

1. `DeveloperHubPage` creates a `marketplace_themes` draft with developer metadata and prices.
2. `ThemeStudioPage` loads and autosaves source files in `marketplace_themes.files`. `INITIAL_FILES` are raw source imports from selected Cupertino theme files; Monaco receives SDK and UI `.d.ts` definitions.
3. Studio preview transpiles the current source in the browser and sends compiled code/bundles to `StudioPreview` with `postMessage`. `StudioPreview` executes those snippets and returns a component schema/test data for its editor controls.
4. Submission changes status to `pending_review`. Admin review invokes `compile-theme`, which Babel-transforms TSX/JSX and writes a `compiled_bundle` plus `status='approved'`.
5. `BuilderPreview` alone currently fetches `marketplace_themes.compiled_bundle`, executes it with `usePrecompiledTheme`, and uses the compiled component for custom theme preview. Missing component exports fall back to the Modern built-in component.

### Current Completion Gaps

- **No published live custom-theme consumer found:** `PortfolioLayout` and `PortfolioHome` resolve only `THEME_REGISTRY`; searches find no `compiled_bundle` read outside `BuilderPreview`. A custom marketplace theme ID therefore does not resolve to its compiled components on public portfolio rendering and falls back to `DEFAULT_THEME`.
- **Custom schema is not wired into the builder editor:** `SectionEditor` resolves `THEME_REGISTRY[themeId]`; a marketplace ID not present in that registry produces “Theme not found.” Studio preview can inspect a component's `schema`, but `compile-theme` stores only executable component code and the published builder editor does not load custom schemas.
- **Commerce views do not use custom bundles:** the public shop, product/cart/checkout routing described above is not wired to the custom compiled theme bundle.
- **Server compilation is implemented, but the end-to-end product pipeline is incomplete:** source → local Studio preview → server compile/store → builder preview works as a code path; server compile/store → builder schema editing → public live theme → themed ecommerce is not connected in the current renderers.
- **Security is a release blocker:** `compile-theme` is configured with `verify_jwt=false`, initializes a service-role client, and does not verify caller/admin role or theme ownership before setting `approved`. Preview/compiled code is evaluated through `new Function`; module allowlists are not a sandbox. See `docs/features/theme-studio.md`.

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