# Repository Catalog

Source-tree review: 2026-10-13. This catalog covers first-party application, backend, docs, and agent-resource paths present in the workspace. It is a navigation/index document, not a substitute for reading code or proving production deployment.

## Scope and Counts

- `src/`: 284 files across the app shell, seven active feature modules, shared components, layouts, SDK, state, and four built-in theme folders.
- `supabase/`: 31 configured/implemented Edge Function entry points, 4 shared helpers, 31 SQL migrations, and `config.toml`.
- `.github/`: 255 authored agent, prompt, reference, test, asset-data, and workflow files, plus 3 generated Python cache files excluded from the source inventory.
- `public/`, `api/`, and docs: 16 files in the current public/API/documentation trees.
- Root project configuration, package scripts, utility scripts, plans, and docs are listed below.

**Excluded from source review:** `.env.local` contents, `node_modules/`, generated `dist/`, `.git/`, Python `__pycache__`/`.pyc`, and the internal contents of the eight commit-pinned third-party submodules in `resources/reference-repos/`. `.env.local` is Git-ignored and was not opened. Submodule paths and provenance are in `docs/DEVELOPMENT_RESOURCES.md`.

## Feature Source Ownership

Each feature directory below has a dedicated developer guide, linked from `docs/FEATURES.md`. Every first-party file under each feature root is included in the respective file map.

| Module | Source directory | Developer guide |
| --- | --- | --- |
| Admin Core | `src/features/admin-core/` | `docs/features/admin-core.md` |
| Authentication | `src/features/auth/` | `docs/features/auth.md` |
| Ecommerce | `src/features/ecommerce/` | `docs/features/ecommerce.md` |
| Messaging | `src/features/messaging/` | `docs/features/messaging.md` |
| Portfolio Builder | `src/features/portfolio-builder/` | `docs/features/portfolio-builder.md` |
| Talent Marketplace | `src/features/talent-marketplace/` | `docs/features/talent-marketplace.md` |
| Theme Studio | `src/features/theme-studio/` | `docs/features/theme-studio.md` |

## Shared Application Files

- **App shell:** `src/main.tsx` (providers/error boundary), `src/App.tsx` (route registry/lazy loading), `src/index.css` (global tokens/utilities), `src/index.ts`, `src/vite-env.d.ts`.
- **Global UI:** `src/components/` contains navigation/footer, loaders, policy pages, media/voice helpers, builder delivery/offer helpers, SEO, and dashboard helpers. The reusable Radix/shadcn-style primitives are in `src/components/ui/`.
- **Role layouts:** `src/layouts/ActorDashboardLayout.tsx`, `AdminDashboardLayout.tsx`, `CustomerDashboardLayout.tsx`.
- **Cross-feature billing:** `src/config/plans.ts`, `src/context/SubscriptionContext.tsx`, `src/hooks/useBillingData.ts`.
- **State:** `src/store/useBuilderStore.ts` (builder sections/theme config, undo/redo); `src/features/ecommerce/store/useCartStore.ts` (persisted store-scoped carts/coupons).
- **Shared services:** `src/supabaseClient.ts`, `src/lib/analytics.ts`, `countries.ts`, `utils.ts`, `ucp-sdk.tsx`.
- **UCP SDK:** `src/lib/ucp-sdk/` contains exported UI/components, types/declarations, general helpers, and hooks `useCarousel`, `useCart`, `useDeviceSize`, `useGallery`, `useLeadForm`, `useNavigationTree`, `usePricingForm`, `useScrollObserver`, and `useShopOrderForm`.
- **Marketing/features:** `src/pages/` contains Home, talent/client landing, contact, voice-over, legal-adjacent feature pages, and feature overview pages.
- **Built-in themes:** `src/themes/registry.ts` and `types.ts`; implementations in `cinematic/`, `cupertino/`, `modern/`, and `modern-bright/`. Each provides a subset of portfolio/storefront views under the common theme contract.
- **Localization:** `src/i18n.ts` loads `public/locales/{en,fr,ar}/translation.json` through i18next HTTP backend and browser-language detection.

See `docs/PROJECT_ARCHITECTURE.md` for route groups and state/tenant flow details.

### Complete Shared/Non-Feature Source File Map

