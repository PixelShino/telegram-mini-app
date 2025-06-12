import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient()

    const { data: shop, error } = await supabase
      .from("shops")
      .select("*")
      .eq("id", params.id)
      .eq("active", true)
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!shop) {
      return NextResponse.json({ error: "Shop not found" }, { status: 404 })
    }

    return NextResponse.json(shop)
  } catch (error) {
    console.error("Ошибка получения магазина:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
