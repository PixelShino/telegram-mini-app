import { create } from "zustand"
import type { Product } from "../types/product"

interface CartItem {
  product: Product
  quantity: number
}

interface CartState {
  items: CartItem[]
  addItem: (product: Product) => void
  removeItem: (productId: number) => void
  getTotalPrice: () => number
  clearCart: () => void
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],

  addItem: (product) =>
    set((state) => {
      const existingItem = state.items.find((item) => item.product.id === product.id)

      if (existingItem) {
        return {
          items: state.items.map((item) =>
            item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item,
          ),
        }
      }

      return {
        items: [...state.items, { product, quantity: 1 }],
      }
    }),

  removeItem: (productId) =>
    set((state) => ({
      items: state.items.filter((item) => item.product.id !== productId),
    })),

  getTotalPrice: () => {
    const { items } = get()
    return items.reduce((total, item) => total + item.product.price * item.quantity, 0)
  },

  clearCart: () => set({ items: [] }),
}))
