// app/api/users/address/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { telegram_id, address, phone, email } = await request.json();

    if (!telegram_id || !address) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 },
      );
    }

    const supabase = createClient();

    // Обновляем адрес пользователя
    const { data, error } = await supabase
      .from('users')
      .update({
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
        phone: phone || undefined,
        email: email || undefined,
      })
      .eq('telegram_id', telegram_id)
      .select()
      .single();

    if (error) {
      console.error('Ошибка при обновлении адреса:', error);
      return NextResponse.json(
        { error: 'Failed to update address' },
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
