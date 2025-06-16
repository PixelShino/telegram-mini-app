// app/api/orders/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const {
      shop_id,
      telegram_id,
      items,
      total_price,
      address,
      comment,
      delivery_time,
      customerInfo,
    } = await request.json();

    if (!shop_id || !items || !total_price || !address) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 },
      );
    }

    const supabase = createClient();

    // 1. Создаем заказ с адресом в отдельных полях
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        shop_id,
        user_id: telegram_id, // Используем telegram_id вместо user_id
        status: 'pending',
        // Добавляем отдельные поля адреса
        country: address.country || '',
        city: address.city || '',
        street: address.street || '',
        house_number: address.house || '',
        is_private_house: address.isPrivateHouse || false,
        apartment: address.apartment ? parseInt(address.apartment) : null,
        entrance: address.entrance ? parseInt(address.entrance) : null,
        floor: address.floor ? parseInt(address.floor) : null,
        intercom_code: address.intercom || '',
        // Добавляем контактные данные
        phone: customerInfo?.phone || '',
        email: customerInfo?.email || '',
        comment,
        deliver_on_time: delivery_time === 'asap' ? null : delivery_time,
        total_amount: total_price,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (orderError) {
      console.error('Ошибка при создании заказа:', orderError);
      return NextResponse.json(
        { error: 'Failed to create order' },
        { status: 500 },
      );
    }

    // 2. Добавляем товары в заказ
    const orderItems = items.map((item: any) => ({
      order_id: order.id,
      product_id: item.product.id,
      amount: item.quantity,
      price: item.product.price,
    }));

    const { error: itemsError } = await supabase
      .from('orders_list')
      .insert(orderItems);

    if (itemsError) {
      console.error('Ошибка при добавлении товаров в заказ:', itemsError);
      // Удаляем созданный заказ, если не удалось добавить товары
      await supabase.from('orders').delete().eq('id', order.id);

      return NextResponse.json(
        { error: 'Failed to add items to order' },
        { status: 500 },
      );
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error('Ошибка обработки запроса:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
