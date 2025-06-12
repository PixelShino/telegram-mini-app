import type { Product } from "./product"

export interface OrderItem {
  product: Product
  quantity: number
}

export interface Order {
  id: string
  shop_id: string
  telegram_user_id: string
  telegram_username?: string
  items: OrderItem[]
  total_amount: number
  status: "pending" | "confirmed" | "completed" | "cancelled"
  created_at: string
  updated_at: string
}
