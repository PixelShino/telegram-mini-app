import { MyContext } from '../types';
import { showOrders, showOrderHistory } from '../services/orders';
import { showProfile } from '../services/user';
import { InlineKeyboard } from 'grammy';
import { createClient } from '@/lib/supabase/server';

// Обработчик кнопки "Изменить адрес доставки"
export async function handleChangeAddress(ctx: MyContext) {
  ctx.session.step = 'change_address_country';
  ctx.session.addressData = {};
  await ctx.reply('Введите вашу страну:');
}

// Обработчик кнопки "Перейти на сайт"
export async function showWebsiteLink(ctx: MyContext) {
  const chatId = ctx.chat!.id;

  // Получаем информацию о боте
  const botInfo = await ctx.api.getMe();
  const botUsername = botInfo.username;

  // Ищем магазин, связанный с этим ботом (проверяем оба варианта имени)
  const supabase = createClient();
  const { data: shop, error } = await supabase
    .from('shops')
    .select('id, name')
    .or(`bot_username.eq.${botUsername},bot_username.eq.@${botUsername}`)
    .eq('status', 'active')
    .single();

  if (error || !shop) {
    await ctx.reply('Извините, магазин временно недоступен.');
    return;
  }

  await ctx.reply(
    `Нажмите на кнопку ниже, чтобы перейти в магазин "${shop.name}":`,
    {
      reply_markup: new InlineKeyboard().url(
        'Открыть сайт',
        `https://telegram-mini-app-tan-ten.vercel.app/shop/${shop.id}`,
      ),
    },
  );
}
