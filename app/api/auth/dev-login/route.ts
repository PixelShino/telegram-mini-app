// app/api/auth/dev-login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const userData = await request.json();

    if (!userData || !userData.telegram_id) {
      return NextResponse.json({ error: 'Invalid user data' }, { status: 400 });
    }

    const supabase = createClient();

    // Проверяем, существует ли пользователь
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('telegram_id', userData.telegram_id)
      .single();

    let user;

    if (existingUser) {
      // Используем существующего пользователя
      user = existingUser;
    } else {
      // Создаем тестового пользователя в базе данных
      const { data: newUser, error } = await supabase
        .from('users')
        .insert([
          {
            telegram_id: userData.telegram_id,
            name: userData.name || 'Test User',
            username: userData.username || 'testuser',
            email: userData.email || 'test@example.com',
            phone: userData.phone || '+79001234567',
            default_address: userData.default_address || '',
            avatar: userData.avatar || null,
            manager: userData.manager || false,
          },
        ])
        .select()
        .single();

      if (error) {
        console.error('Ошибка создания тестового пользователя:', error);
        return NextResponse.json(
          { error: 'Failed to create test user' },
          { status: 500 },
        );
      }

      user = newUser;
    }

    // Создаем токен авторизации
    const token = crypto.randomBytes(32).toString('hex');

    // Сохраняем токен в базе данных
    const { error: tokenError } = await supabase.from('auth_tokens').insert({
      token,
      telegram_id: userData.telegram_id,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 дней
    });

    if (tokenError) {
      console.error('Ошибка создания токена:', tokenError);
      return NextResponse.json(
        { error: 'Failed to create token' },
        { status: 500 },
      );
    }

    // Устанавливаем куки с токеном
    const response = NextResponse.json(user);
    response.cookies.set('telegram_auth', token, {
      httpOnly: true,
      secure: false, // Отключаем secure для работы в development
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 дней
      path: '/',
    });

    return response;
  } catch (error: any) {
    console.error('Ошибка авторизации для разработки:', error);
    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: error.message || 'Unknown error',
      },
      { status: 500 },
    );
  }
}

// if (process.env.NODE_ENV === 'production') {
//   return NextResponse.json(
//     { error: 'Not available in production' },
//     { status: 403 },
//   );
// }
