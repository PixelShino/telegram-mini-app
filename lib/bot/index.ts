// lib/bot/index.ts
import {
  Bot,
  Context,
  InlineKeyboard,
  Keyboard,
  session,
  SessionFlavor,
} from 'grammy';
import { createClient } from '@/lib/supabase/server';

// Определяем типы для сессии
interface SessionData {
  step: string;
  addressData?: any;
  userId?: number;
  registrationComplete?: boolean;
}

// Создаем тип контекста с сессией
type MyContext = Context & SessionFlavor<SessionData>;

// Создаем бота
export function createBot() {
  const bot = new Bot<MyContext>(process.env.TELEGRAM_BOT_TOKEN || '');

  // Добавляем middleware для сессии
  bot.use(
    session({
      initial: (): SessionData => ({ step: 'start' }),
    }),
  );

  // Команда /start
  bot.command('start', async (ctx) => {
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
  });

  // Обработка кнопки "Регистрация"
  bot.hears('Регистрация', async (ctx) => {
    ctx.session.step = 'registration_name';
    await ctx.reply('Введите ваше имя:');
  });

  // Обработка ввода имени
  bot.on('message:text', async (ctx) => {
    if (!ctx.message) return;

    if (ctx.session.step === 'registration_name') {
      const name = ctx.message.text;

      // Сохраняем имя
      ctx.session.step = 'registration_phone';
      await ctx.reply('Введите ваш номер телефона:');
    } else if (ctx.session.step === 'registration_phone') {
      const phone = ctx.message.text;

      // Сохраняем телефон
      ctx.session.step = 'registration_country';
      await ctx.reply('Введите вашу страну:');
    } else if (ctx.session.step === 'registration_country') {
      if (!ctx.session.addressData) ctx.session.addressData = {};
      ctx.session.addressData.country = ctx.message.text;

      ctx.session.step = 'registration_city';
      await ctx.reply('Введите ваш город:');
    } else if (ctx.session.step === 'registration_city') {
      if (!ctx.session.addressData) ctx.session.addressData = {};
      ctx.session.addressData.city = ctx.message.text;

      ctx.session.step = 'registration_street';
      await ctx.reply('Введите улицу:');
    } else if (ctx.session.step === 'registration_street') {
      if (!ctx.session.addressData) ctx.session.addressData = {};
      ctx.session.addressData.street = ctx.message.text;

      ctx.session.step = 'registration_house';
      await ctx.reply('Введите номер дома:');
    } else if (ctx.session.step === 'registration_house') {
      if (!ctx.session.addressData) ctx.session.addressData = {};
      ctx.session.addressData.house = ctx.message.text;

      ctx.session.step = 'registration_private_house';
      await ctx.reply('Это частный дом?', {
        reply_markup: new Keyboard().text('Да').text('Нет').resized().oneTime(),
      });
    } else if (ctx.session.step === 'registration_complete') {
      await showMainMenu(ctx);
    }
  });

  // Обработка ответа о частном доме
  bot.hears(['Да', 'Нет'], async (ctx) => {
    if (!ctx.message) return;

    if (ctx.session.step === 'registration_private_house') {
      if (!ctx.session.addressData) ctx.session.addressData = {};
      ctx.session.addressData.isPrivateHouse = ctx.message.text === 'Да';

      if (ctx.message.text === 'Нет') {
        ctx.session.step = 'registration_apartment';
        await ctx.reply('Введите номер квартиры:');
      } else {
        // Завершаем регистрацию для частного дома
        await completeRegistration(ctx);
      }
    }
  });

  // Обработка кнопок главного меню
  bot.hears('Изменить адрес доставки', async (ctx) => {
    ctx.session.step = 'change_address_country';
    ctx.session.addressData = {};
    await ctx.reply('Введите вашу страну:');
  });

  bot.hears('Мои заказы', async (ctx) => {
    await showOrders(ctx);
  });

  bot.hears('История заказов', async (ctx) => {
    await showOrderHistory(ctx);
  });

  bot.hears('Обо мне', async (ctx) => {
    await showProfile(ctx);
  });

  bot.hears('Перейти на сайт', async (ctx) => {
    await showWebsiteLink(ctx);
  });

  return bot;
}

