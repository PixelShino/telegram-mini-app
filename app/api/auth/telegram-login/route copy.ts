// import { NextRequest, NextResponse } from 'next/server';
// import { createClient } from '@/lib/supabase/server';
// import crypto from 'crypto';

// export async function GET(request: NextRequest) {
//   try {
//     const searchParams = request.nextUrl.searchParams;
//     const shopId = searchParams.get('shop_id');

//     // Получаем параметры авторизации от Telegram
//     const id = searchParams.get('id');
//     const first_name = searchParams.get('first_name');
//     const last_name = searchParams.get('last_name');
//     const username = searchParams.get('username');
//     const photo_url = searchParams.get('photo_url');
//     const auth_date = searchParams.get('auth_date');
//     const hash = searchParams.get('hash');

//     // Проверяем наличие всех необходимых параметров
//     if (!id || !auth_date || !hash || !shopId) {
//       return NextResponse.json({ error: 'Отсутствуют необходимые параметры' }, { status: 400 });
//     }

//     // Проверяем подпись данных
//     const botToken = process.env.TELEGRAM_BOT_TOKEN;
//     if (!botToken) {
//       return NextResponse.json({ error: 'Ошибка конфигурации сервера' }, { status: 500 });
//     }

//     // Создаем строку для проверки
//     const dataCheckString = Object.entries({
//       id, first_name, last_name, username, photo_url, auth_date
//     })
//       .filter(([_, value]) => value !== null)
//       .sort(([a], [b]) => a.localeCompare(b))
//       .map(([key, value]) => `${key}=${value}`)
//       .join('\n');

//     // Создаем секретный ключ
//     const secretKey = crypto.createHash('sha256')
//       .update(botToken)
//       .digest();

//     // Вычисляем хеш
//     const calculatedHash = crypto.createHmac('sha256', secretKey)
//       .update(dataCheckString)
//       .digest('hex');

//     // Проверяем хеш
//     if (calculatedHash !== hash) {
//       return NextResponse.json({ error: 'Недействительная подпись данных' }, { status: 403 });
//     }

//     // Проверяем время авторизации (не старше 24 часов)
//     const authTime = parseInt(auth_date);
//     const currentTime = Math.floor(Date.now() / 1000);
//     if (currentTime - authTime > 86400) {
//       return NextResponse.json({ error: 'Срок действия авторизации истек' }, { status: 403 });
//     }

//     // Создаем или обновляем пользователя в базе данных
//     const supabase = createClient();

//     // Проверяем, существует ли пользователь
//     const { data: existingUser } = await supabase
//       .from('telegram_users')
//       .select('*')
//       .eq('telegram_id', id)
//       .single();

//     if (existingUser) {
//       // Обновляем существующего пользователя
//       await supabase
//         .from('telegram_users')
//         .update({
//           first_name,
//           last_name,
//           username,
//           photo_url,
//           auth_date
//         })
//         .eq('telegram_id', id);
//     } else {
//       // Создаем нового пользователя
//       await supabase
//         .from('telegram_users')
//         .insert({
//           telegram_id: id,
//           first_name,
//           last_name,
//           username,
//           photo_url,
//           auth_date
//         });
//     }

//     // Перенаправляем пользователя обратно в приложение
//     return NextResponse.redirect(`${request.nextUrl.origin}/shop/${shopId}`);
//   } catch (error) {
//     console.error('Ошибка авторизации через Telegram:', error);
//     return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
//   }
// }
