import type React from "react"
import ProductItem from "./ProductItem"
import type { Product } from "../types/product"

const mockProducts: Product[] = [
  {
    id: 1,
    name: "iPhone 15 Pro",
    price: 999,
    description: "Новейший iPhone с камерой Pro",
    imageUrl: "/placeholder.svg?height=200&width=200",
  },
  {
    id: 2,
    name: "MacBook Air M3",
    price: 1299,
    description: "Мощный и легкий ноутбук",
    imageUrl: "/placeholder.svg?height=200&width=200",
  },
  {
    id: 3,
    name: "AirPods Pro",
    price: 249,
    description: "Беспроводные наушники с шумоподавлением",
    imageUrl: "/placeholder.svg?height=200&width=200",
  },
  {
    id: 4,
    name: "Apple Watch Series 9",
    price: 399,
    description: "Умные часы с множеством функций",
    imageUrl: "/placeholder.svg?height=200&width=200",
  },
]

const ProductList: React.FC = () => {
  return (
    <div className="mb-6">
      <h2 className="text-xl font-semibold mb-4">📱 Товары</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {mockProducts.map((product) => (
          <ProductItem key={product.id} product={product} />
        ))}
      </div>
    </div>
  )
}

export default ProductList
