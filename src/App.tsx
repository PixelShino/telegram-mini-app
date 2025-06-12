"use client"

import { useEffect } from "react"
import { useSDK, useThemeParams, useBackButton } from "@tma.js/sdk-react"
import ProductList from "./components/ProductList"
import Cart from "./components/Cart"
import ThemeWrapper from "./components/ThemeWrapper"
import { useCartStore } from "./stores/cartStore"

function App() {
  const sdk = useSDK()
  const themeParams = useThemeParams()
  const backButton = useBackButton()
  const { items } = useCartStore()

  useEffect(() => {
    // Настройка Telegram WebApp
    if (sdk) {
      sdk.ready()
      sdk.expand()
    }
  }, [sdk])

  useEffect(() => {
    // Обработка кнопки "Назад"
    const handleBackClick = () => {
      if (sdk) {
        sdk.close()
      }
    }

    if (backButton) {
      backButton.on("click", handleBackClick)
      if (items.length > 0) {
        backButton.show()
      } else {
        backButton.hide()
      }

      return () => {
        backButton.off("click", handleBackClick)
      }
    }
  }, [backButton, sdk, items.length])

  return (
    <ThemeWrapper>
      <div className="min-h-screen p-4">
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-center">🛍️ Мини Магазин</h1>
          <p className="text-center text-gray-600 mt-2">Добро пожаловать в наш магазин!</p>
        </header>

        <ProductList />
        <Cart />
      </div>
    </ThemeWrapper>
  )
}

export default App
