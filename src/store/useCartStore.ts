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
}

interface CartState {
  items: CartItem[];
  isOpen: boolean; // Controls UI visibility
  openCart: () => void;
  closeCart: () => void;
  addItem: (item: CartItem) => void;
  removeItem: (id: string, variant?: string) => void;
  updateQuantity: (id: string, quantity: number, variant?: string) => void;
  clearCart: () => void;
  getCartTotal: () => number;
  getCartCount: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

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

      clearCart: () => set({ items: [], isOpen: false }),
      getCartTotal: () =>
        get().items.reduce(
          (total, item) => total + item.price * item.quantity,
          0
        ),
      getCartCount: () =>
        get().items.reduce((count, item) => count + item.quantity, 0),
    }),
    { name: "portfolio-cart-storage" }
  )
);
