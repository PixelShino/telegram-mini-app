// app/api/products/[id]/addons/route.ts
import { type NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Добавление связи между товаром и дополнением
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const productId = params.id;
  const { addon_id } = await request.json();

  const supabase = createClient();

  const { data, error } = await supabase
    .from('product_addons')
    .insert({ product_id: productId, addon_id })
    .select();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
