import { type NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const supabase = createClient();

  const { data: categories, error } = await supabase
    .from('categories') // Убедитесь, что запрос идет к таблице categories
    .select('*')
    .eq('shop_id', params.id)
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('Ошибка при получении категорий:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  console.log('Категории из базы данных:', categories);
  return NextResponse.json(categories);
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const supabase = createClient();
  const body = await request.json();

  // Если указана категория по имени, найдем соответствующую категорию в базе
  let categoryId = body.category_id;

  if (body.category && !categoryId) {
    const { data: categoryData } = await supabase
      .from('categories')
      .select('id')
      .eq('shop_id', params.id)
      .eq('name', body.category)
      .single();

    if (categoryData) {
      categoryId = categoryData.id;
    }
  }

  // Создаем товар
  const { data, error } = await supabase
    .from('products')
    .insert({
      ...body,
      shop_id: params.id,
      category_id: categoryId,
      // Сохраняем текстовое значение категории
      category: body.category || (await getCategoryName(supabase, categoryId)),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data[0]);
}

// Вспомогательная функция для получения имени категории по ID
async function getCategoryName(
  supabase: any,
  categoryId: number | null,
): Promise<string | null> {
  if (!categoryId) return null;

  const { data } = await supabase
    .from('categories')
    .select('name')
    .eq('id', categoryId)
    .single();

  return data ? data.name : null;
}
