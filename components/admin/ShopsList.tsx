"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Store, Eye, Edit, Calendar } from "lucide-react"
import type { Shop } from "@/types/shop"

export default function ShopsList() {
  const [shops, setShops] = useState<Shop[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchShops()
  }, [])

  const fetchShops = async () => {
    try {
      const response = await fetch("/api/shops")
      const data = await response.json()
      setShops(data)
    } catch (error) {
      console.error("Ошибка загрузки магазинов:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="text-center py-8">Загрузка магазинов...</div>
  }

  if (shops.length === 0) {
    return (
      <div className="text-center py-12">
        <Store className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-xl font-semibold mb-2">Пока нет магазинов</h3>
        <p className="text-gray-600 mb-4">Создайте свой первый магазин прямо сейчас!</p>
      </div>
    )
  }

  return (
    <div className="grid gap-4">
      {shops.map((shop) => (
        <Card key={shop.id} className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="text-lg">{shop.name}</CardTitle>
              <CardDescription>{shop.description}</CardDescription>
            </div>
            <Badge variant={shop.status === "active" ? "default" : "secondary"}>
              {shop.status === "active" ? "Активен" : "Неактивен"}
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600 flex items-center gap-4">
                <span>Товаров: {shop.products?.length || 0}</span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {new Date(shop.created_at).toLocaleDateString()}
                </span>
              </div>
              <div className="space-x-2">
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/shop/${shop.id}`} target="_blank">
                    <Eye className="mr-1 h-3 w-3" />
                    Просмотр
                  </Link>
                </Button>
                <Button size="sm" asChild>
                  <Link href={`/admin/shop/${shop.id}`}>
                    <Edit className="mr-1 h-3 w-3" />
                    Редактировать
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
