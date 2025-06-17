// app/api/orders/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendOrderStatusNotification } from '@/lib/';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { status } = await request.json();
    const id = params.id;

    if (!id || !status) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 },
      );
    }

    const supabase = createClient();

    // Получаем текущий заказ с информацией о магазине
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .select(
        `
        *,
        shops:shop_id (
          name
        )
      `,
      )
      .eq('id', id)
      .single();

    if (orderError || !orderData) {
      console.error('Ошибка при получении заказа:', orderError);
      return NextResponse.json(
        { error: 'Failed to fetch order' },
        { status: 500 },
      );
    }

    // Обновляем статус заказа
    const { data, error } = await supabase
      .from('orders')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Ошибка при обновлении статуса заказа:', error);
      return NextResponse.json(
        { error: 'Failed to update order status' },
        { status: 500 },
      );
    }

    // Отправляем уведомление в Telegram
    await sendOrderStatusNotification(
      orderData.user_id,
      id,
      orderData.shops.name,
      status,
    );

    return NextResponse.json(data);
  } catch (error) {
    console.error('Ошибка обработки запроса:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
