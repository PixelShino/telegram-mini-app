// lib/bot/index.ts - минимальный функционал
import { Bot, session } from 'grammy';
import { MyContext, SessionData } from './types';
import { handleStart } from './handlers/start';

// Создаем бота
export function createBot() {
  const bot = new Bot<MyContext>(process.env.TELEGRAM_BOT_TOKEN || '');

  // Добавляем middleware для сессии
  bot.use(
    session({
      initial: (): SessionData => ({ step: 'start' }),
    }),
  );

  // Команда /start - только приветствие
  bot.command('start', handleStart);

  return bot;
}

// // lib/bot/index.ts
// import { Bot, session } from 'grammy';
// import { MyContext, SessionData } from './types';
// import { handleStart } from './handlers/start';
// import {
//   handleRegistrationStart,
//   handleRegistrationMessage,
//   handleHouseTypeResponse,
// } from './handlers/registration';
// import { handleChangeAddress, showWebsiteLink } from './handlers/menu';
// import { showOrders, showOrderHistory } from './services/orders';
// import { showProfile, showMainMenu } from './services/user';

// // Создаем бота
// export function createBot() {
//   const bot = new Bot<MyContext>(process.env.TELEGRAM_BOT_TOKEN || '');

//   // Добавляем middleware для сессии
//   bot.use(
//     session({
//       initial: (): SessionData => ({ step: 'start' }),
//     }),
//   );

//   // Команда /start
//   bot.command('start', handleStart);

//   // Обработка кнопки "Регистрация"
//   bot.hears('Регистрация', handleRegistrationStart);

//   // Обработка ответа о частном доме
//   bot.hears(['Да', 'Нет'], handleHouseTypeResponse);

//   // Обработка кнопок главного меню
//   bot.hears('Изменить адрес доставки', handleChangeAddress);
//   bot.hears('Мои заказы', showOrders);
//   bot.hears('История заказов', showOrderHistory);
//   bot.hears('Обо мне', showProfile);
//   bot.hears('Перейти на сайт', showWebsiteLink);

//   // Обработка текстовых сообщений для регистрации - должна быть последней!
//   bot.on('message:text', handleRegistrationMessage);

//   return bot;
// }
