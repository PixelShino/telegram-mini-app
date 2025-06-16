// app/api/users/telegram/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { telegram_id, username, first_name, last_name, photo_url } =
      await request.json();

    if (!telegram_id) {
      return NextResponse.json(
        { error: 'Missing telegram_id' },
        { status: 400 },
      );
    }

    const supabase = createClient();

    // Проверяем, существует ли пользователь
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('telegram_id', telegram_id)
      .single();

    if (existingUser) {
      // Пользователь существует, обновляем его данные
      const { data, error } = await supabase
        .from('users')
        .update({
          username: username || existingUser.username,
          name:
            [first_name, last_name].filter(Boolean).join(' ') ||
            existingUser.name,
          avatar: photo_url || existingUser.avatar,
        })
        .eq('telegram_id', telegram_id)
        .select()
        .single();

      if (error) {
        console.error('Ошибка при обновлении пользователя:', error);
        return NextResponse.json(
          { error: 'Failed to update user' },
          { status: 500 },
        );
      }

      return NextResponse.json(data);
    }

    // Пользователь не существует, создаем нового
    const name = [first_name, last_name].filter(Boolean).join(' ');

    const { data: newUser, error } = await supabase
      .from('users')
      .insert({
        telegram_id,
        username,
        name,
        avatar: photo_url,
      })
      .select()
      .single();

    if (error) {
      console.error('Ошибка при создании пользователя:', error);
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 },
      );
    }

    return NextResponse.json(newUser);
  } catch (error) {
    console.error('Ошибка обработки запроса:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
