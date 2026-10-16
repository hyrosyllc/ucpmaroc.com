# UCP Maroc: File Reference (Portfolio, Ecommerce, Booking, Themes, Studio)

A map of "where does this live and what does it do". Paths are relative to the repo root. **NEW** marks files added during the 2026-10 work; **CHANGED** marks existing files that were materially modified. For deeper explanations see [docs/PROJECT_ARCHITECTURE.md](docs/PROJECT_ARCHITECTURE.md), [docs/REPOSITORY_CATALOG.md](docs/REPOSITORY_CATALOG.md), [docs/PORTFOLIO_ECOMMERCE_THEMES.md](docs/PORTFOLIO_ECOMMERCE_THEMES.md), [docs/features/](docs/features/) and the roadmap in [docs/WORK_PLAN.md](docs/WORK_PLAN.md).

How the pieces connect, in one paragraph: a **site** is a row in `portfolios` with a list of **sections** (`portfolios.sections`, custom pages in `pro_pages.sections`). Each section has a **type**, content (`data`) and design controls (`settings`). A **theme** supplies the React component for each section type. Built-in themes live in `src/themes/`; custom themes are written in **Theme Studio**, approved by an admin, compiled on the server and loaded at runtime. **Ecommerce** and **booking** attach to the same site through its portfolio id. Payments and anything sensitive run in **Supabase Edge Functions**.

---

## 1. App shell, routing, layouts

| File | Role |
| :--- | :--- |
| `src/main.tsx`, `src/App.tsx` **CHANGED** | App entry and the main router (platform domain vs custom domain, dashboards, public site routes). Now includes the public `/pro/:slug/book` page and `/dashboard/bookings`. |
| `src/layouts/ActorDashboardLayout.tsx` **CHANGED** | Seller dashboard shell: sidebar, top bar, multi-site selector. Sidebar now has "Bookings". |
| `src/layouts/AdminDashboardLayout.tsx`, `CustomerDashboardLayout.tsx` | Admin shell and the shop-customer portal shell. |
| `src/features/portfolio-builder/layouts/PortfolioLayout.tsx` **CHANGED** | Wrapper of every public site: loads the portfolio, applies colour/font variables, renders the theme's header, cart drawer, chat widget. Uses `useActiveTheme` so custom themes work. |
| `src/index.css`, `tailwind.config.js`, `components.json` | Global styles, Tailwind config, shadcn config. |
| `api/edge-seo.ts` | Vercel edge function that builds SEO/OpenGraph tags for public pages. |
| `vercel.json`, `vite.config.ts`, `tsconfig*.json` **CHANGED** | Hosting rewrites, CSP report-only and nosniff headers, build config, aliases (`@`, `@ucp/sdk`). `tsconfig.app.json` now excludes the backup editor and test files. |
| `package.json` **CHANGED** | Added the `typecheck` script (`vite build` does not type-check). |
| `.env.example` **CHANGED** | Names of every key you must provide (browser keys and Edge Function secrets). Never commit real values; `.env.local` is git-ignored. |

## 2. Portfolio Builder (site editor)