The following 166 files are the non-feature portion of `src/`; feature-owned paths are exhaustively listed in `docs/features/*.md`.

```text
src/App.tsx
src/main.tsx
src/index.ts
src/index.css
src/vite-env.d.ts
src/supabaseClient.ts
src/i18n.ts
src/components/AccordionItem.tsx
src/components/BuilderFooter.tsx
src/components/CreateOfferFromChatModal.tsx
src/components/DeliverFromLibraryModal.tsx
src/components/DemoCards.tsx
src/components/DemoPlayerRow.tsx
src/components/Footer.tsx
src/components/GlobalAudioPlayer.tsx
src/components/Hero.tsx
src/components/LanguageSwitcher.tsx
src/components/MembersSection.tsx
src/components/Navbar.tsx
src/components/PlatformLoader.tsx
src/components/PrivacyPolicy.tsx
src/components/ProjectMaterialsUploader.tsx
src/components/ProtectedRoute.tsx
src/components/QuotesCarousel.tsx
src/components/ScrollToTop.tsx
src/components/ServiceDeliveryUploader.tsx
src/components/TermsandConditions.tsx
src/components/TermsofService.tsx
src/components/ThemeToggle.tsx
src/components/VoiceNoteRecorder.tsx
src/components/common/SEO.tsx
src/components/dashboard/DashboardPageHeader.tsx
src/components/dashboard/DashboardState.tsx
src/components/dashboard/InlineEdit.tsx
src/components/dashboard/SdkDocsModal.tsx
src/components/dashboard/SiteFilter.tsx
src/components/ui/NotificationToast.tsx
src/components/ui/accordion.tsx
src/components/ui/alert.tsx
src/components/ui/avatar.tsx
src/components/ui/badge.tsx
src/components/ui/button.tsx
src/components/ui/card.tsx
src/components/ui/carousel.tsx
src/components/ui/checkbox.tsx
src/components/ui/dialog.tsx
src/components/ui/drawer.tsx
src/components/ui/dropdown-menu.tsx
src/components/ui/input.tsx
src/components/ui/label.tsx
src/components/ui/navigation-menu.tsx
src/components/ui/progress.tsx
src/components/ui/radio-group.tsx
src/components/ui/scroll-area.tsx
src/components/ui/select.tsx
src/components/ui/separator.tsx
src/components/ui/sheet.tsx
src/components/ui/skeleton.tsx
src/components/ui/slider.tsx
src/components/ui/switch.tsx
src/components/ui/table.tsx
src/components/ui/tabs.tsx
src/components/ui/textarea.tsx
src/components/ui/toggle-group.tsx
src/components/ui/toggle.tsx
src/config/plans.ts
src/context/SubscriptionContext.tsx
src/hooks/useBillingData.ts
src/layouts/ActorDashboardLayout.tsx
src/layouts/AdminDashboardLayout.tsx
src/layouts/CustomerDashboardLayout.tsx
src/lib/analytics.ts
src/lib/countries.ts
src/lib/ucp-sdk.tsx
src/lib/utils.ts
src/lib/ucp-sdk/index.ts
src/lib/ucp-sdk/types.d.ts
src/lib/ucp-sdk/ui.d.ts
src/lib/ucp-sdk/utils.ts
src/lib/ucp-sdk/components/Text.tsx
src/lib/ucp-sdk/hooks/useCarousel.ts
src/lib/ucp-sdk/hooks/useCart.ts
src/lib/ucp-sdk/hooks/useDeviceSize.ts
src/lib/ucp-sdk/hooks/useGallery.ts
src/lib/ucp-sdk/hooks/useLeadForm.ts
src/lib/ucp-sdk/hooks/useNavigationTree.ts
src/lib/ucp-sdk/hooks/usePricingForm.ts
src/lib/ucp-sdk/hooks/useScrollObserver.ts
src/lib/ucp-sdk/hooks/useShopOrderForm.ts
src/pages/ClientLandingPage.tsx
src/pages/ContactUsPage.tsx
src/pages/HomePage.tsx
src/pages/TalentLandingPage.tsx
src/pages/VoiceOverLandingPage.tsx
src/pages/features/FeatureEcommerce.tsx
src/pages/features/FeaturePortfolioBuilder.tsx
src/pages/features/FeatureThemeStudio.tsx
src/pages/features/FeatureWallet.tsx
src/store/useBuilderStore.ts
src/themes/registry.ts
src/themes/types.ts
src/themes/cinematic/index.tsx
src/themes/cinematic/Header.tsx
src/themes/cinematic/ImageSlider.tsx
src/themes/cinematic/ServicesShowcase.tsx
src/themes/cinematic/VideoSlider.tsx
src/themes/cupertino/index.ts
src/themes/cupertino/About.tsx
src/themes/cupertino/Contact.tsx
src/themes/cupertino/Gallery.tsx
src/themes/cupertino/Header.tsx
src/themes/cupertino/Hero.tsx
src/themes/cupertino/LeadForm.tsx
src/themes/cupertino/Map.tsx
src/themes/cupertino/Pricing.tsx
src/themes/cupertino/ProductLayout.tsx
src/themes/cupertino/Shop.tsx
src/themes/cupertino/Team.tsx
src/themes/modern/index.tsx
src/themes/modern/About.tsx
src/themes/modern/CheckoutLayout.tsx
src/themes/modern/Contact.tsx
src/themes/modern/DynamicStore.tsx
src/themes/modern/Gallery.tsx
src/themes/modern/Header.tsx
src/themes/modern/Hero.tsx
src/themes/modern/Html.tsx
src/themes/modern/ImageSlider.tsx
src/themes/modern/LeadForm.tsx
src/themes/modern/LoginLayout.tsx
src/themes/modern/Map.tsx
src/themes/modern/Pricing.tsx
src/themes/modern/ProductLayout.tsx
src/themes/modern/Reviews.tsx
src/themes/modern/ServicesShowcase.tsx
src/themes/modern/Shop.tsx
src/themes/modern/ShopLayout.tsx
src/themes/modern/Team.tsx
src/themes/modern/ThankYouLayout.tsx
src/themes/modern/VideoSlider.tsx
src/themes/modern/components/ModernCartDrawer.tsx
src/themes/modern/components/ModernProductModal.tsx
src/themes/modern-bright/index.tsx
src/themes/modern-bright/About.tsx
src/themes/modern-bright/CheckoutLayout.tsx
src/themes/modern-bright/Contact.tsx
src/themes/modern-bright/DynamicStore.tsx
src/themes/modern-bright/Gallery.tsx
src/themes/modern-bright/Header.tsx
src/themes/modern-bright/Hero.tsx
src/themes/modern-bright/Html.tsx
src/themes/modern-bright/ImageSlider.tsx
src/themes/modern-bright/LeadForm.tsx
src/themes/modern-bright/Map.tsx
src/themes/modern-bright/Pricing.tsx
src/themes/modern-bright/ProductLayout.tsx
src/themes/modern-bright/Reviews.tsx
src/themes/modern-bright/ServicesShowcase.tsx
src/themes/modern-bright/Shop.tsx
src/themes/modern-bright/ShopLayout.tsx
src/themes/modern-bright/Team.tsx
src/themes/modern-bright/ThankYouLayout.tsx
src/themes/modern-bright/VideoSlider.tsx
src/themes/modern-bright/utils.ts
src/themes/modern-bright/components/ModernCartDrawer.tsx
src/themes/modern-bright/components/ModernProductModal.tsx
```

