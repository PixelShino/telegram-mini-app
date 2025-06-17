import { type NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface Product {
  id: number;
  name: string;
  price: number;
  status: string;
  is_addon: boolean;
  addon_category?: string;
  sort_order?: number;
  [key: string]: any; // Для других полей
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const supabase = createClient();
  const productId = request.nextUrl.searchParams.get('product_id');
  const category = request.nextUrl.searchParams.get('category');

  let query = supabase
    .from('products')
    .select('*')
    .eq('shop_id', params.id)
    .eq('is_addon', true)
    .eq('status', 'active');

  // Получаем все дополнения
  const { data: allAddons, error: allAddonsError } = await query
    .order('addon_category', { ascending: true })
    .order('sort_order', { ascending: true });

  if (allAddonsError) {
    return NextResponse.json(
      { error: allAddonsError.message },
      { status: 500 },
    );
  }

  // Если указан ID товара, получаем дополнения для этого товара
  let productAddons: Product[] = [];
  if (productId) {
    const { data: productAddonIds, error: productAddonsError } = await supabase
      .from('product_addons')
      .select('addon_id')
      .eq('product_id', productId);

    if (!productAddonsError && productAddonIds) {
      productAddons = (allAddons as Product[]).filter((addon) =>
        productAddonIds.some((item) => item.addon_id === addon.id),
      );
    }
  }

  // Если указана категория, получаем дополнения для этой категории
  let categoryAddons: Product[] = [];
  if (category) {
    const { data: categoryAddonIds, error: categoryAddonsError } =
      await supabase
        .from('category_addons')
        .select('addon_id')
        .eq('category', category);

    if (!categoryAddonsError && categoryAddonIds) {
      categoryAddons = (allAddons as Product[]).filter((addon) =>
        categoryAddonIds.some((item) => item.addon_id === addon.id),
      );
    }
  }

  // Объединяем результаты с приоритетом для товаров
  let result: Product[] = [];

  if (productId) {
    // Если указан ID товара, приоритет у дополнений для товара
    result = [...productAddons];

    // Добавляем дополнения для категории, которых нет в дополнениях для товара
    if (category) {
      categoryAddons.forEach((addon) => {
        if (!result.some((item) => item.id === addon.id)) {
          result.push(addon);
        }
      });
    }
  } else if (category) {
    // Если указана только категория
    result = categoryAddons;
  } else {
    // Если не указаны ни товар, ни категория, возвращаем все дополнения
    result = allAddons as Product[];
  }

  return NextResponse.json(result);
}
