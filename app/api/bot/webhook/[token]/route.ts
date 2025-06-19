// app/api/bot/webhook/[token]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import {
  processCommand,
  processCallback,
  processMessage,
  processDialogState,
} from '@/lib/bot/commands';
import { createClient } from '@/lib/supabase/server';

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

      try {
        // Проверяем, есть ли активный диалог
        const supabase = createClient();
        const { data: dialogState } = await supabase
          .from('bot_dialog_states')
          .select('*')
          .eq('telegram_id', chatId)
          .single();

        if (dialogState) {
          console.log('Обнаружен активный диалог:', dialogState);
          // Если есть активный диалог, обрабатываем как часть диалога
          await processDialogState(text, chatId, user);
        }
        // Если сообщение начинается с "/", обрабатываем как команду
        else if (text.startsWith('/')) {
          console.log('Обработка команды:', text);
          await processCommand(text, chatId, user);
        }
        // Иначе обрабатываем как текстовое сообщение
        else {
          console.log('Обработка текстового сообщения:', text);
          await processMessage(text, chatId, user);
        }
      } catch (error) {
        console.error('Ошибка при обработке сообщения:', error);
        // Отправляем сообщение об ошибке пользователю
        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            chat_id: chatId,
            text: '❌ Произошла ошибка при обработке вашего сообщения. Пожалуйста, попробуйте еще раз.',
          }),
        });
      }
    }

    // Обработка callback-запросов от кнопок
    if (update.callback_query) {
      const callbackData = update.callback_query.data;
      const chatId = update.callback_query.from.id;
      const messageId = update.callback_query.message.message_id;

      try {
        console.log('Обработка callback-запроса:', callbackData);
        await processCallback(callbackData, chatId, messageId);
      } catch (error) {
        console.error('Ошибка при обработке callback-запроса:', error);
        // Отправляем сообщение об ошибке пользователю
        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            chat_id: chatId,
            text: '❌ Произошла ошибка при обработке вашего запроса. Пожалуйста, попробуйте еще раз.',
          }),
        });
      }

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
