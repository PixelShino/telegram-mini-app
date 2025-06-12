export interface User {
  id: number
  created: string
  name?: string
  username?: string
  avatar?: string
  email?: string
  phone?: string
  default_address?: string
  manager: boolean
}

export interface Shop {
  id: number
  created: string
  name?: string
  url?: string
  description?: string
  min_price_delivery_free: number
  active: boolean
}

export interface Product {
  id: number
  created_at: string
  shop_id?: number
  name?: string
  category?: string
  price?: string
  amount?: number
  sold: number
}

export interface Order {
  id: string
  created: string
  shop_id?: number
  coupon?: string
  user_id?: number
  manager_id?: string
  status?: string
  address?: string
  comment?: string
  deliver_on_time?: string
  deliver_on_price?: number
}

export interface OrderItem {
  id: number
  order_id?: string
  product_id?: number
  amount?: number
  price?: number
}

export interface Group {
  id: number
  name: string
  full_access: boolean
  add_products: boolean
  edit_produtst: boolean
  change_order_status: boolean
  importance: number
}
