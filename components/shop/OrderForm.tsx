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
  ArrowUpDown,
  Hash,
  Phone,
  Mail,
} from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import type { CartItem } from '@/types/cart';
import toast from 'react-hot-toast';

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
  isTelegram: boolean; // Добавьте этот параметр
  onBack: () => void;
  onSubmit: (orderData: any) => Promise<{ id: string } | undefined>;
}

export default function OrderForm({
  items,
  totalPrice,
  user,
  shop,
  isTelegram,
  onBack,
  onSubmit,
}: OrderFormProps) {
  try {
    const [step, setStep] = useState(1); // 1 - адрес и время, 2 - подтверждение, 3 - успех
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [orderId, setOrderId] = useState<string | null>(null);

    const [addressChoice, setAddressChoice] = useState<'default' | 'new'>(
      user?.default_address ? 'default' : 'new',
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
      address: user?.default_address || '',
      comment: '',
      deliveryTime: '',
      phone: user?.phone || '',
      email: user?.email || '',
    });

    //доп проверка
    if (!user) {
      return (
        <div className='p-4 text-center'>Загрузка данных пользователя...</div>
      );
    }

    // В начале компонента OrderForm добавьте:
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
          const userData = await response.json();
          // Если у пользователя уже есть сохраненный адрес, используем его
          if (userData.default_address) {
            try {
              const parsedAddress = JSON.parse(userData.default_address);
              setNewAddressData(parsedAddress);
            } catch (e) {
              console.error('Ошибка при парсинге адреса:', e);
            }
          }
        }
      } catch (error) {
        console.error('Ошибка при сохранении данных пользователя:', error);
      }
    };

    // Парсинг сохраненного адреса
    useEffect(() => {
      if (!user) return;

      try {
        if (user.default_address) {
          let parsed;
          try {
            parsed = JSON.parse(user.default_address);
            setParsedDefaultAddress(parsed);
          } catch (e) {
            console.error('Ошибка парсинга адреса:', e);
            setParsedDefaultAddress(null);
            return;
          }

          // Если выбран сохраненный адрес, используем его
          if (addressChoice === 'default') {
            setFormData((prev) => ({ ...prev, address: user.default_address }));
          }
        }
      } catch (e) {
        console.error('Ошибка обработки данных пользователя:', e);
      }
    }, [user, addressChoice]);

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
        if (!shop?.id) {
          console.error('Отсутствуют необходимые данные:', { shop });
          return;
        }

        // Получаем данные адреса
        const addressData =
          addressChoice === 'default' && parsedDefaultAddress
            ? parsedDefaultAddress
            : newAddressData;

        // Собираем данные пользователя
        const customerInfo = {
          name:
            user?.name ||
            (isTelegram &&
              window.Telegram?.WebApp?.initDataUnsafe?.user?.first_name) ||
            '',
          phone: formData.phone || user?.phone || '',
          email: formData.email || user?.email || '',
        };

        // Получаем telegram_id пользователя
        const telegram_id = isTelegram
          ? window.Telegram?.WebApp?.initDataUnsafe?.user?.id
          : user?.telegram_id;

        // Подготавливаем данные заказа

        const orderData = {
          shop_id: shop.id,
          telegram_id: Number(telegram_id) || null,
          items: items.map((item) => ({
            product: {
              id: Number(item.product.id), //
              price: Number(item.product.price),
            },
            quantity: Number(item.quantity),
          })),
          total_price: Number(totalPrice),
          address: addressData,
          comment: formData.comment || '',
          delivery_time: formData.deliveryTime || 'now',
          customerInfo: {
            name: customerInfo.name || '',
            phone: customerInfo.phone || '',
            email: customerInfo.email || '',
          },
        };

        console.log('Отправляем данные заказа:', orderData);

        // Отправляем заказ
        const response = await fetch('/api/orders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(orderData),
        });

        const responseData = await response.json();

        if (!response.ok) {
          console.error('Ошибка ответа сервера:', responseData);
          throw new Error(responseData.error || 'Ошибка при создании заказа');
        }

        if (responseData?.id) {
          setOrderId(responseData.id);
        }

        setStep(3);
      } catch (error) {
        console.error('Ошибка при оформлении заказа:', error);
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        toast.error('Ошибка при оформлении заказа: ' + errorMessage);
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
              <h2 className='mb-2 text-2xl font-bold'>
                Заказ успешно оформлен!
              </h2>
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
                  <RadioGroupItem
                    value='new'
                    id='new-address'
                    className='mt-1'
                  />
                  <Label htmlFor='new-address' className='font-medium'>
                    Доставка на другой адрес
                  </Label>
                </div>
              </RadioGroup>

              {addressChoice === 'new' && (
                <div className='pt-4 mt-4 space-y-3 border-t'>
                  <div>
                    <Label htmlFor='phone' className='flex items-center gap-2'>
                      <Phone className='w-4 h-4' />
                      Телефон *
                    </Label>
                    <Input
                      id='phone'
                      value={formData.phone || ''}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          phone: e.target.value,
                        }))
                      }
                      placeholder='+7 (999) 123-45-67'
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor='email' className='flex items-center gap-2'>
                      <Mail className='w-4 h-4' />
                      Email *
                    </Label>
                    <Input
                      id='email'
                      type='email'
                      value={formData.email || ''}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          email: e.target.value,
                        }))
                      }
                      placeholder='example@email.com'
                      required
                    />
                  </div>
                  <div>
                    <Label
                      htmlFor='country'
                      className='flex items-center gap-2'
                    >
                      <MapPin className='w-4 h-4' />
                      Страна
                    </Label>
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
                    <Label htmlFor='city' className='flex items-center gap-2'>
                      <Building className='w-4 h-4' />
                      Город
                    </Label>
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
                    <Label htmlFor='street' className='flex items-center gap-2'>
                      <MapPin className='w-4 h-4' />
                      Улица
                    </Label>
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

                  <div className='flex items-center gap-2 py-2'>
                    <Checkbox
                      id='isPrivateHouse'
                      checked={newAddressData.isPrivateHouse}
                      onCheckedChange={(checked) =>
                        handleNewAddressChange('isPrivateHouse', !!checked)
                      }
                    />
                    <Label
                      htmlFor='isPrivateHouse'
                      className='font-medium cursor-pointer'
                    >
                      Частный дом
                    </Label>
                  </div>

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
                        <ArrowUpDown className='w-4 h-4' />
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
                  <div
                    key={product.id}
                    className='flex justify-between text-sm'
                  >
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

        <Button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className='w-full'
        >
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
  } catch (error) {
    console.error('Ошибка в компоненте OrderForm:', error);
    return (
      <div className='p-4 text-center'>
        <p className='text-red-500'>
          Произошла ошибка при загрузке формы заказа.
        </p>
        <Button onClick={() => window.location.reload()} className='mt-4'>
          Перезагрузить страницу
        </Button>
      </div>
    );
  }
}
