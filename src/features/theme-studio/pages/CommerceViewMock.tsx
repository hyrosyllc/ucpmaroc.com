import React, { useEffect, useState } from "react";
import { useCartStore } from "@/features/ecommerce/store/useCartStore";
import { UcpMockContext } from "@/lib/ucp-sdk/mockContext";
import type { CommerceViewKey } from "@/lib/theme-runtime/commerceViews";

const img = (seed: string) => `https://picsum.photos/seed/${seed}/800/600`;

const PRODUCTS = [
  { id: "p1", slug: "linen-shirt", title: "Linen shirt", description: "Breathable, relaxed fit.", price: 59, images: [img("shirt")], action_type: "cart", collection_id: "c1" },
  { id: "p2", slug: "canvas-tote", title: "Canvas tote", description: "Everyday carry.", price: 24, images: [img("tote")], action_type: "cart", collection_id: "c2" },
  { id: "p3", slug: "ceramic-mug", title: "Ceramic mug", description: "Hand glazed, 350 ml.", price: 18, images: [img("mug")], action_type: "cart", collection_id: "c2" },
];
const COLLECTIONS = [{ id: "c1", title: "Clothing" }, { id: "c2", title: "Home" }];
const CART_ITEMS = [
  { id: "p1", title: "Linen shirt", price: 59, quantity: 1, image: img("shirt"), variant: "M / Sand" },
  { id: "p2", title: "Canvas tote", price: 24, quantity: 2, image: img("tote") },
];
const noop = () => {};

function ShopHost({ View }: any) {
  const [activeCollection, setActiveCollection] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const filteredProducts = PRODUCTS.filter((p) => (!activeCollection || p.collection_id === activeCollection) && p.title.toLowerCase().includes(searchQuery.toLowerCase()));
  return <View username="preview" products={PRODUCTS} collections={COLLECTIONS} {...{ activeCollection, setActiveCollection, searchQuery, setSearchQuery, filteredProducts }} themeConfig={{}} portfolioId="preview" />;
}

function ProductHost({ View }: any) {
  const [quantity, setQuantity] = useState(1);
  const [selectedVariants, setSelectedVariants] = useState<Record<string, any>>({});
  const [activeImgIndex, setActiveImgIndex] = useState(0);
  const [step, setStep] = useState<"details" | "form" | "success">("details");
  const [clientInfo, setClientInfo] = useState({ name: "", phone: "", address: "" });
  const product = { ...PRODUCTS[0], images: [img("shirt"), img("shirt2")], pro_collections: { title: "Clothing" }, options: [{ name: "Size", values: [{ label: "S" }, { label: "M" }, { label: "L", price: 4 }] }] };
  return (
    <View
      product={product} username="preview" currentPrice={product.price * quantity} {...{ quantity, setQuantity, selectedVariants, setSelectedVariants, activeImgIndex, setActiveImgIndex, step, setStep, clientInfo, setClientInfo }}
      isSubmitting={false} handleMainAction={noop} handleConfirmOrder={noop} themeConfig={{}} relatedProducts={PRODUCTS.slice(1)}
    />
  );
}

function LoginHost({ View }: any) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  return <View portfolio={{ site_name: "Preview store" }} {...{ isSignUp, setIsSignUp, email, setEmail, name, setName, password, setPassword }} isLoading={false} error="" successMessage="" handleAuth={(e: any) => e.preventDefault()} navigate={noop} shopUrl="/shop" />;
}

// The drawer reads the real cart store, so seed it for the preview and restore the developer's own cart afterwards.
function CartHost({ View }: any) {
  useEffect(() => {
    const before = useCartStore.getState();
    const saved = { items: before.items, isOpen: before.isOpen, coupon: before.coupon };
    useCartStore.setState({ items: CART_ITEMS as any, isOpen: true, coupon: null });
    return () => {
      useCartStore.setState(saved as any);
    };
  }, []);
  return <View username="preview" isPreview />;
}

