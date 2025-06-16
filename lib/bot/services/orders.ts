import { createClient } from '@/lib/supabase/server';
import { MyContext } from '../types';
import { getStatusText } from '../utils/formatters';

// Функция для отображения заказов
export async function showOrders(ctx: MyContext) {
  const chatId = ctx.chat!.id;

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
export async function showOrderHistory(ctx: MyContext) {
  const chatId = ctx.chat!.id;

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
