'use client';

import type React from 'react';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  User,
  MapPin,
  Phone,
  Mail,
  Home,
  Building,
  ArrowUpDown,
  Hash,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface UserSetupProps {
  user: any;
  onComplete: (userData: any) => void;
}

export default function UserSetup({ user, onComplete }: UserSetupProps) {
  const [formData, setFormData] = useState({
    email: user.email || '',
    phone: user.phone || '',
  });

  const [addressData, setAddressData] = useState({
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

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Парсинг адреса, если он есть
  useEffect(() => {
    if (user.default_address) {
      try {
        const parsedAddress = JSON.parse(user.default_address);
        setAddressData(parsedAddress);
      } catch (e) {
        // Если адрес не в JSON формате, оставляем пустые поля
      }
    }
  }, [user.default_address]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.email || !formData.phone) {
      toast.error('Заполните все обязательные поля');
      return;
    }

    setIsSubmitting(true);

    // Преобразуем адрес в JSON строку
    const default_address = JSON.stringify(addressData);

    try {
      const response = await fetch('/api/users/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          ...formData,
          default_address,
        }),
      });

      if (response.ok) {
        const updatedUser = await response.json();
        toast.success('Данные сохранены!');
        onComplete(updatedUser);
      } else {
        toast.error('Ошибка сохранения данных');
      }
    } catch (error) {
      console.error('Ошибка:', error);
      toast.error('Ошибка подключения');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddressChange = (field: string, value: string | boolean) => {
    setAddressData((prev) => ({ ...prev, [field]: value }));
  };

  const isComplete = formData.email && formData.phone;

  return (
    <div className='flex items-center justify-center min-h-screen p-4 bg-background'>
      <Card className='w-full max-w-md'>
        <CardHeader className='text-center'>
          <User className='w-12 h-12 mx-auto mb-4 text-primary' />
          <CardTitle>Добро пожаловать!</CardTitle>
          <CardDescription>
            Для начала покупок заполните контактную информацию
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className='space-y-4'>
            <div>
              <Label htmlFor='email' className='flex items-center gap-2'>
                <Mail className='w-4 h-4' />
                Email *
              </Label>
              <Input
                id='email'
                type='email'
                value={formData.email}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, email: e.target.value }))
                }
                placeholder='example@email.com'
                required
              />
            </div>

            <div>
              <Label htmlFor='phone' className='flex items-center gap-2'>
                <Phone className='w-4 h-4' />
                Телефон *
              </Label>
              <Input
                id='phone'
                type='tel'
                value={formData.phone}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, phone: e.target.value }))
                }
                placeholder='+7 (999) 123-45-67'
                required
              />
            </div>

            <div className='pt-4 mt-4 border-t'>
              <h3 className='flex items-center gap-2 mb-2 text-lg font-medium'>
                <MapPin className='w-5 h-5' />
                Адрес доставки
              </h3>

              <div className='space-y-3'>
                <div>
                  <Label htmlFor='country'>Страна</Label>
                  <Input
                    id='country'
                    value={addressData.country}
                    onChange={(e) =>
                      handleAddressChange('country', e.target.value)
                    }
                    placeholder='Россия'
                  />
                </div>

                <div>
                  <Label htmlFor='city'>Город</Label>
                  <Input
                    id='city'
                    value={addressData.city}
                    onChange={(e) =>
                      handleAddressChange('city', e.target.value)
                    }
                    placeholder='Москва'
                  />
                </div>

                <div>
                  <Label htmlFor='street'>Улица</Label>
                  <Input
                    id='street'
                    value={addressData.street}
                    onChange={(e) =>
                      handleAddressChange('street', e.target.value)
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
                    value={addressData.house}
                    onChange={(e) =>
                      handleAddressChange('house', e.target.value)
                    }
                    placeholder='10'
                  />
                </div>

                <div className='flex items-center space-x-2'>
                  <Checkbox
                    id='isPrivateHouse'
                    checked={addressData.isPrivateHouse}
                    onCheckedChange={(checked) =>
                      handleAddressChange('isPrivateHouse', !!checked)
                    }
                  />
                  <Label htmlFor='isPrivateHouse'>Частный дом</Label>
                </div>

                {!addressData.isPrivateHouse && (
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
                        value={addressData.apartment}
                        onChange={(e) =>
                          handleAddressChange('apartment', e.target.value)
                        }
                        placeholder='42'
                      />
                    </div>

                    <div>
                      <Label htmlFor='entrance'>Подъезд</Label>
                      <Input
                        id='entrance'
                        value={addressData.entrance}
                        onChange={(e) =>
                          handleAddressChange('entrance', e.target.value)
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
                        value={addressData.floor}
                        onChange={(e) =>
                          handleAddressChange('floor', e.target.value)
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
                        value={addressData.intercom}
                        onChange={(e) =>
                          handleAddressChange('intercom', e.target.value)
                        }
                        placeholder='1234'
                      />
                    </div>
                  </>
                )}
              </div>

              <p className='mt-3 text-xs text-muted-foreground'>
                Этот адрес будет использоваться по умолчанию при оформлении
                заказов
              </p>
            </div>

            <Button
              type='submit'
              className='w-full'
              disabled={!isComplete || isSubmitting}
            >
              {isSubmitting ? 'Сохранение...' : 'Продолжить'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
