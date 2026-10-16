/**
 * Commerce view contract.
 *
 * A custom theme may restyle the shop by exporting default components under these file names.
 * Views are presentation only: they receive props and call the callbacks in those props. Cart, pricing, stock,
 * payment and order logic stay in the platform, and a view that is missing or throws falls back to the built-in.
 *
 * Prop shapes: see src/features/ecommerce/product-layouts/types.ts (ShopLayoutProps, ProductLayoutProps)
 * and LoginLayout in src/themes/modern/LoginLayout.tsx.
 */
export const COMMERCE_VIEW_KEYS = ["ShopLayout", "ProductLayout", "LoginLayout", "CartDrawer", "CheckoutView", "ThankYouView"] as const;
export type CommerceViewKey = (typeof COMMERCE_VIEW_KEYS)[number];

export const COMMERCE_VIEWS: Record<CommerceViewKey, { title: string; description: string }> = {
  ShopLayout: { title: "Shop", description: "Product grid with collection filters and search." },
  ProductLayout: { title: "Product page", description: "Gallery, variants, quantity, add to cart / order form, reviews." },
  LoginLayout: { title: "Customer portal login", description: "Sign-in and sign-up for store customers." },
  CartDrawer: { title: "Cart drawer", description: "Slide-over cart; state comes from UCP.useCartDrawer()." },
  CheckoutView: { title: "Checkout", description: "Two-step checkout; receives `checkout` state and platform-owned `slots` for the contact form and payment." },
  ThankYouView: { title: "Thank you", description: "Order confirmation, downloads and receipt; receives a `model` prop." },
};

export const isCommerceViewKey = (name: string): name is CommerceViewKey => (COMMERCE_VIEW_KEYS as readonly string[]).includes(name);
