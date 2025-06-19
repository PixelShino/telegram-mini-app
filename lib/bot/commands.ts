import { createClient } from '@/lib/supabase/server';
import { supabase } from '../supabase/client';

const ORDERS_PER_PAGE = 5;
// Проверка роли пользователя
async function isAdmin(telegramId: number): Promise<boolean> {
  const supabase = createClient();
  const { data } = await supabase
    .from('shop_admins')
    .select('role')
    .eq('telegram_id', telegramId)
    .eq('role', 'admin')
    .single();

  return !!data;
}

// Получение магазина для пользователя
async function getUserShop(telegramId: number) {
  const supabase = createClient();

  // Сначала проверяем, является ли пользователь администратором
  const { data: adminShops } = await supabase
    .from('shop_admins')
    .select('shops(*)')
    .eq('telegram_id', telegramId);

  if (adminShops && adminShops.length > 0) {
    return adminShops[0].shops;
  }

  // Если не админ, ищем магазин по заказам пользователя
  const { data: orders } = await supabase
    .from('orders')
    .select('shops(*)')
    .eq('user_id', telegramId)
    .order('created_at', { ascending: false })
    .limit(1);

  if (orders && orders.length > 0) {
    return orders[0].shops;
  }

  // Если нет заказов, возвращаем первый доступный магазин
  const { data: shops } = await supabase
    .from('shops')
    .select('*')
    .eq('status', 'active')
    .limit(1);

  return shops && shops.length > 0 ? shops[0] : null;
}

/// Обработка команд бота
export async function processCommand(
  command: string,
  chatId: number,
  user: any,
) {
  const commandName = command.split(' ')[0].toLowerCase();
  const args = command.split(' ').slice(1);

  // Проверяем, является ли пользователь администратором
  const admin = await isAdmin(user.id);

  switch (commandName) {
    case '/start':
      return await handleStart(chatId, user, admin);
    case '/stats':
      return admin
        ? await handleStats(chatId)
        : await sendMessage(chatId, 'У вас нет доступа к этой команде.');
    case '/orders':
      return admin
        ? await handleOrders(chatId, args)
        : await handleUserOrders(chatId, user.id);
    case '/myorders':
      return await handleUserOrders(chatId, user.id);
    case '/ordersmgmt':
      return admin
        ? await handleOrders(chatId, args)
        : await sendMessage(chatId, 'У вас нет доступа к этой команде.');
    case '/products':
      return admin
        ? await handleProducts(chatId, args)
        : await sendMessage(chatId, 'У вас нет доступа к этой команде.');
    case '/addproduct':
      return admin
        ? await handleAddProduct(chatId)
        : await sendMessage(chatId, 'У вас нет доступа к этой команде.');
    case '/settings':
      return admin
        ? await handleSettings(chatId, args)
        : await sendMessage(chatId, 'У вас нет доступа к этой команде.');
    case '/help':
      return await handleHelp(chatId, admin);
    default:
      return await sendMessage(
        chatId,
        'Неизвестная команда. Используйте /help для справки.',
      );
  }
}

// Обработчики команд

async function handleStart(chatId: number, user: any, isAdmin: boolean) {
  // Сохраняем данные пользователя из Telegram
  const supabase = createClient();
  try {
    await supabase.from('users').upsert({
      telegram_id: user.id,
      name: `${user.first_name || ''} ${user.last_name || ''}`.trim(),
      username: user.username || '',
    });
  } catch (error) {
    console.error('Ошибка при сохранении пользователя:', error);
  }

  if (isAdmin) {
    const supabase = createClient();

    // Получаем магазины, где пользователь является администратором
    const { data: shops } = await supabase
      .from('shop_admins')
      .select('shops(*)')
      .eq('telegram_id', user.id);

    if (!shops || shops.length === 0) {
      return await sendMessage(
        chatId,
        'У вас пока нет магазинов. Создайте магазин в веб-админке.',
      );
    }

    let message = 'Добро пожаловать в админ-панель! Ваши магазины:\n\n';

    shops.forEach((shop: any, index: number) => {
      message += `${index + 1}. ${shop.shops.name}\n`;
    });

    message += '\nВыберите действие:';

    // Создаем клавиатуру с кнопками команд для админа
    const keyboard = {
      keyboard: [
        [{ text: '/stats - Статистика' }, { text: '/ordersmgmt - Заказы' }],
        [
          { text: '/products - Товары' },
          { text: '/addproduct - Добавить товар' },
        ],
        [{ text: '/settings - Настройки' }, { text: '/help - Справка' }],
      ],
      resize_keyboard: true,
      one_time_keyboard: false,
    };

    await sendMessageWithKeyboard(chatId, message, keyboard);
  } else {
    // Для обычных пользователей
    const shop = await getUserShop(user.id);

    if (!shop) {
      return await sendMessage(
        chatId,
        'Добро пожаловать! К сожалению, магазин временно недоступен.',
      );
    }

    // Создаем клавиатуру с кнопками для обычного пользователя
    const keyboard = {
      keyboard: [
        [{ text: '/myorders - Мои заказы' }, { text: '/help - Справка' }],
        [{ text: 'Перейти в магазин' }],
      ],
      resize_keyboard: true,
      one_time_keyboard: false,
    };

    // Создаем кнопку для перехода в магазин
    const inlineKeyboard = {
      inline_keyboard: [
        [
          {
            text: 'Перейти в магазин',
            web_app: {
              url: `https://telegram-mini-app-tan-ten.vercel.app/shop/${shop.id}`,
            },
          },
        ],
      ],
    };

    await sendMessageWithKeyboard(
      chatId,
      `Добро пожаловать в магазин "${shop.name}"!\n\nДля перехода к покупкам нажмите кнопку ниже.`,
      keyboard,
    );

    // Отправляем также inline-кнопку для перехода в магазин
    await sendMessageWithKeyboard(
      chatId,
      'Или используйте эту кнопку:',
      inlineKeyboard,
    );
  }
}

