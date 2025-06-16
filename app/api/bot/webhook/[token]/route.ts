// app/api/bot/webhook/[token]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createBot } from '@/lib/bot';

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

    // Создаем экземпляр бота из модульной структуры
    const bot = createBot();

    // Обрабатываем обновление
    await bot.handleUpdate(update);

    return NextResponse.json({ ok: true });
  } catch (error: any) {
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
