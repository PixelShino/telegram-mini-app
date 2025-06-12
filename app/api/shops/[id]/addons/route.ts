import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient()

  const { data: addons, error } = await supabase
    .from("products")
    .select("*")
    .eq("shop_id", params.id)
    .eq("is_addon", true)
    .eq("status", "active")
    .order("addon_category", { ascending: true })
    .order("sort_order", { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(addons)
}
