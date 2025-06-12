import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const { shop_id, user_id, items, total_price, address, comment, delivery_time } = await request.json()

    const supabase = createClient()

    // Создаем заказ
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert([
        {
          shop_id,
          user_id,
          address,
          comment,
          status: "pending",
          deliver_on_time: delivery_time === "asap" ? null : new Date().toISOString(),
          deliver_on_price: total_price,
        },
      ])
      .select()
      .single()

    if (orderError) {
      return NextResponse.json({ error: orderError.message }, { status: 500 })
    }

    // Создаем позиции заказа
    const orderItems = items.map((item: any) => ({
      order_id: order.id,
      product_id: item.product.id,
      amount: item.quantity,
      price: Number(item.product.price),
    }))

    const { error: itemsError } = await supabase.from("orders_list").insert(orderItems)

    if (itemsError) {
      return NextResponse.json({ error: itemsError.message }, { status: 500 })
    }

    return NextResponse.json(order)
  } catch (error) {
    console.error("Ошибка создания заказа:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
