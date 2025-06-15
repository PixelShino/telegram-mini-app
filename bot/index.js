// bot/index.js
const { Bot } = require('grammy');
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

// Запуск бота
bot.start();
