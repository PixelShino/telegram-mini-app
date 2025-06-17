// app/api/test-bot/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${botToken}/getMe`,
    );
    const data = await response.json();

    return NextResponse.json({
      ok: data.ok,
      botInfo: data.result,
      message: data.ok ? 'Токен действителен' : 'Токен недействителен',
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: String(error),
        message: 'Ошибка при проверке токена',
      },
      { status: 500 },
    );
  }
}
