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
- **Checkout & Smart Shipping Logic:** `PublicCheckoutPage.tsx` handles complex logic including applying Stripe Elements, verifying coupons, and calculating shipping based on selected markets. It parses the Zustand cart and queries the database to evaluate the `delivery_type`. If all items are `digital` or `service`, it entirely bypasses weight calculations and forces the shipping cost to `$0.00`.
- **Digital Download Hub (Thank You Page):** `PublicThankYouPage.tsx` acts as a dual-purpose Receipt & Download Hub. Upon successful payment, it extracts the `orderId`, clears the cart, and securely fetches the order. It then queries the associated products, and if any are digital, it dynamically renders a "Digital Downloads" UI containing the `digital_message` and secure links to the files stored in Supabase.
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
The platform utilizes the **Product Engine 2.0** architecture to support complex Enterprise-grade product catalogs.

#### 🚀 Deep Dive: Product Engine 2.0 & Digital Delivery Lifecycle
This upgrade drastically expanded what a "Product" represents in the database, requiring interconnected logic spanning the Admin Dashboard, the Storefront, the Checkout, and the Customer Portal.

**1. Database Schema (`pro_products`)**
The product table supports a massive payload including:
- `short_description` (TEXT): A quick summary to hook buyers beneath the price.
- `delivery_type` (TEXT): Enforces Enum values of `physical`, `digital`, or `service`.
- `dimensions` (JSONB): Tracks `length`, `width`, `height`, and `unit` (cm/in) for advanced shipping integrations.
- `digital_files` (JSONB): Stores arrays of file metadata `{ url, name }`.
- `digital_message` (TEXT): A custom post-purchase message (e.g., "Here is the link to access your preset...").
- `accordions` (JSONB): An array of `{ title, content }` objects for FAQs, Size Guides, and Policies.

**2. The Admin Interface (`ProductsPage.tsx`)**
Because the dataset is so large, the product creation form is split into a **5-Tab Architecture**:
- **General:** Manages the Title, Short Description, Long Description, and Store Organization (assigning products globally or to specific tenants/subdomains).
- **Media & Pricing:** Introduces intelligent media parsing. The gallery uploader detects `.mp4`, `.webm`, and `.mov` extensions. It seamlessly injects `<video autoPlay loop muted playsInline>` tags into the thumbnail grids rather than standard `<img>` tags, allowing rich visual showcases.
- **Inventory & Variants:** A dynamic builder for adding product variants (Color, Size) with independent price overrides. Includes real-time `stock_count` toggles. *Logic Check:* If `delivery_type` is `digital`, the inventory tracking toggle is automatically disabled and hidden, as digital goods have infinite stock.
- **Delivery:** The core router for fulfillment. 
  - Choosing **Physical** renders Weight and Dimension inputs.
  - Choosing **Digital** swaps the UI to a multi-file uploader that pushes assets directly to the `portfolio-assets/${actorId}/digital-products/` Supabase Storage bucket, alongside the custom `digital_message` text area.
  - Choosing **Service** hides both, passing a simple `requires_shipping = false` flag.
- **Details & SEO:** An intuitive Accordion Builder that serializes custom tabs directly into the `accordions` JSONB array.

**3. The Storefront View (`PublicProductPage.tsx` & `ModernProductLayout.tsx`)**
- **Visual Injections:** The product layout reads the new data arrays. It places the `short_description` at the top of the buy box. At the bottom, it iterates through the `accordions` JSONB array and renders them using native HTML `<details>` and `<summary>` tags with Tailwind transitions for seamless, JavaScript-free expansion. Video parsing logic matches the admin panel, allowing customers to view looping video reels directly in the product gallery.
- **Cart Hydration:** When "Add to Cart" is clicked, the Controller evaluates `product.delivery_type === 'physical' || product.requires_shipping`. It pushes a `requiresShipping: boolean` flag directly into the Zustand `CartItem` state.

**4. Smart Checkout Logic (`PublicCheckoutPage.tsx`)**
- When a customer hits checkout, the engine scans the Zustand `items` array.
- **Shipping Bypass:** It reduces the `requiresShipping` flag across the entire cart. If *no* items require shipping (i.e., a cart full of digital items or services), the Checkout visually strips away the "Shipping Method" selection box and forces the `shippingCost` variable mathematically to `$0.00`.
- It requires standard fields (Name, Email) to ensure the CRM collects the lead and knows where to send the digital invoice.

