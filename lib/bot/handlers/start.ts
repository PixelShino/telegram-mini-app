// lib/bot/handlers/start.ts
import { createClient } from '@/lib/supabase/server';
import { MyContext } from '../types';
import { Keyboard } from 'grammy';
import { showMainMenu } from '../services/user';

// Обработчик команды /start
export async function handleStart(ctx: MyContext) {
  if (!ctx.chat) {
    console.error('Ошибка: ctx.chat не определен');
    return;
  }

  const chatId = ctx.chat.id;

  // Проверяем, зарегистрирован ли пользователь
  const supabase = createClient();
  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('telegram_id', chatId)
    .single();

  if (user) {
    // Пользователь уже зарегистрирован
    ctx.session.registrationComplete = true;
    ctx.session.userId = chatId;
    ctx.session.step = 'main_menu';

    await showMainMenu(ctx);
  } else {
    // Пользователь не зарегистрирован
    ctx.session.registrationComplete = false;
    ctx.session.step = 'registration';

    await ctx.reply(
      'Добро пожаловать! Для использования бота необходимо зарегистрироваться.',
      {
        reply_markup: new Keyboard().text('Регистрация').resized(),
      },
    );
  }
}
