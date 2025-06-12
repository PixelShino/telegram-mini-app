import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { processCommand } from "@/lib/bot/commands"

// Обработчик вебхуков от Telegram
export async function POST(request: NextRequest) {
  try {
    const update = await request.json()

    // Проверяем, что это сообщение
    if (!update.message) {
      return NextResponse.json({ ok: true })
    }

    const message = update.message
    const chatId = message.chat.id
    const text = message.text || ""

    // Проверяем, является ли пользователь администратором
    const isAdmin = await checkIfAdmin(chatId)

    if (text.startsWith("/") && isAdmin) {
      // Обрабатываем команду администратора
      await processCommand(text, chatId, message.from)
    } else if (isAdmin) {
      // Обрабатываем обычное сообщение от администратора
      await sendMessage(chatId, "Используйте команды для управления магазином. /help для справки.")
    } else {
      // Обычный пользователь
      await sendMessage(chatId, "Добро пожаловать! Используйте кнопку меню для доступа к магазину.")
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Ошибка обработки вебхука:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

// Проверка, является ли пользователь администратором
async function checkIfAdmin(telegramId: number): Promise<boolean> {
  const supabase = createClient()

  const { data } = await supabase.from("shop_admins").select("*").eq("telegram_id", telegramId).single()

  return !!data
}

// Отправка сообщения в Telegram
async function sendMessage(chatId: number, text: string) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN

  if (!botToken) {
    console.error("TELEGRAM_BOT_TOKEN не настроен")
    return
  }

  await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      chat_id: chatId,
      text: text,
      parse_mode: "HTML",
    }),
  })
}
