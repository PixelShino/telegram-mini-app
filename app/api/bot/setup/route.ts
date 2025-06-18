// app/api/bot/setup/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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

    // Устанавливаем команды для администраторов
    const adminCommands = [
      { command: 'start', description: 'Начать работу с ботом' },
      { command: 'stats', description: 'Статистика магазина' },
      { command: 'ordersmgmt', description: 'Управление заказами' },
      { command: 'products', description: 'Список товаров' },
      { command: 'addproduct', description: 'Добавить товар' },
      { command: 'settings', description: 'Настройки магазина' },
      { command: 'help', description: 'Получить справку' },
    ];

    // Устанавливаем команды для обычных пользователей
    const userCommands = [
      { command: 'start', description: 'Начать работу с ботом' },
      { command: 'myorders', description: 'Мои заказы' },
      { command: 'help', description: 'Получить справку' },
    ];

    // Устанавливаем команды для обычных пользователей (глобально)
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

    // Получаем список администраторов из базы данных
    const supabase = createClient();
    const { data: admins } = await supabase
      .from('shop_admins')
      .select('telegram_id')
      .eq('role', 'admin');

    // Устанавливаем команды для каждого администратора
    const adminCommandsResponses = [];
    if (admins && admins.length > 0) {
      for (const admin of admins) {
        const response = await fetch(
          `https://api.telegram.org/bot${token}/setMyCommands`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              commands: adminCommands,
              scope: {
                type: 'chat',
                chat_id: admin.telegram_id,
              },
            }),
          },
        );
        adminCommandsResponses.push(await response.json());
      }
    }

    // Получаем информацию о боте
    const botInfoResponse = await fetch(
      `https://api.telegram.org/bot${token}/getMe`,
    );
    const botInfo = await botInfoResponse.json();

    return NextResponse.json({
      webhook: data,
      userCommands: await userCommandsResponse.json(),
      adminCommands: adminCommandsResponses,
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
