"use client"

import type React from "react"
import { useHapticFeedback } from "@tma.js/sdk-react"
import { useCartStore } from "../stores/cartStore"
import type { Product } from "../types/product"

interface ProductItemProps {
  product: Product
}

const ProductItem: React.FC<ProductItemProps> = ({ product }) => {
  const { addItem } = useCartStore()
  const hapticFeedback = useHapticFeedback()

  const handleAddToCart = () => {
    addItem(product)
    // Тактильная обратная связь
    if (hapticFeedback) {
      hapticFeedback.impactOccurred("light")
    }
  }

  return (
    <div className="border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
      <img
        src={product.imageUrl || "/placeholder.svg"}
        alt={product.name}
        className="w-full h-40 object-cover rounded-md mb-3"
      />
      <h3 className="font-bold text-lg mb-1">{product.name}</h3>
      <p className="text-gray-600 text-sm mb-2">{product.description}</p>
      <div className="flex justify-between items-center">
        <span className="text-xl font-bold text-blue-600">${product.price}</span>
        <button
          onClick={handleAddToCart}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
        >
          В корзину
        </button>
      </div>
    </div>
  )
}

export default ProductItem
