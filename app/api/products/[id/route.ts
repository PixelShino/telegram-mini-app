// app/api/products/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const id = params.id;

    if (!id) {
      return NextResponse.json(
        { error: 'Missing product ID' },
        { status: 400 },
      );
    }

    const supabase = createClient();

    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Ошибка при получении товара:', error);
      return NextResponse.json(
        { error: 'Failed to fetch product' },
        { status: 500 },
      );
    }

    if (!data) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
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
