export interface Product {
  id: string
  shop_id: string
  name: string
  description?: string
  price: number
  imageUrl?: string
  status: "active" | "inactive"
  product_type: "product" | "addon" | "service"
  allow_quantity_change: boolean
  is_addon: boolean
  related_categories: string[]
  addon_category?: string
  sort_order: number
  created_at: string
  updated_at: string
}
