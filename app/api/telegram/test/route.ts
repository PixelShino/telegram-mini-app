import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const userAgent = request.headers.get("user-agent") || "Unknown"

  // Проверяем, запрос из Telegram или нет
  const isTelegram = userAgent.includes("Telegram") || userAgent.includes("TelegramBot")

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    userAgent,
    isTelegram,
    headers: Object.fromEntries(request.headers.entries()),
    url: request.url,
    method: request.method,
  })
}
