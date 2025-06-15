'use client';

import { useState, useEffect, useMemo } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Plus,
  Minus,
  Trash2,
  Store,
  ShoppingBag,
  Package,
  CheckCircle,
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import type { Shop } from '@/types/shop';
import type { Product } from '@/types/product';
import type { TelegramUser } from '@/types/user';
import type { CartItem } from '@/types/cart';
import ProductModal from './ProductModal';
import OrderForm from './OrderForm';
import SearchBar from './SearchBar';
import CategoryFilter from './CategoryFilter';
import FixedCartBar from './FixedCartBar';
import ProductCard from './ProductCard';
import CartAddons from './CartAddons';
import TelegramShopDebug from './TelegramShopDebug';

interface CartState {
  items: CartItem[];
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  getTotalPrice: () => number;
  getTotalItems: () => number;
  getItemQuantity: (productId: string) => number;
  clearCart: () => void;
}

const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (product, quantity = 1) =>
        set((state) => {
          const existingItem = state.items.find(
            (item) => item.product.id === product.id,
          );
          if (existingItem) {
            return {
              items: state.items.map((item) =>
                item.product.id === product.id
                  ? { ...item, quantity: item.quantity + quantity }
                  : item,
              ),
            };
          }
          return { items: [...state.items, { product, quantity }] };
        }),
      removeItem: (productId) =>
        set((state) => ({
          items: state.items.filter((item) => item.product.id !== productId),
        })),
      updateQuantity: (productId, quantity) =>
        set((state) => ({
          items:
            quantity <= 0
              ? state.items.filter((item) => item.product.id !== productId)
              : state.items.map((item) =>
                  item.product.id === productId ? { ...item, quantity } : item,
                ),
        })),
      getTotalPrice: () => {
        const { items } = get();
        return items.reduce(
          (total, item) => total + item.product.price * item.quantity,
          0,
        );
      },
      getTotalItems: () => {
        const { items } = get();
        return items.reduce((total, item) => total + item.quantity, 0);
      },
      getItemQuantity: (productId) => {
        const { items } = get();
        const item = items.find((item) => item.product.id === productId);
        return item ? item.quantity : 0;
      },
      clearCart: () => set({ items: [] }),
    }),
    {
      name: 'cart-storage',
    },
  ),
);

interface ShopContentProps {
  shop: Shop;
  telegramUser: TelegramUser;
  isTelegram: boolean;
  user: any;
}