export async function processMessage(text: string, chatId: number, user: any) {
  // Обработка кнопки "Перейти в магазин"
  if (text === 'Перейти в магазин') {
    const shop = await getUserShop(user.id);

    if (!shop) {
      return await sendMessage(chatId, 'Магазин временно недоступен.');
    }

    // Создаем inline-кнопку для перехода в магазин
    const inlineKeyboard = {
      inline_keyboard: [
        [
          {
            text: 'Перейти в магазин',
            web_app: {
              url: `https://telegram-mini-app-tan-ten.vercel.app/shop/${shop.id}`,
            },
          },
        ],
      ],
    };

    // Отправляем сообщение с inline-кнопкой
    return await sendMessageWithKeyboard(
      chatId,
      'Нажмите на кнопку, чтобы открыть магазин:',
      inlineKeyboard,
    );
  }
}
const USER_ORDERS_PER_PAGE = 3;
// Обработчик для просмотра заказов пользователя
async function handleUserOrders(
  chatId: number,
  telegramId: number,
  page = 0,
  messageId?: number,
) {
  const supabase = createClient();

  // Получаем общее количество заказов для пагинации
  const { count, error: countError } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', telegramId);

  if (countError) {
    console.error('Ошибка получения количества заказов:', countError);
    return await sendMessage(chatId, 'Произошла ошибка при получении заказов.');
  }

  const totalOrders = count || 0;
  const totalPages = Math.ceil(totalOrders / USER_ORDERS_PER_PAGE);

  // Проверяем, что страница в допустимом диапазоне
  if (page < 0) page = 0;
  if (page >= totalPages && totalPages > 0) page = totalPages - 1;

  // Получаем заказы пользователя для текущей страницы
  const { data: orders, error } = await supabase
    .from('orders')
    .select(
      `
      *,
      shops:shop_id (name)
    `,
    )
    .eq('user_id', telegramId)
    .order('created_at', { ascending: false })
    .range(page * USER_ORDERS_PER_PAGE, (page + 1) * USER_ORDERS_PER_PAGE - 1);

  if (error) {
    console.error('Ошибка получения заказов:', error);
    return await sendMessage(chatId, 'Произошла ошибка при получении заказов.');
  }

  if (!orders || orders.length === 0) {
    return await sendMessage(chatId, 'У вас пока нет заказов.');
  }

  let message = `🛒 <b>Ваши заказы (страница ${page + 1} из ${totalPages})</b>\n\n`;

  // Создаем клавиатуру с кнопками для навигации
  const keyboard: any = {
    inline_keyboard: [],
  };

  // Для каждого заказа получаем товары
  for (const order of orders) {
    message += `<b>Заказ #${order.id}</b>\n`;
    message += `Магазин: ${order.shops.name}\n`;
    message += `Сумма: ${order.total_amount.toFixed(2)} ₽\n`;
    message += `Статус: ${getStatusEmoji(order.status)} ${getStatusText(order.status)}\n`;
    message += `Дата: ${new Date(order.created_at).toLocaleString()}\n\n`;

    // Получаем товары заказа
    const { data: orderItems } = await supabase
      .from('orders_list')
      .select(
        `
        *,
        products:product_id (name)
      `,
      )
      .eq('order_id', order.id);

    if (orderItems && orderItems.length > 0) {
      message += `<b>Товары:</b>\n`;
      orderItems.forEach((item) => {
        message += `- ${item.products.name} x ${item.amount} шт. (${(item.price * item.amount).toFixed(2)} ₽)\n`;
      });
    }

    message += '\n';

    // Добавляем кнопку для просмотра деталей заказа
    keyboard.inline_keyboard.push([
      {
        text: `Подробнее о заказе #${order.id}`,
        callback_data: `view_order_${order.id}`,
      },
    ]);
  }

  // Добавляем кнопки навигации
  const navButtons = [];
  if (page > 0) {
    navButtons.push({
      text: '◀️ Назад',
      callback_data: `user_orders_page_${page - 1}`,
    });
  }
  if (page < totalPages - 1) {
    navButtons.push({
      text: 'Вперёд ▶️',
      callback_data: `user_orders_page_${page + 1}`,
    });
  }

  if (navButtons.length > 0) {
    keyboard.inline_keyboard.push(navButtons);
  }

  // Если есть messageId, редактируем существующее сообщение, иначе отправляем новое
  if (messageId) {
    await editMessageWithKeyboard(chatId, messageId, message, keyboard);
  } else {
    await sendMessageWithKeyboard(chatId, message, keyboard);
  }
}
async function handleViewOrder(
  chatId: number,
  orderId: string,
  messageId?: number,
) {
  const supabase = createClient();

  // Получаем информацию о заказе
  const { data: order, error } = await supabase
    .from('orders')
    .select(
      `
      *,
      shops:shop_id (name)
    `,
    )
    .eq('id', orderId)
    .single();

  if (error || !order) {
    await sendMessage(chatId, `❌ Ошибка: заказ #${orderId} не найден.`);
    return;
  }

  // Получаем товары заказа
  const { data: orderItems } = await supabase
    .from('orders_list')
    .select(
      `
      *,
      products:product_id (name)
    `,
    )
    .eq('order_id', orderId);

  // Формируем сообщение с информацией о заказе
  let message = `📋 <b>Заказ #${order.id}</b>\n\n`;
  message += `Магазин: ${order.shops.name}\n`;
  message += `Сумма: ${order.total_amount.toFixed(2)} ₽\n`;
  message += `Статус: ${getStatusEmoji(order.status)} ${getStatusText(order.status)}\n`;
  message += `Дата: ${new Date(order.created_at).toLocaleString()}\n\n`;

  if (order.comment) message += `Комментарий: ${order.comment}\n\n`;

  // Добавляем информацию о товарах
  if (orderItems && orderItems.length > 0) {
    message += `<b>Товары:</b>\n`;
    orderItems.forEach((item) => {
      message += `- ${item.products.name} x ${item.amount} шт. (${(item.price * item.amount).toFixed(2)} ₽)\n`;
    });
    message += '\n';
  }

  // Создаем клавиатуру с кнопкой возврата к списку заказов
  const keyboard = {
    inline_keyboard: [
      [{ text: '◀️ Назад к заказам', callback_data: 'user_orders_back' }],
    ],
  };

  // Если есть messageId, редактируем существующее сообщение, иначе отправляем новое
  if (messageId) {
    await editMessageWithKeyboard(chatId, messageId, message, keyboard);
  } else {
    await sendMessageWithKeyboard(chatId, message, keyboard);
  }
}
// Функция для отправки уведомления о статусе заказа
export async function sendOrderStatusNotification(
  telegram_id: number,
  order_id: string,
  shop_name: string,
  status: string,
): Promise<void> {
  const supabase = createClient();
  const statusText = getStatusText(status);

  // Получаем информацию о заказе
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('*')
    .eq('id', order_id)
    .single();

  if (orderError || !order) {
    console.error('Ошибка при получении информации о заказе:', orderError);
    return;
  }

  // Получаем товары заказа
  const { data: orderItems, error: itemsError } = await supabase
    .from('orders_list')
    .select(
      `
      *,
      products:product_id (name)
    `,
    )
    .eq('order_id', order_id);

  if (itemsError) {
    console.error('Ошибка при получении товаров заказа:', itemsError);
    return;
  }

  // Формируем сообщение с информацией о заказе
  let message = `🔔 <b>Ваш заказ #${order_id}</b>\n\n`;
  message += `Статус: ${getStatusEmoji(status)} ${statusText}\n`;
  message += `Магазин: ${shop_name}\n`;
  message += `Сумма: ${order.total_amount.toFixed(2)} ₽\n`;
  message += `Дата: ${new Date(order.created_at).toLocaleString()}\n\n`;

  // Добавляем информацию о товарах
  if (orderItems && orderItems.length > 0) {
    message += `<b>Товары:</b>\n`;
    orderItems.forEach((item) => {
      message += `- ${item.products.name} x ${item.amount} шт. (${(item.price * item.amount).toFixed(2)} ₽)\n`;
    });
  }

  await sendMessage(telegram_id, message);
}

// Обновленная функция для отправки сообщений с клавиатурой
async function sendMessageWithKeyboard(
  chatId: number,
  text: string,
  keyboard: any,
) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;

  if (!botToken) {
    console.error('TELEGRAM_BOT_TOKEN не настроен');
    return;
  }

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: text,
          parse_mode: 'HTML',
          reply_markup: keyboard,
        }),
      },
    );

    const data = await response.json();
    if (!data.ok) {
      console.error('Ошибка отправки сообщения:', data);
    }
    return data;
  } catch (error) {
    console.error('Ошибка при отправке сообщения в Telegram:', error);
  }
}

async function handleStats(chatId: number) {
  const supabase = createClient();

  // Получаем магазины администратора
  const { data: shops } = await supabase
    .from('shop_admins')
    .select('shop_id')
    .eq('telegram_id', chatId);

  if (!shops || shops.length === 0) {
    return await sendMessage(chatId, 'У вас нет магазинов.');
  }

  const shopIds = shops.map((shop) => shop.shop_id);

  // Получаем статистику по заказам
  const { data: orders, error: ordersError } = await supabase
    .from('orders')
    .select('*')
    .in('shop_id', shopIds);

  if (ordersError) {
    console.error('Ошибка получения заказов:', ordersError);
    return await sendMessage(
      chatId,
      'Произошла ошибка при получении статистики.',
    );
  }

  // Получаем статистику по товарам
  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('*')
    .in('shop_id', shopIds);

  if (productsError) {
    console.error('Ошибка получения товаров:', productsError);
    return await sendMessage(
      chatId,
      'Произошла ошибка при получении статистики.',
    );
  }

  // Считаем общую выручку
  const totalRevenue =
    orders?.reduce((sum, order) => sum + order.total_amount, 0) || 0;

  // Формируем сообщение со статистикой
  let message = '📊 <b>Статистика магазина</b>\n\n';
  message += `📦 Товаров: ${products?.length || 0}\n`;
  message += `🛒 Заказов: ${orders?.length || 0}\n`;
  message += `💰 Выручка: ${totalRevenue.toFixed(2)} ₽\n\n`;

  // Статистика по статусам заказов
  const pendingOrders =
    orders?.filter((order) => order.status === 'pending').length || 0;
  const completedOrders =
    orders?.filter((order) => order.status === 'completed').length || 0;

  message += `⏳ Ожидают обработки: ${pendingOrders}\n`;
  message += `✅ Выполнено: ${completedOrders}\n`;

  await sendMessage(chatId, message);
}

