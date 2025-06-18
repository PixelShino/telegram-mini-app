import { createClient } from '@/lib/supabase/server';

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

// Обработчик для просмотра заказов пользователя
async function handleUserOrders(chatId: number, telegramId: number) {
  const supabase = createClient();

  // Получаем заказы пользователя
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
    .limit(5);

  if (error) {
    console.error('Ошибка получения заказов:', error);
    return await sendMessage(chatId, 'Произошла ошибка при получении заказов.');
  }

  if (!orders || orders.length === 0) {
    return await sendMessage(chatId, 'У вас пока нет заказов.');
  }

  let message = '🛒 <b>Ваши последние заказы</b>\n\n';

  orders.forEach((order) => {
    message += `<b>Заказ #${order.id}</b>\n`;
    message += `Магазин: ${order.shops.name}\n`;
    message += `Сумма: ${order.total_amount.toFixed(2)} ₽\n`;
    message += `Статус: ${getStatusEmoji(order.status)} ${getStatusText(order.status)}\n`;
    message += `Дата: ${new Date(order.created_at).toLocaleString()}\n\n`;
  });

  await sendMessage(chatId, message);
}
// Функция для отправки уведомления о статусе заказа
export async function sendOrderStatusNotification(
  telegram_id: number,
  order_id: string,
  shop_name: string,
  status: string,
): Promise<void> {
  const statusText = getStatusText(status);
  const message = `Ваш заказ №${order_id} в магазине "${shop_name}" ${statusText}`;

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

async function handleProducts(chatId: number, args: string[]) {
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

  // Получаем товары
  const { data: products, error } = await supabase
    .from('products')
    .select('*')
    .in('shop_id', shopIds)
    .order('created_at', { ascending: false })
    .limit(10);

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

  let message = '📦 <b>Ваши товары</b>\n\n';

  products.forEach((product, index) => {
    message += `<b>${index + 1}. ${product.name}</b>\n`;
    message += `Цена: ${product.price.toFixed(2)} ₽\n`;
    message += `Статус: ${product.status === 'active' ? '✅ Активен' : '❌ Неактивен'}\n\n`;
  });

  message +=
    'Для управления товаром используйте команду:\n/products ID_товара действие\n';
  message += 'Действия: edit, delete, activate, deactivate';

  await sendMessage(chatId, message);
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
    const orderId = callbackData.replace('process_order_', '');
    await handleProcessOrder(chatId, orderId, messageId);
  } else if (callbackData.startsWith('orders_page_')) {
    // Пагинация заказов
    const page = parseInt(callbackData.replace('orders_page_', ''), 10);
    await handleOrders(chatId, [], page, messageId);
  } else if (callbackData === 'orders_back') {
    // Возврат к списку заказов
    await handleOrders(chatId, [], 0, messageId);
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
