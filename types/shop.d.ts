import type { Product } from "./product"

export interface Shop {
  id: string
  name: string
  description?: string
  bot_token?: string
  bot_username?: string
  status: "active" | "inactive"
  settings?: {
    welcome_message?: string
    theme_color?: string
    currency?: string
  }
  products?: Product[]
  created_at: string
  updated_at: string
}