async function handleOrders(
  chatId: number,
  args: string[],
  page = 0,
  messageId?: number,
) {
  const supabase = createClient();

  // Получаем магазины администратора
  const { data: shops } = await supabase
    .from('shop_admins')
    .select('shop_id')
    .eq('telegram_id', chatId);

  if (!shops || shops.length === 0) {
    return await sendMessage(chatId, 'У вас нет магазинов.');
  }

  const shopIds = shops.map((shop) => shop.shop_id);

  // Получаем общее количество заказов для пагинации
  const { count, error: countError } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .in('shop_id', shopIds);

  if (countError) {
    console.error('Ошибка получения количества заказов:', countError);
    return await sendMessage(chatId, 'Произошла ошибка при получении заказов.');
  }

  const totalOrders = count || 0;
  const totalPages = Math.ceil(totalOrders / ORDERS_PER_PAGE);

  // Проверяем, что страница в допустимом диапазоне
  if (page < 0) page = 0;
  if (page >= totalPages && totalPages > 0) page = totalPages - 1;

  // Получаем заказы для текущей страницы
  const { data: orders, error } = await supabase
    .from('orders')
    .select(
      `
      *,
      shops:shop_id (name)
    `,
    )
    .in('shop_id', shopIds)
    .order('created_at', { ascending: false })
    .range(page * ORDERS_PER_PAGE, (page + 1) * ORDERS_PER_PAGE - 1);

  if (error) {
    console.error('Ошибка получения заказов:', error);
    return await sendMessage(chatId, 'Произошла ошибка при получении заказов.');
  }

  if (!orders || orders.length === 0) {
    return await sendMessage(chatId, 'У вас пока нет заказов.');
  }

  let message = `🛒 <b>Заказы (страница ${page + 1} из ${totalPages})</b>\n\n`;

  // Создаем клавиатуру с кнопками для каждого заказа и навигации
  const keyboard: any = {
    inline_keyboard: [],
  };

  // Получаем товары для каждого заказа
  for (const order of orders) {
    message += `<b>Заказ #${order.id}</b>\n`;
    message += `Магазин: ${order.shops.name}\n`;
    message += `Сумма: ${order.total_amount.toFixed(2)} ₽\n`;
    message += `Статус: ${getStatusEmoji(order.status)} ${getStatusText(order.status)}\n`;
    message += `Дата: ${new Date(order.created_at).toLocaleString()}\n`;

    // Добавляем информацию о пользователе
    if (order.user_id) {
      message += `Telegram ID: ${order.user_id}\n`;
    }
    if (order.telegram_username) {
      message += `Пользователь: @${order.telegram_username}\n`;
    }

    // Получаем товары заказа
    const { data: orderItems } = await supabase
      .from('orders_list')
      .select(
        `
        *,
        products:product_id (name)
      `,
      )
      .eq('order_id', order.id);

    if (orderItems && orderItems.length > 0) {
      message += `\n<b>Товары:</b>\n`;
      orderItems.forEach((item) => {
        message += `- ${item.products.name} x ${item.amount} шт. (${(item.price * item.amount).toFixed(2)} ₽)\n`;
      });
    }

    message += '\n';

    // Добавляем кнопку "Обработать" для каждого заказа
    keyboard.inline_keyboard.push([
      {
        text: `Обработать заказ #${order.id}`,
        callback_data: `process_order_${order.id}`,
      },
    ]);
  }

  // Добавляем кнопки навигации
  const navButtons = [];
  if (page > 0) {
    navButtons.push({
      text: '◀️ Назад',
      callback_data: `orders_page_${page - 1}`,
    });
  }
  if (page < totalPages - 1) {
    navButtons.push({
      text: 'Вперёд ▶️',
      callback_data: `orders_page_${page + 1}`,
    });
  }

  if (navButtons.length > 0) {
    keyboard.inline_keyboard.push(navButtons);
  }

  // Если есть messageId, редактируем существующее сообщение, иначе отправляем новое
  if (messageId) {
    await editMessageWithKeyboard(chatId, messageId, message, keyboard);
  } else {
    await sendMessageWithKeyboard(chatId, message, keyboard);
  }
}

