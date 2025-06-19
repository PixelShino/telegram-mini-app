// components/admin/ImageUploader.tsx
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, X, Loader2 } from 'lucide-react';
import { uploadProductImages, deleteProductImage } from '@/lib/storage';

interface ImageUploaderProps {
  productId: number;
  existingImages?: string[];
  onImagesUpdated: (images: string[]) => void;
}

export default function ImageUploader({
  productId,
  existingImages = [],
  onImagesUpdated,
}: ImageUploaderProps) {
  const [images, setImages] = useState<string[]>(existingImages);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Обновляем локальное состояние при изменении existingImages
  useEffect(() => {
    setImages(existingImages);
  }, [existingImages]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setError(null);

    try {
      // Преобразуем FileList в массив
      const fileArray = Array.from(files);

      // Загружаем изображения
      const newImageUrls = await uploadProductImages(
        fileArray,
        productId.toString(),
      );

      // Обновляем список изображений
      const updatedImages = [...images, ...newImageUrls];

      // Обновляем локальное состояние
      setImages(updatedImages);

      // Уведомляем родительский компонент
      onImagesUpdated(updatedImages);

      // Сбрасываем input
      e.target.value = '';
    } catch (err) {
      console.error('Ошибка загрузки изображений:', err);
      setError('Ошибка загрузки изображений. Пожалуйста, попробуйте еще раз.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = async (index: number, e: React.MouseEvent) => {
    // Предотвращаем всплытие события, чтобы не закрывать модальное окно
    e.stopPropagation();
    e.preventDefault();

    try {
      // Получаем URL изображения, которое нужно удалить
      const imageToRemove = images[index];
      console.log('Удаление изображения:', { index, imageToRemove });

      // Удаляем изображение из хранилища
      if (imageToRemove) {
        try {
          await deleteProductImage(imageToRemove);
          console.log('Изображение удалено из хранилища');
        } catch (deleteError) {
          console.error('Ошибка при удалении файла из хранилища:', deleteError);
        }
      }

      // Обновляем список изображений
      const updatedImages = [...images];
      updatedImages.splice(index, 1);
      console.log('Обновленный список изображений:', updatedImages);

      // Обновляем локальное состояние
      setImages(updatedImages);

      // Уведомляем родительский компонент
      onImagesUpdated(updatedImages);
      console.log('Состояние компонента обновлено');
    } catch (err) {
      console.error('Ошибка удаления изображения:', err);
      setError('Ошибка удаления изображения. Пожалуйста, попробуйте еще раз.');
    }
  };

  return (
    <div className='space-y-4'>
      <div className='flex flex-wrap gap-2'>
        {images.map((image, index) => (
          <div
            key={index}
            className='relative w-24 h-24 overflow-hidden rounded-md bg-muted'
          >
            <img
              src={image}
              alt={`Product image ${index + 1}`}
              className='object-cover w-full h-full'
            />
            <Button
              variant='destructive'
              size='icon'
              className='absolute w-5 h-5 top-1 right-1'
              onClick={(e) => handleRemoveImage(index, e)}
              type='button'
            >
              <X className='w-3 h-3' />
            </Button>
          </div>
        ))}

        <label className='flex items-center justify-center w-24 h-24 border-2 border-dashed rounded-md cursor-pointer bg-muted/50 hover:bg-muted'>
          <input
            type='file'
            accept='image/*'
            multiple
            className='hidden'
            onChange={handleFileChange}
            disabled={isUploading}
          />
          {isUploading ? (
            <Loader2 className='w-6 h-6 animate-spin' />
          ) : (
            <Upload className='w-6 h-6' />
          )}
        </label>
      </div>

      {error && <p className='text-sm text-destructive'>{error}</p>}
    </div>
  );
}
