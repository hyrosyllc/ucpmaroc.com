# 📚 UCP Maroc - E-Commerce & Portfolio Files Reference Guide

This document serves as a "cheat sheet" for the UCP Maroc codebase. Whenever you are lost or need to know where a specific piece of logic lives, use the tables below to find the correct file.

## 🏗️ 1. Core Architecture & Layouts
| File Name | Role & Description |
| :--- | :--- |
| **`App.tsx`** | The **Main Router**. Handles the environment-aware routing (deciding if the user is visiting via a custom domain `shop.com` or the platform domain `ucp.com/pro/shop`). |
| **`PortfolioLayout.tsx`** | The **Live Site Wrapper**. Fetches the portfolio data for public visitors, dynamically injects the Light/Dark Mode CSS variables (`THEME_PALETTES`), and renders the Header and Footer. |
| **`PortfolioHome.tsx`** | The **Section Renderer** & **Fallback ThemeWrapper**. Iterates over the `sections` array and renders the specific blocks (Hero, About, etc.). Also provides a fallback wrapper for the Builder Preview. |
| **`DynamicPage.tsx`** | The **Custom Pages Controller**. Renders additional pages created by the user (e.g., `/pro/username/tour-dates`) by fetching and iterating through that specific page's sections. |
| **`ActorDashboardLayout.tsx`** | The **Admin App Shell**. Contains the sidebar navigation, top bar (wallet balance, profile dropdown), and handles the multi-tenant `selectedSiteId` context for the dashboard. |
| **`api/edge-seo.ts`** | The **Vercel Edge Function**. Intercepts public requests to generate dynamic `<meta>` SEO tags for OpenGraph (Twitter/Facebook embeds) based on the custom domain or product slug. |

---

## 🛠️ 2. The Portfolio Builder (CMS Admin)
| File Name | Role & Description |
| :--- | :--- |
| **`PortfolioBuilderPage.tsx`** | The **Main Builder Interface**. Manages the drag-and-drop section reordering, global settings (Design/Store tabs), and controls the scaling iframe preview. |
| **`SectionEditor.tsx`** | The **Sidebar Settings Panel**. The massive component where users edit text, upload images, manage variants, and configure specific blocks. |
| **`BuilderPreview.tsx`** | The **Iframe Sandbox**. The isolated environment where the live site preview is rendered. Listens to `postMessage` events from the builder to update in real-time. |
| **`FormManager.tsx`** | The **Form Builder Modal**. Allows users to create, configure, and save reusable Contact and Checkout forms. |

---

## 🛒 3. E-Commerce Admin Dashboard
| File Name | Role & Description |
| :--- | :--- |
| **`ProductsPage.tsx`** | **Product Management**. Creates/edits products, variants, tracks inventory, handles digital file uploads, and configures SEO. |
| **`OrdersPage.tsx`** | **Order List**. Displays all customer orders, calculates gross revenue, and handles bulk status updates (Pending, Completed, etc.) and CSV exports. |
| **`ProOrderDetailPage.tsx`** | **Order Details**. Shows fulfillment details for a single order, real-time customer chat, internal notes, and digital delivery statuses. |
| **`LeadsPage.tsx`** | **CRM Inbox**. Displays contact form submissions and pricing inquiries. Parses custom form data and allows for custom lead tagging. |
| **`AnalyticsPage.tsx`** | **Store Insights**. Renders the Recharts graphs for page views, cart clicks, conversions, and tracks the live activity feed. |
| **`PaymentsPage.tsx`** | **Payment Configurator**. Where users connect Stripe (Express/Standard), configure Crypto wallets, or set up Manual Bank Transfers and COD. |
| **`ShippingRatesPage.tsx`** | **Shipping Configurator**. Sets up flat rates, weight-based rules, or free shipping thresholds for specific countries/regions. |
| **`MarketsPage.tsx`** | **Market Configurator**. Toggles which countries the store is allowed to sell to. |
| **`CollectionsPage.tsx`** | **Category Management**. Creates groupings for products (e.g., "Summer Sale", "E-Books"). |
| **`FormsPage.tsx`** | **Form Directory**. Admin page to view, duplicate, or delete all saved checkout/contact forms. |
| **`SettingsPage.tsx`** | **Site Identity & Billing**. Manages custom domain connections, site names, and handles Stripe subscription upgrades / wallet coin top-ups. |

