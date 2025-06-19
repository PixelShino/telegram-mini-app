'use client';
import type React from 'react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Product } from '@/types/product';
import ImageUploader from './ImageUploader';
import { updateProductImages } from '@/lib/storage';

interface ProductsManagerProps {
  shopId: string;
}

export default function ProductsManager({ shopId }: ProductsManagerProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    product_type: 'product',
    allow_quantity_change: true,
    is_addon: false,
    addon_category: '',
    related_categories: [] as string[],
    sort_order: 0,
    images: [] as string[],
  });

  useEffect(() => {
    fetchProducts();
  }, [shopId]);

  const fetchProducts = async () => {
    try {
      const response = await fetch(`/api/shops/${shopId}/products`);
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error('Ошибка загрузки товаров:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const url = editingProduct
        ? `/api/shops/${shopId}/products/${editingProduct.id}`
        : `/api/shops/${shopId}/products`;
      const method = editingProduct ? 'PUT' : 'POST';

      // Подготавливаем данные для отправки
      const productData = {
        ...formData,
        price: Number.parseFloat(formData.price),
        shop_id: shopId,
      };

      // Отправляем запрос на сохранение товара
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка сохранения товара');
      }

      // Обновляем список товаров
      await fetchProducts();

      // Закрываем диалог и сбрасываем форму
      setDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Ошибка сохранения товара:', error);
      alert(
        `Ошибка сохранения товара: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`,
      );
    } finally {
      setLoading(false);
    }
  };

  // components/admin/ProductsManager.tsx
  // Обновите функцию handleEdit
  const handleEdit = (product: Product) => {
    console.log('Редактирование товара:', product);
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || '',
      price: product.price.toString(),
      product_type: product.product_type || 'product',
      allow_quantity_change: product.allow_quantity_change ?? true,
      is_addon: product.is_addon || false,
      addon_category: product.addon_category || '',
      related_categories: product.related_categories || [],
      sort_order: product.sort_order || 0,
      images: product.images || [],
    });
    console.log('Изображения товара:', product.images);
    setDialogOpen(true);
  };

  const handleDelete = async (productId: string) => {
    if (!confirm('Удалить товар?')) return;
    try {
      await fetch(`/api/shops/${shopId}/products/${productId}`, {
        method: 'DELETE',
      });
      await fetchProducts();
    } catch (error) {
      console.error('Ошибка удаления товара:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      product_type: 'product',
      allow_quantity_change: true,
      is_addon: false,
      addon_category: '',
      related_categories: [],
      sort_order: 0,
      images: [],
    });
    setEditingProduct(null);
  };

  const mainProducts = products.filter((p) => !p.is_addon);
  const addonProducts = products.filter((p) => p.is_addon);

  const handleImagesUpdated = async (images: string[]) => {
    // Просто обновляем состояние формы, без сохранения в базу данных
    setFormData({ ...formData, images });
  };

  // const handleImagesUpdated = async (images: string[]) => {
  //   setFormData({ ...formData, images });

  //   // Если редактируем существующий товар, сохраняем изменения сразу
  //   if (editingProduct) {
  //     try {
  //       console.log('Сохранение изменений изображений в базе данных:', images);

  //       // Сначала обновляем изображения в базе данных
  //       await updateProductImages(Number(editingProduct.id), images);

  //       // Затем обновляем весь товар
  //       const response = await fetch(
  //         `/api/shops/${shopId}/products/${editingProduct.id}`,
  //         {
  //           method: 'PUT',
  //           headers: {
  //             'Content-Type': 'application/json',
  //           },
  //           body: JSON.stringify({
  //             ...formData,
  //             images: images, // Используем обновленный массив изображений
  //             price: Number.parseFloat(formData.price),
  //             shop_id: shopId,
  //           }),
  //         },
  //       );

  //       if (!response.ok) {
  //         throw new Error('Ошибка сохранения товара');
  //       }

  //       console.log('Товар успешно обновлен с новыми изображениями');

  //       // Обновляем список товаров
  //       await fetchProducts();
  //     } catch (error) {
  //       console.error('Ошибка сохранения изменений:', error);
  //     }
  //   }
  // };
  const saveProductChanges = async () => {
    if (!editingProduct) return;

    try {
      const response = await fetch(
        `/api/shops/${shopId}/products/${editingProduct.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...formData,
            price: Number.parseFloat(formData.price),
            shop_id: shopId,
          }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка сохранения товара');
      }

      // Обновляем список товаров
      await fetchProducts();
    } catch (error) {
      console.error('Ошибка сохранения товара:', error);
    }
  };
  return (
    <div className='space-y-6'>
      <Card>
        <CardHeader className='space-y-4'>
          <div>
            <CardTitle>Товары</CardTitle>
            <CardDescription>Управление товарами в магазине</CardDescription>
          </div>

          <Dialog
            open={dialogOpen}
            onOpenChange={(open) => {
              if (!open) {
                // Если диалог закрывается, сбрасываем форму без сохранения
                resetForm();
              }
              setDialogOpen(open);
            }}
          >
            <DialogTrigger asChild>
              <Button onClick={resetForm}>Добавить товар</Button>
            </DialogTrigger>
            <DialogContent className='sm:max-w-[500px] max-h-[90vh] overflow-y-auto'>
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>
                    {editingProduct ? 'Редактировать товар' : 'Добавить товар'}
                  </DialogTitle>
                  <DialogDescription>
                    Заполните информацию о товаре
                  </DialogDescription>
                </DialogHeader>
                <div className='grid gap-4 py-4'>
                  <div className='grid gap-2'>
                    <Label htmlFor='product-name'>Название</Label>
                    <Input
                      id='product-name'
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className='grid gap-2'>
                    <Label htmlFor='product-description'>Описание</Label>
                    <Textarea
                      id='product-description'
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          description: e.target.value,
                        })
                      }
                      rows={3}
                    />
                  </div>
                  <div className='grid gap-2'>
                    <Label htmlFor='product-price'>Цена (₽)</Label>
                    <Input
                      id='product-price'
                      type='number'
                      step='0.01'
                      value={formData.price}
                      onChange={(e) =>
                        setFormData({ ...formData, price: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className='grid gap-2'>
                    <Label htmlFor='product-type'>Тип товара</Label>
                    <Select
                      value={formData.product_type}
                      onValueChange={(value) =>
                        setFormData({ ...formData, product_type: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='product'>Обычный товар</SelectItem>
                        <SelectItem value='addon'>Дополнение</SelectItem>
                        <SelectItem value='service'>Услуга</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className='flex items-center space-x-2'>
                    <Checkbox
                      id='is-addon'
                      checked={formData.is_addon}
                      onCheckedChange={(checked) =>
                        setFormData({
                          ...formData,
                          is_addon: checked as boolean,
                        })
                      }
                    />
                    <Label htmlFor='is-addon'>Является дополнением</Label>
                  </div>
                  <div className='flex items-center space-x-2'>
                    <Checkbox
                      id='allow-quantity'
                      checked={formData.allow_quantity_change}
                      onCheckedChange={(checked) =>
                        setFormData({
                          ...formData,
                          allow_quantity_change: checked as boolean,
                        })
                      }
                    />
                    <Label htmlFor='allow-quantity'>
                      Можно изменять количество
                    </Label>
                  </div>
                  {formData.is_addon && (
                    <>
                      <div className='grid gap-2'>
                        <Label htmlFor='addon-category'>
                          Категория дополнения
                        </Label>
                        <Select
                          value={formData.addon_category}
                          onValueChange={(value) =>
                            setFormData({ ...formData, addon_category: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder='Выберите категорию' />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value='case'>Защита</SelectItem>
                            <SelectItem value='warranty'>Гарантия</SelectItem>
                            <SelectItem value='protection'>
                              Защитные аксессуары
                            </SelectItem>
                            <SelectItem value='sauce'>Соусы</SelectItem>
                            <SelectItem value='utensils'>Приборы</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className='grid gap-2'>
                        <Label htmlFor='sort-order'>Порядок сортировки</Label>
                        <Input
                          id='sort-order'
                          type='number'
                          value={formData.sort_order}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              sort_order: Number.parseInt(e.target.value) || 0,
                            })
                          }
                        />
                      </div>
                    </>
                  )}
                  <div className='grid gap-2'>
                    <Label htmlFor='product-images'>Изображения</Label>
                    <ImageUploader
                      productId={Number(editingProduct?.id)}
                      existingImages={formData.images}
                      onImagesUpdated={handleImagesUpdated}
                    />
                  </div>
                </div>
                <DialogFooter className='flex justify-between'>
                  <Button
                    type='button'
                    variant='outline'
                    onClick={() => {
                      // Закрываем диалог без сохранения
                      setDialogOpen(false);
                      resetForm();
                    }}
                  >
                    Отмена
                  </Button>
                  <Button type='submit' disabled={loading}>
                    {loading ? 'Сохранение...' : 'Сохранить'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className='py-8 text-center'>Загрузка товаров...</div>
          ) : (
            <div className='space-y-6'>
              {/* Основные товары */}
              <div>
                <h3 className='mb-3 font-semibold'>
                  Основные товары ({mainProducts.length})
                </h3>
                {mainProducts.length === 0 ? (
                  <div className='py-8 text-center'>
                    <div className='mb-2 text-4xl'>📦</div>
                    <p className='text-gray-600'>Пока нет товаров</p>
                  </div>
                ) : (
                  <div className='space-y-4'>
                    {mainProducts.map((product) => (
                      <div key={product.id} className='flex flex-col space-y-2'>
                        <div className='flex items-center justify-between'>
                          <h4 className='font-medium'>{product.name}</h4>
                          <Button
                            variant='outline'
                            size='sm'
                            onClick={() => handleEdit(product)}
                          >
                            Редактировать
                          </Button>
                        </div>
                        <p className='text-sm text-gray-600'>
                          {product.description}
                        </p>
                        <p className='text-lg font-bold text-green-600'>
                          {product.price}₽
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {/* Дополнения */}
              {addonProducts.length > 0 && (
                <div>
                  <h3 className='mb-3 font-semibold'>
                    Дополнения ({addonProducts.length})
                  </h3>
                  <div className='space-y-4'>
                    {addonProducts.map((product) => (
                      <div key={product.id} className='flex flex-col space-y-2'>
                        <div className='flex items-center justify-between'>
                          <h4 className='font-medium'>{product.name}</h4>
                          <Button
                            variant='outline'
                            size='sm'
                            onClick={() => handleEdit(product)}
                          >
                            Редактировать
                          </Button>
                        </div>
                        <p className='text-sm text-gray-600'>
                          {product.description}
                        </p>
                        <div className='flex gap-2 mt-1'>
                          <span className='text-lg font-bold text-green-600'>
                            ${product.price}
                          </span>
                          <span className='px-2 py-1 text-xs bg-blue-200 rounded'>
                            {product.addon_category}
                          </span>
                          {!product.allow_quantity_change && (
                            <span className='px-2 py-1 text-xs bg-gray-200 rounded'>
                              Фиксированное количество
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
