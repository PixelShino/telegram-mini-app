// app/api/cart/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Получение корзины пользователя
export async function GET(request: NextRequest) {
  try {
    const telegram_id = request.nextUrl.searchParams.get('telegram_id');

    if (!telegram_id) {
      return NextResponse.json(
        { error: 'Missing telegram_id parameter' },
        { status: 400 },
      );
    }

    const supabase = createClient();

    // Получаем товары в корзине с информацией о продуктах
    const { data, error } = await supabase
      .from('cart_items')
      .select(
        `
        id,
        quantity,
        product_id,
        products:product_id (
          id,
          name,
          price,
          image_url
        )
      `,
      )
      .eq('telegram_id', telegram_id);

    if (error) {
      console.error('Ошибка при получении корзины:', error);
      return NextResponse.json(
        { error: 'Failed to fetch cart' },
        { status: 500 },
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Ошибка обработки запроса:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error.message || String(error),
      },
      { status: 500 },
    );
  }
}

// Добавление товара в корзину
export async function POST(request: NextRequest) {
  try {
    const { telegram_id, product_id, quantity, shop_id } = await request.json();

    if (!telegram_id || !product_id || !shop_id) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 },
      );
    }

    const supabase = createClient();

    // Проверяем, есть ли уже такой товар в корзине
    const { data: existingItem } = await supabase
      .from('cart_items')
      .select('id, quantity')
      .eq('telegram_id', telegram_id)
      .eq('product_id', product_id)
      .single();

    if (existingItem) {
      // Если количество 0 или меньше, удаляем товар
      if (quantity <= 0) {
        const { error } = await supabase
          .from('cart_items')
          .delete()
          .eq('id', existingItem.id);

        if (error) {
          console.error('Ошибка при удалении товара из корзины:', error);
          return NextResponse.json(
            { error: 'Failed to remove item from cart' },
            { status: 500 },
          );
        }

        return NextResponse.json({ success: true, deleted: true });
      }

      // Обновляем количество
      const { data, error } = await supabase
        .from('cart_items')
        .update({
          quantity,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingItem.id)
        .select()
        .single();

      if (error) {
        console.error('Ошибка при обновлении товара в корзине:', error);
        return NextResponse.json(
          { error: 'Failed to update cart item' },
          { status: 500 },
        );
      }

      return NextResponse.json(data);
    } else {
      // Если количество 0 или меньше, не добавляем товар
      if (quantity <= 0) {
        return NextResponse.json({ success: true, noaction: true });
      }

      // Добавляем новый товар
      const { data, error } = await supabase
        .from('cart_items')
        .insert({
          telegram_id,
          product_id,
          quantity,
          shop_id,
        })
        .select()
        .single();

      if (error) {
        console.error('Ошибка при добавлении товара в корзину:', error);
        return NextResponse.json(
          { error: 'Failed to add item to cart' },
          { status: 500 },
        );
      }

      return NextResponse.json(data);
    }
  } catch (error: any) {
    console.error('Ошибка обработки запроса:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error.message || String(error),
      },
      { status: 500 },
    );
  }
}
