"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { User, MapPin, Phone, Mail } from "lucide-react"
import toast from "react-hot-toast"

interface UserSetupProps {
  user: any
  onComplete: (userData: any) => void
}

export default function UserSetup({ user, onComplete }: UserSetupProps) {
  const [formData, setFormData] = useState({
    email: user.email || "",
    phone: user.phone || "",
    default_address: user.default_address || "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.email || !formData.phone) {
      toast.error("Заполните все обязательные поля")
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch("/api/users/setup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.id,
          ...formData,
        }),
      })

      if (response.ok) {
        const updatedUser = await response.json()
        toast.success("Данные сохранены!")
        onComplete(updatedUser)
      } else {
        toast.error("Ошибка сохранения данных")
      }
    } catch (error) {
      console.error("Ошибка:", error)
      toast.error("Ошибка подключения")
    } finally {
      setIsSubmitting(false)
    }
  }

  const isComplete = formData.email && formData.phone

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <User className="h-12 w-12 mx-auto text-primary mb-4" />
          <CardTitle>Добро пожаловать!</CardTitle>
          <CardDescription>Для начала покупок заполните контактную информацию</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email *
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                placeholder="example@email.com"
                required
              />
            </div>

            <div>
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Телефон *
              </Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                placeholder="+7 (999) 123-45-67"
                required
              />
            </div>

            <div>
              <Label htmlFor="address" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Адрес доставки по умолчанию
              </Label>
              <Textarea
                id="address"
                value={formData.default_address}
                onChange={(e) => setFormData((prev) => ({ ...prev, default_address: e.target.value }))}
                placeholder="Укажите ваш основной адрес доставки..."
                rows={3}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Этот адрес будет использоваться по умолчанию при оформлении заказов
              </p>
            </div>

            <Button type="submit" className="w-full" disabled={!isComplete || isSubmitting}>
              {isSubmitting ? "Сохранение..." : "Продолжить"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
