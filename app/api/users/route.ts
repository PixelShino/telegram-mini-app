import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const body = await request.json()

  // Проверяем, существует ли пользователь
  const { data: existingUser } = await supabase
    .from("telegram_users")
    .select("*")
    .eq("telegram_id", body.telegram_id)
    .single()

  if (existingUser) {
    // Обновляем данные существующего пользователя
    const { data: user, error } = await supabase
      .from("telegram_users")
      .update({
        username: body.username,
        first_name: body.first_name,
        last_name: body.last_name,
        language_code: body.language_code,
        last_active: new Date().toISOString(),
      })
      .eq("telegram_id", body.telegram_id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(user)
  } else {
    // Создаем нового пользователя
    const { data: user, error } = await supabase
      .from("telegram_users")
      .insert([
        {
          telegram_id: body.telegram_id,
          username: body.username,
          first_name: body.first_name,
          last_name: body.last_name,
          language_code: body.language_code,
          last_active: new Date().toISOString(),
        },
      ])
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(user)
  }
}
