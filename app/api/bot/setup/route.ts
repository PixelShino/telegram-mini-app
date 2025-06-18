// app/api/bot/setup/route.ts

// Настраивает вебхук для бота - это URL, на который Telegram будет отправлять обновления (сообщения, нажатия кнопок и т.д.). Без этой настройки бот не будет получать сообщения от пользователей.

// Регистрирует команды бота в Telegram - это позволяет пользователям видеть список доступных команд в интерфейсе Telegram (в меню команд или при вводе "/").

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
      return NextResponse.json({ error: 'Bot token not set' }, { status: 500 });
    }

    // URL вебхука
    const webhookUrl = `${request.nextUrl.origin}/api/bot/webhook/${token}`;
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
    const adminCommands = [
      { command: 'start', description: 'Начать работу с ботом' },
      { command: 'stats', description: 'Статистика магазина' },
      { command: 'orders', description: 'Управление заказами' },
      { command: 'products', description: 'Список товаров' },
      { command: 'addproduct', description: 'Добавить товар' },
      { command: 'settings', description: 'Настройки магазина' },
      { command: 'help', description: 'Получить справку' },
    ];

    const userCommands = [
      { command: 'start', description: 'Начать работу с ботом' },
      { command: 'orders', description: 'Мои заказы' },
      { command: 'help', description: 'Получить справку' },
    ];

    // Устанавливаем команды для обычных пользователей
    const userCommandsResponse = await fetch(
      `https://api.telegram.org/bot${token}/setMyCommands`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          commands: userCommands,
        }),
      },
    );

    // Получаем информацию о боте
    const botInfoResponse = await fetch(
      `https://api.telegram.org/bot${token}/getMe`,
    );
    const botInfo = await botInfoResponse.json();

    return NextResponse.json({
      webhook: data,
      commands: await userCommandsResponse.json(),
      webhookUrl,
      botInfo: botInfo.result,
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
