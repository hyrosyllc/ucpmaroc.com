# Work Plan: Completing the Platform End to End

Status: **Draft for approval.** Nothing in this plan has been started. No time estimates are given; phases are sequenced by dependency and sized S / M / L / XL by relative effort.

## 1. Goals

1. Finish the half-built loops: custom themes (author → compile → apply → render live), the SDK, and the themed storefront.
2. Make the section system rich, with missing section types (FAQ, bookings with calendar, and more) and richer variants for existing ones.
3. Complete Theme Studio so developers can build, test, version, and publish themes using the SDK.
4. Enrich Modern; extend Cupertino using SDK-backed sections; build reference custom themes in Theme Studio to prove the process.
5. Scale ecommerce toward enterprise capability (catalog, checkout, promotions, fulfillment, analytics, extensibility, reliability).

## 2. Design Principles (derived from your direction)

- **Default themes are directly authored.** Modern, Modern Bright, and Cinematic stay raw React and are never migrated to the SDK.
- **Cupertino is the SDK testbed.** New SDK capabilities are first proven in Cupertino, then exposed to custom themes.
- **SDK extracts from default-theme logic.** When a default theme gains a behavior worth sharing, extract it into the SDK as a capability; never the reverse.
- **Precompiled, server-side themes.** Source is compiled once on the server and stored; the browser loads a ready bundle. No browser Babel on the live path.
- **Schema-first sections.** Every section type has one declared contract (data shape, settings schema, defaults, supported variants) used by builder, preview, live renderer, and Studio.
- **The server is authoritative for money, inventory, availability, and entitlements.** Themes and SDK hooks only present and collect input.
- **Document before changing.** Each change to a schema, SDK member, or section contract lists every consumer first (see the consumer maps in `docs/PORTFOLIO_ECOMMERCE_THEMES.md`).

## 3. Verified Baseline (what is true today)

These come from source scans, not assumptions.

| Area | Finding |
| --- | --- |
| Compile pipeline | `compile-theme` writes `marketplace_themes.compiled_bundle`, but only `BuilderPreview` reads it. Live `PortfolioLayout`/`PortfolioHome` resolve only `THEME_REGISTRY`. |
| Compile security | `compile-theme` has `verify_jwt=false`, uses the service role, and auto-approves with no caller, owner, or admin check. |
| Code execution | Preview and compiled code run via `new Function`; the module allowlist is not a sandbox. |
| SDK split | `@ucp/sdk` → `src/lib/ucp-sdk/index.ts` (11 members). `@/lib/ucp-sdk` resolves to legacy `src/lib/ucp-sdk.tsx` (4 members) and is what the compiler/preview hooks import. |
| Schemas | Built-in editor writes schema controls to `section.settings` (`defaultValue`, many field types). Studio inspector treats schemas as keyed objects, reads `default`, renders few types, writes to `data`. |
| Inline edit | `InlineEdit` posts `INLINE_EDIT {sectionId, fieldKey, value}`; builder listens for that; Studio listens for `UCP_INLINE_EDIT {field, value}`. |
| Section types | 17 types, fixed in `SectionType` and `SECTION_COMPONENT_MAP`. Custom bundles can only replace implementations of existing types. |
| Visibility | `PortfolioHome` filters `isVisible`; `DynamicPage` does not. |
| Palettes | Live/preview palettes define only `modern` and `cinematic`; other themes fall back to Modern. |
| Commerce theming | Shop page, cart drawer, checkout, thank-you are Modern-bound; product page checks legacy ID `"minimal"` not `"cupertino"`. |
| Two shop models | `shop` (manual products, direct actions) vs `dynamic_store` (database products + cart). |
| Custom-domain portal | Custom-domain branch mounts `CustomerDashboardLayout` without a `:slug` it needs. |
| Billing | Pages/functions/migrations exist locally; checkout paths (`create-checkout-session`, `stripe-billing`, `create-subscription`) overlap; deployment status unverified. |
| Quality gates | No `npm test`; ESLint reports ~5,545 errors; production build passes. |

## 4. Decisions Needed From You (before Phase 1)

Please confirm or change each recommendation.

1. **Single SDK runtime.** Recommendation: keep `src/lib/ucp-sdk/index.ts` as the only SDK; delete the legacy `ucp-sdk.tsx` after repointing imports. Is the legacy file used anywhere you rely on?
2. **Theme manifest as the publish unit.** Recommendation: a published theme is `{ manifest, compiled modules, version }`, not loose files. Approve?
3. **Execution isolation for custom themes.** Options: (A) approved-code-only with review + CSP (fastest, weakest); (B) iframe sandbox per section tree (strong, complicates SSR/SEO/layout); (C) hybrid — A for admin-reviewed themes, B for unreviewed. Recommendation: **C**, starting with A. Approve?
4. **Section registry as data.** Recommendation: a single registry describing each section type; new types are added in one place, not three.
5. **Booking scope v1.** Recommendation: in-platform scheduling first (availability, slots, bookings, payments, reminders), Google Calendar two-way sync second, Microsoft/Apple later. Approve?
6. **Custom-theme commerce views.** Should custom themes be allowed to override shop/product/cart/checkout views, or only sections? Recommendation: sections + product/shop views in v1; checkout/cart behind a stricter "commerce-certified" tier.
7. **Currency/market scope.** Ecommerce today mixes USD (store) and MAD (domains/talent). Choose the primary multi-currency strategy (see Phase 8).
8. **Plans and entitlements.** Which sections, themes, and ecommerce features are tier-gated?

