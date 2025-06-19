// lib/storage.ts
import { supabase } from '@/lib/supabase/client';

// Загрузка одного изображения
export async function uploadProductImage(
  file: File,
  productId: string,
): Promise<string> {
  // Проверка типа файла
  if (!file.type.startsWith('image/')) {
    throw new Error('Файл должен быть изображением');
  }

  // Создаем уникальное имя файла
  const fileExt = file.name.split('.').pop();
  const fileName = `${productId}_${Date.now()}.${fileExt}`;
  const filePath = `products/${fileName}`;

  // Загружаем файл
  const { data, error } = await supabase.storage
    .from('product-images')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    console.error('Ошибка загрузки изображения:', error);
    throw error;
  }

  // Получаем публичный URL
  const {
    data: { publicUrl },
  } = supabase.storage.from('product-images').getPublicUrl(filePath);

  return publicUrl;
}

// Загрузка нескольких изображений
export async function uploadProductImages(
  files: File[],
  productId: string,
): Promise<string[]> {
  const uploadPromises = files.map((file) =>
    uploadProductImage(file, productId),
  );
  return Promise.all(uploadPromises);
}

// Обновление массива изображений в продукте
export async function updateProductImages(
  productId: number | string,
  imageUrls: string[],
): Promise<void> {
  try {
    console.log('Обновление изображений продукта в базе данных:', {
      productId,
      imageUrls,
    });

    // Преобразуем productId в число, если это строка
    const numericProductId =
      typeof productId === 'string' ? parseInt(productId) : productId;

    // Обновляем только поле images
    const { data, error } = await supabase
      .from('products')
      .update({ images: imageUrls })
      .eq('id', numericProductId)
      .select();

    if (error) {
      console.error('Ошибка обновления изображений продукта:', error);
      throw error;
    }

    console.log('Изображения продукта успешно обновлены в базе данных:', data);
  } catch (error) {
    console.error('Ошибка при обновлении изображений продукта:', error);
    throw error;
  }
}

// Удаление изображения из хранилища
export async function deleteProductImage(imageUrl: string): Promise<void> {
  try {
    // Извлекаем путь файла из URL
    const url = new URL(imageUrl);
    const pathParts = url.pathname.split('/');

    // Находим индекс 'product-images' в пути
    const bucketIndex = pathParts.findIndex(
      (part) => part === 'product-images',
    );
    if (bucketIndex === -1) {
      throw new Error('Неверный формат URL изображения');
    }

    // Получаем путь файла относительно бакета
    const filePath = pathParts.slice(bucketIndex + 1).join('/');

    console.log('Удаление файла из хранилища:', filePath);

    // Удаляем файл из хранилища
    const { error } = await supabase.storage
      .from('product-images')
      .remove([filePath]);

    if (error) {
      console.error('Ошибка удаления изображения из хранилища:', error);
      throw error;
    }
  } catch (error) {
    console.error('Ошибка при удалении изображения:', error);
    throw error;
  }
}
