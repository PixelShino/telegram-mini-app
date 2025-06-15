// app/api/bot/setup/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
      return NextResponse.json({ error: 'Bot token not set' }, { status: 500 });
    }

    // URL вебхука
    const webhookUrl = `${request.nextUrl.origin}/api/bot/webhook/${token}`;

    // Настраиваем вебхук
    const response = await fetch(
      `https://api.telegram.org/bot${token}/setWebhook?url=${webhookUrl}`,
    );
    const data = await response.json();

    return NextResponse.json(data);
  } catch (error) {
    console.error('Ошибка настройки вебхука:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
