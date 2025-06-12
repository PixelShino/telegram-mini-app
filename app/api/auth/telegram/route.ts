import { type NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const { user, initData, shopId, isRegistration } = await request.json();

    // Проверяем подлинность данных от Telegram
    if (initData && !verifyTelegramData(initData)) {
      return NextResponse.json(
        { error: 'Invalid Telegram data' },
        { status: 401 },
      );
    }

    const supabase = createClient();

    // Проверяем, существует ли пользователь по telegram_id
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('telegram_id', user.id)
      .single();

    // Если пользователь существует и это не запрос на регистрацию, просто возвращаем данные
    if (existingUser) {
      // Если это запрос на регистрацию, обновляем данные пользователя
      if (isRegistration) {
        const { data: updatedUser, error } = await supabase
          .from('users')
          .update({
            name: `${user.first_name} ${user.last_name || ''}`.trim(),
            username: user.username,
            avatar: user.photo_url || null,
          })
          .eq('telegram_id', user.id)
          .select()
          .single();

        if (error) {
          console.error('Ошибка обновления пользователя:', error);
          return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Проверяем, является ли пользователь администратором магазина
        if (shopId) {
          const { data: adminData } = await supabase
            .from('shop_admins')
            .select('*')
            .eq('telegram_id', user.id)
            .eq('shop_id', shopId)
            .single();

          // Если пользователь не является администратором этого магазина, добавляем его
          if (!adminData) {
            // Здесь можно добавить логику для проверки, должен ли пользователь быть администратором
          }
        }

        return NextResponse.json(updatedUser);
      } else {
        // Если это не запрос на регистрацию, просто возвращаем существующего пользователя
        return NextResponse.json(existingUser);
      }
    } else {
      // Если пользователя нет и это запрос на регистрацию, создаем нового пользователя
      if (isRegistration) {
        const { data: newUser, error } = await supabase
          .from('users')
          .insert([
            {
              telegram_id: user.id,
              name: `${user.first_name} ${user.last_name || ''}`.trim(),
              username: user.username,
              avatar: user.photo_url || null,
              manager: false,
            },
          ])
          .select()
          .single();

        if (error) {
          console.error('Ошибка создания пользователя:', error);
          return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(newUser);
      } else {
        // Если это не запрос на регистрацию, возвращаем ошибку или временный объект пользователя
        return NextResponse.json({
          id: null,
          telegram_id: user.id,
          name: `${user.first_name} ${user.last_name || ''}`.trim(),
          username: user.username,
          avatar: user.photo_url || null,
          needsRegistration: true,
        });
      }
    }
  } catch (error) {
    console.error('Ошибка авторизации:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 },
    );
  }
}

// Проверка подлинности данных от Telegram
function verifyTelegramData(initData: string): boolean {
  if (!process.env.TELEGRAM_BOT_TOKEN) {
    console.warn('TELEGRAM_BOT_TOKEN не установлен');
    return true; // В разработке пропускаем проверку
  }

  try {
    const urlParams = new URLSearchParams(initData);
    const hash = urlParams.get('hash');
    urlParams.delete('hash');

    const dataCheckString = Array.from(urlParams.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');

    const secretKey = crypto
      .createHmac('sha256', 'WebAppData')
      .update(process.env.TELEGRAM_BOT_TOKEN)
      .digest();

    const calculatedHash = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');

    return calculatedHash === hash;
  } catch (error) {
    console.error('Ошибка проверки данных Telegram:', error);
    return false;
  }
}
