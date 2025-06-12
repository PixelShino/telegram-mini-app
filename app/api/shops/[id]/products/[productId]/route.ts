import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function PUT(request: NextRequest, { params }: { params: { id: string; productId: string } }) {
  const supabase = createClient()
  const body = await request.json()

  const { data: product, error } = await supabase
    .from("products")
    .update(body)
    .eq("id", params.productId)
    .eq("shop_id", params.id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(product)
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string; productId: string } }) {
  const supabase = createClient()

  const { error } = await supabase.from("products").delete().eq("id", params.productId).eq("shop_id", params.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