## 5. Phase Overview

| Phase | Name | Depends on | Size |
| --- | --- | --- | --- |
| 0 | Safety, baseline, and quality gates | — | M |
| 1 | Contract foundation (SDK, sections, schemas, manifest) | 0 | L |
| 2 | Precompiled theme pipeline and live runtime | 1 | XL |
| 3 | Theme Studio completion | 1, 2 | XL |
| 4 | Section system v2 and new sections | 1 | XL |
| 5 | Theme enrichment (Modern, Cupertino, custom reference themes) | 3, 4 | XL |
| 6 | Theme-aware storefront | 1, 2 | L |
| 7 | Ecommerce enterprise capabilities | 6 | XL |
| 8 | Platform hardening (billing, domains, i18n, perf, observability) | parallel from 0 | L |
| 9 | Launch, migration, and documentation | all | M |

Phases 4 and 8 can run in parallel with 2–3 once Phase 1 lands.

---

## Phase 0: Safety, Baseline, and Quality Gates

**Why first:** several later phases ship executable user code and money flows; the foundation must be safe and testable.

### 0.1 Close the compile-theme authorization gap (S, release blocker)
- Require JWT (`verify_jwt=true`) and validate the caller inside the function.
- Allow actions by role: *owner* may request a draft compile (sets `status` unchanged, writes a preview bundle); *admin* may approve/publish.
- Verify `marketplace_themes.developer_id` matches the caller's actor.
- Remove automatic `status='approved'` on compile success; approval is a separate admin action.
- Add structured error responses and audit log rows (`marketplace_theme_events`: who, what, version, result).
- **Acceptance:** an unauthenticated request, a non-owner, and a non-admin approval attempt each fail; tests cover all three.

### 0.2 Restrict who can write `compiled_bundle` and `status` (S)
- RLS: developers can read/write `files` and request compile but cannot update `status` to `approved` or write `compiled_bundle` directly; only the service role path can.
- Review existing policies on `marketplace_themes` and add a migration.

### 0.3 Establish test and CI gates (M)
- Add `npm test` (Vitest + React Testing Library) and a Playwright smoke suite.
- Add a GitHub workflow for install, typecheck, lint (scoped), unit tests, build. Keep the existing GCS sync workflow separate.
- Fix the two existing `App.tsx` type errors (`FeatureWallet` and `AdminChatSheet` lazy imports).
- Lint: define a baseline file, fail only on *new* violations, then burn down by directory (start with shared `components/`, `lib/`, `themes/`).
- Remove or relocate dead code: `SectionEditor-backup.tsx`, `create-payment-intent/index copy.ts`; decide fate of `convert_*.cjs` scripts (hard-coded `/workspaces/voice` path).

### 0.4 Environment and secrets hygiene (S)
- Rotate secrets previously exposed in `.env.local`; confirm Supabase function secrets are the only server source.
- Add `.env.example` completeness check in CI.

### 0.5 Database baseline (M)
- Record a schema baseline migration (current migrations are incremental and omit the tables that earlier features created), so a fresh environment can be built.
- Document RLS per table (owner matrix) in `docs/`.

**Exit criteria for Phase 0:** CI green; compile-theme secured; baseline migration reproduces a working database; test harness running.

---

## Phase 1: Contract Foundation

### 1.1 Unify the SDK (M)
- Repoint `usePrecompiledTheme`, `useDynamicThemeCompiler`, and `StudioPreview` to `@ucp/sdk`; delete `src/lib/ucp-sdk.tsx`.
- Add a contract test: every member in `types.d.ts` exists in the runtime object and vice versa.
- Single SDK version constant (`UCP.version`) used in manifests and compatibility checks.
- Audit every SDK member against its Cupertino and Studio usage (consumer map) **before** changing signatures.

### 1.2 Section registry (L)
Create `src/features/portfolio-builder/sections/registry.ts` as the only place a section type is defined:

```
SectionDefinition {
  type, label, icon, category, plan gating,
  dataSchema, settingsSchema (per-theme overridable),
  defaults (data + settings), variants[],
  capabilities: { dataSource?: "products"|"bookings"|"forms"|..., usesCart?, usesForms? },
  version, migrate(fromVersion, data)
}
```
- Derive `SectionType`, `SECTION_COMPONENT_MAP`, `AVAILABLE_BLOCKS`, and the "add section" menu from it.
- Keep a compatibility layer so existing stored sections load unchanged.
- Add per-section **schema versions** and migration functions (needed once sections get richer).

