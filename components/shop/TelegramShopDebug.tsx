"use client"

import { useState, useEffect } from "react"

export default function TelegramShopDebug() {
  const [debugInfo, setDebugInfo] = useState<any>({})
  const [showDebug, setShowDebug] = useState(false)

  useEffect(() => {
    if (typeof window !== "undefined") {
      const tg = (window as any).Telegram?.WebApp

      if (tg) {
        setDebugInfo({
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
      } else {
        setDebugInfo({
          error: "Telegram WebApp не обнаружен",
          window: typeof window !== "undefined",
          telegramObject: typeof (window as any).Telegram !== "undefined",
          userAgent: navigator.userAgent,
        })
      }
    }
  }, [])

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={() => setShowDebug(!showDebug)}
        className="bg-gray-800 text-white rounded-full w-10 h-10 flex items-center justify-center shadow-lg"
      >
        🐞
      </button>

      {showDebug && (
        <div className="absolute bottom-12 right-0 bg-white p-4 rounded-lg shadow-lg w-80 max-h-96 overflow-auto">
          <h3 className="font-bold mb-2">Telegram WebApp Debug</h3>
          <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto">{JSON.stringify(debugInfo, null, 2)}</pre>
        </div>
      )}
    </div>
  )
}
