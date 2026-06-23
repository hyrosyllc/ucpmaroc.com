# 🛍️ E-Commerce Customer Portal Project Plan

## 🎯 Overview
The Customer Portal transforms the platform into a comprehensive E-Commerce engine by allowing end-buyers to authenticate into a specific creator's website. Once logged in, customers can track orders, communicate via real-time chat with the store owner, and leave verified product reviews.

---

## 🗄️ Phase 1: Database Architecture
We need to expand the Supabase schema to support customer identities, order messaging, and product-specific reviews.

### 1. New Tables Needed
*   **`pro_customers`**
    *   `id` (uuid, primary key)
    *   `user_id` (uuid, references `auth.users`) -> The authenticated Supabase user.
    *   `portfolio_id` (uuid, references `portfolios`) -> The specific store they belong to.
    *   `name`, `email`, `phone` -> Customer details.
*   **`pro_order_messages`**
    *   `id` (uuid)
    *   `order_id` (uuid, references `pro_orders`)
    *   `sender_type` (enum: `'customer'` | `'owner'`)
    *   `message` (text)
    *   `created_at` (timestamp)
*   **`pro_product_reviews`**
    *   `id` (uuid)
    *   `product_id` (uuid, references `pro_products`)
    *   `customer_id` (uuid, references `pro_customers`)
    *   `rating` (int, 1-5)
    *   `content` (text)
    *   `images` (jsonb array of URLs)
    *   `is_published` (boolean) -> Automatically true or requires owner approval.

### 2. Table Updates
*   **`pro_orders`**: Add `customer_id` (uuid, nullable initially for backwards compatibility).
*   **`portfolios`**: Add a toggle in `theme_config` (e.g., `customerAccountsEnabled: boolean`).

---

## 🛤️ Phase 2: Customer Routing & UI
We will construct a new nested router within the `PublicShopPage` architecture to handle the customer portal.

### 1. Client-Facing Routes
*   `/pro/:slug/login`
    *   OTP / Magic Link login interface matching the specific site's theme.
*   `/pro/:slug/dashboard`
    *   **Overview layout:** Welcome back message, recent orders summary, account details.
*   `/pro/:slug/dashboard/orders`
    *   **List View:** History of all past and active orders with status badges.
*   `/pro/:slug/dashboard/orders/:id`
    *   **Detail View & Chat:** Shows order line items, fulfillment status, and the real-time chat interface.

### 2. Authentication Strategy
*   Leverage Supabase OTP (`signInWithOtp`). Customers only need to enter their email; no passwords to forget.

---

## 💬 Phase 3: Real-Time Features & Reviews

### 1. Order Chat (Real-Time)
*   **Customer Side:** Integrate Supabase Realtime channel on `pro_order_messages`.
*   **Owner Side:** Update `OrdersPage.tsx` (the slide-out sheet) to include a "Chat with Customer" tab. 
*   **Notifications:** (Optional) Add a badge to the owner's dashboard sidebar when a new unread message arrives.

### 2. Authenticated Product Reviews
*   **Submission:** Allow customers to leave a review directly from their `/dashboard/orders` page after an order is marked `completed`.
*   **Display:** Update the `DynamicStore` and individual Product Page components to fetch from `pro_product_reviews`.
*   **Management:** Update the site owner's dashboard to approve/hide product reviews (similar to the existing site reviews manager).

---

## 🛠️ Phase 4: Integration & Owner Controls

### 1. Site Owner Settings
*   Update `SettingsPage.tsx` -> "E-Commerce" or "General" tab to allow the site owner to turn the Customer Portal ON or OFF.
*   Update `Header.tsx` (the website's navigation bar) to dynamically show a "Login / Account" icon (e.g., a little User icon next to the Shopping Bag) if the feature is enabled.

### 2. Auto-linking Existing Leads to Customers
*   When a customer logs in for the first time, check their email against previous `pro_orders`. If matches are found, back-fill the `customer_id` so they immediately see their past purchase history.

---

## 🚀 Execution Steps (Next Actions)
1.  **Step 1:** Run SQL migrations in Supabase to create the three new tables (`pro_customers`, `pro_order_messages`, `pro_product_reviews`) and set up RLS policies.
2.  **Step 2:** Build the `/pro/:slug/login` UI component and the Supabase OTP integration.
3.  **Step 3:** Scaffold the `/pro/:slug/dashboard` layout and the Orders list.
4.  **Step 4:** Build the Real-Time Chat interface for both the Customer Dashboard and the Owner Dashboard.
5.  **Step 5:** Implement the Product Reviews system and embed it into the live store UI.