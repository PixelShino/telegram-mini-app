import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import crypto from "crypto"

export async function POST(request: NextRequest) {
  try {
    const { user, initData } = await request.json()

    // Проверяем подлинность данных от Telegram
    if (!verifyTelegramData(initData)) {
      return NextResponse.json({ error: "Invalid Telegram data" }, { status: 401 })
    }

    const supabase = createClient()

    // Проверяем, существует ли пользователь
    const { data: existingUser } = await supabase.from("users").select("*").eq("id", user.id).single()

    if (existingUser) {
      // Обновляем данные существующего пользователя
      const { data: updatedUser, error } = await supabase
        .from("users")
        .update({
          name: `${user.first_name} ${user.last_name || ""}`.trim(),
          username: user.username,
        })
        .eq("id", user.id)
        .select()
        .single()

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json(updatedUser)
    } else {
      // Создаем нового пользователя
      const { data: newUser, error } = await supabase
        .from("users")
        .insert([
          {
            id: user.id,
            name: `${user.first_name} ${user.last_name || ""}`.trim(),
            username: user.username,
            manager: false,
          },
        ])
        .select()
        .single()

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json(newUser)
    }
  } catch (error) {
    console.error("Ошибка авторизации:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

// Проверка подлинности данных от Telegram
function verifyTelegramData(initData: string): boolean {
  if (!process.env.TELEGRAM_BOT_TOKEN) {
    console.warn("TELEGRAM_BOT_TOKEN не установлен")
    return true // В разработке пропускаем проверку
  }

  try {
    const urlParams = new URLSearchParams(initData)
    const hash = urlParams.get("hash")
    urlParams.delete("hash")

    const dataCheckString = Array.from(urlParams.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join("\n")

    const secretKey = crypto.createHmac("sha256", "WebAppData").update(process.env.TELEGRAM_BOT_TOKEN).digest()

    const calculatedHash = crypto.createHmac("sha256", secretKey).update(dataCheckString).digest("hex")

    return calculatedHash === hash
  } catch (error) {
    console.error("Ошибка проверки данных Telegram:", error)
    return false
  }
}
