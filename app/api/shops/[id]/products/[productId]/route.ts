// app/api/shops/[id]/products/[productId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; productId: string } },
) {
  try {
    const shopId = params.id;
    const productId = params.productId;
    const data = await request.json();

    console.log('Обновление товара:', { shopId, productId, data });

    // Проверяем, что товар принадлежит указанному магазину
    const supabase = createClient();
    const { data: existingProduct, error: checkError } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .eq('shop_id', shopId)
      .single();

    if (checkError || !existingProduct) {
      console.error('Товар не найден или не принадлежит магазину:', checkError);
      return NextResponse.json(
        { error: 'Product not found or does not belong to the shop' },
        { status: 404 },
      );
    }

    // Подготавливаем данные для обновления
    const productData = {
      name: data.name,
      description: data.description,
      price: Number(data.price),
      product_type: data.product_type,
      is_addon: data.is_addon,
      allow_quantity_change: data.allow_quantity_change,
      addon_category: data.is_addon ? data.addon_category : null,
      sort_order: data.is_addon ? data.sort_order : null,
      images: data.images || [],
      updated_at: new Date().toISOString(),
    };

    // Обновляем товар
    const { error: updateError } = await supabase
      .from('products')
      .update(productData)
      .eq('id', productId);

    if (updateError) {
      console.error('Ошибка обновления товара:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Получаем обновленный товар
    const { data: updatedProduct, error: fetchError } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .single();

    if (fetchError) {
      console.error('Ошибка получения обновленного товара:', fetchError);
      return NextResponse.json(
        { error: 'Product updated but could not fetch the updated data' },
        { status: 500 },
      );
    }

    return NextResponse.json(updatedProduct);
  } catch (error) {
    console.error('Ошибка обработки запроса:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; productId: string } },
) {
  try {
    const shopId = params.id;
    const productId = params.productId;

    // Проверяем, что товар принадлежит указанному магазину
    const supabase = createClient();
    const { data: existingProduct, error: checkError } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .eq('shop_id', shopId)
      .single();

    if (checkError || !existingProduct) {
      return NextResponse.json(
        { error: 'Product not found or does not belong to the shop' },
        { status: 404 },
      );
    }

    // Удаляем товар
    const { error: deleteError } = await supabase
      .from('products')
      .delete()
      .eq('id', productId);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Ошибка обработки запроса:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
