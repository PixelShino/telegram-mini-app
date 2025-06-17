import { createClient } from '@/lib/supabase/server';

// Обработка команд бота
export async function processCommand(
  command: string,
  chatId: number,
  user: any,
) {
  const commandName = command.split(' ')[0].toLowerCase();
  const args = command.split(' ').slice(1);

  switch (commandName) {
    case '/start':
      return await handleStart(chatId, user);
    case '/stats':
      return await handleStats(chatId);
    case '/orders':
      return await handleOrders(chatId, args);
    case '/products':
      return await handleProducts(chatId, args);
    case '/addproduct':
      return await handleAddProduct(chatId);
    case '/settings':
      return await handleSettings(chatId, args);
    case '/help':
      return await handleHelp(chatId);
    default:
      return await sendMessage(
        chatId,
        'Неизвестная команда. Используйте /help для справки.',
      );
  }
}

// Обработчики команд

async function handleStart(chatId: number, user: any) {
  const supabase = createClient();

  // Получаем магазины, где пользователь является администратором
  const { data: shops } = await supabase
    .from('shop_admins')
    .select('shops(*)')
    .eq('telegram_id', user.id);

  if (!shops || shops.length === 0) {
    return await sendMessage(
      chatId,
      'Добро пожаловать! У вас пока нет магазинов. Создайте магазин в веб-админке.',
    );
  }

  let message = 'Добро пожаловать в админ-панель! Ваши магазины:\n\n';

  shops.forEach((shop: any, index: number) => {
    message += `${index + 1}. ${shop.shops.name}\n`;
  });

  message += '\nИспользуйте /help для просмотра доступных команд.';

  await sendMessage(chatId, message);
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

async function handleHelp(chatId: number) {
  const helpMessage =
    '🤖 <b>Доступные команды</b>\n\n' +
    '/stats - Статистика магазина\n' +
    '/orders - Управление заказами\n' +
    '/products - Список товаров\n' +
    '/addproduct - Добавить товар\n' +
    '/settings - Настройки магазина\n' +
    '/help - Эта справка\n\n' +
    'Для получения подробной информации о команде, используйте:\n' +
    '/help <команда>';

  await sendMessage(chatId, helpMessage);
}

// Вспомогательные функции

function getStatusEmoji(status: string): string {
  switch (status) {
    case 'pending':
      return '⏳';
    case 'confirmed':
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
    case 'confirmed':
      return 'Подтвержден';
    case 'completed':
      return 'Выполнен';
    case 'cancelled':
      return 'Отменен';
    default:
      return 'Неизвестно';
  }
}

// Отправка сообщения в Telegram
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
