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
  isOpen: boolean; // Controls UI visibility
  coupon: any | null; // 🚀 ADD COUPON STATE
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
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      coupon: null,

      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),

      addItem: (newItem) =>
        set((state) => {
          // SECURITY: Prevent cross-store cart contamination
          const isDifferentStore = state.items.length > 0 && state.items[0].storeId !== newItem.storeId;
          
          if (isDifferentStore) {
              // Clear cart and start fresh for the new store
              return { items: [newItem], isOpen: true }; 
          }

          const existingItemIndex = state.items.findIndex(
            (item) => item.id === newItem.id && item.variant === newItem.variant
          );
          if (existingItemIndex >= 0) {
            const updatedItems = [...state.items];
            updatedItems[existingItemIndex].quantity += newItem.quantity;
            return { items: updatedItems, isOpen: true }; // Auto-open cart on add
          }
          return { items: [...state.items, newItem], isOpen: true };
        }),

      removeItem: (id, variant) =>
        set((state) => ({
          items: state.items.filter(
            (item) => !(item.id === id && item.variant === variant)
          ),
        })),

      updateQuantity: (id, quantity, variant) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id && item.variant === variant
              ? { ...item, quantity }
              : item
          ),
        })),

      clearCart: () => set({ items: [], isOpen: false, coupon: null }),
      
      applyCoupon: (coupon) => set({ coupon }),
      removeCoupon: () => set({ coupon: null }),
      
      getCartDiscount: () => {
        const state = get();
        if (!state.coupon) return 0;
        
        const subtotal = state.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
        
        if (state.coupon.min_order_amount_cents && (subtotal * 100) < state.coupon.min_order_amount_cents) {
          return 0; // Does not meet minimum order value
        }

        let eligibleSubtotal = 0;
        if (state.coupon.applies_to === 'all' || !state.coupon.applies_to) {
          eligibleSubtotal = subtotal;
        } else {
          const targetIds = state.coupon.target_ids || [];
          eligibleSubtotal = state.items.reduce((sum, item) => {
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
        const subtotal = get().items.reduce((total, item) => total + item.price * item.quantity, 0);
        const discount = get().getCartDiscount();
        return Math.max(0, subtotal - discount);
      },
      getCartCount: () =>
        get().items.reduce((count, item) => count + item.quantity, 0),
    }),
    { name: "portfolio-cart-storage" }
  )
);
