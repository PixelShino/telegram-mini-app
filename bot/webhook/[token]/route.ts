// app/api/bot/webhook/[token]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Bot } from 'grammy';

export async function POST(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const token = params.token;
    
    // Проверяем, что токен совпадает с токеном бота
    if (token !== process.env.TELEGRAM_BOT_TOKEN) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    
    const update = await request.json();
    
    // Создаем экземпляр бота
    const bot = new Bot(process.env.TELEGRAM_BOT_TOKEN);
    
    // Обрабатываем команду /start
    if (update.message && update.message.text && update.message.text.startsWith('/start')) {
      const chatId = update.message.chat.id;
      const text = update.message.text;
      const startParam = text.split(' ')[1]; // Получаем параметр после /start
      
      if (startParam && startParam.startsWith('shop_')) {
        const shopId = startParam.replace('shop_', '');
        
        // Создаем кнопку для возврата на сайт
        await bot.api.sendMessage(chatId, 'Нажмите кнопку ниже, чтобы открыть магазин:', {
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: 'Открыть магазин',
                  web_app: {
                    url: `https://telegram-mini-app-tan-ten.vercel.app/shop/${shopId}`,
                  },
                },
              ],
            ],
          },
        });
      } else {
        // Обычное приветствие
        await bot.api.sendMessage(
          chatId,
          'Добро пожаловать! Используйте команду /help для получения справки.'
        );
      }
    }
    
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Ошибка обработки вебхука:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