export default function ShopContent({
  shop,
  telegramUser,
  isTelegram,
}: ShopContentProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<'products' | 'cart' | 'order'>(
    'products',
  );
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(
    null,
  );

  const {
    items,
    addItem,
    removeItem,
    updateQuantity,
    getTotalPrice,
    getTotalItems,
    getItemQuantity,
    clearCart,
  } = useCartStore();

  // Категории товаров с подкатегориями
  const categories = [
    {
      id: 'electronics',
      name: 'Электроника',
      subcategories: [
        { id: 'phones', name: 'Телефоны' },
        { id: 'tablets', name: 'Планшеты' },
        { id: 'smart-devices', name: 'Умные устройства' },
      ],
    },
    {
      id: 'computers',
      name: 'Компьютеры',
      subcategories: [
        { id: 'laptops', name: 'Ноутбуки' },
        { id: 'desktops', name: 'Настольные ПК' },
        { id: 'components', name: 'Комплектующие' },
      ],
    },
    {
      id: 'accessories',
      name: 'Аксессуары',
      subcategories: [
        { id: 'audio', name: 'Аудио' },
        { id: 'input', name: 'Клавиатуры и мыши' },
        { id: 'cases', name: 'Чехлы и сумки' },
      ],
    },
    {
      id: 'watches',
      name: 'Часы',
      subcategories: [
        { id: 'smart-watches', name: 'Умные часы' },
        { id: 'fitness', name: 'Фитнес-браслеты' },
      ],
    },
  ];

  // Фильтрация товаров (исключаем дополнения из основного списка)
  const filteredProducts = useMemo(() => {
    let filtered = products.filter((product) => !product.is_addon);

    if (searchQuery) {
      filtered = filtered.filter(
        (product) =>
          product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.description
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()),
      );
    }

    if (selectedCategory) {
      filtered = filtered.filter((product) => {
        // Фильтрация по категориям
        if (selectedCategory === 'electronics') {
          if (selectedSubcategory === 'phones')
            return product.name.includes('iPhone');
          if (selectedSubcategory === 'tablets')
            return product.name.includes('iPad');
          if (selectedSubcategory === 'smart-devices')
            return product.name.includes('Watch');
          return (
            product.name.includes('iPhone') ||
            product.name.includes('iPad') ||
            product.name.includes('Watch')
          );
        }
        if (selectedCategory === 'computers') {
          if (selectedSubcategory === 'laptops')
            return product.name.includes('MacBook');
          return product.name.includes('MacBook');
        }
        if (selectedCategory === 'accessories') {
          if (selectedSubcategory === 'audio')
            return product.name.includes('AirPods');
          if (selectedSubcategory === 'input')
            return product.name.includes('Keyboard');
          return (
            product.name.includes('AirPods') ||
            product.name.includes('Keyboard')
          );
        }
        if (selectedCategory === 'watches') {
          return product.name.includes('Watch');
        }
        return true;
      });
    }

    return filtered;
  }, [products, searchQuery, selectedCategory, selectedSubcategory]);

  useEffect(() => {
    fetchProducts();
  }, [shop.id]);

  useEffect(() => {
    if (isTelegram && typeof window !== 'undefined') {
      const tg = (window as any).Telegram.WebApp;

      if (currentView === 'order') {
        tg.BackButton.show();
        const handleBackButtonClick = () => setCurrentView('cart');
        tg.BackButton.onClick(handleBackButtonClick);
        return () => tg.BackButton.offClick(handleBackButtonClick);
      } else if (currentView === 'cart') {
        tg.BackButton.show();
        const handleBackButtonClick = () => setCurrentView('products');
        tg.BackButton.onClick(handleBackButtonClick);
        return () => tg.BackButton.offClick(handleBackButtonClick);
      } else {
        tg.BackButton.hide();
      }
    }
  }, [currentView, isTelegram]);

  const fetchProducts = async () => {
    try {
      const response = await fetch(`/api/shops/${shop.id}/products`);
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error('Ошибка загрузки товаров:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (product: Product, quantity = 1) => {
    if (quantity > 0) {
      addItem(product, quantity);
      toast.success(`${product.name} добавлен в корзину`, {
        icon: <ShoppingBag className='w-4 h-4' />,
        duration: 2000,
      });
    } else {
      // Если количество отрицательное, уменьшаем
      const currentQuantity = getItemQuantity(product.id);
      const newQuantity = currentQuantity + quantity;
      if (newQuantity <= 0) {
        removeItem(product.id);
        toast.success(`${product.name} удален из корзины`, {
          icon: <Trash2 className='w-4 h-4' />,
          duration: 2000,
        });
      } else {
        updateQuantity(product.id, newQuantity);
      }
    }
  };

  const handleCategorySelect = (
    categoryId: string | null,
    subcategoryId?: string | null,
  ) => {
    setSelectedCategory(categoryId);
    setSelectedSubcategory(subcategoryId || null);
  };

  const handleOrderSubmit = async (orderData: any) => {
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          shop_id: shop.id,
          telegram_user_id: telegramUser.id,
          telegram_username: telegramUser.username,
          items: orderData.items,
          total_amount: orderData.totalPrice,
          deliveryAddress: orderData.deliveryAddress,
          customerInfo: orderData.customerInfo,
        }),
      });

      if (response.ok) {
        const order = await response.json();
        clearCart();

        toast.success('Заказ успешно оформлен!', {
          icon: <CheckCircle className='w-4 h-4' />,
          duration: 4000,
        });

        // Возвращаем результат для обработки в OrderForm
        return order;
      } else {
        const errorData = await response.json();
        console.error('Ошибка оформления заказа:', errorData);
        toast.error('Ошибка при оформлении заказа');
        throw new Error(errorData.error || 'Ошибка оформления заказа');
      }
    } catch (error) {
      console.error('Ошибка оформления заказа:', error);
      toast.error('Ошибка при оформлении заказа');
      throw error;
    }
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-screen bg-background'>
        <div className='space-y-4 text-center'>
          <Store className='w-16 h-16 mx-auto text-muted-foreground' />
          <p className='text-muted-foreground'>Загрузка товаров...</p>
        </div>
      </div>
    );
  }

  if (currentView === 'order') {
    return (
      <div className='min-h-screen bg-background'>
        <div className='pt-4 pb-20'>
          <OrderForm
            items={items}
            totalPrice={getTotalPrice()}
            onBack={() => setCurrentView('cart')}
            onSubmit={handleOrderSubmit}
            user={telegramUser}
            shop={shop} // telegramUser={telegramUser}
            // isTelegram={isTelegram}
          />
        </div>
        <Toaster position='top-center' />
        <TelegramShopDebug />
      </div>
    );
  }

  if (currentView === 'cart') {
    return (
      <div className='min-h-screen bg-background'>
        <div className='max-w-md px-4 pt-6 pb-20 mx-auto'>
          <div className='flex items-center justify-between mb-6'>
            <h1 className='text-2xl font-bold'>Корзина</h1>
            <Button
              variant='ghost'
              size='sm'
              onClick={() => setCurrentView('products')}
            >
              <ArrowLeft className='w-4 h-4 mr-2' />
              Назад
            </Button>
          </div>

          {items.length === 0 ? (
            <div className='py-16 space-y-4 text-center'>
              <ShoppingBag className='w-16 h-16 mx-auto text-muted-foreground' />
              <h2 className='text-xl font-semibold'>Корзина пуста</h2>
              <p className='text-muted-foreground'>
                Добавьте товары для оформления заказа
              </p>
              <Button
                onClick={() => setCurrentView('products')}
                className='mt-4'
              >
                Перейти к покупкам
              </Button>
            </div>
          ) : (
            <div className='space-y-4'>
              {/* Список товаров в корзине */}
              <div className='space-y-3'>
                {items.map(({ product, quantity }) => (
                  <Card key={product.id}>
                    <CardContent className='p-4'>
                      <div className='flex items-center gap-4'>
                        <div className='flex-shrink-0 w-16 h-16 overflow-hidden rounded-lg bg-muted'>
                          <img
                            src={
                              product.imageUrl ||
                              '/placeholder.svg?height=64&width=64'
                            }
                            alt={product.name}
                            className='object-cover w-full h-full'
                          />
                        </div>

                        <div className='flex-1 min-w-0'>
                          <h3 className='font-semibold truncate'>
                            {product.name}
                          </h3>
                          <p className='text-sm text-muted-foreground'>
                            {product.price.toLocaleString()} ₽ за шт.
                          </p>
                        </div>

                        <div className='flex flex-col items-end gap-2'>
                          <div className='flex items-center gap-2'>
                            <Button
                              variant='outline'
                              size='sm'
                              onClick={() => {
                                if (quantity <= 1) {
                                  removeItem(product.id);
                                  toast.success(
                                    `${product.name} удален из корзины`,
                                    {
                                      icon: <Trash2 className='w-4 h-4' />,
                                      duration: 2000,
                                    },
                                  );
                                } else {
                                  updateQuantity(product.id, quantity - 1);
                                }
                              }}
                              className='w-8 h-8 p-0'
                            >
                              <Minus className='w-3 h-3' />
                            </Button>
                            <span className='w-8 text-sm font-medium text-center'>
                              {quantity}
                            </span>
                            <Button
                              variant='outline'
                              size='sm'
                              onClick={() => {
                                if (
                                  product.allow_quantity_change ||
                                  quantity === 0
                                ) {
                                  updateQuantity(product.id, quantity + 1);
                                  toast.success(
                                    `Добавлено еще: ${product.name}`,
                                    {
                                      icon: <Plus className='w-4 h-4' />,
                                      duration: 2000,
                                    },
                                  );
                                }
                              }}
                              className='w-8 h-8 p-0'
                              disabled={
                                !product.allow_quantity_change && quantity >= 1
                              }
                            >
                              <Plus className='w-3 h-3' />
                            </Button>
                          </div>

                          <div className='text-right'>
                            <div className='font-bold'>
                              {(product.price * quantity).toLocaleString()} ₽
                            </div>
                            <Button
                              variant='ghost'
                              size='sm'
                              onClick={() => {
                                removeItem(product.id);
                                toast.success(
                                  `${product.name} удален из корзины`,
                                  {
                                    icon: <Trash2 className='w-4 h-4' />,
                                    duration: 2000,
                                  },
                                );
                              }}
                              className='h-6 p-1 text-destructive hover:text-destructive'
                            >
                              <Trash2 className='w-3 h-3' />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Дополнения к заказу */}
              <CartAddons
                shopId={shop.id}
                cartItems={items}
                onAddToCart={handleAddToCart}
                getItemQuantity={getItemQuantity}
              />

              {/* Итого */}
              <Card>
                <CardContent className='p-4'>
                  <div className='space-y-3'>
                    <div className='flex items-center justify-between'>
                      <span className='text-lg font-semibold'>Итого:</span>
                      <Badge
                        variant='default'
                        className='px-3 py-1 text-lg font-bold'
                      >
                        {getTotalPrice().toLocaleString()} ₽
                      </Badge>
                    </div>
                    <Button
                      onClick={() => setCurrentView('order')}
                      className='w-full h-12'
                    >
                      Оформить заказ
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
        <Toaster position='top-center' />
        <TelegramShopDebug />
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-background'>
      {/* Фиксированная строка поиска */}
      <SearchBar onSearch={setSearchQuery} />

      {/* Фиксированные категории */}
      <CategoryFilter
        categories={categories}
        selectedCategory={selectedCategory}
        selectedSubcategory={selectedSubcategory}
        onCategorySelect={handleCategorySelect}
      />

      {/* Основной контент */}
      <div className='pt-[96px] pb-24 px-4 max-w-md mx-auto'>
        {/* Заголовок магазина */}
        <header className='pt-4 mb-6 space-y-2 text-center'>
          <h1 className='text-2xl font-bold'>{shop.name}</h1>
          {shop.description && (
            <p className='text-muted-foreground'>{shop.description}</p>
          )}
          {telegramUser.first_name && (
            <p className='text-sm text-primary'>
              Привет, {telegramUser.first_name}!
            </p>
          )}
        </header>

        {/* Список товаров */}
        {filteredProducts.length === 0 ? (
          <div className='py-16 space-y-4 text-center'>
            <Package className='w-16 h-16 mx-auto text-muted-foreground' />
            <h2 className='text-xl font-semibold'>
              {searchQuery || selectedCategory
                ? 'Товары не найдены'
                : 'Товары скоро появятся'}
            </h2>
            {(searchQuery || selectedCategory) && (
              <Button
                variant='outline'
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory(null);
                  setSelectedSubcategory(null);
                }}
              >
                Сбросить фильтры
              </Button>
            )}
          </div>
        ) : (
          <div className='grid grid-cols-2 gap-3'>
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onProductClick={setSelectedProduct}
                onAddToCart={handleAddToCart}
                cartQuantity={getItemQuantity(product.id)}
                isTelegram={isTelegram}
              />
            ))}
          </div>
        )}
      </div>

      {/* Фиксированная корзина внизу */}
      <FixedCartBar
        itemCount={getTotalItems()}
        totalPrice={getTotalPrice()}
        onCartClick={() => setCurrentView('cart')}
        onCheckoutClick={() => setCurrentView('order')}
        isVisible={items.length > 0}
      />

      {/* Модальное окно товара */}
      <ProductModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={handleAddToCart}
        isTelegram={isTelegram}
      />

      <Toaster position='top-center' />
      <TelegramShopDebug />
    </div>
  );
}
