// app/api/bot/webhook/[token]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Bot } from 'grammy';

export async function POST(
  request: NextRequest,
  { params }: { params: { token: string } },
) {
  try {
    const token = params.token;
    console.log('Получен вебхук от Telegram, токен:', token);

    // Проверяем, что токен совпадает с токеном бота
    if (token !== process.env.TELEGRAM_BOT_TOKEN) {
      console.error('Неверный токен:', token);
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const update = await request.json();
    console.log('Данные вебхука:', JSON.stringify(update));

    // Создаем экземпляр бота
    const bot = new Bot(process.env.TELEGRAM_BOT_TOKEN);

    // Обрабатываем команду /start
    if (
      update.message &&
      update.message.text &&
      update.message.text.startsWith('/start')
    ) {
      const chatId = update.message.chat.id;
      const text = update.message.text;
      const startParam = text.split(' ')[1]; // Получаем параметр после /start

      console.log('Получена команда /start с параметром:', startParam);

      if (startParam && startParam.startsWith('shop_')) {
        const shopId = startParam.replace('shop_', '');

        // Создаем кнопку для возврата на сайт
        await bot.api.sendMessage(
          chatId,
          'Нажмите кнопку ниже, чтобы открыть магазин:',
          {
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
          },
        );

        console.log('Отправлена кнопка для открытия магазина');
      } else {
        // Обычное приветствие
        await bot.api.sendMessage(
          chatId,
          'Добро пожаловать! Используйте команду /help для получения справки.',
        );

        console.log('Отправлено приветственное сообщение');
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    // Добавляем типизацию error как any
    console.error('Ошибка обработки вебхука:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error.message || 'Unknown error',
      },
      { status: 500 },
    );
  }
}
