"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ShoppingCart, ArrowRight } from "lucide-react"

interface FixedCartBarProps {
  itemCount: number
  totalPrice: number
  onCartClick: () => void
  onCheckoutClick: () => void
  isVisible: boolean
}

export default function FixedCartBar({
  itemCount,
  totalPrice,
  onCartClick,
  onCheckoutClick,
  isVisible,
}: FixedCartBarProps) {
  if (!isVisible) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-border p-4 z-50">
      <div className="max-w-md mx-auto flex items-center gap-3">
        <Button variant="outline" onClick={onCartClick} className="flex items-center gap-3 h-12 px-4 flex-1">
          <div className="relative">
            <ShoppingCart className="h-5 w-5" />
            <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
              {itemCount}
            </Badge>
          </div>
          <div className="text-left">
            <div className="text-sm text-muted-foreground">
              {itemCount} товар{itemCount > 1 ? (itemCount > 4 ? "ов" : "а") : ""}
            </div>
            <div className="font-semibold">{totalPrice.toLocaleString()} ₽</div>
          </div>
        </Button>

        <Button onClick={onCheckoutClick} className="h-12 px-6">
          Заказать
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
