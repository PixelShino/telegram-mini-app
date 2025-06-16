// app/api/users/address/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { userId, address, phone, email } = await request.json();

    if (!userId || !address) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 },
      );
    }

    const supabase = createClient();

    // Обновляем адрес и контактные данные пользователя
    const { data, error } = await supabase
      .from('users')
      .update({
        // Контактные данные
        phone: phone || undefined,
        email: email || undefined,

        // Адрес
        country: address.country || '',
        city: address.city || '',
        street: address.street || '',
        house_number: address.house || '',
        is_private_house: address.isPrivateHouse || false,
        apartment: address.apartment ? parseInt(address.apartment) : null,
        entrance: address.entrance ? parseInt(address.entrance) : null,
        floor: address.floor ? parseInt(address.floor) : null,
        intercom_code: address.intercom || '',
        default_address: JSON.stringify(address),
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Ошибка при обновлении данных пользователя:', error);
      return NextResponse.json(
        { error: 'Failed to update user data' },
        { status: 500 },
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Ошибка обработки запроса:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