async function handleProcessOrder(
  chatId: number,
  orderId: string,
  messageId?: number,
) {
  const supabase = createClient();

  // Получаем информацию о заказе
  const { data: order, error } = await supabase
    .from('orders')
    .select(
      `
      *,
      shops:shop_id (name)
    `,
    )
    .eq('id', orderId)
    .single();

  if (error || !order) {
    await sendMessage(chatId, `❌ Ошибка: заказ #${orderId} не найден.`);
    return;
  }

  // Получаем товары заказа
  const { data: orderItems } = await supabase
    .from('orders_list')
    .select(
      `
      *,
      products:product_id (name)
    `,
    )
    .eq('order_id', orderId);

  // Формируем сообщение с информацией о заказе
  let message = `📋 <b>Заказ #${order.id}</b>\n\n`;
  message += `Магазин: ${order.shops.name}\n`;
  message += `Сумма: ${order.total_amount.toFixed(2)} ₽\n`;
  message += `Статус: ${getStatusEmoji(order.status)} ${getStatusText(order.status)}\n`;
  message += `Дата: ${new Date(order.created_at).toLocaleString()}\n\n`;

  // Добавляем информацию о пользователе
  if (order.user_id) {
    message += `Telegram ID: ${order.user_id}\n`;
  }
  if (order.telegram_username) {
    message += `Пользователь: @${order.telegram_username}\n`;
  }

  if (order.phone) message += `Телефон: ${order.phone}\n`;
  if (order.email) message += `Email: ${order.email}\n`;
  if (order.comment) message += `Комментарий: ${order.comment}\n\n`;

  message += `Адрес: ${formatAddress(order)}\n\n`;

  // Добавляем информацию о товарах
  if (orderItems && orderItems.length > 0) {
    message += `<b>Товары:</b>\n`;
    orderItems.forEach((item) => {
      message += `- ${item.products.name} x ${item.amount} шт. (${(item.price * item.amount).toFixed(2)} ₽)\n`;
    });
    message += '\n';
  }

  message += `Выберите действие:`;

  // Создаем клавиатуру с кнопками для изменения статуса
  const keyboard = {
    inline_keyboard: [
      [
        {
          text: '⏳ Ожидает обработки',
          callback_data: `order_${order.id}_pending`,
        },
        {
          text: '🔄 Принят в работу',
          callback_data: `order_${order.id}_processing`,
        },
      ],
      [
        { text: '✅ Выполнен', callback_data: `order_${order.id}_completed` },
        { text: '❌ Отменен', callback_data: `order_${order.id}_cancelled` },
      ],
      [{ text: '◀️ Назад к заказам', callback_data: 'orders_back' }],
    ],
  };

  // Если есть messageId, редактируем существующее сообщение, иначе отправляем новое
  if (messageId) {
    await editMessageWithKeyboard(chatId, messageId, message, keyboard);
  } else {
    await sendMessageWithKeyboard(chatId, message, keyboard);
  }
}
async function editMessageWithKeyboard(
  chatId: number,
  messageId: number,
  text: string,
  keyboard: any,
) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;

  if (!botToken) {
    console.error('TELEGRAM_BOT_TOKEN не настроен');
    return;
  }

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${botToken}/editMessageText`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: chatId,
          message_id: messageId,
          text: text,
          parse_mode: 'HTML',
          reply_markup: keyboard,
        }),
      },
    );

    const data = await response.json();
    if (!data.ok) {
      console.error('Ошибка редактирования сообщения:', data);
    }
    return data;
  } catch (error) {
    console.error('Ошибка при редактировании сообщения в Telegram:', error);
  }
}

// Функция для форматирования адреса
function formatAddress(order: any): string {
  const parts = [];

  if (order.country) parts.push(order.country);
  if (order.city) parts.push(order.city);
  if (order.street) parts.push(order.street);
  if (order.house_number) parts.push(`д. ${order.house_number}`);

  if (!order.is_private_house) {
    if (order.apartment) parts.push(`кв. ${order.apartment}`);
    if (order.entrance) parts.push(`подъезд ${order.entrance}`);
    if (order.floor) parts.push(`этаж ${order.floor}`);
    if (order.intercom_code) parts.push(`домофон ${order.intercom_code}`);
  }

  return parts.length > 0 ? parts.join(', ') : 'Не указан';
}
const PRODUCTS_PER_PAGE = 5;
// Обновленная функция для управления товарами с пагинацией
async function handleProducts(
  chatId: number,
  args: string[],
  page = 0,
  messageId?: number,
) {
  const supabase = createClient();

  // Получаем магазины администратора
  const { data: shops } = await supabase
    .from('shop_admins')
    .select('shop_id')
    .eq('telegram_id', chatId);

  if (!shops || shops.length === 0) {
    return await sendMessage(chatId, 'У вас нет магазинов.');
  }

  const shopIds = shops.map((shop) => shop.shop_id);

  // Получаем общее количество товаров для пагинации
  const { count, error: countError } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .in('shop_id', shopIds);

  if (countError) {
    console.error('Ошибка получения количества товаров:', countError);
    return await sendMessage(chatId, 'Произошла ошибка при получении товаров.');
  }

  const totalProducts = count || 0;
  const totalPages = Math.ceil(totalProducts / PRODUCTS_PER_PAGE);

  // Проверяем, что страница в допустимом диапазоне
  if (page < 0) page = 0;
  if (page >= totalPages && totalPages > 0) page = totalPages - 1;

  // Получаем товары для текущей страницы
  const { data: products, error } = await supabase
    .from('products')
    .select('*')
    .in('shop_id', shopIds)
    .order('created_at', { ascending: false })
    .range(page * PRODUCTS_PER_PAGE, (page + 1) * PRODUCTS_PER_PAGE - 1);

  if (error) {
    console.error('Ошибка получения товаров:', error);
    return await sendMessage(chatId, 'Произошла ошибка при получении товаров.');
  }

  if (!products || products.length === 0) {
    return await sendMessage(
      chatId,
      'У вас пока нет товаров. Используйте /addproduct для добавления.',
    );
  }

  let message = `📦 <b>Ваши товары (страница ${page + 1} из ${totalPages})</b>\n\n`;

  // Создаем клавиатуру с кнопками для каждого товара и навигации
  const keyboard: any = {
    inline_keyboard: [],
  };

  products.forEach((product, index) => {
    message += `<b>${index + 1}. ${product.name}</b>\n`;
    message += `Цена: ${product.price.toFixed(2)} ₽\n`;
    message += `Статус: ${product.status === 'active' ? '✅ Активен' : '❌ Неактивен'}\n\n`;

    // Добавляем кнопку "Редактировать" для каждого товара
    keyboard.inline_keyboard.push([
      {
        text: `Редактировать ${product.name}`,
        callback_data: `edit_product_${product.id}`,
      },
    ]);
  });

  // Добавляем кнопки навигации
  const navButtons = [];
  if (page > 0) {
    navButtons.push({
      text: '◀️ Назад',
      callback_data: `products_page_${page - 1}`,
    });
  }
  if (page < totalPages - 1) {
    navButtons.push({
      text: 'Вперёд ▶️',
      callback_data: `products_page_${page + 1}`,
    });
  }

  if (navButtons.length > 0) {
    keyboard.inline_keyboard.push(navButtons);
  }

  // Добавляем кнопку для добавления нового товара
  keyboard.inline_keyboard.push([
    { text: '➕ Добавить новый товар', callback_data: 'add_product' },
  ]);

  // Добавляем кнопку для управления категориями
  keyboard.inline_keyboard.push([
    { text: '🏷️ Управление категориями', callback_data: 'manage_categories' },
  ]);

  // Если есть messageId, редактируем существующее сообщение, иначе отправляем новое
  if (messageId) {
    await editMessageWithKeyboard(chatId, messageId, message, keyboard);
  } else {
    await sendMessageWithKeyboard(chatId, message, keyboard);
  }
}

// Функция для редактирования товара
async function handleEditProduct(
  chatId: number,
  productId: string,
  messageId?: number,
) {
  const supabase = createClient();

  // Получаем информацию о товаре
  const { data: product, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', productId)
    .single();

  if (error || !product) {
    await sendMessage(chatId, `❌ Ошибка: товар #${productId} не найден.`);
    return;
  }

  // Формируем сообщение с информацией о товаре
  let message = `✏️ <b>Редактирование товара</b>\n\n`;
  message += `<b>${product.name}</b>\n`;
  message += `Описание: ${product.description || 'Не указано'}\n`;
  message += `Цена: ${product.price.toFixed(2)} ₽\n`;
  message += `Статус: ${product.status === 'active' ? '✅ Активен' : '❌ Неактивен'}\n`;
  message += `Можно изменять количество: ${product.allow_quantity_change ? '✅ Да' : '❌ Нет'}\n`;
  message += `Остаток: ${product.amount || 0} шт.\n\n`;

  message += `Выберите, что хотите изменить:`;

  // Создаем клавиатуру с кнопками для редактирования различных полей
  const keyboard = {
    inline_keyboard: [
      [
        {
          text: '✏️ Название',
          callback_data: `edit_product_name_${productId}`,
        },
        {
          text: '📝 Описание',
          callback_data: `edit_product_description_${productId}`,
        },
      ],
      [
        { text: '💰 Цена', callback_data: `edit_product_price_${productId}` },
        {
          text: '🔢 Остаток',
          callback_data: `edit_product_amount_${productId}`,
        },
      ],
      [
        {
          text: '🖼️ Изображения',
          callback_data: `edit_product_images_${productId}`,
        },
        {
          text: '🏷️ Категория',
          callback_data: `edit_product_category_${productId}`,
        },
      ],
      [
        {
          text:
            product.status === 'active'
              ? '❌ Деактивировать'
              : '✅ Активировать',
          callback_data: `toggle_product_status_${productId}`,
        },
        {
          text: product.allow_quantity_change
            ? '❌ Запретить изменение кол-ва'
            : '✅ Разрешить изменение кол-ва',
          callback_data: `toggle_product_quantity_${productId}`,
        },
      ],
      [
        {
          text: '🗑️ Удалить товар',
          callback_data: `delete_product_${productId}`,
        },
        { text: '◀️ Назад к товарам', callback_data: 'products_back' },
      ],
    ],
  };

  // Если есть messageId, редактируем существующее сообщение, иначе отправляем новое
  if (messageId) {
    await editMessageWithKeyboard(chatId, messageId, message, keyboard);
  } else {
    await sendMessageWithKeyboard(chatId, message, keyboard);
  }
}
// Функция для изменения статуса товара (активен/неактивен)
async function toggleProductStatus(
  chatId: number,
  productId: string,
  messageId?: number,
) {
  const supabase = createClient();

  // Получаем текущий статус товара
  const { data: product, error: getError } = await supabase
    .from('products')
    .select('status')
    .eq('id', productId)
    .single();

  if (getError || !product) {
    await sendMessage(chatId, `❌ Ошибка: товар #${productId} не найден.`);
    return;
  }

  // Определяем новый статус
  const newStatus = product.status === 'active' ? 'inactive' : 'active';

  // Обновляем статус товара
  const { error: updateError } = await supabase
    .from('products')
    .update({ status: newStatus })
    .eq('id', productId);

  if (updateError) {
    await sendMessage(
      chatId,
      `❌ Ошибка при обновлении статуса товара: ${updateError.message}`,
    );
    return;
  }

  // Отправляем уведомление об успешном обновлении
  await sendMessage(
    chatId,
    `✅ Статус товара изменен на "${newStatus === 'active' ? 'активен' : 'неактивен'}".`,
  );

  // Возвращаемся к редактированию товара
  await handleEditProduct(chatId, productId, messageId);
}
// Функция для редактирования описания товара
async function handleEditProductDescription(chatId: number, productId: string) {
  const supabase = createClient();

  // Получаем информацию о товаре
  const { data: product, error } = await supabase
    .from('products')
    .select('name, description')
    .eq('id', productId)
    .single();

  if (error || !product) {
    await sendMessage(chatId, `❌ Ошибка: товар #${productId} не найден.`);
    return;
  }

  // Сохраняем состояние диалога
  await supabase.from('bot_dialog_states').upsert({
    telegram_id: chatId,
    state: 'editing_product_description',
    data: { product_id: productId, product_name: product.name },
    updated_at: new Date().toISOString(),
  });

  // Отправляем запрос на ввод нового описания товара
  await sendMessage(
    chatId,
    `Редактирование описания товара <b>${product.name}</b>\n\n` +
      `Текущее описание: ${product.description || 'Не указано'}\n\n` +
      `Введите новое описание товара:`,
  );
}

// Функция для изменения настройки изменения количества товара
async function toggleProductQuantity(
  chatId: number,
  productId: string,
  messageId?: number,
) {
  const supabase = createClient();

  // Получаем текущую настройку товара
  const { data: product, error: getError } = await supabase
    .from('products')
    .select('allow_quantity_change')
    .eq('id', productId)
    .single();

  if (getError || !product) {
    await sendMessage(chatId, `❌ Ошибка: товар #${productId} не найден.`);
    return;
  }

  // Определяем новое значение
  const newValue = !product.allow_quantity_change;

  // Обновляем настройку товара
  const { error: updateError } = await supabase
    .from('products')
    .update({ allow_quantity_change: newValue })
    .eq('id', productId);

  if (updateError) {
    await sendMessage(
      chatId,
      `❌ Ошибка при обновлении настройки товара: ${updateError.message}`,
    );
    return;
  }

  // Отправляем уведомление об успешном обновлении
  await sendMessage(
    chatId,
    `✅ Настройка изменения количества товара изменена на "${newValue ? 'разрешено' : 'запрещено'}".`,
  );

  // Возвращаемся к редактированию товара
  await handleEditProduct(chatId, productId, messageId);
}

