// // lib/telegram.ts
// import { Bot } from 'grammy';

// // Получаем токен бота из переменных окружения
// const botToken = process.env.TELEGRAM_BOT_TOKEN;

// // Функция для получения текста статуса заказа
// function getStatusText(status: string): string {
//   switch (status) {
//     case 'completed':
//       return 'успешно выполнен';
//     case 'in_progress':
//     case 'processing':
//       return 'принят в обработку';
//     case 'pending':
//       return 'ожидает обработки';
//     case 'cancelled':
//       return 'отменен';
//     default:
//       return status;
//   }
// }

// // Функция для отправки уведомления о статусе заказа
// export async function sendOrderStatusNotification(
//   telegram_id: number,
//   order_id: string,
//   shop_name: string,
//   status: string,
// ): Promise<void> {
//   if (!botToken) {
//     console.error('TELEGRAM_BOT_TOKEN не настроен');
//     return;
//   }

//   try {
//     const bot = new Bot(botToken);
//     const statusText = getStatusText(status);

//     const message = `Ваш заказ №${order_id} в магазине "${shop_name}" ${statusText}`;

//     await bot.api.sendMessage(telegram_id, message);
//     console.log(`Уведомление отправлено пользователю ${telegram_id}`);
//   } catch (error) {
//     console.error('Ошибка при отправке уведомления в Telegram:', error);
//   }
// }