---

## 🛍️ 4. Storefront Controllers (Public Logic)
| File Name | Role & Description |
| :--- | :--- |
| **`PublicShopPage.tsx`** | **Shop Controller**. Fetches active products and collections, handles search/filtering logic, and passes data to the Theme's View. |
| **`PublicProductPage.tsx`** | **Product Controller**. Fetches a single product's details, dynamic checkout forms, and related products, then passes them to the Theme's View. |
| **`PublicCheckoutPage.tsx`** | **Checkout Engine**. Calculates shipping, validates discount coupons, extracts form details, and mounts the Stripe Payment Elements. |
| **`PublicThankYouPage.tsx`** | **Receipt & Download Hub**. The post-purchase success page. Acts as a digital locker to instantly deliver secure file downloads for digital products. |
| **`CustomerLoginPage.tsx`** | **Portal Auth**. Handles passwordless OTP (One-Time Password) magic link logins for customers. |
| **`CustomerOrdersPage.tsx`** | **Portal History**. Lists past orders for an authenticated customer in their dedicated dashboard. |
| **`useCartStore.ts`** | **Zustand State**. The global memory for the shopping cart (items, totals, active coupon, open/close state). |

---

## 🖌️ 5. Storefront Views (The "Modern" Theme Components)
| File Name | Role & Description |
| :--- | :--- |
| **`index.tsx` (Theme Registry)**| **The Dictionary**. Maps the components below to their string names and defines the configuration schemas (the toggles seen in the Section Editor). |
| **`ShopLayout.tsx`** | **Shop View**. The visual layout for the product grid and sidebar collections/filters. |
| **`ProductLayout.tsx`** | **Product View**. The visual layout for a single product, including the image gallery, variant capsules, accordions, and reviews. |
| **`ModernCartDrawer.tsx`** | **Cart UI**. The sliding panel that shows added items, handles quantity updates, and accepts promo codes. |
| **`CheckoutLayout.tsx` & `ThankYouLayout.tsx`** | **Wrapper Views**. Clean, distraction-free wrappers used during the checkout and post-purchase phases. |
| **`DynamicStore.tsx`** | **Inline Store Block**. The drag-and-drop store section (Grid, Bento, Spotlight) that can be placed on any page. |
| **`LeadForm.tsx` & `Contact.tsx`** | **Form Blocks**. Renders the contact forms and social links. |
| **`Pricing.tsx`** | **Rate Cards**. Renders SaaS-style pricing tiers or service rate lists. |
| **`Hero.tsx`** | **Top Banner**. The main landing section with typewriter effects and video backgrounds. |
| **`Header.tsx`** | **Navigation**. Renders the logo, desktop links, mega-menus, and mobile sliding menu. |
| **`Html.tsx`** | **Code Sandbox**. An isolated iframe that executes the user's custom HTML/Tailwind/JS code safely. |
| **`Gallery.tsx`, `ImageSlider.tsx`, `VideoSlider.tsx`** | **Media Blocks**. Render visual masonry grids, horizontal carousels, and cinematic video modals. |
| **`Reviews.tsx`** | **Testimonials**. Displays approved customer reviews and allows visitors to submit new ones. |
| **`Team.tsx` & `About.tsx`** | **Bio Blocks**. Renders team grids or personal biographies with statistics. |
| **`Map.tsx` & `ServicesShowcase.tsx`** | **Location & Demos**. Renders Google Maps embeds and audio/video/script demo showcases. |