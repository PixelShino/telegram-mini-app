// app/api/auth/telegram/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const { user, hash, auth_date, shopId } = await request.json();

    // Проверяем наличие необходимых данных
    if (!user || !user.id) {
      return NextResponse.json({ error: 'Invalid user data' }, { status: 400 });
    }

    // Проверяем подпись данных от Telegram (в продакшене)
    // const botToken = process.env.TELEGRAM_BOT_TOKEN;
    // if (botToken && hash && auth_date) {
    //   // Создаем строку для проверки
    //   const dataCheckString = Object.entries(user)
    //     .filter(([key, _]) => key !== 'hash')
    //     .sort(([a], [b]) => a.localeCompare(b))
    //     .map(([key, value]) => `${key}=${value}`)
    //     .join('\n');
    //
    //   // Создаем секретный ключ
    //   const secretKey = crypto.createHash('sha256').update(botToken).digest();
    //
    //   // Вычисляем хеш
    //   const calculatedHash = crypto
    //     .createHmac('sha256', secretKey)
    //     .update(dataCheckString)
    //     .digest('hex');
    //
    //   // Проверяем хеш
    //   if (calculatedHash !== hash) {
    //     return NextResponse.json({ error: 'Invalid hash' }, { status: 401 });
    //   }
    // }

    const supabase = createClient();

    // Проверяем, существует ли пользователь
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('telegram_id', user.id)
      .single();

    if (existingUser) {
      // Обновляем данные существующего пользователя
      const { data: updatedUser, error } = await supabase
        .from('users')
        .update({
          name: `${user.first_name || ''} ${user.last_name || ''}`.trim(),
          username: user.username || '',
          avatar: user.photo_url || null,
        })
        .eq('telegram_id', user.id)
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json(updatedUser);
    } else {
      // Создаем нового пользователя
      const { data: newUser, error } = await supabase
        .from('users')
        .insert([
          {
            telegram_id: user.id,
            name: `${user.first_name || ''} ${user.last_name || ''}`.trim(),
            username: user.username || '',
            avatar: user.photo_url || null,
            manager: false,
          },
        ])
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json(newUser);
    }
  } catch (error) {
    console.error('Ошибка авторизации:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 },
    );
  }
}
