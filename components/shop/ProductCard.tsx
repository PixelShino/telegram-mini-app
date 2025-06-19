'use client';

import type React from 'react';
import { useState, useCallback } from 'react';
import useEmblaCarousel from 'embla-carousel-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Plus,
  Minus,
  ShoppingCart,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import type { Product } from '@/types/product';

interface ProductCardProps {
  product: Product;
  onProductClick: (product: Product) => void;
  onAddToCart: (product: Product, quantity: number) => void;
  cartQuantity: number;
  isTelegram: boolean;
}

export default function ProductCard({
  product,
  onProductClick,
  onAddToCart,
  cartQuantity,
  isTelegram,
}: ProductCardProps) {
  const [lastClickTime, setLastClickTime] = useState(0);

  // Настройка слайдера
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });

  // Функции для навигации по слайдеру
  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAddToCart(product, 1);
    if (isTelegram && typeof window !== 'undefined') {
      const tg = (window as any).Telegram.WebApp;
      tg.HapticFeedback.impactOccurred('light');
    }
  };

  const handleQuantityChange = (e: React.MouseEvent, change: number) => {
    e.stopPropagation();

    // Добавляем задержку для предотвращения быстрых нажатий
    const now = Date.now();
    if (now - lastClickTime < 300) {
      return; // Игнорируем слишком быстрые нажатия
    }
    setLastClickTime(now);

    if (change < 0 && cartQuantity <= 1) {
      // Если количество = 1 и нажали минус, удаляем товар полностью
      onAddToCart(product, -cartQuantity);
    } else {
      // Передаем изменение, а не абсолютное значение
      onAddToCart(product, change);
    }

    if (isTelegram && typeof window !== 'undefined') {
      const tg = (window as any).Telegram.WebApp;
      tg.HapticFeedback.impactOccurred('light');
    }
  };

  // Получаем изображения товара
  const images = product.images || [
    product.imageUrl || '/placeholder.svg?height=150&width=150',
  ];

  return (
    <Card
      onClick={() => onProductClick(product)}
      className='cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02] relative overflow-hidden'
    >
      {/* Индикатор товара в корзине */}
      {cartQuantity > 0 && (
        <Badge className='absolute z-10 flex items-center justify-center w-6 h-6 p-0 top-2 right-2'>
          {cartQuantity}
        </Badge>
      )}

      <CardContent className='p-3'>
        <div className='relative mb-3 overflow-hidden rounded-lg aspect-square bg-muted'>
          {/* Слайдер изображений */}
          <div className='overflow-hidden embla' ref={emblaRef}>
            <div className='flex embla__container'>
              {images.map((image, index) => (
                <div
                  key={index}
                  className='embla__slide flex-[0_0_100%] min-w-0'
                >
                  <img
                    src={image}
                    alt={`${product.name} - изображение ${index + 1}`}
                    className='object-cover w-full h-full transition-transform duration-200 hover:scale-105'
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Кнопки навигации слайдера - показываем только если больше 1 изображения */}
          {images.length > 1 && (
            <>
              <Button
                variant='ghost'
                size='icon'
                className='absolute left-0 z-10 -translate-y-1/2 top-1/2 bg-white/50 hover:bg-white/80'
                onClick={(e) => {
                  e.stopPropagation();
                  scrollPrev();
                }}
              >
                <ChevronLeft className='w-4 h-4' />
              </Button>
              <Button
                variant='ghost'
                size='icon'
                className='absolute right-0 z-10 -translate-y-1/2 top-1/2 bg-white/50 hover:bg-white/80'
                onClick={(e) => {
                  e.stopPropagation();
                  scrollNext();
                }}
              >
                <ChevronRight className='w-4 h-4' />
              </Button>
            </>
          )}
        </div>

        <div className='space-y-2'>
          <h3 className='text-sm font-semibold leading-tight line-clamp-2'>
            {product.name}
          </h3>

          <div className='text-lg font-bold text-primary'>
            {product.price.toLocaleString()} ₽
          </div>

          {/* Селектор количества - показываем только если товар в корзине */}
          {cartQuantity > 0 ? (
            <div className='flex items-center justify-center gap-2 py-1'>
              <Button
                variant='outline'
                size='sm'
                onClick={(e) => handleQuantityChange(e, -1)}
                className='p-0 h-7 w-7'
              >
                <Minus className='w-3 h-3' />
              </Button>
              <span className='w-8 text-sm font-medium text-center'>
                {cartQuantity}
              </span>
              <Button
                variant='outline'
                size='sm'
                onClick={(e) => handleQuantityChange(e, 1)}
                className='p-0 h-7 w-7'
                disabled={!product.allow_quantity_change && cartQuantity >= 1}
              >
                <Plus className='w-3 h-3' />
              </Button>
            </div>
          ) : (
            /* Кнопка добавления в корзину */
            <Button onClick={handleAddToCart} size='sm' className='w-full h-8'>
              <ShoppingCart className='w-3 h-3 mr-1' />В корзину
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
