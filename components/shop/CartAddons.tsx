"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Minus } from "lucide-react"
import type { Product } from "@/types/product"
import type { CartItem } from "@/types/cart"

interface CartAddonsProps {
  shopId: string
  cartItems: CartItem[]
  onAddToCart: (product: Product, quantity: number) => void
  getItemQuantity: (productId: string) => number
}

export default function CartAddons({ shopId, cartItems, onAddToCart, getItemQuantity }: CartAddonsProps) {
  const [addons, setAddons] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAddons()
  }, [shopId, cartItems])

  const fetchAddons = async () => {
    try {
      const response = await fetch(`/api/shops/${shopId}/addons`)
      if (response.ok) {
        const data = await response.json()

        // Фильтруем дополнения по категориям товаров в корзине
        const cartCategories = getCartCategories()
        const relevantAddons = data.filter((addon: Product) =>
          addon.related_categories.some((cat) => cartCategories.includes(cat)),
        )

        setAddons(relevantAddons)
      }
    } catch (error) {
      console.error("Ошибка загрузки дополнений:", error)
    } finally {
      setLoading(false)
    }
  }

  const getCartCategories = () => {
    const categories = new Set<string>()

    cartItems.forEach((item) => {
      // Определяем категорию товара по названию (в реальном проекте лучше хранить в БД)
      if (
        item.product.name.includes("iPhone") ||
        item.product.name.includes("iPad") ||
        item.product.name.includes("Watch")
      ) {
        categories.add("electronics")
      }
      if (item.product.name.includes("MacBook")) {
        categories.add("computers")
      }
      // Добавьте другие категории по необходимости
    })

    return Array.from(categories)
  }

  const groupedAddons = addons.reduce(
    (groups, addon) => {
      const category = addon.addon_category || "other"
      if (!groups[category]) {
        groups[category] = []
      }
      groups[category].push(addon)
      return groups
    },
    {} as Record<string, Product[]>,
  )

  const getCategoryTitle = (category: string) => {
    const titles: Record<string, string> = {
      case: "Защита",
      warranty: "Гарантия",
      protection: "Защитные аксессуары",
      sauce: "Соусы",
      utensils: "Приборы",
      other: "Дополнения",
    }
    return titles[category] || "Дополнения"
  }

  if (loading || addons.length === 0) {
    return null
  }

  return (
    <Card className="mt-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Дополнить заказ</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {Object.entries(groupedAddons).map(([category, categoryAddons]) => (
          <div key={category} className="space-y-2">
            <h4 className="font-medium text-sm text-muted-foreground">{getCategoryTitle(category)}</h4>
            <div className="space-y-2">
              {categoryAddons
                .sort((a, b) => a.sort_order - b.sort_order)
                .map((addon) => {
                  const quantity = getItemQuantity(addon.id)
                  return (
                    <div key={addon.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium text-sm">{addon.name}</div>
                        <div className="text-xs text-muted-foreground">{addon.description}</div>
                        <Badge variant="outline" className="text-xs mt-1">
                          {addon.price.toLocaleString()} ₽
                        </Badge>
                      </div>

                      <div className="flex items-center gap-2">
                        {addon.allow_quantity_change && quantity > 0 ? (
                          // Селектор количества для товаров, где можно менять количество
                          <div className="flex items-center gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onAddToCart(addon, -1)}
                              className="h-7 w-7 p-0"
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="text-sm font-medium w-6 text-center">{quantity}</span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onAddToCart(addon, 1)}
                              className="h-7 w-7 p-0"
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          // Простая кнопка добавления для услуг
                          <Button
                            variant={quantity > 0 ? "default" : "outline"}
                            size="sm"
                            onClick={() => onAddToCart(addon, quantity > 0 ? -quantity : 1)}
                            className="h-8 px-3"
                          >
                            {quantity > 0 ? "Убрать" : "Добавить"}
                          </Button>
                        )}
                      </div>
                    </div>
                  )
                })}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