// Функция для удаления товара
async function deleteProduct(
  chatId: number,
  productId: string,
  messageId?: number,
) {
  const supabase = createClient();

  // Проверяем, есть ли товар в заказах
  const { data: orderItems, error: checkError } = await supabase
    .from('orders_list')
    .select('id')
    .eq('product_id', productId)
    .limit(1);

  if (checkError) {
    await sendMessage(
      chatId,
      `❌ Ошибка при проверке товара: ${checkError.message}`,
    );
    return;
  }

  // Если товар есть в заказах, предупреждаем пользователя
  if (orderItems && orderItems.length > 0) {
    const keyboard = {
      inline_keyboard: [
        [
          { text: '❌ Отмена', callback_data: `edit_product_${productId}` },
          {
            text: '⚠️ Удалить всё равно',
            callback_data: `force_delete_product_${productId}`,
          },
        ],
      ],
    };

    await sendMessageWithKeyboard(
      chatId,
      `⚠️ <b>Внимание!</b> Этот товар присутствует в заказах. Удаление может привести к ошибкам в отчетах.\n\nВы уверены, что хотите удалить товар?`,
      keyboard,
    );
    return;
  }

  // Если товара нет в заказах или пользователь подтвердил удаление
  const { error: deleteError } = await supabase
    .from('products')
    .delete()
    .eq('id', productId);

  if (deleteError) {
    await sendMessage(
      chatId,
      `❌ Ошибка при удалении товара: ${deleteError.message}`,
    );
    return;
  }

  // Отправляем уведомление об успешном удалении
  await sendMessage(chatId, `✅ Товар успешно удален.`);

  // Возвращаемся к списку товаров
  await handleProducts(chatId, [], 0, messageId);
}

// Функция для добавления новой категории
async function handleAddCategory(chatId: number) {
  const supabase = createClient();

  // Получаем магазин пользователя
  const { data: shops } = await supabase
    .from('shop_admins')
    .select('shop_id')
    .eq('telegram_id', chatId)
    .limit(1);

  if (!shops || shops.length === 0) {
    await sendMessage(chatId, `❌ Ошибка: у вас нет магазинов.`);
    return;
  }

  const shopId = shops[0].shop_id;

  // Сохраняем состояние диалога
  await supabase.from('bot_dialog_states').upsert({
    telegram_id: chatId,
    state: 'adding_category',
    data: { shop_id: shopId },
    updated_at: new Date().toISOString(),
  });

  // Отправляем запрос на ввод названия категории
  await sendMessage(chatId, `Введите название новой категории:`);
}

// Функция для редактирования категории
async function handleEditCategory(
  chatId: number,
  categoryId: string,
  messageId?: number,
) {
  const supabase = createClient();

  // Получаем информацию о категории
  const { data: category, error } = await supabase
    .from('categories')
    .select('*')
    .eq('id', categoryId)
    .single();

  if (error || !category) {
    await sendMessage(
      chatId,
      `❌ Ошибка: категория #${categoryId} не найдена.`,
    );
    return;
  }

  // Формируем сообщение с информацией о категории
  let message = `✏️ <b>Редактирование категории</b>\n\n`;
  message += `<b>${category.name}</b>\n\n`;
  message += `Выберите действие:`;

  // Создаем клавиатуру с кнопками для редактирования категории
  const keyboard = {
    inline_keyboard: [
      [
        {
          text: '✏️ Переименовать',
          callback_data: `rename_category_${categoryId}`,
        },
        { text: '🗑️ Удалить', callback_data: `delete_category_${categoryId}` },
      ],
      [{ text: '◀️ Назад к категориям', callback_data: 'manage_categories' }],
    ],
  };

  // Если есть messageId, редактируем существующее сообщение, иначе отправляем новое
  if (messageId) {
    await editMessageWithKeyboard(chatId, messageId, message, keyboard);
  } else {
    await sendMessageWithKeyboard(chatId, message, keyboard);
  }
}

// Функция для переименования категории
async function handleRenameCategory(chatId: number, categoryId: string) {
  const supabase = createClient();

  // Получаем информацию о категории
  const { data: category, error } = await supabase
    .from('categories')
    .select('*')
    .eq('id', categoryId)
    .single();

  if (error || !category) {
    await sendMessage(
      chatId,
      `❌ Ошибка: категория #${categoryId} не найдена.`,
    );
    return;
  }

  // Сохраняем состояние диалога
  await supabase.from('bot_dialog_states').upsert({
    telegram_id: chatId,
    state: 'renaming_category',
    data: { category_id: categoryId, current_name: category.name },
    updated_at: new Date().toISOString(),
  });

  // Отправляем запрос на ввод нового названия категории
  await sendMessage(
    chatId,
    `Текущее название категории: <b>${category.name}</b>\n\nВведите новое название категории:`,
  );
}

// Функция для удаления категории
async function handleDeleteCategory(
  chatId: number,
  categoryId: string,
  messageId?: number,
) {
  const supabase = createClient();

  // Получаем информацию о категории
  const { data: category, error: categoryError } = await supabase
    .from('categories')
    .select('*')
    .eq('id', categoryId)
    .single();

  if (categoryError || !category) {
    await sendMessage(
      chatId,
      `❌ Ошибка: категория #${categoryId} не найдена.`,
    );
    return;
  }

  // Проверяем, есть ли товары в этой категории
  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('id')
    .eq('category_id', categoryId)
    .limit(1);

  if (productsError) {
    await sendMessage(
      chatId,
      `❌ Ошибка при проверке товаров: ${productsError.message}`,
    );
    return;
  }

  // Если в категории есть товары, предупреждаем пользователя
  if (products && products.length > 0) {
    const keyboard = {
      inline_keyboard: [
        [
          { text: '❌ Отмена', callback_data: `edit_category_${categoryId}` },
          {
            text: '⚠️ Удалить всё равно',
            callback_data: `force_delete_category_${categoryId}`,
          },
        ],
      ],
    };

    await sendMessageWithKeyboard(
      chatId,
      `⚠️ <b>Внимание!</b> В категории "${category.name}" есть товары. При удалении категории товары останутся без категории.\n\nВы уверены, что хотите удалить категорию?`,
      keyboard,
    );
    return;
  }

  // Если в категории нет товаров или пользователь подтвердил удаление
  await deleteCategory(chatId, categoryId, category.name, messageId);
}

// Вспомогательная функция для удаления категории
async function deleteCategory(
  chatId: number,
  categoryId: string,
  categoryName: string,
  messageId?: number,
) {
  const supabase = createClient();

  // Удаляем категорию
  const { error: deleteError } = await supabase
    .from('categories')
    .delete()
    .eq('id', categoryId);

  if (deleteError) {
    await sendMessage(
      chatId,
      `❌ Ошибка при удалении категории: ${deleteError.message}`,
    );
    return;
  }

  // Отправляем уведомление об успешном удалении
  await sendMessage(chatId, `✅ Категория "${categoryName}" успешно удалена.`);

  // Возвращаемся к списку категорий
  await handleManageCategories(chatId, messageId);
}

