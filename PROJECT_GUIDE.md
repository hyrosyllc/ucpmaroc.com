# 🚀 UCP Maroc - Platform Feature Guide

Welcome to the definitive guide for the **UCP Maroc Platform**. This document outlines the core modules, capabilities, and technical achievements of the application. 

At its core, the platform is a **Multi-Tenant Portfolio Builder & E-Commerce CRM** tailored for creators, actors, and agencies. It allows users to design stunning websites, sell products or services, capture leads, and analyze traffic—all from a single, centralized dashboard.

---

## 📑 Table of Contents
- [🌟 1. The Portfolio Builder (CMS)](#-1-the-portfolio-builder-cms)
- [🛍️ 2. Advanced E-Commerce Engine](#-2-advanced-e-commerce-engine)
- [💳 3. Global Payments Infrastructure](#-3-global-payments-infrastructure)
- [📬 4. CRM & Order Management](#-4-crm--order-management)
- [📊 5. Analytics & Insights](#-5-analytics--insights)
- [⚙️ 6. System Architecture & Context](#️-6-system-architecture--context)
- [🛠️ Technical Stack Summary](#️-technical-stack-summary)

---

## 🌟 1. The Portfolio Builder (CMS)
The heart of the application is a deeply interactive, real-time website builder featuring a live iframe canvas, drag-and-drop mechanics, and a 3-tab architecture (Content, Design, Store).

### 🎨 Live Canvas & Multi-Device Preview
- **Perfect Scaling Engine:** Real-time iframe preview that math-perfectly scales to fit the viewport.
- **Device Toggling:** Instantly switch between Desktop, Tablet, and Mobile preview modes.
- **Two-Way Sync:** Changes in the builder instantly reflect in the iframe using cross-window `postMessage` architecture.

### 🧱 Rich Section Library (The Content Tab)
Users can drag, drop, and configure various functional blocks using `@dnd-kit`:
- **Dynamic Store:** Automatically grids products with 'Bento', 'Carousel', or 'Spotlight' layouts.
- **Lead & Checkout Forms:** Map custom forms directly into the page to capture customer data.
- **Hero & Typography:** Typewriter effects, trust badges, and advanced typography controls.
- **Media Sliders:** Image and Video sliders supporting direct MP4 or YouTube embeds.
- **Pricing & Rate Cards:** Sortable pricing tiers with "Popular" highlighting and direct checkout links.
- **Custom HTML/CSS/JS Sandbox:** A fully isolated Monaco Editor instance allowing developers to inject custom Tailwind CSS and scoped JavaScript interacting directly with the native `window.UCP` SDK.

### 🖌️ Global Theming (The Design Tab)
- **Theme Store:** Users can unlock premium themes (e.g., Cinematic Dark, Cupertino) using their Wallet Coins.
- **Brand Controls:** Global hex color overrides, border-radius manipulation (Sharp to Round), and typography selection.

### 🛒 E-Commerce Design & Layouts (The Store Tab)
Giving users drag-and-drop control over complex conversion funnels (like Checkout or Product pages) is dangerous; a user might accidentally delete the "Add to Cart" button and break their store. 
To solve this, UCP Maroc utilizes a **Settings-Driven Template Architecture**:
- **The Store Tab:** Inside the Builder, the "Store" tab allows users to safely customize their eCommerce funnels via toggles (e.g., "Show Sidebar Filters on Shop Page", "Enable Authenticated Reviews"). These selections are saved securely into the portfolio's `theme_config` JSON.
- **Controller/View Routing:** 
  - **The Controller (e.g., `PublicProductPage.tsx`, `CustomerLoginPage.tsx`):** Environment-aware logic that identifies the tenant (via Subdomain or Custom Domain), authenticates the active customer session, fetches the required data, and handles backend execution (like Supabase OTP generation).
  - **The View (e.g., `ProductLayout.tsx`, `LoginLayout.tsx`):** A purely presentational component. The Controller dynamically injects the fetched data and UI callbacks into the View based on the active theme (e.g., Modern vs. Cupertino).
  - **The Connection:** The View reads the `themeConfig` object passed down from the Controller. If the user toggled off "Product Reviews" in the Store Tab, the View simply unmounts the review block. This guarantees a lightning-fast, unbreakable funnel.
- **Shop Page Architecture:** Similar to products, `PublicShopPage.tsx` acts as the Controller. It fetches the store's active products and collections, and passes them to `ShopLayout.tsx`. Toggles in the Store Settings can instantly modify the layout, such as hiding the sidebar filters.
- **Global Cart Drawer:** The cart state is managed entirely via Zustand (`useCartStore.ts`). A `CartDrawerContainer` listens to the active theme and injects the appropriately styled `ModernCartDrawer` globally, providing a persistent shopping experience across all pages without losing state.
- **Checkout & Thank You Pages:** `PublicCheckoutPage.tsx` handles complex logic including applying Stripe Elements, verifying coupons, and calculating shipping based on the selected markets. Once successful, it routes the user to `PublicThankYouPage.tsx`, which clears the cart and securely displays the extracted order receipt.
- **Available Store Settings (`theme_config` Keys):**
  - `store_enabled`: Globally toggles the e-commerce engine on or off.
  - `store_product_reviews`: Shows/hides the authenticated review block on product pages.
  - `store_related_products`: Shows/hides the related product grid at the bottom of product pages.
  - `store_shop_filters`: Shows/hides the category/search sidebar on the main shop page.
  - `store_cart_notes`: Enables a text area in the cart drawer for special order instructions.
  - `store_checkout_layout`: Switches the checkout view between `one-page`, `two-column` (Shopify), and `multi-step`.
  - `store_portal_enabled`: Toggles customer login capabilities and order tracking dashboards.

---

## 🛍️ 2. Advanced E-Commerce Engine
A highly flexible digital and physical storefront system supporting multi-site management, variant tracking, and dedicated customer portals.

### 📦 Product & Inventory Management
- **Variant Engine:** Support for complex product options (e.g., Size, Color) with distinct price overrides.
- **Inventory Tracking:** Real-time stock counting preventing overselling.
- **Action Types:** Route products to a Standard Cart, direct WhatsApp chat, external URL, or a Custom Direct Order Form.
- **Collections:** Group products by season or category with custom banner images and SEO-friendly slugs.

*Note: The Product Engine is slated for a "2.0 Upgrade" which will introduce Digital File uploads, variant-specific images, product dimensions, rich-text long descriptions, dynamic accordions (Size Guides, Policies), and Shopify/Amazon CSV importing.*

### 🏷️ Promotions & Coupons
- **Discount Types:** Percentage (%), Fixed Amount ($), or Free Shipping.
- **Advanced Targeting:** Limit coupons to specific Products, Collections, or Product Types.
- **Usage Constraints:** Date-bound validity, minimum order amounts, and global usage limits.

### 🌍 Markets & Shipping
- **Regional Toggles:** Turn specific countries and global regions on or off for selling.
- **Smart Shipping Rules:** Flat rate, weight-based calculations, and conditional Free Shipping thresholds.

### 🔐 The Customer Portal
- **Themeable & Environment-Aware:** The Customer Login portal follows the Controller-View pattern. It flawlessly resolves the active store regardless of whether the user accesses it via a platform subdomain or a white-labeled custom domain, and delegates the UI to a theme-specific Login Layout.
- **Passwordless Authentication:** Customers log in to their favorite creator's store using Supabase OTP (One-Time Password) magic links sent to their email.
- **Tenant Isolation:** A bridging table (`pro_customers`) ensures a user is securely tied only to the specific `portfolio_id` they purchased from.
- **Order History & Tracking:** Customers have their own secure dashboard (`/pro/:slug/dashboard`) to view past purchases and current fulfillment statuses.
- **Authenticated Product Reviews:** Only logged-in customers can leave reviews on products. These are held in "Pending" status until the store owner approves them.

---

## 💳 3. Global Payments Infrastructure
The platform provides versatile checkout integrations catering to both fiat and crypto.

- **Stripe Express (Managed):** Zero-friction onboarding for creators via Stripe Connect (Platform takes a fee).
- **Stripe Standard (BYO):** Pro users can attach their own Stripe API keys to keep 100% of the revenue.
- **Web3 Crypto:** Support for direct USDC / SOL payments to an EVM/Solana wallet address.
- **Manual Bank Transfer:** Configurable IBAN / Wise details for offline fulfillment.
- **Cash on Delivery (COD):** Trust-based local fulfillment option.

---

## 📬 4. CRM & Order Management
A complete back-office to manage customer interactions.

### 📦 Direct Orders
- **Unified Status Flow:** Pending, In Progress, Completed, Cancelled, Refunded.
- **Intelligent Data Extraction:** Automatically parses custom checkout forms to extract Names, Emails, Cities, and Payment Intents cleanly into the UI.
- **Real-Time Customer Chat:** Using **Supabase Realtime**, store owners and customers can chat live on a specific order. The UI updates instantly across both the Owner's and Customer's dashboards without refreshing.
- **Bulk Actions:** Update statuses or delete multiple orders simultaneously.
- **CSV Exports:** One-click export of complex order data, dynamically generating columns for custom form fields.

### 👥 Customer CRM
- **Lifetime Value (LTV) Calculation:** The system dynamically calculates how much a specific client has spent across all their historic orders, minus refunds/cancellations.
- **Unified Profiles:** Merges all previous guest checkouts using the same email into a single unified Customer profile once they authenticate.

###  Leads & Inbox
- **Smart Parsing:** Guesses Name/Email/Phone even from wildly varying custom form inputs.
- **Custom Tagging:** Apply specific colored tags (e.g., `VIP`, `FOLLOW_UP`) directly to leads.
- **Global Filtering:** Filter inbox by Portfolio, Source (Pricing vs Contact), Status, or Custom Tags.

### 📝 Form Manager
- **Form Library:** Save reusable Checkout and Contact forms to apply across multiple sites or pricing plans.
- **Drag-and-Drop Fields:** Add text, emails, dropdowns, and checkboxes.
- **Locked Checkout Core:** Safeguards critical e-commerce fields (City, Zip, Country) from being accidentally deleted by the user while allowing custom additions.
- **Global Cart Form Targeting:** Assign a specific checkout form to be used globally whenever a user adds standard products to their cart.

---

## 📊 5. Analytics & Insights
Deep visual tracking of portfolio performance.

- **Area Charts:** Dual-layered, gradient-filled Recharts visualizing 30-day Page Views vs Interactions.
- **Action Breakdown:** Progress bars showing the exact split of intents (WhatsApp vs Cart vs Direct Forms vs Links).
- **Live Activity Feed:** A chronological ticker of the latest interactions (e.g., "Started WhatsApp Order for Premium T-Shirt").
- **Top Products:** Ranks the most clicked/purchased products dynamically.

---

## ⚙️ 6. System Architecture & Context

### 🌍 Environment-Aware Routing (`isCustomDomain`)
The root `App.tsx` and all Public Controllers intelligently detect if the application is being accessed via the primary platform domain (e.g., `ucpmaroc.com/pro/brand`) or a white-labeled custom domain (e.g., `shop.mybrand.com`). 
Instead of failing due to missing URL slugs, Custom Domains query the `portfolios` table directly via the hostname, mapping the visitor to the correct storefront and actor instantly.

### 🏢 Multi-Tenant Context (`selectedSiteId`)
A sophisticated "Sticky Filter" mechanism lives in the `ActorDashboardLayout`. Once a user selects a specific brand or website from the top dropdown, that filter seamlessly propagates across Products, Orders, Leads, Analytics, Customers, Reviews, and Forms—ensuring they never accidentally mix up data from two different businesses.

### 🔄 App Switcher
To keep the sidebar perfectly clean, a toggle allows users approved for the internal UCP Agency to switch entirely between the **"Store Builder"** (B2C) and the **"Agency Hub"** (B2B).

### 🪙 Wallet & Billing System
- **Coins Currency:** The platform runs on an internal "Coin" system to buy site slots and premium themes.
- **Subscription Tiers:** Starter, eCommerce, and Pro plans handled via Stripe Subscriptions.
- **Proration:** Intelligent down/up-grading logic calculating unused value to apply credits.

### 🌐 Custom Domains
- Integrates via edge functions (`manage-domains`) to dynamically map external CNAME / A Records to specific portfolios.

---

## 🛠️ Technical Stack Summary
- **Frontend Framework:** React (Vite / CRA)
- **Routing:** React Router DOM v6
- **Styling:** Tailwind CSS + Radix UI / Shadcn UI components.
- **State Management:** Zustand (`useCartStore`, `useBuilderStore`).
- **Drag & Drop:** `@dnd-kit/core` & `@hello-pangea/dnd`.
- **Backend / Auth / DB:** Supabase (PostgreSQL, Edge Functions, Storage, Realtime).
- **Code Editor:** `@monaco-editor/react` (for Custom HTML/CSS blocks).
- **Charts:** `recharts`.