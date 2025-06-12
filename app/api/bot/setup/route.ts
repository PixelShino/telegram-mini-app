import { type NextRequest, NextResponse } from "next/server"

// Настройка вебхука для бота
export async function POST(request: NextRequest) {
  try {
    const { botToken, webhookUrl } = await request.json()

    if (!botToken || !webhookUrl) {
      return NextResponse.json({ error: "Missing botToken or webhookUrl" }, { status: 400 })
    }

    // Устанавливаем вебхук
    const response = await fetch(`https://api.telegram.org/bot${botToken}/setWebhook`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: webhookUrl,
        allowed_updates: ["message", "callback_query"],
      }),
    })

    const data = await response.json()

    if (!data.ok) {
      return NextResponse.json({ error: data.description }, { status: 500 })
    }

    // Устанавливаем команды бота
    await fetch(`https://api.telegram.org/bot${botToken}/setMyCommands`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        commands: [
          { command: "stats", description: "Статистика магазина" },
          { command: "orders", description: "Управление заказами" },
          { command: "products", description: "Список товаров" },
          { command: "addproduct", description: "Добавить товар" },
          { command: "settings", description: "Настройки магазина" },
          { command: "help", description: "Справка по командам" },
        ],
      }),
    })

    return NextResponse.json({ success: true, message: "Webhook and commands set successfully" })
  } catch (error) {
    console.error("Error setting webhook:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

// Получение информации о текущем вебхуке
export async function GET(request: NextRequest) {
  try {
    const botToken = request.nextUrl.searchParams.get("token")

    if (!botToken) {
      return NextResponse.json({ error: "Missing botToken" }, { status: 400 })
    }

    const response = await fetch(`https://api.telegram.org/bot${botToken}/getWebhookInfo`)
    const data = await response.json()

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error getting webhook info:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
