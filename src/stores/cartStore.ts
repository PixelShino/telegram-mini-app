import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Product } from '../../types/product'; // Используем основные типы
import type { CartItem } from '../../types/cart';

interface CartState {
  items: CartItem[];
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void; // string, не number
  updateQuantity: (productId: string, quantity: number) => void;
  setItemQuantity: (product: Product, quantity: number) => void;
  getTotalPrice: () => number;
  getTotalItems: () => number;
  getItemQuantity: (productId: string) => number;
  clearCart: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (product, quantity = 1) =>
        set((state) => {
          const existingItem = state.items.find(
            (item) => item.product.id === product.id,
          );

          if (existingItem) {
            return {
              items: state.items.map((item) =>
                item.product.id === product.id
                  ? { ...item, quantity: item.quantity + quantity }
                  : item,
              ),
            };
          }

          return {
            items: [...state.items, { product, quantity }],
          };
        }),

      removeItem: (productId) =>
        set((state) => ({
          items: state.items.filter((item) => item.product.id !== productId),
        })),

      updateQuantity: (productId, quantity) =>
        set((state) => ({
          items:
            quantity <= 0
              ? state.items.filter((item) => item.product.id !== productId)
              : state.items.map((item) =>
                  item.product.id === productId ? { ...item, quantity } : item,
                ),
        })),

      setItemQuantity: (product, quantity) =>
        set((state) => {
          const existingItem = state.items.find(
            (item) => item.product.id === product.id,
          );
          if (existingItem) {
            return {
              items: state.items.map((item) =>
                item.product.id === product.id ? { ...item, quantity } : item,
              ),
            };
          }
          return { items: [...state.items, { product, quantity }] };
        }),

      getTotalPrice: () => {
        const { items } = get();
        return items.reduce(
          (total, item) => total + item.product.price * item.quantity,
          0,
        );
      },

      getTotalItems: () => {
        const { items } = get();
        return items.reduce((total, item) => total + item.quantity, 0);
      },

      getItemQuantity: (productId) => {
        const { items } = get();
        const item = items.find((item) => item.product.id === productId);
        return item ? item.quantity : 0;
      },

      clearCart: () => set({ items: [] }),
    }),
    {
      name: 'cart-storage',
    },
  ),
);

// import { create } from "zustand"
// import type { Product } from "../types/product"

// interface CartItem {
//   product: Product
//   quantity: number
// }

// interface CartState {
//   items: CartItem[]
//   addItem: (product: Product) => void
//   removeItem: (productId: number) => void
//   getTotalPrice: () => number
//   clearCart: () => void
// }

// export const useCartStore = create<CartState>((set, get) => ({
//   items: [],

//   addItem: (product) =>
//     set((state) => {
//       const existingItem = state.items.find((item) => item.product.id === product.id)

//       if (existingItem) {
//         return {
//           items: state.items.map((item) =>
//             item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item,
//           ),
//         }
//       }

//       return {
//         items: [...state.items, { product, quantity: 1 }],
//       }
//     }),

//   removeItem: (productId) =>
//     set((state) => ({
//       items: state.items.filter((item) => item.product.id !== productId),
//     })),

//   getTotalPrice: () => {
//     const { items } = get()
//     return items.reduce((total, item) => total + item.product.price * item.quantity, 0)
//   },

//   clearCart: () => set({ items: [] }),
// }))