### 1.3 One schema format (M)
- Define a single field-schema spec: `text`, `richtext`, `textarea`, `number`, `slider`, `toggle`, `select`, `multiselect`, `color`, `image`, `video`, `link`, `icon`, `font`, `product-picker`, `collection-picker`, `form-picker`, `page-picker`, `repeater` (nested fields), `group`, `conditional (showIf)`.
- Standardize on `defaultValue` and arrays of `{id,type,label,...}`.
- Write one shared renderer used by `SectionEditor` and Theme Studio (replacing the Studio's limited inspector).
- Settings go to `section.settings`; content to `section.data`. Studio test controls follow the same rule.

### 1.4 Typed section contracts (M)
- Collapse `types/portfolio.ts`, `themes/types.ts` (`BlockProps`), and `types/sections.ts` into one generated-or-shared type per section derived from the registry definition.
- Enforce in built-in themes through types (non-breaking: widen where Modern uses looser props).

### 1.5 Preview/message protocol (S)
- One versioned message protocol shared by builder preview and Studio preview (`UCP_PROTOCOL_V1`): `UPDATE_PREVIEW`, `INLINE_EDIT`, `EDIT_SECTION`, `SCROLL_TO_SECTION`, `PREVIEW_READY`, schema-parsed events.
- Validate `event.origin` and `event.source`; stop using `"*"` for targetOrigin.

### 1.6 Theme manifest spec (M)
```
manifest.json {
  id, name, version, sdkVersion (semver range),
  sections: { <type>: { module, schema, defaults, variants } },
  views: { shop?, product?, cart?, checkout?, thankYou?, login? },
  tokens: { palettes: { light, dark }, fonts, radius, buttonStyles },
  assets, capabilities, compatibility, hash
}
```
- Manifest is generated by the compiler from source exports (`schema`, `defaultProps`, etc.), never hand-written.

**Exit criteria:** one SDK; one section registry; one schema renderer; manifest spec reviewed; contract tests green.

---

## Phase 2: Precompiled Theme Pipeline and Live Runtime

Goal: themes compile on the server once, are stored versioned, and load fast for builder and live sites.

### 2.1 Data model (M)
Migrations:
- `marketplace_theme_versions(id, theme_id, version, status, manifest jsonb, source_hash, compiled_at, created_by, reviewed_by, review_notes)`.
- `marketplace_theme_assets(version_id, path, storage_key, hash, size)` for compiled modules; large bundles go to Storage (not Postgres rows).
- `portfolios.theme_version_id` (pin) + `portfolios.theme_config.templateId` retained for built-ins.
- Keep `marketplace_themes` as the *theme* record; versions are immutable.

### 2.2 Server compile service (L)
- Rework `compile-theme` into a pipeline: **validate → lint → transform → bundle → manifest → store**.
  - Validate source: file allowlist, size limits, import allowlist, forbidden globals (`window.parent`, `document.cookie`, `fetch` to non-platform hosts, dynamic `import()`).
  - Transform TS/TSX with a bundler (esbuild-wasm or SWC in the Edge runtime) rather than per-file Babel; output ESM modules with externals mapped to platform-provided modules (`react`, `@ucp/sdk`, `lucide-react`, `framer-motion`, `@/lib/utils`).
  - Extract `schema`, `defaultProps`, `testData` by static analysis or a sandboxed evaluation step; fail the compile if they are malformed.
  - Hash each module (content address); write to Storage `themes/<themeId>/<version>/<hash>.js`.
- Compile is a job: request → queued → running → success/failed, with logs readable in Studio.
- Idempotent per `source_hash`.

### 2.3 Review and publish workflow (M)
- States: `draft → compiled → submitted → in_review → approved | rejected → published | deprecated`.
- Admin UI shows a diff against the previous version, compile report, forbidden-API findings, and the manifest.
- Publishing pins an immutable version; developer updates create new versions; sites can stay pinned or follow `latest-compatible`.
- Rollback: an admin or site owner can pin an earlier version.

### 2.4 Runtime loader (L)
- Add `themeRuntime` in `src/themes/runtime/`:
  - `resolveTheme(themeId, versionId?)` → built-in registry entry **or** marketplace manifest + lazy module loaders.
  - `loadSection(theme, sectionType)` → dynamic ESM import from CDN/Storage URL with integrity hash, cached by hash.
  - Single provider mounted in both `PortfolioLayout` and `BuilderPreview`.
- Resolve once per page, preload Header/Hero modules via `<link rel="modulepreload">`; lazy-load others on visibility.
- Failure policy: explicit error state per section (never silent Modern fallback); optional per-site "fallback to Modern" toggle.
- Public query returns the pinned manifest with the portfolio in one round trip (no extra waterfall).

### 2.5 Isolation (L)
Implement the approved option from Decision 3:
- Stage A: reviewed-only + strict CSP (script-src limited to platform + theme CDN), no `eval`/`new Function` in production path (ESM modules instead).
- Stage B (optional): render untrusted sections in a sandboxed iframe with a postMessage RPC bridge to SDK capabilities.
- SDK capability gating: cart, forms, bookings expose narrow RPC methods; themes never receive the Supabase client.

### 2.6 Builder integration (M)
- Theme picker lists approved marketplace versions with preview thumbnails (generated screenshot per theme version).
- Applying a theme sets `theme_version_id` and loads the manifest; `SectionEditor` reads schemas from the manifest (same path as built-ins).
- Theme-switch safety: map existing section `data` to the new theme; keep `settings` per theme (`settings.themes[themeId]`) so switching back restores design choices.
- Palette/token handling reads `manifest.tokens` (fixes the Modern-fallback palette problem for all themes).

### 2.7 Performance and caching (M)
- Immutable, content-hashed assets with long cache headers; version manifest cached at the edge.
- Budget: first-section JS and manifest under an agreed size; measure with Lighthouse CI on three reference sites.
- Optional SSR/prerender for SEO later (see Phase 8).

**Exit criteria:** a custom theme compiled once on the server renders on a live published site, in builder preview, and its schemas drive the section editor, with no browser compile step.

---

## Phase 3: Theme Studio Completion

### 3.1 Fix the current loop (M)
- Use the unified SDK in preview; use the shared schema renderer and protocol (Phase 1).
- Ensure inline edit, settings controls, data controls, and device toggles all work in Studio the same way as in the builder.
- Start from the section registry: Studio shows required/optional sections and their expected exports.

### 3.2 Project model (L)
- Multi-file project with folders: `sections/`, `views/`, `components/`, `styles/`, `assets/`, `manifest.config.ts`.
- Templates: blank, "Modern-like (no SDK)", "Cupertino-like (SDK)", "Commerce-ready".
- File operations: create, rename, delete, drag/drop, import/export zip (and GitHub sync later).
- Per-file TypeScript diagnostics with real semantic checking (enable `noSemanticValidation`), SDK types and registry-derived section prop types injected into Monaco.

### 3.3 Preview experience (L)
- Preview against a real site or sample dataset (store, bookings, FAQs); switch device, light/dark, locale.
- Full-page preview with every supported section; per-section isolation view; commerce views preview (shop/product/cart).
- Error overlay with source-mapped stack traces; compile log panel.
- Time-travel: local history snapshots and restore.

### 3.4 Versioning and publishing (M)
- "Save draft" vs "Compile" vs "Submit for review" are explicit steps; show status badge and version.
- Changelog per version; semantic version bump rules (breaking schema change = major).
- Test-run checklist before submit: schema valid, all required sections present, SDK compatibility, accessibility smoke test, bundle budgets.

### 3.5 Developer documentation (M)
- Replace `SdkDocsModal` with a versioned docs site generated from `types.d.ts` and the section registry (props, schema fields, examples, capability notes).
- Starter tutorials: build a section, add a schema, use cart hooks, add a booking section.

### 3.6 Marketplace operations (M)
- Pricing, licensing, per-site vs global unlock, revenue share, payout reporting for theme developers (builds on existing `purchase_theme` RPC).
- Ratings and screenshots; support/contact link.

**Exit criteria:** a developer can create, test, compile, submit, and an admin can approve a theme that then runs live — entirely through the UI.

---

## Phase 4: Section System v2 and New Sections

### 4.1 Richer foundations (M)
- Section-level controls shared by all sections: spacing, background (color/gradient/image/video), width, alignment, visibility per device, anchor ID, animation preset, custom class (restricted), A/B variants (later).
- Content blocks inside sections via the `repeater` field (e.g., cards, steps, items) with drag-reorder.
- Dynamic content bindings: bind a field to a product, collection, form, booking service, page, or site-wide variable (name, contact info).
- Section library: save a configured section as a reusable template; global/shared sections (e.g., footer, announcement) edited once.
- Preset templates per section (the "layouts gallery").
- Undo/redo, duplicate, copy/paste across pages, bulk visibility.

### 4.2 Enrich existing sections (L)
For each existing type, add variants, richer data fields, and accessibility fixes. Examples:
- **Hero:** video background, split with form, product spotlight, countdown, rotating testimonials, parallax.
- **About, Team, Reviews:** richer layouts, ratings aggregates, source badges, video testimonials.
- **Gallery/sliders:** lightbox with captions, filtering by tags, lazy responsive images.
- **Pricing:** monthly/yearly toggle, comparison table, feature matrix, currency awareness.
- **Contact/LeadForm:** multi-step forms, conditional fields, file upload, spam protection, CRM tagging.
- **Map:** multiple locations, opening hours.
- **Header:** announcement bar presets, mega-menu with images, search, language switcher, account link.

### 4.3 New section types (XL)
Each new section is delivered end to end: registry definition, schema, defaults, Modern implementation, Cupertino SDK implementation, editor UI, preview, live render, tests, docs.

**Priority 1**
1. **FAQ:** accordion/grid/tabs, categories, search, JSON-LD `FAQPage` for SEO, bind to a reusable FAQ library.
2. **Booking (calendar):** see 4.4.
3. **Testimonials/Logo cloud/Trust badges.**
4. **Rich text / Content block** (headings, lists, media, embed).
5. **Call-to-action banner / Newsletter signup** (email capture to leads/CRM).
6. **Features/Benefits grid, Steps/Process, Stats counters (animated).**
7. **Footer** (links, socials, newsletter, legal, language).
8. **Blog/Articles list** (requires a lightweight CMS model; see Phase 8).

**Priority 2**
9. Video/Audio player section (ties into actor demos).
10. Timeline / Milestones.
11. Comparison table.
12. Countdown / Announcement / Promo popup.
13. Product collection grid and Featured product (data-bound, replaces many uses of manual `shop`).
14. Cart-upsell/bundles section.
15. Instagram/social feed (external embed with consent).
16. Downloads/Resources.
17. Events/Schedule list (can reuse booking data).
18. Login/Account/Order-tracking entry.
19. Embed (iframe) and Custom HTML (retain, with stricter sanitization).

### 4.4 Booking system and booking pages (XL)

**Data model**
- `booking_services(id, portfolio_id, actor_id, name, description, duration_min, buffer_before, buffer_after, price_cents, currency, capacity, location_type[in-person|online|phone], location_details, requires_payment, deposit_cents, cancellation_policy, form_id, active)`
- `booking_resources(id, portfolio_id, name, type[staff|room|equipment])` and `booking_service_resources` mapping.
- `availability_rules(id, resource_id|portfolio_id, weekday, start_time, end_time, timezone)` and `availability_exceptions(date, closed|custom_hours)`.
- `bookings(id, portfolio_id, service_id, resource_id, customer_id?, name, email, phone, start_at, end_at, timezone, status[pending|confirmed|cancelled|completed|no_show], payment_status, order_id?, notes, form_responses, manage_token_hash, source)`.
- `calendar_connections(id, actor_id, provider, account, encrypted_tokens, sync_state)`.
- `booking_events`, `reminders_outbox` for notifications.

**Server logic (Edge Functions / RPC)**
- `get-availability(service, date range, tz)`: computes slots from rules, exceptions, buffers, existing bookings, lead time, max horizon, and external busy times.
- `create-booking`: transactional slot hold with exclusion constraint (`tstzrange` + GiST) to prevent double booking; supports hold expiry for unpaid bookings.
- Payments: reuse store payment attempts (deposit or full), webhook-confirmed; refunds per policy.
- Manage links: reschedule/cancel via signed token; policy enforcement.
- Notifications: confirmation, reminders (email now, SMS/WhatsApp later), `.ics` attachment.
- Google Calendar two-way sync (OAuth, busy-time read, event write); then Microsoft.
- Waitlist, recurring bookings, group sessions (capacity), packages/memberships (later).

**UI**
- Booking **section** (service list + inline calendar) for any page.
- Dedicated **booking pages**: `/pro/:slug/book`, `/book/:serviceSlug`, per-service landing with SEO, embeddable widget.
- Owner dashboard: services, availability editor (weekly + exceptions), calendar view (day/week/month), bookings list, customer notes, reschedule, no-show, exports, reports.
- Customer portal tab for upcoming bookings; time zone handling (display in the visitor's zone).
- SDK additions: `useBookingServices`, `useAvailability`, `useBookingFlow` (Cupertino proves them first).

**Edge cases to specify before build:** DST changes, overlapping services across resources, partial refunds, timeouts of payment holds, GDPR export/delete, rate limits and bot protection.

### 4.5 Forms platform upgrade (M)
- Shared form engine used by LeadForm, bookings, checkout fields, FAQ "ask a question".
- Conditional logic, validation rules, file uploads, spam protection (honeypot + turnstile), webhooks, email routing.
- Submission inbox with statuses, assignments, tags, export.

### 4.6 Accessibility, SEO, and performance for sections (M)
- WCAG 2.2 AA checks per section (keyboard, focus, contrast, reduced motion).
- Structured data (FAQ, Product, Event, LocalBusiness, Breadcrumb); unique per-page meta; Open Graph images; sitemap.
- Image pipeline (responsive `srcset`, AVIF/WebP, lazy loading).
- Section-level Lighthouse budget in CI.

**Exit criteria:** section registry holds ≥ 30 types with variants; FAQ and Booking complete in Modern and Cupertino; shared section controls available; docs updated.

---

## Phase 5: Theme Enrichment

### 5.1 Modern (L)
- Remains raw React (no SDK). Add all Phase 4 sections natively, richer variants for existing ones, a proper light/dark palette, motion polish, full commerce views (shop/product/cart/checkout/thank-you/portal).
- Extract any logic worth sharing into the SDK only after it stabilizes in Modern.

### 5.2 Modern Bright and Cinematic (M each)
- Reach parity with Modern's section list; add real palettes (fix fallback), commerce views.

### 5.3 Cupertino (L)
- Implement every new section using SDK hooks (FAQ, Booking, CTA, Newsletter, Features, Steps, Footer, etc.).
- Every gap discovered becomes an SDK issue; fix SDK first, then adopt.
- Add Cupertino commerce views and register `cupertino` properly in storefront routing.

### 5.4 Reference custom themes built in Theme Studio (L)
Build 3 themes **only through Theme Studio and the publish pipeline** to test the process end to end:
1. **"Atelier"** — editorial portfolio (uses sections only).
2. **"Boutique"** — commerce-first (shop/product views, bundles, upsells).
3. **"Studio Booking"** — service business (booking, FAQ, testimonials).
- For each: author, compile on server, submit, review, publish, apply to a real site, run Lighthouse and accessibility checks. Every friction point is recorded and fixed in the Studio/SDK.
- Success = another developer can reproduce a theme from docs alone.

### 5.5 Theme acceptance suite (M)
- Visual regression (Playwright screenshots per section and variant, light/dark, mobile/desktop).
- Contract tests: every theme exposes required exports, valid schemas, no forbidden APIs.

---

## Phase 6: Theme-Aware Storefront

### 6.1 View dispatch (M)
- Replace direct `ModernShopLayout`/`ModernProductLayout`/`ModernCartDrawer`/Modern checkout imports with `themeRuntime.getView(theme, "shop" | "product" | "cart" | "checkout" | "thankYou" | "login")`.
- Fix the `"minimal"` vs `"cupertino"` mismatch.
- Fallback rule: if a theme lacks a view, use the platform-default view (explicit, logged), not silently Modern.

### 6.2 Controller/view contract (M)
- Define typed view props (`ShopViewProps`, `ProductViewProps`, ...) as the stable interface between ecommerce controllers and themes; themes cannot reach into data fetching.
- Controllers stay in `features/ecommerce`; views live in themes; SDK exposes only sanctioned actions (`addToCart`, `applyCoupon`, `startCheckout`).

### 6.3 Unify the two shop section models (M)
- Migrate `shop` (manual) usage toward `dynamic_store`/product-collection sections; keep `shop` as a legacy type with an upgrade tool that converts manual products into catalog products.
- Decide and document what happens with direct WhatsApp/link actions (keep as product `action_type`).

### 6.4 Custom domain parity (S)
- Fix `CustomerDashboardLayout` to resolve the portfolio from hostname when no `:slug`; test login, orders, messages, thank-you, checkout on custom domains.

### 6.5 Builder preview of commerce views (M)
- Replace "coming soon" checkout preview with real themed preview using sample data.

---

## Phase 7: Ecommerce — Enterprise Capabilities

Principle: match the table-stakes of Shopify/BigCommerce, then lead where this platform is structurally different (creators, services, bookings, multi-market, AI, local payments).

### 7.1 Catalog (L)
- Product types: physical, digital, service, **bookable**, bundle, subscription, gift card, made-to-order.
- Variants: up to many options with per-variant SKU, price, weight, image, inventory, barcode; matrix editor; bulk edit.
- Collections: manual and **smart (rules)**; sorting, merchandising pins.
- Metafields/custom attributes with typed schema; product templates.
- Bulk import/export (CSV with Shopify/WooCommerce mappers), demo data loader, media library with video/3D/AR assets later.
- Product SEO, structured data, redirects management, URL handles.
- Draft/scheduled publishing, per-market visibility, translations per field.

### 7.2 Inventory (L)
- Multi-location inventory, reservations during checkout (hold with TTL), oversell protection with row-level locks, low-stock alerts, backorder/preorder, stock history ledger, transfers, supplier/purchase orders (later).

### 7.3 Pricing and promotions (L)
- Price lists per market/currency/customer group; compare-at; tax-inclusive display.
- Discount engine: automatic and code discounts, BOGO, tiered, bundles, free shipping, product/collection/customer-segment targeting, stackability rules, usage limits per customer, scheduled campaigns, server-side evaluation only.
- Gift cards, store credit, loyalty points, referral codes.

### 7.4 Checkout (XL)
- Server-side cart and checkout sessions (not trusted browser totals), persisted for abandoned-cart recovery and cross-device.
- One-page, multi-step, and express checkout (Apple Pay / Google Pay / Stripe Link), address autocomplete, guest and account checkout, saved addresses/payment methods.
- Payment methods: cards (Stripe Connect), bank transfer, COD, crypto (NOWPayments), **local Moroccan/MENA gateways** (e.g., CMI/Payzone/Cash Plus options to be selected and verified), buy-now-pay-later where available.
- Taxes: configurable rates per region, VAT/GST inclusion, tax IDs, B2B exemptions; connect a tax engine later.
- Shipping: carrier integrations/rate APIs, label printing, pickup/local delivery, delivery zones, free-shipping thresholds, shipping profiles per product, COD cities.
- Fraud and risk: velocity limits, Stripe Radar signals, address checks, manual review queue.
- Reliability: idempotency keys on every mutating call, webhook inbox with retry/dead-letter, reconciliation job between Stripe and `pro_orders`.

### 7.5 Orders and fulfillment (L)
- Order state machine (pending → paid → fulfilled → delivered → completed; refunds/returns/exchanges), partial fulfillment, split shipments, tracking links, packing slips and invoices (PDF), returns portal (RMA), draft orders/manual orders, order edits, timeline of events, internal notes, tags.
- Digital delivery with signed expiring URLs and download limits; license keys.
- Notifications: transactional email templates per event with merchant branding; SMS/WhatsApp opt-in.

### 7.6 Customers and CRM (M)
- Unified customer profile across orders, bookings, leads, chats; segments, tags, lifetime value, RFM, consent management; account portal (orders, returns, addresses, bookings, downloads, wishlist).

### 7.7 Marketing and growth (L)
- Abandoned-cart recovery (finish `abandoned-cart-recovery` with scheduling and templates), email campaigns/flows, back-in-stock, wishlist, product reviews with photos/video and verified-buyer badges, upsell/cross-sell and post-purchase offers, discount popups, UTM attribution, pixel/CAPI integrations (Meta, TikTok, Google), SEO tools, blog.

### 7.8 Analytics and reporting (L)
- Sales, conversion funnel, cohort, product performance, traffic sources, inventory aging, tax and payout reports, exports, scheduled reports, real-time dashboard; event pipeline (`analytics_events`) with batching and retention policy.

### 7.9 Multi-market and localization (L)
- Markets (country groups) with currency, language, domain/path strategy, tax and shipping rules; automatic currency display; translations of products/sections via `public/locales` and per-field translations; RTL polish for Arabic.
- Resolve the USD (store) vs MAD (other flows) split with a single money model: integer minor units + ISO currency on every record.

### 7.10 Extensibility (L)
- Public REST/GraphQL API with scoped API keys and rate limits; outgoing webhooks with signing and retries; app/extension framework (installable integrations) built on the same sanctioned SDK capabilities; theme app blocks (third-party sections can plug in).
- Event bus design (`order.created`, `booking.confirmed`, etc.) as the integration backbone.

### 7.11 Store operations and multi-tenant scale (L)
- Roles and permissions per store (owner, manager, fulfillment, support); staff invitations; audit log.
- Multi-store management for one actor with shared catalogs.
- Rate limiting, bot protection, queue-based background jobs, read replicas/caching for public catalog reads, CDN image transformation, database indexes review on `pro_*` tables, load tests with defined throughput targets.

### 7.12 AI capabilities (M)
- Product description/SEO/alt text generation, catalog enrichment, AI storefront assistant (extend existing store bot with product search, order lookup, booking help), smart recommendations, merchandising insights, anomaly alerts. Metered through the existing usage billing.

### 7.13 "Beyond Shopify" differentiators (strategy, M)
Pursue deliberately:
- **Unified commerce + services + bookings** in one customer profile and checkout (physical, digital, service, bookable).
- **Creator/talent-native:** audio/video demos, voice-note chat, quotes-to-order, offers from chat.
- **Regional payments and COD excellence** with delivery-city logic and WhatsApp ordering.
- **Built-in AI voice/chat agent** with credits billing (already partially built).
- **Open theme marketplace with a real developer loop** (Phases 2–3).
- Measure against agreed benchmarks (checkout time, Lighthouse, order success rate, setup time to first sale), not feature counts alone.

---

## Phase 8: Platform Hardening (runs in parallel)

### 8.1 Billing completion (L)
- Choose one canonical subscription flow (reconcile `create-checkout-session`, `stripe-billing`, `create-subscription`); remove the others or clearly scope them.
- Replace placeholder `billing_prices` Stripe IDs; run the test-mode matrix in `docs/BILLING_OPERATIONS.md`; reconcile queue monitoring and alerts; dispute/refund flows; invoices.
- Verify remote migrations vs local; apply in order.

### 8.2 Domains (M)
- Harden `manage-domains` (ownership verification, SSL/status polling, error states); documented DNS instructions; domain removal cleanup.
- Decide whether to revisit domain sales later with a real registrar API (out of scope now).

### 8.3 Auth and accounts (M)
- Add password recovery route (login UI links to `/forgot-password`, route missing), MFA for admins, session handling consistency, profile-creation idempotency, account-deletion tests.

### 8.4 Security (L)
- RLS review for every table with a test matrix; CORS tightening (functions currently `*`); input validation on all Edge Functions; secrets rotation process; CSP; dependency scanning; audit logging for admin actions; PII retention and export/delete (GDPR/Moroccan law 09-08 considerations to review with counsel).

### 8.5 Performance and SEO (L)
- Code-split audit (main chunk warnings), image pipeline, prefetch strategy, prerendering/SSR for public portfolio and product pages (evaluate Vercel Edge/Prerender or migrating the public site to a framework with SSR; the current `edge-seo.ts` only serves bots).
- Core Web Vitals budgets in CI.

### 8.6 Observability (M)
- Error tracking (Sentry), structured logs for Edge Functions, uptime checks, business dashboards (failed payments, webhook lag, compile failures), alerting.

### 8.7 Internationalization (M)
- Complete translations for all new UI; locale-aware formatting; RTL pass; remove the legacy `debug: true` i18n setting in production.

### 8.8 Documentation hygiene (S, continuous)
- Update `docs/` with every phase; keep historical docs marked; ADRs for the decisions in Section 4.

---

## Phase 9: Launch, Migration, and Rollout

- Feature flags per capability (new section system, runtime loader, booking, new checkout) with percentage/tenant rollout.
- Data migrations: sections to schema v2, `shop` → catalog conversion tool, theme pinning for existing sites, backfill `theme_version_id`.
- Backward compatibility window and rollback plan for each migration.
- Beta cohort (selected creators) with feedback loop before general availability.
- Support playbooks, status page, changelog.

---

## 6. Cross-Cutting Practices

- **Consumer-map review** before any schema/SDK change: list every reader/writer (builder, preview, live, Studio, compile, docs). The scans in `docs/PORTFOLIO_ECOMMERCE_THEMES.md` are the starting map; some pieces that look unused (e.g., legacy sections, the manual `shop`) may serve live data.
- **Never break stored data:** schema versions + migrations + dual-read period.
- **Definition of done for any feature:** typed contract, schema, defaults, builder editor, preview, live render, theme implementations, tests (unit + visual + e2e), accessibility check, docs, feature flag, analytics events, i18n strings.
- **Review gates:** security review for anything executing user code or touching money; DB review for new tables/RLS.

## 7. Risks and Mitigations

| Risk | Mitigation |
| --- | --- |
| Executing third-party code in public pages | Review workflow, CSP, versioned immutable bundles, optional iframe isolation, kill switch to unpublish a theme version |
| Scope is very large | Phase gates and feature flags; each phase ships independently; Phase 0–2 are the critical path |
| Breaking existing sites during schema/theme changes | Schema versions, compatibility layer, pinned theme versions, staged rollout |
| Double booking / race conditions | DB exclusion constraints, transactional holds, idempotent APIs, load tests |
| Payment correctness across providers | Server-authoritative pricing, webhook inbox, reconciliation jobs, test-mode matrix |
| Currency inconsistencies (USD/MAD) | Single money model and migration plan before multi-market work |
| SDK drift between default themes and custom themes | Contract tests, `sdkVersion` in manifests, Cupertino as continuous SDK testbed |
| Quality debt (lint, no tests) | CI gates introduced in Phase 0; baseline + ratchet |
| Compile service limits in Edge runtime | Prototype bundler choice early (spike in Phase 2.2) before committing |

## 8. Spikes (small, early, to de-risk)

1. Bundler in Supabase Edge (esbuild-wasm vs SWC vs external build worker) — output size, cold-start, supported syntax.
2. ESM dynamic import of compiled sections from Storage/CDN with integrity hashes inside the Vite app and in the public site.
3. Iframe sandbox RPC prototype for one section (measure layout/SEO impact).
4. Booking slot computation + exclusion-constraint prototype with DST test cases.
5. Server-side cart/checkout session design against current `useCartStore` and `create-payment-intent`.

## 9. Approval Checklist

Please mark approve / change / reject:

- [ ] Phase order and dependency graph (Section 5)
- [ ] Decisions 1–8 (Section 4)
- [ ] Phase 0 as the immediate first step (security fix + CI + baseline)
- [ ] Section priority list, including FAQ and Booking in Priority 1 (Phase 4.3)
- [ ] Booking v1 scope (Phase 4.4)
- [ ] Three reference custom themes (Phase 5.4)
- [ ] Ecommerce capability scope (Phase 7), with items you want removed or added
- [ ] Spikes before large commitments (Section 8)

After approval, the next deliverable is a task breakdown per phase (issue-sized work items with acceptance criteria and owners), starting with Phase 0.