// Функция для обработки текстовых сообщений в диалогах
export async function processDialogState(
  text: string,
  chatId: number,
  user: any,
) {
  const supabase = createClient();
  console.log('Обработка диалога:', { text, chatId });

  try {
    // Получаем текущее состояние диалога
    const { data: dialogState, error } = await supabase
      .from('bot_dialog_states')
      .select('*')
      .eq('telegram_id', chatId)
      .single();

    if (error) {
      console.error('Ошибка получения состояния диалога:', error);
      await sendMessage(chatId, '❌ Произошла ошибка при обработке диалога.');
      return await processMessage(text, chatId, user);
    }

    if (!dialogState) {
      console.log('Нет активного диалога');
      return await processMessage(text, chatId, user);
    }

    console.log('Текущее состояние диалога:', dialogState);

    // Обрабатываем различные состояния диалога
    switch (dialogState.state) {
      case 'editing_product_name':
        // Редактирование названия товара
        console.log('Обновление названия товара:', {
          productId: dialogState.data.product_id,
          newName: text,
        });

        const { error: nameError } = await supabase
          .from('products')
          .update({ name: text })
          .eq('id', dialogState.data.product_id);

        if (nameError) {
          console.error('Ошибка при обновлении названия товара:', nameError);
          await sendMessage(
            chatId,
            `❌ Ошибка при обновлении названия товара: ${nameError.message}`,
          );
        } else {
          console.log('Название товара успешно обновлено');
          await sendMessage(
            chatId,
            `✅ Название товара изменено с "${dialogState.data.current_name}" на "${text}"!`,
          );
          await handleEditProduct(chatId, dialogState.data.product_id);
        }
        break;

      case 'editing_product_description':
        // Редактирование описания товара
        console.log('Обновление описания товара:', {
          productId: dialogState.data.product_id,
          newDescription: text,
        });

        const { error: descriptionError } = await supabase
          .from('products')
          .update({ description: text })
          .eq('id', dialogState.data.product_id);

        if (descriptionError) {
          console.error(
            'Ошибка при обновлении описания товара:',
            descriptionError,
          );
          await sendMessage(
            chatId,
            `❌ Ошибка при обновлении описания товара: ${descriptionError.message}`,
          );
        } else {
          console.log('Описание товара успешно обновлено');
          await sendMessage(
            chatId,
            `✅ Описание товара "${dialogState.data.product_name}" успешно обновлено!`,
          );
          await handleEditProduct(chatId, dialogState.data.product_id);
        }
        break;

      case 'editing_product_price':
        // Редактирование цены товара
        const price = parseFloat(text);

        if (isNaN(price) || price <= 0) {
          await sendMessage(
            chatId,
            `❌ Ошибка: введите корректную цену (положительное число).`,
          );
          return;
        }

        console.log('Обновление цены товара:', {
          productId: dialogState.data.product_id,
          newPrice: price,
        });

        const { error: priceError } = await supabase
          .from('products')
          .update({ price })
          .eq('id', dialogState.data.product_id);

        if (priceError) {
          console.error('Ошибка при обновлении цены товара:', priceError);
          await sendMessage(
            chatId,
            `❌ Ошибка при обновлении цены товара: ${priceError.message}`,
          );
        } else {
          console.log('Цена товара успешно обновлена');
          await sendMessage(
            chatId,
            `✅ Цена товара "${dialogState.data.product_name}" изменена на ${price.toFixed(2)} ₽!`,
          );
          await handleEditProduct(chatId, dialogState.data.product_id);
        }
        break;

      case 'editing_product_amount':
        // Редактирование остатка товара
        const amount = parseInt(text);

        if (isNaN(amount) || amount < 0) {
          await sendMessage(
            chatId,
            `❌ Ошибка: введите корректное количество (целое неотрицательное число).`,
          );
          return;
        }

        console.log('Обновление остатка товара:', {
          productId: dialogState.data.product_id,
          newAmount: amount,
        });

        const { error: amountError } = await supabase
          .from('products')
          .update({ amount })
          .eq('id', dialogState.data.product_id);

        if (amountError) {
          console.error('Ошибка при обновлении остатка товара:', amountError);
          await sendMessage(
            chatId,
            `❌ Ошибка при обновлении остатка товара: ${amountError.message}`,
          );
        } else {
          console.log('Остаток товара успешно обновлен');
          await sendMessage(
            chatId,
            `✅ Остаток товара "${dialogState.data.product_name}" изменен на ${amount} шт.!`,
          );
          await handleEditProduct(chatId, dialogState.data.product_id);
        }
        break;

      // Другие состояния диалога...

      default:
        // Неизвестное состояние диалога
        console.warn('Неизвестное состояние диалога:', dialogState.state);
        await sendMessage(
          chatId,
          `❌ Неизвестное состояние диалога. Пожалуйста, начните заново.`,
        );
    }
  } catch (error) {
    console.error('Ошибка при обработке диалога:', error);
    await sendMessage(
      chatId,
      `❌ Произошла ошибка при обработке вашего запроса. Пожалуйста, попробуйте еще раз.`,
    );
  } finally {
    // Очищаем состояние диалога
    try {
      await supabase
        .from('bot_dialog_states')
        .delete()
        .eq('telegram_id', chatId);
      console.log('Состояние диалога очищено');
    } catch (error) {
      console.error('Ошибка при очистке состояния диалога:', error);
    }
  }
}

// Функция для редактирования названия товара
async function handleEditProductName(chatId: number, productId: string) {
  const supabase = createClient();
  console.log('Запуск редактирования названия товара:', { chatId, productId });

  // Получаем информацию о товаре
  const { data: product, error } = await supabase
    .from('products')
    .select('name')
    .eq('id', productId)
    .single();

  if (error || !product) {
    console.error('Ошибка получения товара:', error);
    await sendMessage(chatId, `❌ Ошибка: товар #${productId} не найден.`);
    return;
  }

  console.log('Товар найден:', product);

  // Сохраняем состояние диалога
  const { error: dialogError } = await supabase
    .from('bot_dialog_states')
    .upsert({
      telegram_id: chatId,
      state: 'editing_product_name',
      data: { product_id: productId, current_name: product.name },
      updated_at: new Date().toISOString(),
    });

  if (dialogError) {
    console.error('Ошибка сохранения состояния диалога:', dialogError);
    await sendMessage(chatId, `❌ Ошибка: не удалось начать редактирование.`);
    return;
  }

  console.log('Состояние диалога сохранено');

  // Отправляем запрос на ввод нового названия товара
  await sendMessage(
    chatId,
    `Редактирование названия товара\n\n` +
      `Текущее название: <b>${product.name}</b>\n\n` +
      `Введите новое название товара:`,
  );
}

// Функция для редактирования цены товара
async function handleEditProductPrice(chatId: number, productId: string) {
  const supabase = createClient();

  // Получаем информацию о товаре
  const { data: product, error } = await supabase
    .from('products')
    .select('name, price')
    .eq('id', productId)
    .single();

  if (error || !product) {
    await sendMessage(chatId, `❌ Ошибка: товар #${productId} не найден.`);
    return;
  }

  // Сохраняем состояние диалога
  await supabase.from('bot_dialog_states').upsert({
    telegram_id: chatId,
    state: 'editing_product_price',
    data: { product_id: productId, product_name: product.name },
    updated_at: new Date().toISOString(),
  });

  // Отправляем запрос на ввод новой цены товара
  await sendMessage(
    chatId,
    `Редактирование цены товара <b>${product.name}</b>\n\n` +
      `Текущая цена: ${product.price.toFixed(2)} ₽\n\n` +
      `Введите новую цену товара (только число):`,
  );
}

// Функция для редактирования остатка товара
async function handleEditProductAmount(chatId: number, productId: string) {
  const supabase = createClient();

  // Получаем информацию о товаре
  const { data: product, error } = await supabase
    .from('products')
    .select('name, amount')
    .eq('id', productId)
    .single();

  if (error || !product) {
    await sendMessage(chatId, `❌ Ошибка: товар #${productId} не найден.`);
    return;
  }

  // Сохраняем состояние диалога
  await supabase.from('bot_dialog_states').upsert({
    telegram_id: chatId,
    state: 'editing_product_amount',
    data: { product_id: productId, product_name: product.name },
    updated_at: new Date().toISOString(),
  });

  // Отправляем запрос на ввод нового остатка товара
  await sendMessage(
    chatId,
    `Редактирование остатка товара <b>${product.name}</b>\n\n` +
      `Текущий остаток: ${product.amount || 0} шт.\n\n` +
      `Введите новый остаток товара (только целое число):`,
  );
}

// Функция для редактирования категории товара
async function handleEditProductCategory(chatId: number, productId: string) {
  const supabase = createClient();

  // Получаем информацию о товаре
  const { data: product, error: productError } = await supabase
    .from('products')
    .select('name, category_id')
    .eq('id', productId)
    .single();

  if (productError || !product) {
    await sendMessage(chatId, `❌ Ошибка: товар #${productId} не найден.`);
    return;
  }

  // Получаем магазины администратора
  const { data: shops } = await supabase
    .from('shop_admins')
    .select('shop_id')
    .eq('telegram_id', chatId);

  if (!shops || shops.length === 0) {
    await sendMessage(chatId, 'У вас нет магазинов.');
    return;
  }

  const shopIds = shops.map((shop) => shop.shop_id);

  // Получаем категории
  const { data: categories, error: categoriesError } = await supabase
    .from('categories')
    .select('*')
    .in('shop_id', shopIds)
    .order('name', { ascending: true });

  if (categoriesError) {
    await sendMessage(
      chatId,
      `❌ Ошибка при получении категорий: ${categoriesError.message}`,
    );
    return;
  }

  if (!categories || categories.length === 0) {
    await sendMessage(
      chatId,
      `❌ У вас пока нет категорий. Сначала создайте категории через меню "Управление категориями".`,
    );
    return;
  }

  // Формируем сообщение с выбором категории
  let message = `🏷️ <b>Выберите категорию для товара "${product.name}"</b>\n\n`;
  message += `Текущая категория: ${product.category_id ? 'Установлена' : 'Не установлена'}\n\n`;
  message += `Доступные категории:`;

  // Создаем клавиатуру с кнопками для выбора категории
  const keyboard: {
    inline_keyboard: Array<Array<{ text: string; callback_data: string }>>;
  } = {
    inline_keyboard: [],
  };

  // Добавляем кнопку для удаления категории
  keyboard.inline_keyboard.push([
    {
      text: '❌ Без категории',
      callback_data: `set_product_category_${productId}_null`,
    },
  ]);

  // Добавляем кнопки для каждой категории
  categories.forEach((category) => {
    keyboard.inline_keyboard.push([
      {
        text: category.name,
        callback_data: `set_product_category_${productId}_${category.id}`,
      },
    ]);
  });

  // Добавляем кнопку "Назад"
  keyboard.inline_keyboard.push([
    { text: '◀️ Назад', callback_data: `edit_product_${productId}` },
  ]);

  // Отправляем сообщение с клавиатурой
  await sendMessageWithKeyboard(chatId, message, keyboard);
}

