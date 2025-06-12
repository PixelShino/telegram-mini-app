'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, Home, Building, ArrowUpDown, Hash } from 'lucide-react';

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

interface OrderAddressSelectorProps {
  defaultAddress?: string;
  onAddressSelected: (address: string) => void;
}

export default function OrderAddressSelector({
  defaultAddress,
  onAddressSelected,
}: OrderAddressSelectorProps) {
  const [addressChoice, setAddressChoice] = useState<'default' | 'new'>(
    defaultAddress ? 'default' : 'new',
  );
  const [showAddressForm, setShowAddressForm] = useState(false);
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

  // Парсинг сохраненного адреса
  useEffect(() => {
    if (defaultAddress) {
      try {
        const parsed = JSON.parse(defaultAddress);
        setParsedDefaultAddress(parsed);

        // Если выбран сохраненный адрес, отправляем его
        if (addressChoice === 'default') {
          onAddressSelected(defaultAddress);
        }
      } catch (e) {
        console.error('Ошибка парсинга адреса:', e);
      }
    }
  }, [defaultAddress, addressChoice, onAddressSelected]);

  // Обработка изменения выбора адреса
  const handleAddressChoiceChange = (value: string) => {
    const choice = value as 'default' | 'new';
    setAddressChoice(choice);

    if (choice === 'default' && defaultAddress) {
      onAddressSelected(defaultAddress);
      setShowAddressForm(false);
    } else {
      setShowAddressForm(true);
    }
  };

  // Обработка изменения полей нового адреса
  const handleNewAddressChange = (field: string, value: string | boolean) => {
    setNewAddressData((prev) => {
      const updated = { ...prev, [field]: value };
      // Отправляем обновленный адрес родительскому компоненту
      onAddressSelected(JSON.stringify(updated));
      return updated;
    });
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

  return (
    <div className='space-y-4'>
      <h3 className='flex items-center gap-2 mb-2 text-lg font-medium'>
        <MapPin className='w-5 h-5' />
        Адрес доставки
      </h3>

      <RadioGroup
        value={addressChoice}
        onValueChange={handleAddressChoiceChange}
        className='space-y-2'
      >
        {defaultAddress && parsedDefaultAddress && (
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
          <div>
            <Label htmlFor='new-address' className='font-medium'>
              Доставка на другой адрес
            </Label>
            {addressChoice === 'new' && !showAddressForm && (
              <Button
                variant='outline'
                size='sm'
                onClick={() => setShowAddressForm(true)}
                className='mt-2'
              >
                Указать адрес
              </Button>
            )}
          </div>
        </div>
      </RadioGroup>

      {addressChoice === 'new' && showAddressForm && (
        <Card className='mt-4'>
          <CardContent className='pt-4'>
            <div className='space-y-3'>
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
                    <Label htmlFor='floor' className='flex items-center gap-2'>
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
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