**5. Post-Purchase & Fulfillment (`PublicThankYouPage.tsx`)**
- Upon successful Stripe or Manual payment, the user is redirected to the Thank You Page with the generated `?order={id}`.
- **The Download Hub:** The page transforms from a simple receipt into an authenticated Download Hub. It executes a secondary Supabase query, matching the `items` array from the `pro_orders` row against the `pro_products` table to check if any purchased items possess a `delivery_type` of `digital`.
- If found, it injects a highly visible "Digital Downloads" card at the top of the page. It iterates through the product's `digital_files` JSONB array, generating secure download `<button>`s, and renders the unique `digital_message` left by the creator.

**6. Admin & CRM Clarity (`OrdersPage.tsx` & `ProOrderDetailPage.tsx`)**
- To prevent creators from mistakenly trying to box and ship a digital item, the Admin dashboards parse the `requiresShipping` flag on the order items.
- **Visual Badges:** It automatically prepends bright blue `<Badge>` components reading "Digital / Service" or "Digital Delivery" next to the items, instantly signaling that the order requires zero physical fulfillment.

#### 🛠️ Step-by-Step Implementation & Files Updated (Digital Products & Delivery)
Here is the exact step-by-step sequence of how Digital Products and intelligent shipping bypasses were built into the platform:

1. **Database Schema Expansion (Supabase SQL)**
   - Added columns to `pro_products`: `short_description`, `delivery_type`, `dimensions`, `digital_files`, `digital_message`, `accordions`.
2. **Admin Catalog Upgrade (`src/features/ecommerce/pages/ProductsPage.tsx`)**
   - Refactored the single-page form into a scalable 5-Tab interface.
   - Implemented the `delivery_type` Radio Group (Physical, Digital, Service).
   - Added the Supabase Storage Uploader for `digital_files` directly to the `portfolio-assets` bucket.
3. **Global Cart State (`src/features/ecommerce/store/useCartStore.ts`)**
   - Updated the Zustand `CartItem` interface to accept a `requiresShipping: boolean` flag so the cart knows the physical footprint of the order.
4. **Storefront Product Controller (`src/features/ecommerce/pages/PublicProductPage.tsx`)**
   - Mapped the database `delivery_type` to the cart's `requiresShipping` flag during the `addItem` dispatch.
5. **Storefront Product View (`src/themes/modern/ProductLayout.tsx`)**
   - Injected native `<video>` tags for mp4 gallery support.
   - Rendered `short_description`.
   - Mapped the `accordions` JSONB into native `<details>` HTML dropdowns.
6. **Smart Checkout Bypassing (`src/features/ecommerce/checkout/PublicCheckoutPage.tsx`)**
   - Evaluated `items.some(i => i.requiresShipping === false)`. If false, the UI hides the shipping methods step and forces `$0.00` shipping cost, seamlessly accommodating digital and service-based carts.
7. **Post-Purchase Download Hub (`src/features/ecommerce/checkout/PublicThankYouPage.tsx`)**
   - Fetched the order ID, then executed a secondary fetch to `pro_products` to pull the `digital_files` and `digital_message`.
   - Rendered a highly visible "Digital Downloads" UI allowing immediate post-purchase access.
8. **Admin Clarity (`src/features/ecommerce/pages/OrdersPage.tsx` & `ProOrderDetailPage.tsx`)**
   - Injected "Digital / Service" and "Digital Delivery" blue badges based on the item's `requiresShipping` flag, preventing the store owner from thinking they need to ship a box.
9. **Customer Portal Lifelong Access (`src/features/ecommerce/pages/CustomerOrdersPage.tsx` & `CustomerOrderDetailPage.tsx`)**
   - Added "View Receipt & Downloads" buttons to the customer's dashboard, routing them back to the `PublicThankYouPage` using their Order ID, creating a persistent digital locker.

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
- **Persistent Digital Access:** The customer's `CustomerOrdersPage` and `CustomerOrderDetailPage` inject a "View Invoice & Downloads" button on past orders. This dynamically routes them back to the `PublicThankYouPage.tsx` using their order ID, acting as a lifetime digital locker where they can infinitely re-download their purchased files or print receipts.
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
- **Visual Delivery Tags:** Orders containing digital items display automated blue badges, removing fulfillment ambiguity for the store owner.
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