| File | Role |
| :--- | :--- |
| `pages/PortfolioBuilderPage.tsx` **CHANGED** | Main builder UI: section list, drag reorder, theme browser, settings, iframe preview. Section palette now comes from the section registry. |
| `components/SectionEditor.tsx` **CHANGED** | Right-hand editor for one section. Hand-written forms for the original types; schema-driven forms for newer types; Design tab shows the theme's schema plus the shared Layout controls. Reads custom-theme schemas via `useActiveTheme`. |
| `components/SectionEditor-backup.tsx` | Old copy of the editor. Contains nothing the current editor lacks and has syntax errors; excluded from type-checking. Candidate for deletion. |
| `pages/BuilderPreview.tsx` **CHANGED** | The page inside the builder's preview iframe. Renders sections with the active theme and applies shared layout controls; talks to the builder through `postMessage`. |
| `pages/PortfolioHome.tsx` **CHANGED** | Live home page: renders the site's sections in order (header handled by the layout). Also exports the page loader. |
| `pages/DynamicPage.tsx` **CHANGED** | Renders custom pages (`/pro/:slug/:page`) from `pro_pages`. |
| `pages/SettingsPage.tsx`, `pages/Billing*.tsx` | Site identity/domain settings and the billing screens (subscriptions, payment methods, usage). See `docs/BILLING_OPERATIONS.md` for which are routed. |
| `components/FormManager.tsx` | Create and edit reusable contact/checkout forms. |
| `components/PortfolioMediaManager.tsx` | Media library picker/uploader used by editors. |
| `components/ProductManagerModal.tsx`, `TopUpModal.tsx` | Pick store products for sections; buy platform credit. |
| `hooks/useActiveTheme.ts` **NEW** | Resolves a theme id to a component map: a built-in theme, or an approved marketplace theme whose compiled bundle is fetched, evaluated and cached. Missing sections fall back to Modern. |
| `hooks/usePrecompiledTheme.ts`, `useDynamicThemeCompiler.ts` **CHANGED** | Thin wrappers over the shared theme runtime (kept for compatibility). |
| `hooks/usePortfolio.ts` | Loads a public portfolio and its owner profile. |
| `types/portfolio.ts` **CHANGED** | `SectionType` union, `PortfolioSection`, default starter sections. |
| `types/sections.ts`, `types/portfolio-themes.ts` | Typed data contracts for the original sections; older template list. |
| `config/templates.ts`, `config/html-templates.ts` | Starter site templates and the Custom HTML template library. |
| `index.ts` | Public exports of the feature. |

### Section system (shared by every theme) **NEW**

| File | Role |
| :--- | :--- |
| `src/features/portfolio-builder/sections/registry.ts` | The single definition of every section type: label, theme component name, category, plan module, default content and (for newer types) the editable fields. Palette, component map and defaults all derive from it. |
| `sections/schema.ts` | The field-definition format (`text`, `textarea`, `richtext`, `number`, `toggle`, `select`, `color`, `slider`, `image`, `link`, `repeater`). |
| `sections/SchemaFields.tsx` | Generic form renderer for those fields, including reorderable repeaters and the media-library picker. Used by the builder and by Theme Studio. |
| `sections/frame.tsx` | Layout controls every section gets (spacing, background, width, hide per device, entrance animation, anchor) and the helpers that apply them on the live site, preview and Studio. |

## 3. Themes

| File | Role |
| :--- | :--- |
| `src/themes/registry.ts` **CHANGED** | Lists built-in themes and resolves a section type to a component. A theme missing a component falls back to Modern. |
| `src/themes/types.ts` **CHANGED** | The contract a theme must satisfy. |
| `src/themes/modern/` | Reference theme written as plain React (no SDK). Section files: `Header`, `Hero`, `About`, `Gallery`, `ImageSlider`, `VideoSlider`, `Team`, `Map`, `Pricing`, `Contact`, `LeadForm`, `Reviews`, `ServicesShowcase`, `Shop`, `DynamicStore`, `Html`. |
| `src/themes/modern/` **NEW files** | `Stats` (animated counters), `Faq`, `Features`, `Steps`, `Cta`, `RichText`, `LogoCloud`, `Testimonials`, `Booking`, and `components/SectionHeading`. |
| `src/themes/modern/` commerce views | `ShopLayout`, `ProductLayout`, `CheckoutLayout`, `ThankYouLayout`, `LoginLayout`, and `components/ModernCartDrawer`, `ModernProductModal`: the shop, product, checkout, receipt and login screens the storefront controllers hand data to. |
| `src/themes/modern/index.tsx` **CHANGED** | Registers all Modern components and their design schemas. |
| `src/themes/modern-bright/` | Light variant: own versions of most sections and commerce views; reuses Modern's `Stats` and falls back to Modern for newer sections. `utils.ts` holds its helpers. |
| `src/themes/cinematic/` | Dark theme: overrides `Header`, `ImageSlider`, `VideoSlider`, `ServicesShowcase`; everything else inherits Modern. |
| `src/themes/cupertino/` | Apple-style theme built entirely on the SDK (testbed for custom themes). Original files: `Header`, `Hero`, `About`, `Gallery`, `Contact`, `Team`, `Map`, `Pricing`, `LeadForm`, `Shop`, plus `ProductLayout` (presentational commerce view). |
| `src/themes/cupertino/` **NEW files** | `Faq`, `Stats`, `Booking`, `Features`, `Steps`, `Cta`, `RichText`, `LogoCloud`, `Testimonials`, `ImageSlider`, `VideoSlider`, `Html`, `Reviews`, `ServicesShowcase`, `DynamicStore`, and the shared helper `SectionTitle`. Every section type now exists here. |
| `src/themes/cupertino/index.ts` **CHANGED** | Registers every Cupertino section and schema. |

