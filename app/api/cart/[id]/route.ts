// app/api/cart/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Обновление количества товара
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { quantity } = await request.json();
    const id = params.id;

    if (!id || quantity === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 },
      );
    }

    const supabase = createClient();

    if (quantity <= 0) {
      // Удаляем товар из корзины
      const { error } = await supabase.from('cart_items').delete().eq('id', id);

      if (error) {
        console.error('Ошибка при удалении товара из корзины:', error);
        return NextResponse.json(
          { error: 'Failed to remove item from cart' },
          { status: 500 },
        );
      }

      return NextResponse.json({ success: true, deleted: true });
    } else {
      // Обновляем количество
      const { data, error } = await supabase
        .from('cart_items')
        .update({
          quantity,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
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

// Удаление товара из корзины
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const id = params.id;

    if (!id) {
      return NextResponse.json(
        { error: 'Missing id parameter' },
        { status: 400 },
      );
    }

    const supabase = createClient();

    const { error } = await supabase.from('cart_items').delete().eq('id', id);

    if (error) {
      console.error('Ошибка при удалении товара из корзины:', error);
      return NextResponse.json(
        { error: 'Failed to remove item from cart' },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
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