// Функция для редактирования изображений товара
async function handleEditProductImages(chatId: number, productId: string) {
  const supabase = createClient();

  // Получаем информацию о товаре
  const { data: product, error } = await supabase
    .from('products')
    .select('name, images')
    .eq('id', productId)
    .single();

  if (error || !product) {
    await sendMessage(chatId, `❌ Ошибка: товар #${productId} не найден.`);
    return;
  }

  // Формируем сообщение с информацией об изображениях
  let message = `🖼️ <b>Изображения товара "${product.name}"</b>\n\n`;

  if (!product.images || product.images.length === 0) {
    message += `У товара пока нет изображений.\n\n`;
  } else {
    message += `У товара ${product.images.length} изображений.\n\n`;
  }

  message += `Для управления изображениями используйте веб-интерфейс администратора.\n`;
  message += `В Telegram боте пока нет возможности загружать и удалять изображения напрямую.`;

  // Создаем клавиатуру с кнопкой "Назад"
  const keyboard: {
    inline_keyboard: Array<Array<{ text: string; callback_data: string }>>;
  } = {
    inline_keyboard: [
      [{ text: '◀️ Назад', callback_data: `edit_product_${productId}` }],
    ],
  };

  // Отправляем сообщение с клавиатурой
  await sendMessageWithKeyboard(chatId, message, keyboard);
}

// Функция для управления категориями
async function handleManageCategories(chatId: number, messageId?: number) {
  const supabase = createClient();

  // Получаем магазины администратора
  const { data: shops } = await supabase
    .from('shop_admins')
    .select('shop_id')
    .eq('telegram_id', chatId);

  if (!shops || shops.length === 0) {
    return await sendMessage(chatId, 'У вас нет магазинов.');
  }

  const shopIds = shops.map((shop) => shop.shop_id);

  // Получаем категории
  const { data: categories, error } = await supabase
    .from('categories')
    .select('*')
    .in('shop_id', shopIds)
    .order('name', { ascending: true });

  if (error) {
    console.error('Ошибка получения категорий:', error);
    return await sendMessage(
      chatId,
      'Произошла ошибка при получении категорий.',
    );
  }

  let message = `🏷️ <b>Управление категориями</b>\n\n`;

  if (!categories || categories.length === 0) {
    message += 'У вас пока нет категорий. Добавьте первую категорию!';
  } else {
    message += 'Ваши категории:\n\n';
    categories.forEach((category, index) => {
      message += `${index + 1}. ${category.name}\n`;
    });
  }

  // Создаем клавиатуру с кнопками для управления категориями
  const keyboard: {
    inline_keyboard: Array<Array<{ text: string; callback_data: string }>>;
  } = {
    inline_keyboard: [
      [{ text: '➕ Добавить категорию', callback_data: 'add_category' }],
    ],
  };

  // Добавляем кнопки для редактирования категорий, если они есть
  if (categories && categories.length > 0) {
    categories.forEach((category) => {
      keyboard.inline_keyboard.push([
        {
          text: `✏️ ${category.name}`,
          callback_data: `edit_category_${category.id}`,
        },
      ]);
    });
  }

  // Добавляем кнопку "Назад"
  keyboard.inline_keyboard.push([
    { text: '◀️ Назад к товарам', callback_data: 'products_back' },
  ]);

  // Если есть messageId, редактируем существующее сообщение, иначе отправляем новое
  if (messageId) {
    await editMessageWithKeyboard(chatId, messageId, message, keyboard);
  } else {
    await sendMessageWithKeyboard(chatId, message, keyboard);
  }
}
// TODO: Сделать добавление товара через бота
async function handleAddProduct(chatId: number) {
  // Здесь будет логика добавления товара через бота
  // Это требует создания состояния диалога и пошагового процесса

  await sendMessage(
    chatId,
    'Для добавления товара, пожалуйста, следуйте инструкциям:\n\n' +
      '1. Отправьте название товара\n' +
      '2. Отправьте описание\n' +
      '3. Отправьте цену\n' +
      '4. Отправьте фото товара\n\n' +
      'Эта функция будет доступна в ближайшем обновлении.',
  );
}
// TODO: Сделать настройку магазина через бота
async function handleSettings(chatId: number, args: string[]) {
  await sendMessage(
    chatId,
    '⚙️ <b>Настройки магазина</b>\n\n' +
      'Для изменения настроек используйте команды:\n\n' +
      '/settings name НОВОЕ_НАЗВАНИЕ - изменить название\n' +
      '/settings description НОВОЕ_ОПИСАНИЕ - изменить описание\n' +
      '/settings welcome НОВОЕ_ПРИВЕТСТВИЕ - изменить приветствие\n\n' +
      'Эта функция будет доступна в ближайшем обновлении.',
  );
}

//  функция для справки с учетом роли пользователя
async function handleHelp(chatId: number, isAdmin: boolean) {
  let helpMessage = '🤖 <b>Доступные команды</b>\n\n';

  if (isAdmin) {
    helpMessage +=
      '/start - Начало работы\n' +
      '/stats - Статистика магазина\n' +
      '/ordersmgmt - Управление заказами\n' +
      '/products - Список товаров\n' +
      '/addproduct - Добавить товар\n' +
      '/settings - Настройки магазина\n' +
      '/help - Эта справка\n\n' +
      'Для получения подробной информации о команде, используйте:\n' +
      '/help КОМАНДА';
  } else {
    helpMessage +=
      '/start - Начало работы\n' +
      '/myorders - Ваши заказы\n' +
      '/help - Эта справка';
  }

  await sendMessage(chatId, helpMessage);
}

// Вспомогательные функции

function getStatusEmoji(status: string): string {
  switch (status) {
    case 'pending':
      return '⏳';
    case 'processing':
      return '🔄';
    case 'completed':
      return '✅';
    case 'cancelled':
      return '❌';
    default:
      return '❓';
  }
}

function getStatusText(status: string): string {
  switch (status) {
    case 'pending':
      return 'Ожидает обработки';
    case 'processing':
      return 'Принят в обработку';
    case 'completed':
      return 'Выполнен';
    case 'cancelled':
      return 'Отменен';
    default:
      return 'Неизвестно';
  }
}

//  функция для отправки обычных сообщений
async function sendMessage(chatId: number, text: string) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;

  if (!botToken) {
    console.error('TELEGRAM_BOT_TOKEN не настроен');
    return;
  }

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: text,
          parse_mode: 'HTML',
        }),
      },
    );

    const data = await response.json();
    if (!data.ok) {
      console.error('Ошибка отправки сообщения:', data);
    }
    return data;
  } catch (error) {
    console.error('Ошибка при отправке сообщения в Telegram:', error);
  }
}
// Функция для отправки уведомления администраторам о новом заказе
export async function sendOrderNotificationToAdmins(
  order_id: string,
  shop_id: string,
  total_amount: number,
  customer_info: string,
): Promise<void> {
  const supabase = createClient();

  // Получаем администраторов магазина
  const { data: admins, error } = await supabase
    .from('shop_admins')
    .select('telegram_id')
    .eq('shop_id', shop_id)
    .eq('role', 'admin');

  if (error || !admins || admins.length === 0) {
    console.error('Не удалось найти администраторов магазина:', error);
    return;
  }

  // Получаем информацию о магазине
  const { data: shop } = await supabase
    .from('shops')
    .select('name')
    .eq('id', shop_id)
    .single();

  const shopName = shop ? shop.name : 'Неизвестный магазин';

  // Создаем клавиатуру с кнопками для обработки заказа
  const keyboard = {
    inline_keyboard: [
      [
        {
          text: 'Принять в обработку',
          callback_data: `order_${order_id}_processing`,
        },
        { text: 'Выполнить', callback_data: `order_${order_id}_completed` },
      ],
      [{ text: 'Отменить', callback_data: `order_${order_id}_cancelled` }],
    ],
  };

  // Отправляем уведомление каждому администратору
  for (const admin of admins) {
    const message =
      `🔔 <b>Новый заказ #${order_id}</b>\n\n` +
      `Магазин: ${shopName}\n` +
      `Сумма: ${total_amount.toFixed(2)} ₽\n` +
      `Клиент: ${customer_info}\n\n` +
      `Статус: ${getStatusEmoji('pending')} ${getStatusText('pending')}\n\n` +
      `Выберите действие:`;

    await sendMessageWithKeyboard(admin.telegram_id, message, keyboard);
  }
}