## Supabase Edge Functions

All active entry points are under `supabase/functions/<name>/index.ts`; per-function `deno.json` and `.npmrc` files define local Deno/import configuration where present. `supabase/config.toml` is the local function/JWT configuration. Shared code is in `supabase/functions/_shared/`.

| Function | Responsibility |
| --- | --- |
| `abandoned-cart-recovery` | Abandoned store-cart recovery workflow |
| `admin-chat` | Admin AI assistant backend |
| `admin-delete-account` | Privileged account cleanup |
| `auto-topup-charge` | Actor Platform Credit auto-top-up |
| `charge-saved-card` | Shared saved-card charge used by Platform Credit auto-top-up |
| `clean-audio` | Actor audio cleanup job |
| `compile-theme` | Transpile marketplace theme source and publish a compiled bundle |
| `confirm-order-payment` | Verify Stripe payment and advance a talent order |
| `create-bank-transfer-request` | Create a Platform Credit bank-transfer attempt |
| `create-checkout-session` | Portfolio subscription checkout session |
| `create-crypto-invoice` | NOWPayments Platform Credit invoice |
| `create-order` | Validate and create a talent-marketplace order |
| `create-payment-intent` | Shared Stripe intent setup for store checkout, talent orders, and credit top-ups |
| `create-portal-session` | Stripe customer portal/setup session actions |
| `create-subscription` | Stripe subscription creation path |
| `crypto-webhook` | Verify/process NOWPayments callbacks |
| `get-clients-with-emails` | Admin/client lookup helper |
| `manage-domains` | Add/check/remove portfolio custom-domain configuration |
| `poll-audo-status` | Poll audio-processing status |
| `send-pending-notifications` | Deliver queued order notifications |
| `store-ai-bot` | Signed store-chat webhook, FAQ/AI and usage metering |
| `store-realtime-session` | Mint/reconcile metered realtime voice sessions |
| `store-voice-agent-transfer` | Transfer store voice session to human support |
| `store-voice-note` | Store/process voice-note workflow |
| `store-voice-transcribe` | Transcribe visitor voice messages |
| `stripe-billing` | Platform subscription/payment-method actions |
| `stripe-connect` | Stripe Connect account onboarding |
| `stripe-connect-webhook` | Connected-account order/payment events |
| `stripe-standard-oauth` | Exchange standard Stripe OAuth callback |
| `stripe-webhook` | Platform account billing/payment callbacks |
| `toggle-actor-status` | Admin actor activation/suspension operation |

