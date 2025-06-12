'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowLeft,
  MapPin,
  Clock,
  ShoppingCart,
  CheckCircle,
  Home,
  Building,
  Stairs,
  Hash,
} from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import type { CartItem } from '@/types/cart';

interface AddressData {
  country: string;
  city: string;
  street: string;
  house: string;
  apartment: string;
  isPrivateHouse: boolean;
  entrance: string;
  floor: string;
  intercom: string;
}

interface OrderFormProps {
  items: CartItem[];
  totalPrice: number;
  user: any;
  shop: any;
  onBack: () => void;
  onSubmit: (orderData: any) => void;
}

export default function OrderForm({
  items,
  totalPrice,
  user,
  shop,
  onBack,
  onSubmit,
}: OrderFormProps) {
  const [step, setStep] = useState(1); // 1 - адрес и время, 2 - подтверждение, 3 - успех
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);

  const [addressChoice, setAddressChoice] = useState<'default' | 'new'>(
    user.default_address ? 'default' : 'new',
  );
  const [parsedDefaultAddress, setParsedDefaultAddress] =
    useState<AddressData | null>(null);
  const [newAddressData, setNewAddressData] = useState<AddressData>({
    country: '',
    city: '',
    street: '',
    house: '',
    apartment: '',
    isPrivateHouse: false,
    entrance: '',
    floor: '',
    intercom: '',
  });

  const [formData, setFormData] = useState({
    address: user.default_address || '',
    comment: '',
    deliveryTime: '',
  });

  // Парсинг сохраненного адреса
  useEffect(() => {
    if (user && user.default_address) {
      try {
        const parsed = JSON.parse(user.default_address);
        setParsedDefaultAddress(parsed);

        // Если выбран сохраненный адрес, используем его
        if (addressChoice === 'default') {
          setFormData((prev) => ({ ...prev, address: user.default_address }));
        }
      } catch (e) {
        console.error('Ошибка парсинга адреса:', e);
      }
    }
  }, [user, user?.default_address, addressChoice]);

  // Временные слоты для доставки
  const deliveryTimeSlots = [
    { value: 'asap', label: 'Как можно скорее' },
    { value: 'morning', label: 'Утром (9:00 - 12:00)' },
    { value: 'afternoon', label: 'Днем (12:00 - 17:00)' },
    { value: 'evening', label: 'Вечером (17:00 - 21:00)' },
  ];

  // Обработка изменения выбора адреса
  const handleAddressChoiceChange = (value: string) => {
    const choice = value as 'default' | 'new';
    setAddressChoice(choice);

    if (choice === 'default' && user.default_address) {
      setFormData((prev) => ({ ...prev, address: user.default_address }));
    } else if (choice === 'new') {
      // Используем новый адрес
      const addressString = JSON.stringify(newAddressData);
      setFormData((prev) => ({ ...prev, address: addressString }));
    }
  };

  // Обработка изменения полей нового адреса
  const handleNewAddressChange = (field: string, value: string | boolean) => {
    setNewAddressData((prev) => {
      const updated = { ...prev, [field]: value };
      // Обновляем адрес в форме
      setFormData((prevForm) => ({
        ...prevForm,
        address: JSON.stringify(updated),
      }));
      return updated;
    });
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      const orderData = {
        shop_id: shop.id,
        user_id: user.id,
        items,
        total_price: totalPrice,
        address: formData.address,
        comment: formData.comment,
        delivery_time: formData.deliveryTime,
      };

      const result = await onSubmit(orderData);

      if (result && result.id) {
        setOrderId(result.id);
      }

      setStep(3);
    } catch (error) {
      console.error('Ошибка при оформлении заказа:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Форматирование адреса для отображения
  const formatAddress = (address: AddressData): string => {
    const parts = [
      address.country,
      address.city,
      address.street,
      `д. ${address.house}`,
    ];

    if (!address.isPrivateHouse) {
      if (address.apartment) parts.push(`кв. ${address.apartment}`);
      if (address.entrance) parts.push(`подъезд ${address.entrance}`);
      if (address.floor) parts.push(`этаж ${address.floor}`);
      if (address.intercom) parts.push(`домофон: ${address.intercom}`);
    }

    return parts.filter(Boolean).join(', ');
  };

  // Шаг успешного оформления
  if (step === 3) {
    return (
      <div className='max-w-md px-4 mx-auto space-y-6'>
        <Card>
          <CardContent className='pt-6 pb-6 text-center'>
            <div className='flex justify-center mb-4'>
              <CheckCircle className='w-16 h-16 text-green-500' />
            </div>
            <h2 className='mb-2 text-2xl font-bold'>Заказ успешно оформлен!</h2>
            <p className='mb-4 text-muted-foreground'>
              {orderId
                ? `Номер заказа: #${orderId.substring(0, 8)}`
                : 'Ваш заказ принят в обработку'}
            </p>
            <p className='mb-6'>
              Мы свяжемся с вами в ближайшее время для подтверждения заказа.
            </p>
            <Button onClick={onBack} className='w-full'>
              Вернуться в магазин
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === 1) {
    return (
      <div className='max-w-md px-4 mx-auto space-y-6'>
        <div className='flex items-center justify-between'>
          <h2 className='text-xl font-bold'>Оформление заказа</h2>
          <button
            onClick={onBack}
            className='text-muted-foreground hover:text-foreground'
          >
            <ArrowLeft className='w-5 h-5' />
          </button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <MapPin className='w-4 h-4' />
              Адрес доставки
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <RadioGroup
              value={addressChoice}
              onValueChange={handleAddressChoiceChange}
              className='space-y-2'
            >
              {user.default_address && parsedDefaultAddress && (
                <div className='flex items-start space-x-2'>
                  <RadioGroupItem
                    value='default'
                    id='default-address'
                    className='mt-1'
                  />
                  <div>
                    <Label htmlFor='default-address' className='font-medium'>
                      Использовать сохраненный адрес
                    </Label>
                    <p className='mt-1 text-sm text-muted-foreground'>
                      {formatAddress(parsedDefaultAddress)}
                    </p>
                  </div>
                </div>
              )}

              <div className='flex items-start space-x-2'>
                <RadioGroupItem value='new' id='new-address' className='mt-1' />
                <Label htmlFor='new-address' className='font-medium'>
                  Доставка на другой адрес
                </Label>
              </div>
            </RadioGroup>

            {addressChoice === 'new' && (
              <div className='pt-4 mt-4 space-y-3 border-t'>
                <div>
                  <Label htmlFor='country'>Страна</Label>
                  <Input
                    id='country'
                    value={newAddressData.country}
                    onChange={(e) =>
                      handleNewAddressChange('country', e.target.value)
                    }
                    placeholder='Россия'
                  />
                </div>

                <div>
                  <Label htmlFor='city'>Город</Label>
                  <Input
                    id='city'
                    value={newAddressData.city}
                    onChange={(e) =>
                      handleNewAddressChange('city', e.target.value)
                    }
                    placeholder='Москва'
                  />
                </div>

                <div>
                  <Label htmlFor='street'>Улица</Label>
                  <Input
                    id='street'
                    value={newAddressData.street}
                    onChange={(e) =>
                      handleNewAddressChange('street', e.target.value)
                    }
                    placeholder='Ленина'
                  />
                </div>

                <div>
                  <Label htmlFor='house' className='flex items-center gap-2'>
                    <Home className='w-4 h-4' />
                    Дом
                  </Label>
                  <Input
                    id='house'
                    value={newAddressData.house}
                    onChange={(e) =>
                      handleNewAddressChange('house', e.target.value)
                    }
                    placeholder='10'
                  />
                </div>

                <div className='flex items-center space-x-2'>
                  <Checkbox
                    id='isPrivateHouse'
                    checked={newAddressData.isPrivateHouse}
                    onCheckedChange={(checked) =>
                      handleNewAddressChange('isPrivateHouse', !!checked)
                    }
                  />
                  <Label htmlFor='isPrivateHouse'>Частный дом</Label>
                </div>

                {!newAddressData.isPrivateHouse && (
                  <>
                    <div>
                      <Label
                        htmlFor='apartment'
                        className='flex items-center gap-2'
                      >
                        <Building className='w-4 h-4' />
                        Квартира
                      </Label>
                      <Input
                        id='apartment'
                        value={newAddressData.apartment}
                        onChange={(e) =>
                          handleNewAddressChange('apartment', e.target.value)
                        }
                        placeholder='42'
                      />
                    </div>

                    <div>
                      <Label htmlFor='entrance'>Подъезд</Label>
                      <Input
                        id='entrance'
                        value={newAddressData.entrance}
                        onChange={(e) =>
                          handleNewAddressChange('entrance', e.target.value)
                        }
                        placeholder='1'
                      />
                    </div>

                    <div>
                      <Label
                        htmlFor='floor'
                        className='flex items-center gap-2'
                      >
                        <Stairs className='w-4 h-4' />
                        Этаж
                      </Label>
                      <Input
                        id='floor'
                        value={newAddressData.floor}
                        onChange={(e) =>
                          handleNewAddressChange('floor', e.target.value)
                        }
                        placeholder='5'
                      />
                    </div>

                    <div>
                      <Label
                        htmlFor='intercom'
                        className='flex items-center gap-2'
                      >
                        <Hash className='w-4 h-4' />
                        Код домофона
                      </Label>
                      <Input
                        id='intercom'
                        value={newAddressData.intercom}
                        onChange={(e) =>
                          handleNewAddressChange('intercom', e.target.value)
                        }
                        placeholder='1234'
                      />
                    </div>
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Clock className='w-4 h-4' />
              Время доставки
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select
              value={formData.deliveryTime}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, deliveryTime: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder='Выберите время доставки' />
              </SelectTrigger>
              <SelectContent>
                {deliveryTimeSlots.map((slot) => (
                  <SelectItem key={slot.value} value={slot.value}>
                    {slot.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Комментарий к заказу</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={formData.comment}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, comment: e.target.value }))
              }
              placeholder='Дополнительные пожелания к заказу...'
              rows={3}
            />
          </CardContent>
        </Card>

        <Button
          onClick={() => setStep(2)}
          disabled={
            !formData.address ||
            (addressChoice === 'new' &&
              (!newAddressData.country ||
                !newAddressData.city ||
                !newAddressData.street ||
                !newAddressData.house))
          }
          className='w-full'
        >
          Продолжить
        </Button>
      </div>
    );
  }

  // Шаг подтверждения
  return (
    <div className='max-w-md px-4 mx-auto space-y-6'>
      <div className='flex items-center justify-between'>
        <h2 className='text-xl font-bold'>Подтверждение заказа</h2>
        <button
          onClick={() => setStep(1)}
          className='text-muted-foreground hover:text-foreground'
        >
          <ArrowLeft className='w-5 h-5' />
        </button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Детали заказа</CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div>
            <h4 className='mb-2 font-medium'>Товары:</h4>
            <div className='space-y-2'>
              {items.map(({ product, quantity }) => (
                <div key={product.id} className='flex justify-between text-sm'>
                  <span>
                    {product.name} x{quantity}
                  </span>
                  <span>
                    {(Number(product.price) * quantity).toLocaleString()} ₽
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className='pt-2 border-t'>
            <div className='flex justify-between font-bold'>
              <span>Итого:</span>
              <span>{totalPrice.toLocaleString()} ₽</span>
            </div>
          </div>

          <div>
            <h4 className='mb-1 font-medium'>Адрес доставки:</h4>
            <p className='text-sm text-muted-foreground'>
              {addressChoice === 'default' && parsedDefaultAddress
                ? formatAddress(parsedDefaultAddress)
                : addressChoice === 'new' && newAddressData
                  ? formatAddress(newAddressData)
                  : formData.address}
            </p>
          </div>

          {formData.deliveryTime && (
            <div>
              <h4 className='mb-1 font-medium'>Время доставки:</h4>
              <p className='text-sm text-muted-foreground'>
                {
                  deliveryTimeSlots.find(
                    (slot) => slot.value === formData.deliveryTime,
                  )?.label
                }
              </p>
            </div>
          )}

          {formData.comment && (
            <div>
              <h4 className='mb-1 font-medium'>Комментарий:</h4>
              <p className='text-sm text-muted-foreground'>
                {formData.comment}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Button onClick={handleSubmit} disabled={isSubmitting} className='w-full'>
        {isSubmitting ? (
          <span className='animate-pulse'>Оформление...</span>
        ) : (
          <>
            <ShoppingCart className='w-4 h-4 mr-2' />
            Подтвердить заказ
          </>
        )}
      </Button>
    </div>
  );
}
