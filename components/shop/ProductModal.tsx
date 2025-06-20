'use client';

import { useEffect, useState, useCallback } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Plus,
  Minus,
  ShoppingCart,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';
import type { Product } from '@/types/product';

interface ProductModalProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (
    product: Product,
    quantity: number,
    singleOrder?: boolean,
  ) => void;
  isTelegram: boolean;
  cartQuantity?: number;
  onGoToCart: () => void;
}

export default function ProductModal({
  product,
  onClose,
  onAddToCart,
  isTelegram,
  cartQuantity = 0,
  onGoToCart,
}: ProductModalProps) {
  const [quantity, setQuantity] = useState(cartQuantity > 0 ? cartQuantity : 1);
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

  useEffect(() => {
    if (product && cartQuantity > 0) {
      setQuantity(cartQuantity);
    } else {
      setQuantity(1);
    }
  }, [product, cartQuantity]);

  if (!product) return null;

  // Получаем изображения товара
  const images =
    product.images && product.images.length > 0
      ? product.images
      : [product.imageUrl || '/placeholder.svg?height=400&width=400'];

  const handleAddToCart = () => {
    // Проверяем, можно ли добавить товар в указанном количестве
    if (!product.allow_quantity_change && quantity > 1) {
      // Если allow_quantity_change = false, ограничиваем количество до 1
      onAddToCart(product, 1);
    } else {
      onAddToCart(product, quantity);
    }
    onClose();
  };

  // Обновите обработчик изменения количества
  const handleQuantityChange = (change: number) => {
    // Добавляем задержку для предотвращения быстрых нажатий
    const now = Date.now();
    if (now - lastClickTime < 500) {
      return; // Игнорируем слишком быстрые нажатия
    }
    setLastClickTime(now);

    if (cartQuantity > 0) {
      // Если товар уже в корзине, сразу обновляем его количество в корзине
      if (change < 0 && cartQuantity <= 1) {
        // Если количество = 1 и нажали минус, удаляем товар полностью
        onAddToCart(product, -cartQuantity);
        onClose(); // Закрываем модальное окно
      } else {
        // Обновляем количество товара в корзине
        onAddToCart(product, change);
        setQuantity(Math.max(1, quantity + change));
      }
    } else {
      // Если товара нет в корзине, просто обновляем локальное состояние
      setQuantity(Math.max(1, quantity + change));
    }

    if (isTelegram && typeof window !== 'undefined') {
      const tg = (window as any).Telegram.WebApp;
      tg.HapticFeedback.impactOccurred('light');
    }
  };

  return (
    <Dialog open={!!product} onOpenChange={() => onClose()}>
      <DialogContent className='max-w-md mx-auto max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle className='text-xl font-bold'>
            {product.name}
          </DialogTitle>
        </DialogHeader>

        <div className='space-y-4'>
          {/* Предупреждение об индивидуальном заказе */}
          {product.single_order_only && (
            <div className='p-3 mb-4 border border-orange-200 rounded-lg bg-orange-50'>
              <div className='flex items-center gap-2'>
                <AlertCircle className='w-4 h-4 text-orange-600' />
                <span className='text-sm font-medium text-orange-800'>
                  Товар требует индивидуальной обработки
                </span>
              </div>
              <p className='mt-1 text-xs text-orange-600'>
                Этот товар нельзя заказать вместе с другими товарами
              </p>
            </div>
          )}

          {/* Слайдер изображений товара */}
          <div className='relative overflow-hidden rounded-lg aspect-square bg-muted'>
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
                      className='object-cover w-full h-full'
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
                  onClick={scrollPrev}
                >
                  <ChevronLeft className='w-6 h-6' />
                </Button>
                <Button
                  variant='ghost'
                  size='icon'
                  className='absolute right-0 z-10 -translate-y-1/2 top-1/2 bg-white/50 hover:bg-white/80'
                  onClick={scrollNext}
                >
                  <ChevronRight className='w-6 h-6' />
                </Button>
              </>
            )}
          </div>

          {/* Информация о товаре */}
          <div className='space-y-3'>
            <div className='flex items-center gap-2'>
              <Badge
                variant='secondary'
                className='px-3 py-1 text-lg font-bold'
              >
                {product.price.toLocaleString()} ₽
              </Badge>
            </div>

            {product.description && (
              <div>
                <h4 className='mb-2 font-semibold'>Описание</h4>
                <DialogDescription className='leading-relaxed text-muted-foreground'>
                  {product.description}
                </DialogDescription>
              </div>
            )}

            {/* Селектор количества - скрываем для индивидуальных заказов */}
            {!product.single_order_only && (
              <div className='space-y-3'>
                <h4 className='font-semibold'>Количество</h4>
                <div className='flex items-center justify-center gap-4'>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => handleQuantityChange(-1)}
                    className='w-10 h-10 p-0'
                    disabled={quantity <= 1 && cartQuantity === 0}
                  >
                    <Minus className='w-4 h-4' />
                  </Button>

                  <span className='w-12 text-xl font-semibold text-center'>
                    {cartQuantity > 0 ? cartQuantity : quantity}
                  </span>

                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => handleQuantityChange(1)}
                    className='w-10 h-10 p-0'
                    disabled={
                      !product.allow_quantity_change && cartQuantity >= 1
                    }
                  >
                    <Plus className='w-4 h-4' />
                  </Button>
                </div>
              </div>
            )}

            {/* Итоговая стоимость и кнопка */}
            <div className='pt-4 space-y-3 border-t'>
              <div className='flex items-center justify-between'>
                <span className='text-lg font-semibold'>Итого:</span>
                <Badge
                  variant='default'
                  className='px-3 py-1 text-lg font-bold'
                >
                  {(
                    product.price * (product.single_order_only ? 1 : quantity)
                  ).toLocaleString()}{' '}
                  ₽
                </Badge>
              </div>

              {cartQuantity > 0 ? (
                // Если товар уже в корзине, показываем только кнопку "Перейти в корзину"
                <Button
                  onClick={() => {
                    onClose();
                    onGoToCart();
                  }}
                  className='w-full h-12'
                >
                  <ShoppingCart className='w-4 h-4 mr-2' />
                  Перейти в корзину
                </Button>
              ) : (
                // Если товара нет в корзине, показываем кнопку добавления
                <Button
                  onClick={() => {
                    if (product.single_order_only) {
                      onAddToCart(product, 1, true);
                      onGoToCart(); // Сразу переходим в корзину
                    } else {
                      handleAddToCart();
                    }
                  }}
                  className='w-full h-12'
                >
                  <ShoppingCart className='w-4 h-4 mr-2' />
                  {product.single_order_only
                    ? 'Заказать индивидуально'
                    : 'Добавить в корзину'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