`create-payment-intent/index copy.ts` is a second source file in the function folder but is not the configured entry point; `supabase/config.toml` points to `index.ts`. Treat it as an archival copy until its ownership/removal is resolved. The function catalog is based on source names/imports and configured entry points, not remote deployment status.

## Shared Supabase Helpers

- `_shared/actorAuth.ts`: validate actor identity for actor-scoped function requests.
- `_shared/billingConfig.ts`: billing IDs, price lookup/validation and credit purchase validation.
- `_shared/cors.ts`: shared CORS response headers.
- `_shared/stripeCustomer.ts`: actor Stripe customer lookup/creation.

## Migration Inventory

Migrations are incremental. This directory is not a complete database baseline, and the local latest migration does not prove remote application.

| Migration | Main concern |
| --- | --- |
| `20260902000000_account_deletion.sql` | Account-deletion audit/cleanup; includes retained legacy domain-sale tables |
| `20260903000000_marketplace_settings.sql` | Marketplace service allowlist settings |
| `20260903010000_actor_services.sql` | Actor service listings base schema |
| `20260903020000_marketplace_service_listings.sql` | Listing status, media and offer fields |
| `20260906000000_marketplace_read_policies.sql` | Marketplace read/RLS policies |
| `20260907000000_store_chat_schema.sql` | Store visitor conversations/messages |
| `20260908000000_store_ai_bot_webhook.sql` | pg_net/trigger wiring for AI chat webhook |
| `20260908010000_store_ai_bot_reliability.sql` | Idempotent AI message-processing state |
| `20260909000000_fix_store_ai_bot_trigger.sql` | Corrected store AI notification trigger |
| `20260909010000_store_chat_rich_messages.sql` | Store message types and metadata |
| `20260911000000_billing_credits_hardening.sql` | Stripe event idempotency, chargebacks and atomic credit deduction |
| `20260912000000_wallet_transactions_stripe_columns.sql` | Stripe correlation fields on wallet ledger |
| `20260912010000_actor_stripe_customer.sql` | Platform Stripe customer identity on actors |
| `20260912020000_billing_webhook_reliability.sql` | Retry-safe webhook processing state |
| `20260912030000_enterprise_billing_ledger.sql` | Provider-neutral billing attempts/ledger |
| `20260912040000_secure_credit_subscriptions.sql` | Subscription/credit RLS and checked RPCs |
| `20260912050000_usage_metering.sql` | Usage ledger and atomic credit charging |
| `20260912060000_store_payment_reconciliation.sql` | Separate Stripe Connect store-order ledger |
| `20260912070000_billing_reconciliation_queue.sql` | Operator reconciliation view |
| `20260915000000_bot_plus_voice_minute_pricing.sql` | Metered live-voice product/rate |
| `20260915010000_billing_usage_reversal.sql` | Reversal for failed/overcharged usage |
| `20260926000000_fractional_voice_billing.sql` | Fractional-credit/per-second voice accounting |
| `20260926010000_auto_topup_settings.sql` | Actor auto-top-up preferences |
| `20260926020000_billing_prices_table.sql` | Database-backed subscription-price catalog/RPCs |
| `20260926030001_subscriptions_actor_based.sql` | Stripe subscription metadata and actor helper RPCs |
| `20260926030002_fix_subscriptions_schema.sql` | Ensure subscription columns exist |
| `20260926030003_add_subscriptions_unique_portfolio.sql` | Unique portfolio subscription index |
| `20260926030004_allow_null_stripe_subscription_id.sql` | Allow credit-funded subscriptions without Stripe ID |
| `20260926030005_allow_null_stripe_price_id.sql` | Allow credit-funded subscriptions without Stripe price |
| `20260926030006_allow_null_billing_columns.sql` | Allow Stripe-only fields to be null for credit plans |
| `20260926030007_fix_subscriptions_rls.sql` | Repair actor-user subscription read policy |

