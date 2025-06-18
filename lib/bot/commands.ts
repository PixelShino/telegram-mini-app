import { createClient } from '@/lib/supabase/server';

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

    message += '\nИспользуйте /help для просмотра доступных команд.';

    await sendMessage(chatId, message);
  } else {
    // Для обычных пользователей
    const shop = await getUserShop(user.id);

    if (!shop) {
      return await sendMessage(
        chatId,
        'Добро пожаловать! К сожалению, магазин временно недоступен.',
      );
    }

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
  message += `💰 Выручка: $${totalRevenue.toFixed(2)}\n\n`;

  // Статистика по статусам заказов
  const pendingOrders =
    orders?.filter((order) => order.status === 'pending').length || 0;
  const completedOrders =
    orders?.filter((order) => order.status === 'completed').length || 0;

  message += `⏳ Ожидают обработки: ${pendingOrders}\n`;
  message += `✅ Выполнено: ${completedOrders}\n`;

  await sendMessage(chatId, message);
}

async function handleOrders(chatId: number, args: string[]) {
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

  // Получаем последние заказы
  const { data: orders, error } = await supabase
    .from('orders')
    .select('*')
    .in('shop_id', shopIds)
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) {
    console.error('Ошибка получения заказов:', error);
    return await sendMessage(chatId, 'Произошла ошибка при получении заказов.');
  }

  if (!orders || orders.length === 0) {
    return await sendMessage(chatId, 'У вас пока нет заказов.');
  }

  let message = '🛒 <b>Последние заказы</b>\n\n';

  orders.forEach((order, index) => {
    message += `<b>Заказ #${order.id}</b>\n`;
    message += `Сумма: $${order.total_amount.toFixed(2)}\n`;
    message += `Статус: ${getStatusEmoji(order.status)} ${getStatusText(order.status)}\n`;
    message += `Дата: ${new Date(order.created_at).toLocaleString()}\n`;

    if (order.telegram_username) {
      message += `Пользователь: @${order.telegram_username}\n`;
    }

    message += '\n';
  });

  message +=
    'Для управления заказом используйте команду:\n/orders <id_заказа> <действие>\n';
  message += 'Действия: confirm, complete, cancel';

  await sendMessage(chatId, message);
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
    message += `Цена: $${product.price.toFixed(2)}\n`;
    message += `Статус: ${product.status === 'active' ? '✅ Активен' : '❌ Неактивен'}\n\n`;
  });

  message +=
    'Для управления товаром используйте команду:\n/products <id_товара> <действие>\n';
  message += 'Действия: edit, delete, activate, deactivate';

  await sendMessage(chatId, message);
}

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

async function handleSettings(chatId: number, args: string[]) {
  await sendMessage(
    chatId,
    '⚙️ <b>Настройки магазина</b>\n\n' +
      'Для изменения настроек используйте команды:\n\n' +
      '/settings name <новое_название> - изменить название\n' +
      '/settings description <новое_описание> - изменить описание\n' +
      '/settings welcome <новое_приветствие> - изменить приветствие\n\n' +
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
      '/orders - Управление заказами\n' +
      '/products - Список товаров\n' +
      '/addproduct - Добавить товар\n' +
      '/settings - Настройки магазина\n' +
      '/help - Эта справка\n\n' +
      'Для получения подробной информации о команде, используйте:\n' +
      '/help <команда>';
  } else {
    helpMessage +=
      '/start - Начало работы\n' +
      '/orders - Ваши заказы\n' +
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
): Promise<void> {
  // Парсим данные callback
  const parts = callbackData.split('_');

  if (parts[0] === 'order' && parts.length === 3) {
    const orderId = parts[1];
    const newStatus = parts[2];

    // Обновляем статус заказа
    await updateOrderStatus(orderId, newStatus, chatId);
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