## 4. UCP SDK (what custom themes and Cupertino build on)

`src/lib/ucp-sdk/index.ts` **CHANGED** exports one `UCP` object. The old `src/lib/ucp-sdk.tsx` was removed.

| File | Role |
| :--- | :--- |
| `components/Text.tsx` **CHANGED** | Inline-editable text in the builder; sanitised HTML on the live site. |
| `components/HtmlSandbox.tsx` **NEW** | Renders owner-written HTML in an isolated iframe (scripts stripped unless the owner enables JavaScript). |
| `hooks/useScrollObserver`, `useCart`, `useNavigationTree`, `useDeviceSize` | Header scroll state, cart count/drawer, computed menu tree, responsive helpers. |
| `hooks/useGallery`, `useCarousel`, `useLeadForm`, `usePricingForm`, `useShopOrderForm` | Gallery lightbox, scroll carousels, contact-form submit, pricing-plan actions, shop product modal and order form. |
| `hooks/useFaq`, `useCountUp`, `useSlider`, `useVideoGallery`, `useAccordion`, `useHeaderChrome` **NEW** | FAQ accordion + structured data, animated numbers, slideshows with autoplay, video lightbox, generic accordion, mobile menu/hide-on-scroll/announcements. |
| `hooks/useReviews`, `useServicesShowcase`, `useStoreProducts` **NEW** | Reviews and visitor submissions, talent services and demos, products for the store section plus card and spotlight behaviour. |
| (booking) `useBookingFlow`, `BookingPayment`, `formatPrice` **NEW** | Re-exported from `src/features/booking/` so themes get booking without owning its logic. |
| `types.d.ts` **CHANGED**, `ui.d.ts` | Typings Monaco loads in Theme Studio for autocompletion. |
| `utils.ts` | Small helpers (YouTube id parsing, etc.). |

## 5. Theme runtime (custom themes) **NEW**

`src/lib/theme-runtime/`: one module system for Studio preview, builder preview and the live site.

| File | Role |
| :--- | :--- |
| `loader.ts` | Evaluates a compiled bundle; supports `./` imports between theme files; one broken file does not break the rest. Pure and unit-tested. |
| `modules.ts` | The only external modules themes may import (React, SDK, `cn`, framer-motion, recharts, date-fns, confetti, `Link`, lucide icons, shadcn UI). |
| `schema.ts` | Accepts both schema formats themes use and normalises them. |
| `compile.ts` | Browser-side Babel compile (Studio) and file warnings. |
| `sectionTypes.ts` | Maps `Faq.tsx` to the `faq` section type and back via the registry. |
| `index.ts`, `theme-runtime.test.ts` | Public entry (`loadThemeBundle`) and the unit tests. |

## 6. Theme Studio and marketplace