## Agent, CI, and Editor Resources

- **Copilot/agent design resources:** `.github/prompts/brand/`, `design/`, `design-system/`, `slides/`, `banner-design/`, `ui-styling/`, and `ui-ux-pro-max/`. These contain `SKILL.md`/prompt instructions plus reference data, templates, and helper scripts. `design/` routes across logo/CIP/icon/social/banner/slide materials; the other folders provide focused brand, token, UI, slide, banner, and UI/UX guidance.
- **Focused engineering skills:** `.github/skills/frontend-design/`, `react-best-practices/` (rule files plus `AGENTS.md`), and `web-design-guidelines/` (local rule snapshot).
- **GitHub Actions:** `.github/workflows/sync-to-gcs.yml` syncs the repository to a GCS bucket on pushes to `master`; it is not a lint/build/test workflow.
- **Editor-specific files:** `.vscode/settings.json` enables Deno for `supabase/functions`; `.claude/settings.local.json` is local tool-permission configuration and should not be mistaken for shared project architecture.
- **External source references:** eight submodules in `resources/reference-repos/`; see `docs/DEVELOPMENT_RESOURCES.md` for exact repositories, pinned commits and licenses.

### Agent Resource Directory Map

- `.github/prompts/banner-design/`: `SKILL.md` and banner sizing/style reference.
- `.github/prompts/brand/`: skill, brand guideline/reference docs, starter template, color/context/asset scripts, and a script test.
- `.github/prompts/design/`: unified design skill, CIP/icon/logo data, design/logo/CIP/social/slide references, and CIP/icon/logo generators/search scripts.
- `.github/prompts/design-system/`: token/component/slide skill, CSV design data, token references, token/slide generators and validators, tests, and starter token template.
- `.github/prompts/slides/`: slide skill and five copy/layout/template/strategy references.
- `.github/prompts/ui-styling/`: licensed UI skill, Radix/shadcn and Tailwind references, helper scripts, requirements, and tests.
- `.github/prompts/ui-ux-pro-max/`: Copilot prompt, license, design/UX CSV+JSON data, per-stack datasets, search/compiler scripts, and test fixtures/suite.
- `.github/skills/frontend-design/`: skill and license.
- `.github/skills/react-best-practices/`: skill, guide/metadata, agent instructions, template/section docs, and React rule files under `rules/`.
- `.github/skills/web-design-guidelines/`: skill, license, and checked-in guideline snapshot under `references/`.
- `.github/workflows/sync-to-gcs.yml`: single workflow; the workflow syncs repository contents to GCS, not application build/tests.

All leaf paths were included in the 255-file tree inventory; these directory summaries record their roles without duplicating the large reference-data file list. Use `find .github -type f ! -path '*/.git/*' ! -path '*/__pycache__/*' ! -name '*.pyc' | sort` to print the current authored-file list.

## Root Tooling and Plans

