"use client"

import React from "react"
import { useMainButton, useHapticFeedback } from "@tma.js/sdk-react"
import { useCartStore } from "../stores/cartStore"

const Cart: React.FC = () => {
  const { items, removeItem, getTotalPrice } = useCartStore()
  const mainButton = useMainButton()
  const hapticFeedback = useHapticFeedback()

  React.useEffect(() => {
    if (items.length > 0) {
      mainButton?.setText(`Оплатить $${getTotalPrice()}`)
      mainButton?.show()

      const handleMainButtonClick = () => {
        if (hapticFeedback) {
          hapticFeedback.notificationOccurred("success")
        }
        // Здесь будет логика оплаты
        alert("Функция оплаты будет добавлена позже!")
      }

      mainButton?.on("click", handleMainButtonClick)

      return () => {
        mainButton?.off("click", handleMainButtonClick)
      }
    } else {
      mainButton?.hide()
    }
  }, [items, mainButton, hapticFeedback, getTotalPrice])

  const handleRemoveItem = (productId: number) => {
    removeItem(productId)
    if (hapticFeedback) {
      hapticFeedback.impactOccurred("medium")
    }
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">🛒 Корзина пуста</p>
      </div>
    )
  }

  return (
    <div className="mt-6">
      <h2 className="text-xl font-semibold mb-4">🛒 Корзина ({items.length})</h2>
      <div className="space-y-3">
        {items.map(({ product, quantity }) => (
          <div key={product.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
            <div className="flex items-center space-x-3">
              <img
                src={product.imageUrl || "/placeholder.svg"}
                alt={product.name}
                className="w-12 h-12 object-cover rounded"
              />
              <div>
                <h4 className="font-medium">{product.name}</h4>
                <p className="text-sm text-gray-600">Количество: {quantity}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="font-bold">${product.price * quantity}</span>
              <button
                onClick={() => handleRemoveItem(product.id)}
                className="text-red-500 hover:text-red-700 px-2 py-1"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 p-4 bg-blue-50 rounded-lg">
        <div className="flex justify-between items-center">
          <span className="text-lg font-semibold">Итого:</span>
          <span className="text-xl font-bold text-blue-600">${getTotalPrice()}</span>
        </div>
      </div>
    </div>
  )
}

export default Cart