| File | Role |
| :--- | :--- |
| `src/features/theme-studio/pages/ThemeStudioPage.tsx` **CHANGED** | The code editor: file explorer (create/rename/delete), Monaco, live preview, Design and Content test panels, submit for review. |
| `pages/StudioPreview.tsx` **CHANGED** | The preview iframe: loads the compiled files, renders one component or the test site's full page, reports errors and schemas to Studio. Same-origin, source-checked messages. |
| `pages/DeveloperHubPage.tsx` **CHANGED** | Creator Hub: list themes with status and rejection reasons, create themes, open Studio. |
| `src/features/admin-core/pages/AdminThemesPage.tsx` **CHANGED** | Admin review: automated checks, code viewer, approve (with acknowledgement of flagged patterns), reject with a reason. |
| `src/components/dashboard/SdkDocsModal.tsx` **CHANGED** | In-app SDK documentation, now listing the section hooks and multi-file rules. |
| `src/components/dashboard/InlineEdit.tsx` **CHANGED** | Editable text wrapper; posts edits to the parent window of the same origin only. |
| `supabase/functions/compile-theme/` **CHANGED** | Admin-only: validates imports and size, scans for risky patterns, compiles every file, uploads the bundle by content hash, approves or rejects; `backfill` action hashes older versions. |
| `supabase/migrations/20261016000000_theme_studio_hardening.sql` **NEW** | Stops developers writing bundles or approving themselves; keeps source private; exposes bundles through `marketplace_themes_public`. Not yet applied. |
| `supabase/migrations/20261017000000_theme_versions.sql` **NEW** | Immutable theme versions: snapshots per submission, submit and rollback functions, withdraw-on-edit, public pinned-version view. |
| `supabase/migrations/20261018000000_theme_version_hash_deprecation.sql` **NEW** | `bundle_hash` and deprecation columns, public `theme-bundles` storage bucket, `set_theme_version_deprecated`, rollback refuses deprecated versions. Not yet applied. |
| `src/features/portfolio-builder/components/ThemeVersionPin.tsx` **NEW** | Builder selector to follow the latest theme version or pin an approved one, with a deprecation warning. |
| `src/lib/theme-runtime/diff.ts` **NEW** | Line diff and per-file change status used by the admin review dialog. |
| `src/lib/theme-runtime/commerceViews.ts` **NEW** | Contract: which commerce views a custom theme may export (`ShopLayout`, `ProductLayout`, `LoginLayout`). |
| `src/features/ecommerce/components/CommerceView.tsx` **NEW** | Renders the theme's custom commerce view, else the built-in; falls back if the custom view crashes. Used by the shop, product and login pages. |
| `api/csp-report.ts` **NEW** | Receives CSP violation reports (report-only phase) and logs them. |
| `src/lib/ucp-sdk/hooks/useCartDrawer.ts` **NEW** | SDK hook for cart drawer views: items, quantity, coupon validation, totals, checkout routing. |
| `src/features/ecommerce/checkout/PublicCheckoutPage.tsx` **CHANGED** | Split in place: `useCheckoutController` (all logic), `PaymentSlot` (platform Stripe and order creation), `DefaultCheckoutView` (Modern look), and the page that dispatches to a theme's `CheckoutView`. |
| `src/features/ecommerce/checkout/PublicThankYouPage.tsx` **CHANGED** | Split in place: `useThankYouModel`, `DefaultThankYouView`, and the dispatching page (`ThankYouView`). |
| `src/themes/cupertino/{ShopLayout,ProductLayout,LoginLayout,CartDrawer,CheckoutView,ThankYouView}.tsx` **NEW/CHANGED** | Cupertino commerce views built only from allowed theme modules and the SDK; also Studio starters. |
| `src/features/theme-studio/pages/CommerceViewMock.tsx` **NEW** | Sample data hosts so Studio can preview each commerce view. |
| `sandbox.html`, `src/sandbox/main.tsx` **NEW** | Entry for the sandboxed (opaque-origin) Studio preview; no app shell, i18n or auth. |

## 7. Booking (appointments and Google Calendar) **NEW**