// Функция для завершения регистрации
async function completeRegistration(ctx: any) {
  const chatId = ctx.chat.id;
  const user = ctx.from;
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
        phone: '', // Нужно добавить из сессии
        default_address: JSON.stringify(addressData),
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
async function showMainMenu(ctx: any) {
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

// Функция для отображения заказов
async function showOrders(ctx: any) {
  const chatId = ctx.chat.id;

  // Получаем активные заказы пользователя
  const supabase = createClient();
  const { data: orders, error } = await supabase
    .from('orders')
    .select('*')
    .eq('user_id', chatId)
    .neq('status', 'completed')
    .neq('status', 'cancelled')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Ошибка при получении заказов:', error);
    await ctx.reply('Произошла ошибка при получении заказов.');
    return;
  }

  if (!orders || orders.length === 0) {
    await ctx.reply('У вас нет активных заказов.');
    return;
  }

  // Отображаем заказы
  for (const order of orders) {
    await ctx.reply(
      `Заказ #${order.id}\n` +
        `Статус: ${getStatusText(order.status)}\n` +
        `Сумма: ${order.total_amount} ₽\n` +
        `Дата: ${new Date(order.created_at).toLocaleString('ru-RU')}`,
    );
  }
}

// Функция для отображения истории заказов
async function showOrderHistory(ctx: any) {
  const chatId = ctx.chat.id;

  // Получаем историю заказов пользователя
  const supabase = createClient();
  const { data: orders, error } = await supabase
    .from('orders')
    .select('*')
    .eq('user_id', chatId)
    .in('status', ['completed', 'cancelled'])
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) {
    console.error('Ошибка при получении истории заказов:', error);
    await ctx.reply('Произошла ошибка при получении истории заказов.');
    return;
  }

  if (!orders || orders.length === 0) {
    await ctx.reply('У вас нет завершенных заказов.');
    return;
  }

  // Отображаем историю заказов
  await ctx.reply('История заказов:');

  for (const order of orders) {
    await ctx.reply(
      `Заказ #${order.id}\n` +
        `Статус: ${getStatusText(order.status)}\n` +
        `Сумма: ${order.total_amount} ₽\n` +
        `Дата: ${new Date(order.created_at).toLocaleString('ru-RU')}`,
    );
  }
}

// Функция для отображения профиля
async function showProfile(ctx: any) {
  const chatId = ctx.chat.id;

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

  // Отображаем профиль
  let addressText = 'Не указан';

  if (user.default_address) {
    try {
      const address = JSON.parse(user.default_address);
      addressText = formatAddress(address);
    } catch (e) {
      console.error('Ошибка при парсинге адреса:', e);
    }
  }

  await ctx.reply(
    `Ваш профиль:\n\n` +
      `Имя: ${user.name}\n` +
      `Телефон: ${user.phone || 'Не указан'}\n` +
      `Email: ${user.email || 'Не указан'}\n\n` +
      `Адрес доставки:\n${addressText}`,
  );
}

// Функция для отображения ссылки на сайт
async function showWebsiteLink(ctx: any) {
  const chatId = ctx.chat.id;

  await ctx.reply('Нажмите на кнопку ниже, чтобы перейти на сайт:', {
    reply_markup: new InlineKeyboard().url(
      'Открыть сайт',
      `https://telegram-mini-app-tan-ten.vercel.app/shop?user_id=${chatId}`,
    ),
  });
}

// Вспомогательная функция для форматирования адреса
function formatAddress(address: any): string {
  const parts = [];

  if (address.country) parts.push(address.country);
  if (address.city) parts.push(address.city);
  if (address.street) parts.push(`ул. ${address.street}`);
  if (address.house) parts.push(`д. ${address.house}`);

  if (!address.isPrivateHouse) {
    if (address.apartment) parts.push(`кв. ${address.apartment}`);
    if (address.entrance) parts.push(`подъезд ${address.entrance}`);
    if (address.floor) parts.push(`этаж ${address.floor}`);
    if (address.intercom) parts.push(`домофон ${address.intercom}`);
  }

  return parts.join(', ');
}

// Вспомогательная функция для получения текста статуса
function getStatusText(status: string): string {
  switch (status) {
    case 'pending':
      return 'Ожидает обработки';
    case 'processing':
      return 'В обработке';
    case 'shipping':
      return 'Доставляется';
    case 'completed':
      return 'Выполнен';
    case 'cancelled':
      return 'Отменен';
    default:
      return status;
  }
}
