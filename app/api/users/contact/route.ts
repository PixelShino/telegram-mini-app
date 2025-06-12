import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const body = await request.json()

  try {
    // Обновляем информацию о пользователе с контактом
    const { data: user, error } = await supabase
      .from("telegram_users")
      .update({
        phone_number: body.phone_number,
        first_name: body.first_name,
        last_name: body.last_name,
        has_shared_contact: true,
        last_active: new Date().toISOString(),
      })
      .eq("telegram_id", body.telegram_id)
      .select()
      .single()

    if (error) {
      console.error("Ошибка обновления контакта пользователя:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, user })
  } catch (error) {
    console.error("Ошибка сохранения контакта:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