- `package.json`/`package-lock.json`: Vite/React dependencies; scripts are `dev`, `build`, `lint`, and `preview`; no root `test` script.
- Vite/TypeScript/CSS: `vite.config.ts`, `tsconfig*.json`, `tailwind.config.js`, `postcss.config.js`, `eslint.config.js`, `components.json`, `index.html`, `vercel.json`.
- Export checks: `check_exports.cjs` verifies that files explicitly referenced by feature barrels exist and passes in the current tree. `check_all_exports.cjs` enforces a stronger rule that every `.ts`/`.tsx` inside a feature be re-exported; it currently reports 31 files, including direct-route imports, internal types/helpers, and backup files. These are not missing source files or build failures; decide whether the project actually requires every internal file to be part of the barrel API before treating this script as a gate. Both scripts are standalone, not package scripts.
- `convert_text.cjs` and `convert_theme.cjs` contain a hard-coded `/workspaces/voice/...` directory; they are legacy utilities and should not be run for this repository without correcting and reviewing their target.
- `README.md`, `PROJECT_GUIDE.md`, `BILLING_GUIDE.md`, `ECOMMERCE_FILES_ROLES.md`, `ECOMMERCE_LOGIN_PLAN.md`, `ECOMMERCE_PLAN.md`, `Documentation/FEATURES.md`, and `docs/` are the documentation set. Canonical current maps are `docs/PROJECT_ARCHITECTURE.md`, `docs/FEATURES.md`, `docs/features/*.md`, `docs/BILLING_OPERATIONS.md`, and `docs/DEVELOPMENT_RESOURCES.md`; older plans are retained historical notes.

## Known Gaps Found During Inventory

- Domain-sale marketplace UI/admin pages and the domain-specific payment-intent branch have been removed. Existing `store_domains`/`store_orders` tables and their account-deletion cleanup reference are retained as legacy data; the separate portfolio custom-domain workflow remains active.
- `src/features/portfolio-builder/components/SectionEditor-backup.tsx` and the payment-intent `index copy.ts` are backup/duplicate sources, not normal route/function entry points.
- The custom-domain customer dashboard route mounts `CustomerDashboardLayout` without a `:slug`, though the layout consumes it.
- Live and preview theme palettes explicitly cover only `modern` and `cinematic`; `modern_bright`/`cupertino` currently fall back to Modern values.
- The `compile-theme` function uses the service-role client, is configured with `verify_jwt=false`, and does not validate caller/admin authorization in its source. Theme compilation/preview executes user code through `new Function`; import restrictions do not create a sandbox. See `docs/features/theme-studio.md`.
- Billing pages/functions/migrations exist locally, but the route has both `create-checkout-session` and `stripe-billing` calls while a separate `create-subscription` function exists. Remote migration/deployment and end-to-end payment status are unknown; see `docs/BILLING_OPERATIONS.md`.
- Customer store login and global actor/client auth are distinct identities/data flows (`pro_customers` per portfolio vs `actors`/`clients` global profiles).
- No test script is declared in the root `package.json`; the two export checks and prompt-specific tests are separate tools.

## Verification Snapshot

Checks run on 2026-10-13 against this workspace:

- `npm run build`: passes; Vite transformed 4,805 modules and completed in about 30 seconds. It emits existing Tailwind arbitrary-value ambiguity warnings, a PostCSS `from` warning, a Browserslist database freshness warning, and the configured large-chunk warning.
- `npx eslint . --format json` (with `resources/reference-repos/**` excluded): scans 335 project/config/prompt files and currently reports 5,545 errors and 54 warnings after the domain feature removal. This is not a clean lint baseline; the remaining issues are pre-existing source/prompt findings outside this removal. Use the filtered report to triage before treating lint as a release gate.
- `node check_exports.cjs`: passes (`All exported files exist.`).
- `node check_all_exports.cjs`: fails its every-file-must-be-barrel-exported rule for 31 feature files; see Root Tooling for why this does not mean those files are missing or unreachable.
- Feature path comparison: every file under each of the seven active `src/features/*` directories appears in that feature's developer guide. Shared-source path comparison matches all 166 non-feature `src/` files. Function/migration path comparison matches all 31 current entry points and all 31 SQL files.
- `git diff --check`: passes for edited project files.
