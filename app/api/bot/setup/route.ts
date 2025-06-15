// app/api/bot/setup/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createBot } from '@/lib/bot';

export async function GET(request: NextRequest) {
  try {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
      return NextResponse.json({ error: 'Bot token not set' }, { status: 500 });
    }

    // URL вебхука
    const webhookUrl = `${request.nextUrl.origin}/api/bot/webhook`;
    console.log('Setting webhook URL:', webhookUrl);

    // Настраиваем вебхук
    const response = await fetch(
      `https://api.telegram.org/bot${token}/setWebhook`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: webhookUrl,
          allowed_updates: ['message', 'callback_query'],
        }),
      },
    );

    const data = await response.json();

    if (!data.ok) {
      return NextResponse.json({ error: data.description }, { status: 500 });
    }

    // Устанавливаем команды бота
    const commandsResponse = await fetch(
      `https://api.telegram.org/bot${token}/setMyCommands`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          commands: [
            { command: 'start', description: 'Начать работу с ботом' },
            { command: 'help', description: 'Получить справку' },
            { command: 'profile', description: 'Мой профиль' },
            { command: 'orders', description: 'Мои заказы' },
          ],
        }),
      },
    );

    const commandsData = await commandsResponse.json();

    return NextResponse.json({
      webhook: data,
      commands: commandsData,
      webhookUrl,
    });
  } catch (error: any) {
    console.error('Ошибка настройки вебхука:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error.message || 'Unknown error',
      },
      { status: 500 },
    );
  }
}
