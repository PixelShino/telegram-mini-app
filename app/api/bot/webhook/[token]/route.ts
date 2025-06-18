// app/api/bot/webhook/[token]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { processCommand, processCallback } from '@/lib/bot/commands';

export async function POST(
  request: NextRequest,
  { params }: { params: { token: string } },
) {
  try {
    const token = params.token;
    const botToken = process.env.TELEGRAM_BOT_TOKEN;

    if (token !== botToken) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const update = await request.json();
    console.log('Получен вебхук от Telegram, токен:', token);
    console.log('Данные вебхука:', update);

    // Обработка команд
    if (update.message?.text && update.message.text.startsWith('/')) {
      const chatId = update.message.chat.id;
      const command = update.message.text;
      const user = update.message.from;

      await processCommand(command, chatId, user);
    }

    // Обработка callback-запросов от кнопок
    if (update.callback_query) {
      const callbackData = update.callback_query.data;
      const chatId = update.callback_query.from.id;

      await processCallback(callbackData, chatId);

      // Отправляем ответ на callback-запрос, чтобы убрать индикатор загрузки с кнопки
      await fetch(
        `https://api.telegram.org/bot${botToken}/answerCallbackQuery`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            callback_query_id: update.callback_query.id,
          }),
        },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Ошибка обработки вебхука:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