function CheckoutHost({ View }: any) {
  const [checkoutStep, setCheckoutStep] = useState<1 | 2>(1);
  const [isSummaryExpanded, setIsSummaryExpanded] = useState(false);
  const [couponInput, setCouponInput] = useState("");
  const [selectedShippingRate, setSelectedShippingRate] = useState<any>(null);
  const subtotal = CART_ITEMS.reduce((s, i) => s + i.price * i.quantity, 0);
  const rates = [{ id: "r1", name: "Standard (3 to 5 days)", rate_cents: 500, type: "flat" }, { id: "r2", name: "Express", rate_cents: 1500, type: "flat" }];
  const checkout = {
    items: CART_ITEMS, coupon: null, discount: 0, subtotal, finalTotal: subtotal + (selectedShippingRate ? selectedShippingRate.rate_cents / 100 : 0),
    shippingCost: selectedShippingRate ? selectedShippingRate.rate_cents / 100 : 0, requiresShipping: true, applicableRates: rates, selectedShippingRate, setSelectedShippingRate,
    couponInput, setCouponInput, couponError: "", isValidatingCoupon: false, handleApplyCoupon: noop, removeCoupon: noop, shopUrl: "/shop", homeUrl: "/",
    initError: null, checkoutStep, setCheckoutStep, formValues: { name: "Jane Doe", email: "jane@example.com", address: "1 Main St", city: "Casablanca", country: "Morocco" },
    isSummaryExpanded, setIsSummaryExpanded,
  };
  const placeholder = (label: string, action?: () => void) => (
    <div className="space-y-4 rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
      <p>{label} (rendered by the platform on the live site)</p>
      {action && <button type="button" onClick={action} className="rounded-md border px-4 py-2 text-foreground">Continue</button>}
    </div>
  );
  const slots = { contact: placeholder("Contact and shipping form", () => setCheckoutStep(2)), payment: placeholder("Secure payment") };
  return (
    <UcpMockContext.Provider value={{ checkout: { ...checkout, slots } }}>
      <View portfolio={{ site_name: "Preview store", public_slug: "preview" }} />
    </UcpMockContext.Provider>
  );
}

function ThankYouHost({ View }: any) {
  const order = { id: "1a2b3c4d-0000", customer_name: "Jane Doe", product_name: "Cart order", product_price: "$107.00" };
  const model = {
    loading: false, order, digitalProducts: [{ id: "d1", title: "Style guide (PDF)", digital_message: "Thanks for your order.", digital_files: [{ name: "guide.pdf", url: "#" }] }],
    displayName: "Jane Doe", displayEmail: "jane@example.com", displayPhone: "+212 600 000000", displayAddress: "1 Main St - Casablanca, Morocco",
    paymentMethod: "Credit Card (Stripe)", orderNumber: "1A2B3C4D", firstName: "Jane", shippingMethod: "Standard (3 to 5 days)", bank: null, items: CART_ITEMS, totalDisplay: "112.00",
    homeUrl: "/", shopUrl: "/shop", ordersUrl: "/dashboard/orders", handlePrint: noop, navigate: noop, coreExtra: {}, customData: [],
  };
  return (
    <UcpMockContext.Provider value={{ thankYou: model }}>
      <View portfolio={{ site_name: "Preview store", public_slug: "preview" }} />
    </UcpMockContext.Provider>
  );
}

const HOSTS: Record<CommerceViewKey, React.ComponentType<any>> = {
  ShopLayout: ShopHost,
  ProductLayout: ProductHost,
  LoginLayout: LoginHost,
  CartDrawer: CartHost,
  CheckoutView: CheckoutHost,
  ThankYouView: ThankYouHost,
};

/** Renders a commerce view with sample data so developers can style it without a live store. */
export function CommerceViewMock({ view, Component }: { view: CommerceViewKey; Component: React.ComponentType<any> }) {
  const Host = HOSTS[view];
  return <Host View={Component} />;
}
