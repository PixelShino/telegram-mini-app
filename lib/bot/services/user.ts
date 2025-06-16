import { createClient } from '@/lib/supabase/server';
import { MyContext } from '../types';
import { Keyboard } from 'grammy';

// Функция для завершения регистрации
export async function completeRegistration(ctx: MyContext) {
  const chatId = ctx.chat!.id;
  const user = ctx.from!;
  const addressData = ctx.session.addressData || {};

  // Сохраняем пользователя в базе данных
  const supabase = createClient();

  const { data, error } = await supabase
    .from('users')
    .insert([
      {
        telegram_id: chatId,
        name: `${user.first_name || ''} ${user.last_name || ''}`.trim(),
        username: user.username || '',
        email: addressData.email || '',
        phone: addressData.phone || '',
        // Используем отдельные поля для адреса
        country: addressData.country || '',
        city: addressData.city || '',
        street: addressData.street || '',
        house_number: addressData.house || '',
        is_private_house: addressData.isPrivateHouse || false,
        apartment: addressData.apartment
          ? parseInt(addressData.apartment)
          : null,
        entrance: addressData.entrance ? parseInt(addressData.entrance) : null,
        floor: addressData.floor ? parseInt(addressData.floor) : null,
        intercom_code: addressData.intercom || '',
        avatar: null,
        manager: false,
      },
    ])
    .select()
    .single();

  if (error) {
    console.error('Ошибка при регистрации пользователя:', error);
    await ctx.reply(
      'Произошла ошибка при регистрации. Пожалуйста, попробуйте еще раз.',
    );
    return;
  }

  ctx.session.registrationComplete = true;
  ctx.session.userId = chatId;
  ctx.session.step = 'registration_complete';

  await ctx.reply('Регистрация успешно завершена!');
  await showMainMenu(ctx);
}

// Функция для отображения главного меню
export async function showMainMenu(ctx: MyContext) {
  await ctx.reply('Главное меню:', {
    reply_markup: new Keyboard()
      .text('Изменить адрес доставки')
      .row()
      .text('Мои заказы')
      .text('История заказов')
      .row()
      .text('Обо мне')
      .text('Перейти на сайт')
      .resized(),
  });
}

// Функция для отображения профиля
export async function showProfile(ctx: MyContext) {
  const chatId = ctx.chat!.id;

  // Получаем данные пользователя
  const supabase = createClient();
  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('telegram_id', chatId)
    .single();

  if (error) {
    console.error('Ошибка при получении данных пользователя:', error);
    await ctx.reply('Произошла ошибка при получении данных профиля.');
    return;
  }

  // Форматируем адрес с использованием новой структуры
  const addressText = formatAddressFromUser(user);

  await ctx.reply(
    `Ваш профиль:\n\n` +
      `Имя: ${user.name}\n` +
      `Телефон: ${user.phone || 'Не указан'}\n` +
      `Email: ${user.email || 'Не указан'}\n\n` +
      `Адрес доставки:\n${addressText}`,
  );
}

// Импортируем функцию форматирования адреса
import { formatAddressFromUser } from '../utils/formatters';