| File | Role |
| :--- | :--- |
| `src/features/booking/api.ts` | Typed calls to the booking functions and service queries; price formatting. |
| `useBookingFlow.ts` | The booking state machine (service, month calendar, slots in the visitor's time zone, form, payment hand-off). Shared by the widget and the SDK. |
| `BookingWidget.tsx` | The ready-made booking UI used by Modern's section and the public page; also used for rescheduling. |
| `BookingPayment.tsx` | Stripe card form for deposits or full payment on the seller's connected account. |
| `BookingPage.tsx` | Public `/pro/:slug/book` page; also handles customer "manage" links (cancel, reschedule). |
| `BookingsDashboardPage.tsx` | Seller dashboard: bookings list with actions, plus the tabs below. |
| `ServicesTab.tsx`, `AvailabilityTab.tsx`, `SettingsTab.tsx` | Services and pricing/deposits; weekly hours and days off; time zone, notice, Google Calendar connection and calendar choice. |
| `ics.ts` | Builds the "add to calendar" file. |
| `supabase/functions/booking-availability/` | Public: computes bookable slots. |
| `booking-create/` | Public: validates the slot, prevents double booking, creates the booking (and Stripe payment when required). |
| `booking-manage/` | Public (secret link): view, cancel or reschedule a booking. |
| `booking-owner-action/` | Seller: confirm, cancel, complete, no-show; removes the Google event and emails the customer. |
| `booking-reminders/` | Scheduled: releases expired payment holds and sends 24-hour reminders. |
| `google-calendar/` | Starts and finishes each seller's own Google connection; lists and selects calendars; disconnect. |
| `supabase/functions/_shared/bookingSlots.ts` (+ `.test.ts`) | Pure slot calculation (time zones, daylight saving, buffers); tests included. |
| `_shared/bookingData.ts`, `bookingFulfillment.ts`, `bookingToken.ts`, `googleCalendar.ts` | Loading booking context and sending email; post-confirmation steps (Google event, emails); secure per-booking links; Google OAuth, encryption of tokens, calendar API calls. |
| `supabase/migrations/20261015000000_booking_system.sql` | Tables, overlap guard, security rules, payment-confirmation function (applied). |

## 8. Ecommerce: seller dashboard (`src/features/ecommerce/pages/`)

| File | Role |
| :--- | :--- |
| `ProductsPage.tsx` | Products, variants, inventory, digital files, SEO. |
| `CollectionsPage.tsx` | Product groupings. |
| `OrdersPage.tsx`, `ProOrderDetailPage.tsx` | Order list with bulk status and export; single order fulfilment, notes, chat, digital delivery. |
| `CustomersPage.tsx` | Store customers. |
| `LeadsPage.tsx` | Contact and pricing-form submissions (CRM inbox). |
| `CouponsPage.tsx` | Discount codes. |
| `ShippingRatesPage.tsx`, `MarketsPage.tsx` | Shipping rules and the countries the store sells to. |
| `PaymentsPage.tsx`, `StripeCallbackPage.tsx` | Connect Stripe, crypto, bank transfer, cash on delivery; Stripe OAuth return. |
| `FormsPage.tsx` | Saved checkout/contact forms. |
| `ReviewsPage.tsx` | Approve or reject visitor reviews. |
| `AnalyticsPage.tsx` | Traffic, cart and conversion charts. |
| `store-inbox/StoreInboxPage.tsx`, `store-settings/StoreBotSettingsPage.tsx` | Visitor live chats; chat widget and AI bot settings. |

## 9. Ecommerce: storefront (public side)

| File | Role |
| :--- | :--- |
| `pages/PublicShopPage.tsx`, `PublicProductPage.tsx` | Controllers: fetch products/collections, handle filtering, pass data to the active theme's view. |
| `checkout/PublicCheckoutPage.tsx` **CHANGED** | Checkout engine: shipping, coupons, form data, payment. Now confirms card payments on the seller's Stripe account. |
| `checkout/StripeCheckoutForm.tsx`, `PublicThankYouPage.tsx` | Card form; receipt and secure digital downloads. |
| `pages/CustomerLoginPage.tsx`, `CustomerDashboardOverview.tsx`, `CustomerOrdersPage.tsx`, `CustomerOrderDetailPage.tsx`, `CustomerMessagesPage.tsx` | Customer portal: one-time-code login, order history and detail, messages. |
| `components/CartDrawerContainer.tsx`, `ProductModalContainer.tsx` | Mount the theme's cart drawer and product modal. |
| `components/store-chat/StorefrontChatWidget.tsx` | Visitor chat/voice widget. |
| `components/CreateSiteModal.tsx` | Create a new site from the builder. |
| `store/useCartStore.ts` | Cart state (items, totals, coupon, open/closed). |
| `product-layouts/types.ts` | Props contract between controllers and themed product/shop views. |
| `src/lib/stripeClient.ts` **NEW** | One Stripe.js instance per connected account (needed for direct charges). |

## 10. Supabase Edge Functions (existing)

| Function | Role |
| :--- | :--- |
| `create-payment-intent` **CHANGED** | Prices a store order on the server and creates the Stripe payment; now also returns the seller's account id. |
| `stripe-connect-webhook` **CHANGED** | Connected-account payment events: store orders and now booking payments (confirm, refund if the slot was lost). |
| `stripe-webhook`, `stripe-billing`, `create-checkout-session`, `create-subscription`, `create-portal-session`, `charge-saved-card`, `auto-topup-charge` | Platform billing, subscriptions, saved cards, credit top-ups. |
| `stripe-connect`, `stripe-standard-oauth` | Seller Stripe onboarding. |
| `create-crypto-invoice`, `crypto-webhook`, `create-bank-transfer-request` | Crypto and bank-transfer credit purchases. |
| `create-order`, `confirm-order-payment`, `send-pending-notifications` | Talent-marketplace orders and notifications. |
| `abandoned-cart-recovery` | Recovery emails for abandoned carts. |
| `store-ai-bot`, `store-realtime-session`, `store-voice-note`, `store-voice-transcribe`, `store-voice-agent-transfer` | Store chat AI, voice sessions and transcription. |
| `admin-chat`, `admin-delete-account` **CHANGED**, `toggle-actor-status`, `get-clients-with-emails` | Admin tools (delete-account CORS bug fixed). |
| `manage-domains` | Custom domain add/check/remove. |
| `clean-audio` **CHANGED**, `poll-audo-status` **CHANGED** | Talent audio cleanup (CORS bug fixed). |
| `_shared/actorAuth.ts`, `billingConfig.ts`, `cors.ts`, `stripeCustomer.ts` | Shared helpers: caller identity, billing ids, CORS headers, Stripe customer lookup. |
| `supabase/config.toml` **CHANGED** | Function settings (JWT required or not); registers the new booking and Google functions and secures `compile-theme`. |

## 11. Other shared code

| File | Role |
| :--- | :--- |
| `src/supabaseClient.ts` | Supabase browser client. |
| `src/lib/utils.ts`, `countries.ts`, `analytics.ts` | Class-name helper, country list, event tracking. |
| `src/context/SubscriptionContext.tsx`, `src/config/plans.ts` | Plan limits and entitlements (section-type gating is defined but not enforced yet). |
| `src/store/useBuilderStore.ts` | Builder state: sections, theme config, undo/redo, unsaved changes. |
| `src/components/ui/` | shadcn UI primitives (also exposed to custom themes). |

## 12. Documentation and plan

| File | Role |
| :--- | :--- |
| `docs/WORK_PLAN.md` **CHANGED** | The roadmap: phases, what is done, what remains, decisions, risks. |
| `docs/features/theme-studio.md` **CHANGED** | How Studio, the runtime and review work. |
| `docs/PORTFOLIO_ECOMMERCE_THEMES.md` **CHANGED**, `docs/REPOSITORY_CATALOG.md`, `docs/PROJECT_ARCHITECTURE.md`, `docs/FEATURES.md`, `docs/features/*.md`, `docs/BILLING_OPERATIONS.md` | Architecture and per-feature guides. |
