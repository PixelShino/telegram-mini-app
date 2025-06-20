'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
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
  AlertCircle,
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
import { useCartStore } from '@/src/stores/cartStore';

// interface CartState {
//   items: CartItem[];
//   addItem: (product: Product, quantity?: number) => void;
//   removeItem: (productId: string) => void;
//   updateQuantity: (productId: string, quantity: number) => void;
//   getTotalPrice: () => number;
//   getTotalItems: () => number;
//   getItemQuantity: (productId: string) => number;
//   clearCart: () => void;
// }
interface Category {
  id: number | string;
  name: string;
  slug?: string;
  parent_id?: number | null;
  shop_id?: string;
  sort_order?: number;
  created_at?: string;
  updated_at?: string;
  children?: Category[];
}

// const useCartStore = create<CartState>()(
//   persist(
//     (set, get) => ({
//       items: [],
//       addItem: (product, quantity = 1) =>
//         set((state) => {
//           const existingItem = state.items.find(
//             (item) => item.product.id === product.id,
//           );
//           if (existingItem) {
//             return {
//               items: state.items.map((item) =>
//                 item.product.id === product.id
//                   ? { ...item, quantity: item.quantity + quantity }
//                   : item,
//               ),
//             };
//           }
//           return { items: [...state.items, { product, quantity }] };
//         }),
//       removeItem: (productId) =>
//         set((state) => ({
//           items: state.items.filter((item) => item.product.id !== productId),
//         })),
//       updateQuantity: (productId, quantity) =>
//         set((state) => ({
//           items:
//             quantity <= 0
//               ? state.items.filter((item) => item.product.id !== productId)
//               : state.items.map((item) =>
//                   item.product.id === productId ? { ...item, quantity } : item,
//                 ),
//         })),
//       getTotalPrice: () => {
//         const { items } = get();
//         return items.reduce(
//           (total, item) => total + item.product.price * item.quantity,
//           0,
//         );
//       },
//       getTotalItems: () => {
//         const { items } = get();
//         return items.reduce((total, item) => total + item.quantity, 0);
//       },
//       getItemQuantity: (productId) => {
//         const { items } = get();
//         const item = items.find((item) => item.product.id === productId);
//         return item ? item.quantity : 0;
//       },
//       clearCart: () => set({ items: [] }),
//     }),
//     {
//       name: 'cart-storage',
//     },
//   ),
// );

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
  // const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<'products' | 'cart' | 'order'>(
    'products',
  );
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(
    null,
  );
  const [saveCartInProgress, setSaveCartInProgress] = useState(false);
  const saveCartTimeout = useRef<NodeJS.Timeout | null>(null);
  const [isLoadingCart, setIsLoadingCart] = useState(false);

  const [isProcessingCart, setIsProcessingCart] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [loadingStates, setLoadingStates] = useState({
    products: true,
    categories: true,
    cart: false,
  });

  const {
    items,
    addItem,
    removeItem,
    updateQuantity,
    setItemQuantity,
    getTotalPrice,
    getTotalItems,
    getItemQuantity,
    clearCart,
  } = useCartStore();
  const [categories, setCategories] = useState<Category[]>([]);

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
        // Проверяем по category_id (если есть)
        if (
          product.category_id &&
          product.category_id.toString() === selectedCategory
        ) {
          return true;
        }

        // Проверяем по текстовому полю category
        if (selectedSubcategory) {
          // Если выбрана подкатегория, ищем точное совпадение с текстовым полем
          const subcategory = categories.find(
            (c) => c.id.toString() === selectedSubcategory,
          );
          return product.category === subcategory?.name;
        } else {
          // Если выбрана только основная категория
          const category = categories.find(
            (c) => c.id.toString() === selectedCategory,
          );

          // Проверяем совпадение с текстовым полем category
          if (product.category === category?.name) {
            return true;
          }

          // Проверяем, является ли категория родительской для категории товара
          const productCategoryObj = categories.find(
            (c) =>
              c.name === product.category ||
              (product.category_id && c.id === product.category_id),
          );

          return productCategoryObj?.parent_id?.toString() === selectedCategory;
        }
      });
    }

    return filtered;
  }, [
    products,
    searchQuery,
    selectedCategory,
    selectedSubcategory,
    categories,
  ]);

  // Функция для построения дерева категорий
  const buildCategoryTree = (categories: Category[]) => {
    const rootCategories = categories.filter((c) => !c.parent_id);

    return rootCategories.map((rootCategory) => {
      const children = categories.filter(
        (c) => c.parent_id === rootCategory.id,
      );
      return {
        ...rootCategory,
        children,
      };
    });
  };
  // Функция для преобразования категорий из базы данных в формат для CategoryFilter

  const prepareCategoriesForFilter = useMemo(() => {
    console.log('Исходные категории:', categories);
    console.log('Товары:', products);

    // Сначала строим дерево всех категорий
    const rootCategories = categories.filter((c) => !c.parent_id);

    const categoryTree = rootCategories.map((rootCategory) => {
      const children = categories.filter(
        (c) => c.parent_id === rootCategory.id,
      );

      return {
        ...rootCategory,
        children: children || [],
      };
    });

    // Затем фильтруем только те категории, которые имеют товары
    const filteredTree = categoryTree.filter((rootCategory) => {
      // Проверяем, есть ли товары в корневой категории
      const hasProductsInRoot = products.some(
        (product) =>
          product.category_id === rootCategory.id ||
          product.category === rootCategory.name,
      );

      // Проверяем, есть ли товары в подкатегориях
      const hasProductsInChildren = rootCategory.children.some((child) =>
        products.some(
          (product) =>
            product.category_id === child.id || product.category === child.name,
        ),
      );

      // Фильтруем подкатегории, оставляя только те, которые имеют товары
      if (hasProductsInChildren) {
        rootCategory.children = rootCategory.children.filter((child) =>
          products.some(
            (product) =>
              product.category_id === child.id ||
              product.category === child.name,
          ),
        );
      }

      return hasProductsInRoot || hasProductsInChildren;
    });

    console.log('Отфильтрованное дерево категорий:', filteredTree);
    return filteredTree;
  }, [categories, products]); // Зависимости для useMemo

  useEffect(() => {
    fetchProducts();
  }, [shop.id]);

  useEffect(() => {
    fetchCategories();
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

  useEffect(() => {
    if (telegramUser?.id) {
      loadCartFromDatabase();
    }
  }, [telegramUser?.id]);

  // В начале компонента ShopContent, после других useEffect
  useEffect(() => {
    // Проверяем, открыто ли приложение в Telegram WebApp
    if (
      isTelegram &&
      typeof window !== 'undefined' &&
      window.Telegram?.WebApp
    ) {
      const tg = window.Telegram.WebApp;

      // Если пользователь авторизован в Telegram, получаем его данные
      if (tg.initDataUnsafe?.user) {
        const tgUser = tg.initDataUnsafe.user;

        // Сохраняем данные пользователя в базу данных
        saveTelegramUserData(tgUser);
      }
    }
  }, [isTelegram]);

  useEffect(() => {
    const allLoaded =
      !loadingStates.products &&
      !loadingStates.categories &&
      !loadingStates.cart;
    if (allLoaded && isInitialLoading) {
      setIsInitialLoading(false);
    }
  }, [loadingStates, isInitialLoading]);

  // Функция для сохранения данных пользователя из Telegram
  const saveTelegramUserData = async (tgUser: any) => {
    try {
      const response = await fetch('/api/users/telegram', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          telegram_id: tgUser.id,
          username: tgUser.username || '',
          first_name: tgUser.first_name || '',
          last_name: tgUser.last_name || '',
          photo_url: tgUser.photo_url || '',
        }),
      });

      if (response.ok) {
        console.log('Данные пользователя Telegram сохранены успешно');
      }
    } catch (error) {
      console.error('Ошибка при сохранении данных пользователя:', error);
    }
  };
  const fetchCategories = async () => {
    setLoadingStates((prev) => ({ ...prev, categories: true }));
    try {
      console.log('Загрузка категорий для магазина:', shop.id);
      const response = await fetch(`/api/shops/${shop.id}/categories`);
      if (response.ok) {
        const data = await response.json();
        console.log('Загружено категорий:', data.length, data);

        const validCategories = data.filter(
          (item: any) =>
            item.hasOwnProperty('name') &&
            item.hasOwnProperty('id') &&
            !item.hasOwnProperty('price'),
        );

        console.log('Валидные категории:', validCategories);
        setCategories(validCategories);
      } else {
        console.error('Ошибка загрузки категорий:', await response.text());
      }
    } catch (error) {
      console.error('Ошибка загрузки категорий:', error);
    } finally {
      setLoadingStates((prev) => ({ ...prev, categories: false }));
    }
  };

  const fetchProducts = async () => {
    setLoadingStates((prev) => ({ ...prev, products: true }));
    try {
      const timestamp = new Date().getTime();
      console.log('Загрузка товаров для магазина:', shop.id);

      const response = await fetch(
        `/api/shops/${shop.id}/products?t=${timestamp}&status=all`,
      );

      if (response.ok) {
        const data = await response.json();
        console.log('Загружено товаров:', data.length);
        setProducts(data);
      } else {
        console.error('Ошибка загрузки товаров:', await response.text());
      }
    } catch (error) {
      console.error('Ошибка загрузки товаров:', error);
    } finally {
      setLoadingStates((prev) => ({ ...prev, products: false }));
      // setLoading(false);
    }
  };
  const clearCartFromDatabase = async () => {
    let telegram_id = telegramUser?.id;

    if (
      isTelegram &&
      typeof window !== 'undefined' &&
      window.Telegram?.WebApp?.initDataUnsafe?.user
    ) {
      telegram_id = window.Telegram.WebApp.initDataUnsafe.user.id;
    }

    if (!telegram_id) return;

    try {
      // Используем DELETE метод для быстрой очистки всей корзины
      const response = await fetch(`/api/cart`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          telegram_id: Number(telegram_id),
        }),
      });

      if (!response.ok) {
        console.error('Ошибка при очистке корзины:', await response.text());
      }
    } catch (error) {
      console.error('Ошибка при очистке корзины в базе данных:', error);
    }
  };

  const showConfirmationToast = (
    message: string,
    onConfirm: () => void,
    onCancel?: () => void,
    confirmText = 'Да',
    cancelText = 'Нет',
  ) => {
    const toastId = toast.custom(
      (t) => (
        <Card className='max-w-sm mx-auto shadow-lg'>
          <CardContent className='p-4'>
            <div className='space-y-4'>
              <div className='flex items-start gap-3'>
                <AlertCircle className='w-5 h-5 text-orange-500 mt-0.5 flex-shrink-0' />
                <p className='text-sm leading-relaxed text-gray-700'>
                  {message}
                </p>
              </div>
              <div className='flex justify-end gap-2'>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => {
                    toast.dismiss(toastId);
                    onCancel?.();
                  }}
                >
                  {cancelText}
                </Button>
                <Button
                  size='sm'
                  onClick={() => {
                    toast.dismiss(toastId);
                    onConfirm();
                  }}
                >
                  {confirmText}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ),
      {
        duration: Infinity, // Не исчезает автоматически
        position: 'top-center',
      },
    );
  };
  const handleAddToCart = async (
    product: Product,
    quantity = 1,
    singleOrder = false,
  ) => {
    // Блокируем ВСЕ операции с корзиной во время обработки
    if (isInitialLoading || isProcessingCart) {
      return;
    }

    // Проверяем, есть ли в корзине товары, требующие индивидуальной обработки
    const hasSingleOrderItems = items.some(
      (item) => item.product.single_order_only,
    );
    const hasRegularItems = items.some(
      (item) => !item.product.single_order_only,
    );

    if (product.single_order_only || singleOrder) {
      // Для индивидуальных заказов разрешаем изменение количества только если allow_quantity_change = true
      if (quantity < 0) {
        // Удаляем товар полностью
        removeItem(product.id);
        saveCartToDatabase(product, 0);
        toast.success(`${product.name} удален из корзины`, {
          icon: <Trash2 className='w-4 h-4' />,
          duration: 2000,
        });
        return;
      }

      // Если в корзине есть обычные товары, спрашиваем подтверждение
      if (hasRegularItems) {
        showConfirmationToast(
          `В корзине есть обычные товары. Для добавления индивидуального заказа нужно очистить корзину.\n\nРекомендуем сначала оформить заказ с текущими товарами, а затем добавить индивидуальный товар.\n\nОчистить корзину и добавить "${product.name}"?`,
          async () => {
            // Блокируем ВСЕ операции с корзиной
            setIsProcessingCart(true);

            try {
              if (hasSingleOrderItems) {
                clearCart();
                await clearCartFromDatabase();

                toast.success('Корзина очищена для индивидуального заказа', {
                  icon: <ShoppingBag className='w-4 h-4' />,
                  duration: 2000,
                });
              }

              // Для индивидуальных заказов добавляем указанное количество, если allow_quantity_change = true
              const quantityToAdd = product.allow_quantity_change
                ? quantity
                : 1;
              addItem(product, quantityToAdd);
              saveCartToDatabase(product, quantityToAdd);

              toast.success(
                `${product.name} добавлен для индивидуального заказа`,
                {
                  icon: <ShoppingBag className='w-4 h-4' />,
                  duration: 2000,
                },
              );
            } finally {
              setIsProcessingCart(false);
            }
            return;
          },
          () => {
            // Отмена - предлагаем оформить заказ
            showConfirmationToast(
              'Хотите оформить заказ с текущими товарами?',
              () => {
                setCurrentView('order');
              },
              undefined,
              'Оформить заказ',
              'Отмена',
            );
          },
          'Очистить корзину',
          'Отмена',
        );
        return;
      }

      // Блокируем операции
      setIsProcessingCart(true);

      try {
        if (hasSingleOrderItems) {
          // Очищаем корзину в интерфейсе и базе данных
          clearCart();
          await clearCartFromDatabase();

          toast.success('Корзина очищена для индивидуального заказа', {
            icon: <ShoppingBag className='w-4 h-4' />,
            duration: 2000,
          });
        }

        addItem(product, 1); // Всегда добавляем только 1 штуку для индивидуальных заказов
        saveCartToDatabase(product, 1);
        toast.success(`${product.name} добавлен для индивидуального заказа`, {
          icon: <ShoppingBag className='w-4 h-4' />,
          duration: 2000,
        });
      } finally {
        // Разблокируем операции
        setIsProcessingCart(false);
      }
      return;
    }

    // Проверяем, можно ли добавить обычный товар
    if (hasSingleOrderItems) {
      toast.error('Нельзя добавить обычный товар к индивидуальному заказу', {
        duration: 3000,
      });
      return;
    }

    // Блокируем операции для обычных товаров тоже
    setIsProcessingCart(true);

    try {
      // Обычная логика для обычных товаров
      if (quantity > 0) {
        const currentQuantity = getItemQuantity(product.id);
        const newQuantity = currentQuantity + quantity;

        if (currentQuantity === 0) {
          addItem(product, quantity);
        } else {
          updateQuantity(product.id, newQuantity);
        }

        saveCartToDatabase(product, newQuantity);

        toast.success(`${product.name} добавлен в корзину`, {
          icon: <ShoppingBag className='w-4 h-4' />,
          duration: 2000,
        });
      } else {
        const currentQuantity = getItemQuantity(product.id);
        const newQuantity = currentQuantity + quantity;

        if (newQuantity <= 0) {
          removeItem(product.id);
          saveCartToDatabase(product, 0);

          toast.success(`${product.name} удален из корзины`, {
            icon: <Trash2 className='w-4 h-4' />,
            duration: 2000,
          });
        } else {
          updateQuantity(product.id, newQuantity);
          saveCartToDatabase(product, newQuantity);
        }
      }
    } finally {
      // Разблокируем операции
      setIsProcessingCart(false);
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
    let telegram_id: string | number | undefined = telegramUser?.id;

    if (
      isTelegram &&
      typeof window !== 'undefined' &&
      window.Telegram?.WebApp?.initDataUnsafe?.user
    ) {
      telegram_id = window.Telegram.WebApp.initDataUnsafe.user.id;
    }

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          shop_id: shop.id,
          telegram_id: Number(telegram_id),
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

        if (telegram_id) {
          try {
            // Получаем все товары в корзине
            const cartResponse = await fetch(
              `/api/cart?telegram_id=${Number(telegram_id)}`,
            );
            if (cartResponse.ok) {
              const cartItems = await cartResponse.json();

              // Удаляем каждый товар последовательно
              for (const item of cartItems) {
                try {
                  const deleteResponse = await fetch(`/api/cart/${item.id}`, {
                    method: 'DELETE',
                  });

                  if (!deleteResponse.ok) {
                    console.error(
                      `Ошибка при удалении товара ${item.id} из корзины:`,
                      await deleteResponse.json(),
                    );
                  }
                } catch (deleteError) {
                  console.error(
                    `Ошибка при удалении товара ${item.id} из корзины:`,
                    deleteError,
                  );
                }
              }
            }
          } catch (error) {
            console.error('Ошибка при очистке корзины в базе данных:', error);
          }
        }

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

  const loadCartFromDatabase = async () => {
    let telegram_id = telegramUser?.id;

    if (
      isTelegram &&
      typeof window !== 'undefined' &&
      window.Telegram?.WebApp?.initDataUnsafe?.user
    ) {
      telegram_id = window.Telegram.WebApp.initDataUnsafe.user.id;
    }

    if (!telegram_id) return;

    if (isLoadingCart) return;
    setIsLoadingCart(true);
    setLoadingStates((prev) => ({ ...prev, cart: true }));

    try {
      const response = await fetch(
        `/api/cart?telegram_id=${Number(telegram_id)}`,
      );

      if (response.ok) {
        const cartData = await response.json();
        clearCart();

        for (const item of cartData) {
          try {
            const productResponse = await fetch(
              `/api/products/${item.product_id}`,
            );
            if (productResponse.ok) {
              const productData = await productResponse.json();
              if (productData && productData.status === 'active') {
                setItemQuantity(productData, item.quantity);
              } else {
                toast.error(
                  `Товар "${item.products?.name || 'Неизвестный товар'}" больше недоступен и был удален из корзины`,
                  {
                    duration: 4000,
                  },
                );

                await fetch(`/api/cart/${item.id}`, {
                  method: 'DELETE',
                });
              }
            }
          } catch (productError) {
            console.error(
              'Ошибка при загрузке информации о товаре:',
              productError,
            );
          }
        }
      }
    } catch (error) {
      console.error('Ошибка при загрузке корзины:', error);
      toast.error('Не удалось загрузить сохраненную корзину', {
        duration: 3000,
      });
    } finally {
      setIsLoadingCart(false);
      setLoadingStates((prev) => ({ ...prev, cart: false }));
    }
  };
  const saveCartToDatabase = async (product: Product, quantity: number) => {
    // Получаем telegram_id напрямую из Telegram WebApp, если доступно
    let telegram_id = telegramUser?.id;

    if (
      isTelegram &&
      typeof window !== 'undefined' &&
      window.Telegram?.WebApp?.initDataUnsafe?.user
    ) {
      telegram_id = window.Telegram.WebApp.initDataUnsafe.user.id;
    }

    if (!telegram_id) return;

    try {
      console.log('Сохранение товара в корзину:', {
        telegram_id: Number(telegram_id),
        product_id: product.id,
        quantity, // Используем переданное значение
        shop_id: shop.id,
      });

      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          telegram_id: Number(telegram_id),
          product_id: product.id,
          quantity, // Используем переданное значение
          shop_id: shop.id,
        }),
      });

      const data = await response.json();
      console.log('Ответ от API корзины:', data);

      if (!response.ok) {
        console.error('Ошибка при сохранении корзины:', data);
      }
    } catch (error) {
      console.error('Ошибка при сохранении корзины:', error);
    }
  };

  // if (loading) {
  //   return (
  //     <div className='flex items-center justify-center min-h-screen bg-background'>
  //       <div className='space-y-4 text-center'>
  //         <Store className='w-16 h-16 mx-auto text-muted-foreground' />
  //         <p className='text-muted-foreground'>Загрузка товаров...</p>
  //       </div>
  //     </div>
  //   );
  // }

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
            isTelegram={isTelegram}
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
              {/* Предупреждение об индивидуальном заказе */}
              {items.some((item) => item.product.single_order_only) && (
                <div className='p-3 mb-4 border border-orange-200 rounded-lg bg-orange-50'>
                  <div className='flex items-center gap-2'>
                    <AlertCircle className='w-4 h-4 text-orange-600' />
                    <span className='text-sm font-medium text-orange-800'>
                      Индивидуальный заказ
                    </span>
                  </div>
                  <p className='text-xs text-orange-600'>
                    В корзине товар, требующий индивидуальной обработки
                  </p>
                </div>
              )}

              {/* Список товаров в корзине */}
              <div className='space-y-3'>
                {items.map(({ product, quantity }) => (
                  <Card key={product.id} className='relative'>
                    {product.single_order_only && (
                      <div className='absolute z-10 top-2 left-2'>
                        <Badge
                          variant='secondary'
                          className='text-xs text-orange-800 bg-orange-100'
                        >
                          Индивидуальный
                        </Badge>
                      </div>
                    )}
                    <CardContent
                      className={`p-4 ${product.single_order_only ? 'pt-8' : ''}`}
                    >
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
                          {/* Скрываем селектор количества для индивидуальных заказов */}
                          {(!product.single_order_only ||
                            (product.single_order_only &&
                              product.allow_quantity_change)) && (
                            <div className='flex items-center gap-2'>
                              <Button
                                variant='outline'
                                size='sm'
                                onClick={() => {
                                  if (quantity <= 1) {
                                    removeItem(product.id);
                                    saveCartToDatabase(product, 0);
                                    toast.success(
                                      `${product.name} удален из корзины`,
                                      {
                                        icon: <Trash2 className='w-4 h-4' />,
                                        duration: 2000,
                                      },
                                    );
                                  } else {
                                    updateQuantity(product.id, quantity - 1);
                                    saveCartToDatabase(product, quantity - 1);
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
                                  updateQuantity(product.id, quantity + 1);
                                  saveCartToDatabase(product, quantity + 1);
                                  toast.success(
                                    `Добавлено еще: ${product.name}`,
                                    {
                                      icon: <Plus className='w-4 h-4' />,
                                      duration: 2000,
                                    },
                                  );
                                }}
                                className='w-8 h-8 p-0'
                              >
                                <Plus className='w-3 h-3' />
                              </Button>
                            </div>
                          )}

                          {/* Если индивидуальный заказ БЕЗ allow_quantity_change - показываем только количество */}
                          {product.single_order_only &&
                            !product.allow_quantity_change && (
                              <div className='flex items-center justify-center py-1'>
                                <Badge variant='outline' className='text-sm'>
                                  Количество: {quantity}
                                </Badge>
                              </div>
                            )}

                          <div className='text-right'>
                            <div className='font-bold'>
                              {(product.price * quantity).toLocaleString()} ₽
                            </div>
                            <Button
                              variant='ghost'
                              size='sm'
                              onClick={() => {
                                removeItem(product.id);
                                saveCartToDatabase(product, 0);
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

              {/* Дополнения к заказу - скрываем для индивидуальных заказов */}
              {!items.some((item) => item.product.single_order_only) && (
                <CartAddons
                  shopId={shop.id}
                  cartItems={items}
                  onAddToCart={handleAddToCart}
                  getItemQuantity={getItemQuantity}
                />
              )}

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

  // if (isInitialLoading) {
  //   return (
  //     <div className='flex items-center justify-center min-h-screen bg-background'>
  //       <div className='space-y-4 text-center'>
  //         <div className='w-16 h-16 mx-auto border-b-2 rounded-full animate-spin border-primary'></div>
  //         <p className='text-lg font-semibold'>Загрузка магазина...</p>
  //       </div>
  //     </div>
  //   );
  // }
  if (isInitialLoading) {
    return (
      <div className='flex flex-col items-center justify-center min-h-screen bg-background'>
        {/* Пульсирующий спиннер с вращающимися волнами */}
        <div className='relative flex items-center justify-center w-32 h-32 mb-8'>
          {/* Центральный круг */}
          <div className='absolute z-10 w-6 h-6 bg-black rounded-full'></div>

          {/* Волны с вращением */}
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className='absolute border-2 border-black rounded-full'
              style={{
                width: `${20 + i * 20}px`,
                height: `${20 + i * 20}px`,
                animation: `pulse 1.5s infinite, rotate ${4 - i * 0.5}s infinite linear`,
                animationDelay: `${i * 0.2}s`,
                opacity: 0.7 - i * 0.15,
              }}
            />
          ))}
        </div>

        {/* Текст с эффектом печатной машинки */}
        <p className='overflow-hidden text-xl font-bold tracking-wider border-r-2 border-black whitespace-nowrap animate-typing'>
          Загрузка магазина...
        </p>

        {/* Анимации */}
        <style jsx>{`
          @keyframes pulse {
            0% {
              transform: scale(0.8);
              opacity: 0.5;
            }
            50% {
              transform: scale(1.2);
              opacity: 0.2;
            }
            100% {
              transform: scale(0.8);
              opacity: 0.5;
            }
          }
          @keyframes rotate {
            0% {
              transform: rotate(0deg) scale(0.8);
            }
            50% {
              transform: rotate(180deg) scale(1.2);
            }
            100% {
              transform: rotate(360deg) scale(0.8);
            }
          }
          @keyframes typing {
            from {
              width: 0;
            }
            to {
              width: 240px;
            }
          }
          .animate-typing {
            animation: typing 3s steps(20, end) infinite;
          }
        `}</style>
      </div>
    );
  }
  return (
    <div className='min-h-screen bg-background'>
      {/* Фиксированная строка поиска */}
      <SearchBar onSearch={setSearchQuery} />
      {/* Фиксированные категории */}
      {/* Фиксированные категории */}
      // В ShopContent.tsx замените вызов CategoryFilter на:
      <CategoryFilter
        categories={prepareCategoriesForFilter}
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
        cartQuantity={selectedProduct ? getItemQuantity(selectedProduct.id) : 0}
        onGoToCart={() => setCurrentView('cart')}
      />
      <Toaster position='top-center' />
      <TelegramShopDebug />
    </div>
  );
}
