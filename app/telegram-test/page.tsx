"use client"

import { useEffect, useState } from "react"

export default function TelegramTestPage() {
  const [telegramInfo, setTelegramInfo] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Проверяем наличие Telegram WebApp
    const tg = (window as any).Telegram?.WebApp

    if (tg) {
      try {
        // Инициализируем WebApp
        tg.ready()
        tg.expand()

        setTelegramInfo({
          platform: tg.platform,
          version: tg.version,
          colorScheme: tg.colorScheme,
          themeParams: tg.themeParams,
          isExpanded: tg.isExpanded,
          viewportHeight: tg.viewportHeight,
          viewportStableHeight: tg.viewportStableHeight,
          headerColor: tg.headerColor,
          backgroundColor: tg.backgroundColor,
          initData: tg.initData ? "Присутствует" : "Отсутствует",
          initDataUnsafe: tg.initDataUnsafe
            ? {
                user: tg.initDataUnsafe.user
                  ? {
                      id: tg.initDataUnsafe.user.id,
                      first_name: tg.initDataUnsafe.user.first_name,
                      username: tg.initDataUnsafe.user.username,
                    }
                  : "Отсутствует",
                start_param: tg.initDataUnsafe.start_param,
              }
            : "Отсутствует",
        })
      } catch (err) {
        setError(`Ошибка инициализации: ${err instanceof Error ? err.message : String(err)}`)
      }
    } else {
      setError("Telegram WebApp не обнаружен")
    }

    // Получаем информацию о запросе
    fetch("/api/telegram/test")
      .then((res) => res.json())
      .then((data) => {
        setTelegramInfo((prev) => ({ ...prev, request: data }))
      })
      .catch((err) => {
        setError(`Ошибка API: ${err.message}`)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-4xl mb-4">🔍</div>
          <p>Проверка Telegram WebApp...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-lg mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-4">Telegram WebApp Test</h1>

        {error ? (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <strong>Ошибка:</strong> {error}
          </div>
        ) : (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            <strong>Успех!</strong> Telegram WebApp обнаружен и инициализирован.
          </div>
        )}

        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-2">Отладочная информация:</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-x-auto text-sm">{JSON.stringify(telegramInfo, null, 2)}</pre>
        </div>

        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-2">Инструкции:</h2>
          <ol className="list-decimal pl-5 space-y-2">
            <li>Убедитесь, что вы открываете это приложение через Telegram бота</li>
            <li>Проверьте, что в BotFather правильно настроен URL для Mini App</li>
            <li>
              URL должен быть в формате: <code>https://yourdomain.com/tgapp/SHOP_ID</code>
            </li>
            <li>Проверьте, что скрипт Telegram WebApp загружен (telegram-web-app.js)</li>
          </ol>
        </div>

        <div className="mt-6 flex justify-center">
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
          >
            Обновить страницу
          </button>
        </div>
      </div>
    </div>
  )
}
