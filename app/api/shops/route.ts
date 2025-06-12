import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  const supabase = createClient()

  const { data: shops, error } = await supabase
    .from("shops")
    .select(`
      *,
      products (*)
    `)
    .order("created_at", { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(shops)
}

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const body = await request.json()

  const { data: shop, error } = await supabase
    .from("shops")
    .insert([
      {
        name: body.name,
        description: body.description,
        bot_token: body.bot_token,
        status: "active",
        settings: {
          welcome_message: "Добро пожаловать в наш магазин!",
        },
      },
    ])
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(shop)
}
