"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, MapPin, Clock, ShoppingCart, CheckCircle } from "lucide-react"
import type { CartItem } from "@/types/cart"

interface OrderFormProps {
  items: CartItem[]
  totalPrice: number
  user: any
  shop: any
  onBack: () => void
  onSubmit: (orderData: any) => void
}

export default function OrderForm({ items, totalPrice, user, shop, onBack, onSubmit }: OrderFormProps) {
  const [step, setStep] = useState(1) // 1 - адрес и время, 2 - подтверждение, 3 - успех
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [orderId, setOrderId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    address: user.default_address || "",
    comment: "",
    deliveryTime: "",
    useDefaultAddress: !!user.default_address,
  })

  // Временные слоты для доставки
  const deliveryTimeSlots = [
    { value: "asap", label: "Как можно скорее" },
    { value: "morning", label: "Утром (9:00 - 12:00)" },
    { value: "afternoon", label: "Днем (12:00 - 17:00)" },
    { value: "evening", label: "Вечером (17:00 - 21:00)" },
  ]

  const handleSubmit = async () => {
    setIsSubmitting(true)

    try {
      const orderData = {
        shop_id: shop.id,
        user_id: user.id,
        items,
        total_price: totalPrice,
        address: formData.address,
        comment: formData.comment,
        delivery_time: formData.deliveryTime,
      }

      const result = await onSubmit(orderData)

      if (result && result.id) {
        setOrderId(result.id)
      }

      setStep(3)
    } catch (error) {
      console.error("Ошибка при оформлении заказа:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Шаг успешного оформления
  if (step === 3) {
    return (
      <div className="space-y-6 px-4 max-w-md mx-auto">
        <Card>
          <CardContent className="pt-6 pb-6 text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle className="h-16 w-16 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Заказ успешно оформлен!</h2>
            <p className="text-muted-foreground mb-4">
              {orderId ? `Номер заказа: #${orderId.substring(0, 8)}` : "Ваш заказ принят в обработку"}
            </p>
            <p className="mb-6">Мы свяжемся с вами в ближайшее время для подтверждения заказа.</p>
            <Button onClick={onBack} className="w-full">
              Вернуться в магазин
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (step === 1) {
    return (
      <div className="space-y-6 px-4 max-w-md mx-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Оформление заказа</h2>
          <button onClick={onBack} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Адрес доставки
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {user.default_address && (
              <div className="p-3 bg-muted rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Основной адрес:</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        address: user.default_address,
                        useDefaultAddress: true,
                      }))
                    }
                  >
                    Использовать
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">{user.default_address}</p>
              </div>
            )}

            <div>
              <Label htmlFor="address">Адрес доставки *</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
                placeholder="Укажите полный адрес доставки..."
                rows={3}
                required
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Время доставки
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select
              value={formData.deliveryTime}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, deliveryTime: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Выберите время доставки" />
              </SelectTrigger>
              <SelectContent>
                {deliveryTimeSlots.map((slot) => (
                  <SelectItem key={slot.value} value={slot.value}>
                    {slot.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Комментарий к заказу</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={formData.comment}
              onChange={(e) => setFormData((prev) => ({ ...prev, comment: e.target.value }))}
              placeholder="Дополнительные пожелания к заказу..."
              rows={3}
            />
          </CardContent>
        </Card>

        <Button onClick={() => setStep(2)} disabled={!formData.address.trim()} className="w-full">
          Продолжить
        </Button>
      </div>
    )
  }

  // Шаг подтверждения
  return (
    <div className="space-y-6 px-4 max-w-md mx-auto">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Подтверждение заказа</h2>
        <button onClick={() => setStep(1)} className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Детали заказа</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Товары:</h4>
            <div className="space-y-2">
              {items.map(({ product, quantity }) => (
                <div key={product.id} className="flex justify-between text-sm">
                  <span>
                    {product.name} x{quantity}
                  </span>
                  <span>{(Number(product.price) * quantity).toLocaleString()} ₽</span>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t pt-2">
            <div className="flex justify-between font-bold">
              <span>Итого:</span>
              <span>{totalPrice.toLocaleString()} ₽</span>
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-1">Адрес доставки:</h4>
            <p className="text-sm text-muted-foreground">{formData.address}</p>
          </div>

          {formData.deliveryTime && (
            <div>
              <h4 className="font-medium mb-1">Время доставки:</h4>
              <p className="text-sm text-muted-foreground">
                {deliveryTimeSlots.find((slot) => slot.value === formData.deliveryTime)?.label}
              </p>
            </div>
          )}

          {formData.comment && (
            <div>
              <h4 className="font-medium mb-1">Комментарий:</h4>
              <p className="text-sm text-muted-foreground">{formData.comment}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full">
        {isSubmitting ? (
          <span className="animate-pulse">Оформление...</span>
        ) : (
          <>
            <ShoppingCart className="mr-2 h-4 w-4" />
            Подтвердить заказ
          </>
        )}
      </Button>
    </div>
  )
}
