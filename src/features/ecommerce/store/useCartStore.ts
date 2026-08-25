import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  id: string;
  title: string;
  price: number;
  image?: string;
  quantity: number;
  variant?: string;
  storeId?: string;
  productType?: string;
  collectionId?: string;
  requiresShipping?: boolean;
}

interface CartState {
  items: CartItem[];
  allCarts: Record<string, CartItem[]>; // 🚀 Track multiple carts
  activeStoreId: string | null;         // 🚀 Know which store is active
  isOpen: boolean; // Controls UI visibility
  coupon: any | null; // 🚀 ADD COUPON STATE
  allCoupons: Record<string, any | null>; // 🚀 Track multiple coupons
  openCart: () => void;
  closeCart: () => void;
  addItem: (item: CartItem) => void;
  removeItem: (id: string, variant?: string) => void;
  updateQuantity: (id: string, quantity: number, variant?: string) => void;
  clearCart: () => void;
  getCartTotal: () => number;
  getCartCount: () => number;
  applyCoupon: (coupon: any) => void;
  removeCoupon: () => void;
  getCartDiscount: () => number;
  validateStoreContext: (currentStoreId: string | null | undefined) => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      allCarts: {},
      activeStoreId: null,
      isOpen: false,
      coupon: null,
      allCoupons: {},

      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),

      validateStoreContext: (currentStoreId) =>
        set((state) => {
          const storeId = currentStoreId || "global";
          
          if (state.activeStoreId === storeId) {
            return state;
          }

          const currentCarts = { ...(state.allCarts || {}) };
          const currentCoupons = { ...(state.allCoupons || {}) };

          // 🚀 LEGACY MIGRATION: If there are existing items but no activeStoreId (pre-update), 
          // safely tuck them away before switching so they aren't destroyed!
          if (!state.activeStoreId && state.items?.length > 0) {
            const legacyStoreId = state.items[0].storeId || "global";
            currentCarts[legacyStoreId] = state.items;
            currentCoupons[legacyStoreId] = state.coupon;
          } else if (state.activeStoreId) {
            // Normal save
            currentCarts[state.activeStoreId] = state.items || [];
            currentCoupons[state.activeStoreId] = state.coupon || null;
          }

          // Load items for the new store
          const nextItems = currentCarts[storeId] || [];
          const nextCoupon = currentCoupons[storeId] || null;

          return {
            activeStoreId: storeId,
            allCarts: currentCarts,
            allCoupons: currentCoupons,
            items: nextItems,
            coupon: nextCoupon,
          };
        }),

      addItem: (newItem) =>
        set((state) => {
          // 🚀 FIX: Trust the incoming item's storeId over the stale activeStoreId!
          const storeId = newItem.storeId || state.activeStoreId || "global";
          
          let currentCarts = { ...(state.allCarts || {}) };
          let currentItems = state.items || [];

          // 🚀 Force context switch if we are adding to a different store
          if (state.activeStoreId !== storeId) {
            if (state.activeStoreId) {
              currentCarts[state.activeStoreId] = state.items || [];
            }
            currentItems = currentCarts[storeId] || [];
          }
          
          const existingItemIndex = currentItems.findIndex(
            (item) => item.id === newItem.id && item.variant === newItem.variant
          );
          
          let updatedItems;
          if (existingItemIndex >= 0) {
            updatedItems = [...currentItems];
            updatedItems[existingItemIndex] = {
              ...updatedItems[existingItemIndex],
              quantity: updatedItems[existingItemIndex].quantity + newItem.quantity
            };
          } else {
            updatedItems = [...currentItems, newItem];
          }

          currentCarts[storeId] = updatedItems;

          return { 
            activeStoreId: storeId,
            items: updatedItems, 
            isOpen: true,
            allCarts: currentCarts
          };
        }),

      removeItem: (id, variant) =>
        set((state) => {
          const storeId = state.activeStoreId || "global";
          const updatedItems = (state.items || []).filter(
            (item) => !(item.id === id && item.variant === variant)
          );
          return {
            items: updatedItems,
            allCarts: { ...(state.allCarts || {}), [storeId]: updatedItems }
          };
        }),

      updateQuantity: (id, quantity, variant) =>
        set((state) => {
          const storeId = state.activeStoreId || "global";
          const updatedItems = (state.items || []).map((item) =>
            item.id === id && item.variant === variant
              ? { ...item, quantity }
              : item
          );
          return {
            items: updatedItems,
            allCarts: { ...(state.allCarts || {}), [storeId]: updatedItems }
          };
        }),

      clearCart: () => set((state) => {
          const storeId = state.activeStoreId || "global";
          return { 
            items: [], 
            isOpen: false, 
            coupon: null,
            allCarts: { ...(state.allCarts || {}), [storeId]: [] },
            allCoupons: { ...(state.allCoupons || {}), [storeId]: null }
          };
      }),
      
      applyCoupon: (coupon) => set((state) => {
          const storeId = state.activeStoreId || "global";
          return { 
            coupon,
            allCoupons: { ...(state.allCoupons || {}), [storeId]: coupon }
          };
      }),
      
      removeCoupon: () => set((state) => {
          const storeId = state.activeStoreId || "global";
          return { 
            coupon: null,
            allCoupons: { ...(state.allCoupons || {}), [storeId]: null }
          };
      }),
      
      getCartDiscount: () => {
        const state = get();
        if (!state.coupon) return 0;
        
        const subtotal = (state.items || []).reduce((sum, item) => sum + item.price * item.quantity, 0);
        
        if (state.coupon.min_order_amount_cents && (subtotal * 100) < state.coupon.min_order_amount_cents) {
          return 0; // Does not meet minimum order value
        }

        let eligibleSubtotal = 0;
        if (state.coupon.applies_to === 'all' || !state.coupon.applies_to) {
          eligibleSubtotal = subtotal;
        } else {
          const targetIds = state.coupon.target_ids || [];
          eligibleSubtotal = (state.items || []).reduce((sum, item) => {
            let isEligible = false;
            if (state.coupon.applies_to === 'products' && targetIds.includes(item.id)) isEligible = true;
            if (state.coupon.applies_to === 'collections' && item.collectionId && targetIds.includes(item.collectionId)) isEligible = true;
            if (state.coupon.applies_to === 'types' && item.productType && targetIds.includes(item.productType)) isEligible = true;
            return sum + (isEligible ? item.price * item.quantity : 0);
          }, 0);
        }

        if (eligibleSubtotal === 0) return 0; // No eligible items for this coupon

        if (state.coupon.type === 'percentage') return eligibleSubtotal * (state.coupon.value_amount / 100);
        if (state.coupon.type === 'fixed') return Math.min(eligibleSubtotal, state.coupon.value_amount / 100);
        return 0;
      },

      getCartTotal: () => {
        const subtotal = (get().items || []).reduce((total, item) => total + item.price * item.quantity, 0);
        const discount = get().getCartDiscount();
        return Math.max(0, subtotal - discount);
      },
      getCartCount: () =>
        (get().items || []).reduce((count, item) => count + item.quantity, 0),
    }),
    { name: "portfolio-cart-storage" }
  )
);
