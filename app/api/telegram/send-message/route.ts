import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { chatId, message, botToken } = await request.json()

    if (!chatId || !message || !botToken) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
    }

    console.log(`Отправка сообщения в Telegram: chatId=${chatId}, message=${message.substring(0, 50)}...`)

    // Отправляем сообщение через Telegram Bot API
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: "HTML",
      }),
    })

    const data = await response.json()

    if (!data.ok) {
      console.error("Ошибка отправки сообщения в Telegram:", data)
      return NextResponse.json({ error: data.description }, { status: 500 })
    }

    return NextResponse.json({ success: true, messageId: data.result.message_id })
  } catch (error) {
    console.error("Ошибка при отправке сообщения в Telegram:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
