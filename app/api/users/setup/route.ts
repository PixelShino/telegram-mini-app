import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const { userId, email, phone, default_address } = await request.json()

    const supabase = createClient()

    const { data: user, error } = await supabase
      .from("users")
      .update({
        email,
        phone,
        default_address,
      })
      .eq("id", userId)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error("Ошибка обновления пользователя:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
