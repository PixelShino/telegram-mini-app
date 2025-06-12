"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import ProductsManager from "./ProductsManager"
import type { Shop } from "@/types/shop"

interface ShopEditorProps {
  shop: Shop
}

export default function ShopEditor({ shop: initialShop }: ShopEditorProps) {
  const [shop, setShop] = useState(initialShop)
  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/shops/${shop.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(shop),
      })

      if (response.ok) {
        alert("Магазин успешно обновлен!")
      }
    } catch (error) {
      console.error("Ошибка обновления магазина:", error)
    } finally {
      setLoading(false)
    }
  }

  const telegramUrl = `https://t.me/${shop.bot_username}?start=shop_${shop.id}`
  const webUrl = `${process.env.NEXT_PUBLIC_APP_URL}/shop/${shop.id}`

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{shop.name}</h1>
          <p className="text-gray-600">Редактирование магазина</p>
        </div>
        <div className="space-x-2">
          <Badge variant={shop.status === "active" ? "default" : "secondary"}>
            {shop.status === "active" ? "Активен" : "Неактивен"}
          </Badge>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? "Сохранение..." : "💾 Сохранить"}
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Основные настройки</CardTitle>
              <CardDescription>Базовая информация о магазине</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Название магазина</Label>
                <Input id="name" value={shop.name} onChange={(e) => setShop({ ...shop, name: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Описание</Label>
                <Textarea
                  id="description"
                  value={shop.description || ""}
                  onChange={(e) => setShop({ ...shop, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="welcome_message">Приветственное сообщение</Label>
                <Textarea
                  id="welcome_message"
                  value={shop.settings?.welcome_message || ""}
                  onChange={(e) =>
                    setShop({
                      ...shop,
                      settings: { ...shop.settings, welcome_message: e.target.value },
                    })
                  }
                  placeholder="Добро пожаловать в наш магазин!"
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          <ProductsManager shopId={shop.id} />
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>🔗 Ссылки</CardTitle>
              <CardDescription>Ссылки для доступа к магазину</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Telegram Mini App</Label>
                <div className="mt-1 p-2 bg-gray-50 rounded text-sm break-all">{telegramUrl}</div>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2 w-full"
                  onClick={() => navigator.clipboard.writeText(telegramUrl)}
                >
                  📋 Копировать
                </Button>
              </div>
              <div>
                <Label className="text-sm font-medium">Веб-версия</Label>
                <div className="mt-1 p-2 bg-gray-50 rounded text-sm break-all">{webUrl}</div>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2 w-full"
                  onClick={() => window.open(webUrl, "_blank")}
                >
                  🌐 Открыть
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>📊 Статистика</CardTitle>
              <CardDescription>Данные по магазину</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Товаров:</span>
                  <span className="font-medium">{shop.products?.length || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Заказов:</span>
                  <span className="font-medium">0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Выручка:</span>
                  <span className="font-medium">$0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Создан:</span>
                  <span className="font-medium">{new Date(shop.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>⚙️ Настройки бота</CardTitle>
              <CardDescription>Конфигурация Telegram бота</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="bot_username">Username бота</Label>
                <Input
                  id="bot_username"
                  value={shop.bot_username || ""}
                  onChange={(e) => setShop({ ...shop, bot_username: e.target.value })}
                  placeholder="my_shop_bot"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="bot_token">Bot Token</Label>
                <Input
                  id="bot_token"
                  type="password"
                  value={shop.bot_token || ""}
                  onChange={(e) => setShop({ ...shop, bot_token: e.target.value })}
                  placeholder="Токен от @BotFather"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
