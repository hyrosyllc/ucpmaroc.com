# 🛒 UCP Maroc - E-Commerce Roadmap & Plan

This document tracks the execution phases for the advanced multi-tenant E-Commerce engine.

## ✅ Phase 1: Core Engine & Routing (Completed)
- [x] Environment-Aware Routing (`isCustomDomain` vs Subdomain).
- [x] Sticky Site Filter Context (`selectedSiteId`).
- [x] Database Schema (Products, Orders, Leads, Customers, Reviews, Forms, Coupons, Shipping).
- [x] Global Cart Drawer with Zustand State Persistence.
- [x] Checkout Controller with Stripe Integration and Coupon validation.

## ✅ Phase 2: Design & Theming (Completed)
- [x] Split E-commerce layouts from standard Builder blocks.
- [x] Implement the `Controller -> View` rendering architecture.
- [x] Add "Store Settings" toggles to the CMS (`store_shop_filters`, `store_product_reviews`, etc.).
- [x] Passwordless Customer Portal with Edge Case domain handling.
- [x] Full-Screen "Shopify-Style" Admin Order Detail Page with Real-Time Chat.

## ⏳ Phase 3: Advanced Checkouts & Cart (Next Up)
- [ ] **Two-Column Checkout:** Read `themeConfig.store_checkout_layout` and render a Shopify-esque two-column layout on Desktop.
- [ ] **Multi-Step Checkout:** Render an accordion-style checkout (Shipping -> Details -> Payment).
- [ ] **Cart Order Notes:** Read `themeConfig.store_cart_notes` to inject a persistent text area in the Zustand Cart Drawer that passes data to the Order notes.
- [ ] **Related Products:** Fetch top 4 items from the same `collection_id` and display them at the bottom of the Product Layout.

## 🚀 Phase 4: Product Engine 2.0 (The Catalog Upgrade)
- [ ] **Schema Expansion:** Add `short_description`, `accordions` (JSONB), `dimensions` (L,W,H), and `digital_file_url` to `pro_products`. Update `options` JSONB to support variant-specific images.
- [ ] **Admin Products Page Revamp:** Refactor `ProductsPage.tsx` into a tabbed layout (General, Variants, Shipping/Dimensions, Digital/Files) to handle the massive new dataset cleanly.
- [ ] **Frontend Layout Upgrades:** Update `ModernProductLayout` to render Accordions (e.g., Refund Policy, Size Guide) and swap the main gallery image when a variant with an image is selected.
- [ ] **Digital Product Delivery:** Auto-email secure, signed Supabase Storage URLs upon successful payment for `product_type: "Digital"`. Bypass shipping calculations at checkout for digital-only carts.
- [ ] **Data Imports & Demos:** Build a CSV Import Wizard mapping Shopify/Amazon export formats to our database. Create a "Load Demo Products" one-click button for new users.

## 🗓️ Phase 5: Automated Workflows (Backlog)
- [ ] **Transactional Receipts (Edge Function):** Create a Supabase webhook that listens for `INSERT` on `pro_orders` and fires an HTML email receipt via Resend/SendGrid.
- [ ] **New Order Notifications:** In-app Dashboard Bell Notification + Email alert for the Store Owner.
- [ ] **Customer Chat Badge:** Show a red dot/counter on the "Orders" sidebar when a customer replies to an order chat.

## 🗓️ Phase 6: SEO & Discovery (Backlog)
- [ ] **Dynamic Helmet Injection:** Inject `<title>`, `og:image`, and `meta name="description"` tags dynamically on the Shop and Product Controllers so links unfurl beautifully on iMessage/WhatsApp/Twitter.
- [ ] **Sitemap Generator:** Edge function to auto-generate `sitemap.xml` for custom domains.

---
*Note: The platform is currently fully operational for standard physical/manual orders. Future phases focus on Enterprise scaling, digital fulfillment, and UX enhancements.*