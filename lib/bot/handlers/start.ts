// lib/bot/handlers/start.ts - минимальный функционал
import { createClient } from '@/lib/supabase/server';
import { MyContext } from '../types';
import { InlineKeyboard } from 'grammy';

// Обработчик команды /start
export async function handleStart(ctx: MyContext) {
  if (!ctx.chat) {
    console.error('Ошибка: ctx.chat не определен');
    return;
  }

  const chatId = ctx.chat.id;

  // Получаем информацию о магазине
  const supabase = createClient();
  const { data: shop } = await supabase
    .from('shops')
    .select('id, name')
    .eq('status', 'active')
    .single();

  if (!shop) {
    await ctx.reply('Извините, магазин временно недоступен.');
    return;
  }

  // Сохраняем данные пользователя из Telegram
  const user = ctx.from;
  if (user) {
    try {
      await supabase.from('users').upsert({
        telegram_id: user.id,
        name: `${user.first_name || ''} ${user.last_name || ''}`.trim(),
        username: user.username || '',
      });
    } catch (error) {
      console.error('Ошибка при сохранении пользователя:', error);
    }
  }

  // Отправляем приветственное сообщение с кнопкой для перехода в магазин
  await ctx.reply(
    `Добро пожаловать в ${shop.name}! Нажмите на кнопку ниже, чтобы перейти в магазин:`,
    {
      reply_markup: new InlineKeyboard().url(
        'Открыть магазин',
        `https://telegram-mini-app-tan-ten.vercel.app/shop/${shop.id}`,
      ),
    },
  );
}

// // lib/bot/handlers/start.ts
// import { createClient } from '@/lib/supabase/server';
// import { MyContext } from '../types';
// import { Keyboard } from 'grammy';
// import { showMainMenu } from '../services/user';

// // Обработчик команды /start
// export async function handleStart(ctx: MyContext) {
//   if (!ctx.chat) {
//     console.error('Ошибка: ctx.chat не определен');
//     return;
//   }

//   const chatId = ctx.chat.id;

//   // Проверяем, зарегистрирован ли пользователь
//   const supabase = createClient();
//   const { data: user } = await supabase
//     .from('users')
//     .select('*')
//     .eq('telegram_id', chatId)
//     .single();

//   if (user) {
//     // Пользователь уже зарегистрирован
//     ctx.session.registrationComplete = true;
//     ctx.session.userId = chatId;
//     ctx.session.step = 'main_menu';

//     await showMainMenu(ctx);
//   } else {
//     // Пользователь не зарегистрирован
//     ctx.session.registrationComplete = false;
//     ctx.session.step = 'registration';

//     await ctx.reply(
//       'Добро пожаловать! Для использования бота необходимо зарегистрироваться.',
//       {
//         reply_markup: new Keyboard().text('Регистрация').resized(),
//       },
//     );
//   }
// }
