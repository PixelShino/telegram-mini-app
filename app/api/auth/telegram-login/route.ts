// app/api/auth/telegram-login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import crypto from 'crypto';

export async function GET(request: NextRequest) {
  // Сохраняем shopId в переменной вне блока try, чтобы она была доступна в catch
  const shopId = request.nextUrl.searchParams.get('shop_id') || '';

  try {
    const searchParams = request.nextUrl.searchParams;

    // Получаем параметры авторизации от Telegram
    const id = searchParams.get('id');
    const first_name = searchParams.get('first_name');
    const last_name = searchParams.get('last_name');
    const username = searchParams.get('username');
    const photo_url = searchParams.get('photo_url');
    const auth_date = searchParams.get('auth_date');
    const hash = searchParams.get('hash');

    // Проверяем наличие всех необходимых параметров
    if (!id || !auth_date || !hash || !shopId) {
      return NextResponse.redirect(
        `${request.nextUrl.origin}/shop/${shopId}?error=missing_params`,
      );
    }

    // Проверяем подпись данных
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      return NextResponse.redirect(
        `${request.nextUrl.origin}/shop/${shopId}?error=server_config`,
      );
    }

    // Создаем строку для проверки
    const dataCheckString = Object.entries({
      id,
      first_name,
      last_name,
      username,
      photo_url,
      auth_date,
    })
      .filter(([_, value]) => value !== null)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');

    // Создаем секретный ключ
    const secretKey = crypto.createHash('sha256').update(botToken).digest();

    // Вычисляем хеш
    const calculatedHash = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');

    // Проверяем хеш
    if (calculatedHash !== hash) {
      return NextResponse.redirect(
        `${request.nextUrl.origin}/shop/${shopId}?error=invalid_hash`,
      );
    }

    // Проверяем время авторизации (не старше 24 часов)
    const authTime = parseInt(auth_date);
    const currentTime = Math.floor(Date.now() / 1000);
    if (currentTime - authTime > 86400) {
      return NextResponse.redirect(
        `${request.nextUrl.origin}/shop/${shopId}?error=expired_auth`,
      );
    }

    // Создаем или обновляем пользователя в базе данных
    const supabase = createClient();

    // Проверяем, существует ли пользователь
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('telegram_id', id)
      .single();

    if (existingUser) {
      // Обновляем существующего пользователя
      await supabase
        .from('users')
        .update({
          name: `${first_name || ''} ${last_name || ''}`.trim(),
          username,
          avatar: photo_url,
        })
        .eq('telegram_id', id);
    } else {
      // Создаем нового пользователя
      await supabase.from('users').insert({
        telegram_id: id,
        name: `${first_name || ''} ${last_name || ''}`.trim(),
        username,
        avatar: photo_url,
        manager: false,
      });
    }

    // Создаем JWT токен для авторизации
    const token = crypto.randomBytes(32).toString('hex');

    // Сохраняем токен в куки
    const response = NextResponse.redirect(
      `${request.nextUrl.origin}/shop/${shopId}?auth=success`,
    );
    response.cookies.set('telegram_auth', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 дней
      path: '/',
    });

    // Сохраняем токен в базе данных
    await supabase.from('auth_tokens').insert({
      token,
      telegram_id: id,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 дней
    });

    return response;
  } catch (error) {
    console.error('Ошибка авторизации через Telegram:', error);
    return NextResponse.redirect(
      `${request.nextUrl.origin}/shop/${shopId}?error=server_error`,
    );
  }
}
