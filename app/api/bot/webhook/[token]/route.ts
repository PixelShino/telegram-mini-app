// app/api/bot/webhook/[token]/route.ts
import { NextRequest, NextResponse } from 'next/server';
// import { Bot } from 'grammy';
import { processCommand } from '@/lib/bot/commands';

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

    if (update.message?.text && update.message.text.startsWith('/')) {
      const chatId = update.message.chat.id;
      const command = update.message.text;
      const user = update.message.from;

      await processCommand(command, chatId, user);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Ошибка обработки вебхука:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
