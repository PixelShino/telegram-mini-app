// app/api/auth/check-auth/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  console.log(' Проверка авторизации: Запрос получен');

  try {
    // Получаем токен из куки
    const token = request.cookies.get('telegram_auth')?.value;
    console.log(
      ' Проверка авторизации: Токен из куки',
      token ? 'найден' : 'отсутствует',
    );

    if (!token) {
      console.log(
        ' Проверка авторизации: Токен отсутствует, возвращаем 401 Unauthorized',
      );
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createClient();
    console.log('📊 Проверка авторизации: Подключение к Supabase установлено');

    // Проверяем токен в базе данных
    console.log(
      ` Проверка авторизации: Ищем токен в базе данных: ${token.substring(0, 8)}...`,
    );
    const { data: tokenData, error: tokenError } = await supabase
      .from('auth_tokens')
      .select('*')
      .eq('token', token)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (tokenError) {
      console.log(
        ' Проверка авторизации: Ошибка при поиске токена:',
        tokenError.message,
      );
    }

    if (!tokenData) {
      console.log(
        ' Проверка авторизации: Токен не найден или истек, возвращаем 401',
      );
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 },
      );
    }

    console.log(
      `Проверка авторизации: Токен найден, telegram_id: ${tokenData.telegram_id}`,
    );

    // Получаем данные пользователя
    console.log(
      ` Проверка авторизации: Ищем пользователя с telegram_id: ${tokenData.telegram_id}`,
    );
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('telegram_id', tokenData.telegram_id)
      .single();

    if (userError) {
      console.log(
        ' Проверка авторизации: Ошибка при поиске пользователя:',
        userError.message,
      );
    }

    if (!userData) {
      console.log(
        ' Проверка авторизации: Пользователь не найден, возвращаем 404',
      );
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    console.log(
      ` Проверка авторизации: Пользователь найден, id: ${userData.id}, name: ${userData.name}`,
    );
    return NextResponse.json(userData);
  } catch (error: any) {
    console.error(' Проверка авторизации: Критическая ошибка:', error);
    console.error('Стек вызовов:', error.stack);
    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: error.message || 'Unknown error',
      },
      { status: 500 },
    );
  }
}
