"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Plus, Minus, ShoppingCart } from "lucide-react"
import type { Product } from "@/types/product"

interface ProductModalProps {
  product: Product | null
  onClose: () => void
  onAddToCart: (product: Product, quantity: number) => void
  isTelegram: boolean
}

export default function ProductModal({ product, onClose, onAddToCart, isTelegram }: ProductModalProps) {
  const [quantity, setQuantity] = useState(1)

  if (!product) return null

  const handleAddToCart = () => {
    onAddToCart(product, quantity)
    onClose()
  }

  return (
    <Dialog open={!!product} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-md mx-auto max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">{product.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Изображение товара */}
          <div className="aspect-square overflow-hidden rounded-lg bg-muted">
            <img
              src={product.imageUrl || "/placeholder.svg?height=400&width=400"}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Информация о товаре */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-lg font-bold px-3 py-1">
                {product.price.toLocaleString()} ₽
              </Badge>
            </div>

            {product.description && (
              <div>
                <h4 className="font-semibold mb-2">Описание</h4>
                <DialogDescription className="text-muted-foreground leading-relaxed">
                  {product.description}
                </DialogDescription>
              </div>
            )}

            {/* Селектор количества */}
            <div className="space-y-3">
              <h4 className="font-semibold">Количество</h4>
              <div className="flex items-center justify-center gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="h-10 w-10 p-0"
                  disabled={quantity <= 1}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="text-xl font-semibold w-12 text-center">{quantity}</span>
                <Button variant="outline" size="sm" onClick={() => setQuantity(quantity + 1)} className="h-10 w-10 p-0">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Итоговая стоимость и кнопка */}
            <div className="border-t pt-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold">Итого:</span>
                <Badge variant="default" className="text-lg font-bold px-3 py-1">
                  {(product.price * quantity).toLocaleString()} ₽
                </Badge>
              </div>
              <Button onClick={handleAddToCart} className="w-full h-12">
                <ShoppingCart className="mr-2 h-4 w-4" />
                Добавить в корзину
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