// Функция для обработки callback-запросов от кнопок
export async function processCallback(
  callbackData: string,
  chatId: number,
  messageId: number,
): Promise<void> {
  // Парсим данные callback
  if (
    callbackData.startsWith('order_') &&
    callbackData.split('_').length === 3
  ) {
    // Обработка изменения статуса заказа
    const parts = callbackData.split('_');
    const orderId = parts[1];
    const newStatus = parts[2];

    await updateOrderStatus(orderId, newStatus, chatId);
    // После обновления статуса возвращаемся к деталям заказа
    await handleProcessOrder(chatId, orderId, messageId);
  } else if (callbackData.startsWith('process_order_')) {
    // Обработка конкретного заказа
    const orderId = callbackData.substring('process_order_'.length);
    await handleProcessOrder(chatId, orderId, messageId);
  } else if (callbackData.startsWith('orders_page_')) {
    // Пагинация заказов
    const page = parseInt(callbackData.substring('orders_page_'.length), 10);
    await handleOrders(chatId, [], page, messageId);
  } else if (callbackData === 'orders_back') {
    // Возврат к списку заказов
    await handleOrders(chatId, [], 0, messageId);
  } else if (callbackData.startsWith('products_page_')) {
    // Пагинация товаров
    const page = parseInt(callbackData.substring('products_page_'.length), 10);
    await handleProducts(chatId, [], page, messageId);
  } else if (callbackData === 'products_back') {
    // Возврат к списку товаров
    await handleProducts(chatId, [], 0, messageId);
  } else if (callbackData.startsWith('edit_product_name_')) {
    // Редактирование названия товара
    const productId = callbackData.substring('edit_product_name_'.length);
    await handleEditProductName(chatId, productId);
  } else if (callbackData.startsWith('edit_product_description_')) {
    // Редактирование описания товара
    const productId = callbackData.substring(
      'edit_product_description_'.length,
    );
    await handleEditProductDescription(chatId, productId);
  } else if (callbackData.startsWith('edit_product_price_')) {
    // Редактирование цены товара
    const productId = callbackData.substring('edit_product_price_'.length);
    await handleEditProductPrice(chatId, productId);
  } else if (callbackData.startsWith('edit_product_amount_')) {
    // Редактирование остатка товара
    const productId = callbackData.substring('edit_product_amount_'.length);
    await handleEditProductAmount(chatId, productId);
  } else if (callbackData.startsWith('edit_product_images_')) {
    // Редактирование изображений товара
    const productId = callbackData.substring('edit_product_images_'.length);
    await handleEditProductImages(chatId, productId);
  } else if (callbackData.startsWith('edit_product_category_')) {
    // Редактирование категории товара
    const productId = callbackData.substring('edit_product_category_'.length);
    await handleEditProductCategory(chatId, productId);
  } else if (callbackData.startsWith('edit_product_')) {
    // Редактирование товара (общий случай)
    const productId = callbackData.substring('edit_product_'.length);
    await handleEditProduct(chatId, productId, messageId);
  } else if (callbackData === 'add_product') {
    // Добавление нового товара
    await handleAddProduct(chatId);
  } else if (callbackData === 'manage_categories') {
    // Управление категориями
    await handleManageCategories(chatId, messageId);
  } else if (callbackData.startsWith('toggle_product_status_')) {
    // Изменение статуса товара
    const productId = callbackData.substring('toggle_product_status_'.length);
    await toggleProductStatus(chatId, productId, messageId);
  } else if (callbackData.startsWith('toggle_product_quantity_')) {
    // Изменение возможности изменения количества товара
    const productId = callbackData.substring('toggle_product_quantity_'.length);
    await toggleProductQuantity(chatId, productId, messageId);
  } else if (callbackData.startsWith('delete_product_')) {
    // Удаление товара
    const productId = callbackData.substring('delete_product_'.length);
    await deleteProduct(chatId, productId, messageId);
  } else if (callbackData.startsWith('force_delete_product_')) {
    // Принудительное удаление товара
    const productId = callbackData.substring('force_delete_product_'.length);
    await deleteProduct(chatId, productId, messageId);
  } else if (callbackData === 'add_category') {
    // Добавление новой категории
    await handleAddCategory(chatId);
  } else if (callbackData.startsWith('edit_category_')) {
    // Редактирование категории
    const categoryId = callbackData.substring('edit_category_'.length);
    await handleEditCategory(chatId, categoryId, messageId);
  } else if (callbackData.startsWith('rename_category_')) {
    // Переименование категории
    const categoryId = callbackData.substring('rename_category_'.length);
    await handleRenameCategory(chatId, categoryId);
  } else if (callbackData.startsWith('delete_category_')) {
    // Удаление категории
    const categoryId = callbackData.substring('delete_category_'.length);
    await handleDeleteCategory(chatId, categoryId, messageId);
  } else if (callbackData.startsWith('force_delete_category_')) {
    // Принудительное удаление категории
    const categoryId = callbackData.substring('force_delete_category_'.length);

    // Получаем информацию о категории
    const { data: category } = await supabase
      .from('categories')
      .select('name')
      .eq('id', categoryId)
      .single();

    if (category) {
      await deleteCategory(chatId, categoryId, category.name, messageId);
    } else {
      await sendMessage(chatId, `❌ Ошибка: категория не найдена.`);
    }
  } else if (callbackData.startsWith('set_product_category_')) {
    // Установка категории товара
    const parts = callbackData
      .substring('set_product_category_'.length)
      .split('_');
    const productId = parts[0];
    const categoryId = parts[1] === 'null' ? null : parts[1];

    // Обновляем категорию товара
    const { error: updateError } = await supabase
      .from('products')
      .update({ category_id: categoryId })
      .eq('id', productId);

    if (updateError) {
      await sendMessage(
        chatId,
        `❌ Ошибка при обновлении категории товара: ${updateError.message}`,
      );
    } else {
      await sendMessage(chatId, `✅ Категория товара успешно обновлена!`);
      await handleEditProduct(chatId, productId, messageId);
    }
  }
}

// Функция для обновления статуса заказа
async function updateOrderStatus(
  orderId: string,
  status: string,
  adminId: number,
): Promise<void> {
  const supabase = createClient();

  // Проверяем, что администратор имеет доступ к этому заказу
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select(
      `
      *,
      shops:shop_id (name)
    `,
    )
    .eq('id', orderId)
    .single();

  if (orderError || !order) {
    await sendMessage(adminId, `❌ Ошибка: заказ #${orderId} не найден.`);
    return;
  }

  // Проверяем права администратора
  const { data: adminAccess } = await supabase
    .from('shop_admins')
    .select('*')
    .eq('telegram_id', adminId)
    .eq('shop_id', order.shop_id)
    .single();

  if (!adminAccess) {
    await sendMessage(
      adminId,
      `❌ У вас нет прав для управления этим заказом.`,
    );
    return;
  }

  // Обновляем статус заказа
  const { error: updateError } = await supabase
    .from('orders')
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId);

  if (updateError) {
    await sendMessage(
      adminId,
      `❌ Ошибка при обновлении статуса заказа: ${updateError.message}`,
    );
    return;
  }

  // Отправляем уведомление администратору
  await sendMessage(
    adminId,
    `✅ Статус заказа #${orderId} изменен на "${getStatusText(status)}"`,
  );

  // Отправляем уведомление пользователю
  if (order.user_id) {
    await sendOrderStatusNotification(
      order.user_id,
      orderId,
      order.shops.name,
      status,
    );
  }
}
