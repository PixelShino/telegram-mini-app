// bot/webhook.js
const { Bot, webhookCallback } = require('grammy');
const express = require('express');
const dotenv = require('dotenv');

dotenv.config();

const bot = new Bot(process.env.TELEGRAM_BOT_TOKEN);

// Обработка команды /start с параметрами
bot.command('start', async (ctx) => {
  const startParam = ctx.match;

  if (startParam && startParam.startsWith('shop_')) {
    const shopId = startParam.replace('shop_', '');

    // Создаем кнопку для возврата на сайт
    const keyboard = {
      inline_keyboard: [
        [
          {
            text: 'Открыть магазин',
            web_app: {
              url: `https://telegram-mini-app-tan-ten.vercel.app/shop/${shopId}`,
            },
          },
        ],
      ],
    };

    await ctx.reply('Нажмите кнопку ниже, чтобы открыть магазин:', {
      reply_markup: keyboard,
    });
  } else {
    // Обычное приветствие
    await ctx.reply(
      'Добро пожаловать! Используйте команду /help для получения справки.',
    );
  }
});

// Настройка Express для вебхука
const app = express();
app.use(express.json());
app.use(
  `/webhook/${process.env.TELEGRAM_BOT_TOKEN}`,
  webhookCallback(bot, 'express'),
);

// Запуск сервера
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Webhook server is running on port ${PORT}`);
});

// Установка вебхука
bot.api.setWebhook(
  `https://telegram-mini-app-tan-ten.vercel.app/api/bot/webhook/${process.env.TELEGRAM_BOT_TOKEN}`,
);
