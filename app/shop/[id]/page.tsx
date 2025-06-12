"use client"

import { useState, useEffect } from "react"
import TelegramAuth from "@/components/auth/TelegramAuth"
import UserSetup from "@/components/user/UserSetup"
import ShopContent from "@/components/shop/ShopContent"
import { Toaster } from "react-hot-toast"

interface ShopPageProps {
  params: {
    id: string
  }
}

export default function ShopPage({ params }: ShopPageProps) {
  const [user, setUser] = useState<any>(null)
  const [shop, setShop] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchShop()
  }, [params.id])

  const fetchShop = async () => {
    try {
      const response = await fetch(`/api/shops/${params.id}`)
      if (response.ok) {
        const shopData = await response.json()
        setShop(shopData)
      }
    } catch (error) {
      console.error("Ошибка загрузки магазина:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAuthSuccess = (userData: any) => {
    setUser(userData)
  }

  const handleUserSetupComplete = (userData: any) => {
    setUser(userData)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!shop) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Магазин не найден</h1>
          <p className="text-muted-foreground">Проверьте правильность ссылки</p>
        </div>
      </div>
    )
  }

  // Если пользователь не авторизован
  if (!user) {
    return <TelegramAuth onAuthSuccess={handleAuthSuccess} shopId={params.id} />
  }

  // Если пользователь не заполнил обязательные данные
  if (!user.email || !user.phone) {
    return <UserSetup user={user} onComplete={handleUserSetupComplete} />
  }

  // Показываем магазин
  return (
    <>
      <ShopContent shop={shop} user={user} />
      <Toaster position="top-center" />
    </>
  )
}
