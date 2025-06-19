// app/api/bot/webhook/[token]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import {
  processCommand,
  processCallback,
  processMessage,
} from '@/lib/bot/commands';

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

    // Обработка сообщений
    if (update.message?.text) {
      const chatId = update.message.chat.id;
      const text = update.message.text;
      const user = update.message.from;

      // Если сообщение начинается с "/", обрабатываем как команду
      if (text.startsWith('/')) {
        await processCommand(text, chatId, user);
      }
      // Иначе обрабатываем как текстовое сообщение
      else {
        await processMessage(text, chatId, user);
      }
    }

    // Обработка callback-запросов от кнопок
    if (update.callback_query) {
      const callbackData = update.callback_query.data;
      const chatId = update.callback_query.from.id;
      const messageId = update.callback_query.message.message_id;

      await processCallback(callbackData, chatId, messageId);

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
