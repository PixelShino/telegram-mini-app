"use client"

import { useEffect, useState } from "react"
import ShopContent from "./ShopContent"
import TelegramShopDebug from "./TelegramShopDebug"
import type { Shop } from "@/types/shop"
import type { TelegramUser } from "@/types/user"

interface TelegramShopProps {
  shop: Shop
  telegramUser: TelegramUser
}

export default function TelegramShop({ shop, telegramUser }: TelegramShopProps) {
  const [isTelegram, setIsTelegram] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Проверяем и инициализируем Telegram WebApp, если доступен
    try {
      const tg = (window as any).Telegram?.WebApp

      if (tg) {
        console.log("Telegram WebApp обнаружен:", tg)

        // Инициализируем WebApp
        tg.ready()
        tg.expand()

        setIsTelegram(true)

        // Получаем данные пользователя из Telegram
        const user = tg.initDataUnsafe?.user
        if (user) {
          // Сохраняем пользователя в БД
          saveUserToDatabase(user)
        }

        console.log("Telegram WebApp инициализирован")
      } else {
        console.log("Telegram WebApp не обнаружен, работаем в веб-режиме")
        setIsTelegram(false)
      }
    } catch (err) {
      console.error("Ошибка при инициализации Telegram WebApp:", err)
      setIsTelegram(false)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const saveUserToDatabase = async (user: any) => {
    try {
      await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          telegram_id: user.id,
          username: user.username,
          first_name: user.first_name,
          last_name: user.last_name,
          language_code: user.language_code,
        }),
      })
    } catch (error) {
      console.error("Ошибка сохранения пользователя:", error)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-4xl mb-4">🛍️</div>
          <p>Загрузка магазина...</p>
        </div>
      </div>
    )
  }

  // Всегда показываем магазин, независимо от окружения
  return (
    <div
      className="min-h-screen"
      style={{
        backgroundColor: isTelegram ? (window as any).Telegram?.WebApp?.themeParams?.bg_color || "#ffffff" : "#ffffff",
        color: isTelegram ? (window as any).Telegram?.WebApp?.themeParams?.text_color || "#000000" : "#000000",
      }}
    >
      <ShopContent shop={shop} telegramUser={telegramUser} isTelegram={isTelegram} />
      <TelegramShopDebug />
    </div>
  )
}
