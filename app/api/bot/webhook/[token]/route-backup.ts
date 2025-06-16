// // // app/api/bot/webhook/[token]/route.ts
// // import { NextRequest, NextResponse } from 'next/server';
// // import { Bot } from 'grammy';
// // import { createClient } from '@/lib/supabase/server';

// // // Хранилище для временных данных регистрации
// // const registrationData = new Map();

// // export async function POST(
// //   request: NextRequest,
// //   { params }: { params: { token: string } },
// // ) {
// //   try {
// //     const token = params.token;
// //     console.log('Получен вебхук от Telegram, токен:', token);

// //     // Проверяем, что токен совпадает с токеном бота
// //     if (token !== process.env.TELEGRAM_BOT_TOKEN) {
// //       console.error('Неверный токен:', token);
// //       return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
// //     }

// //     const update = await request.json();
// //     console.log('Данные вебхука:', JSON.stringify(update));

// //     // Создаем экземпляр бота
// //     const bot = new Bot(process.env.TELEGRAM_BOT_TOKEN || '');

// //     // Получаем информацию о магазине
// //     const supabase = createClient();
// //     const { data: shop } = await supabase
// //       .from('shops')
// //       .select('name')
// //       .eq('status', 'active')
// //       .single();

// //     const shopName = shop?.name || 'Наш магазин';

// //     // Обрабатываем команду /start
// //     if (update.message?.text === '/start') {
// //       const chatId = update.message.chat.id;

// //       // Проверяем, зарегистрирован ли пользователь
// //       const { data: user } = await supabase
// //         .from('users')
// //         .select('*')
// //         .eq('telegram_id', chatId)
// //         .single();

// //       if (user) {
// //         // Пользователь уже зарегистрирован, показываем главное меню
// //         await bot.api.sendMessage(chatId, `Добро пожаловать в ${shopName}!`, {
// //           reply_markup: {
// //             keyboard: [
// //               [{ text: 'Изменить адрес доставки' }],
// //               [{ text: 'Мои заказы' }, { text: 'История заказов' }],
// //               [{ text: 'Обо мне' }, { text: 'Перейти на сайт' }],
// //             ],
// //             resize_keyboard: true,
// //           },
// //         });
// //       } else {
// //         // Пользователь не зарегистрирован, предлагаем регистрацию
// //         await bot.api.sendMessage(
// //           chatId,
// //           `Добро пожаловать в ${shopName}! Для начала работы необходимо зарегистрироваться.`,
// //           {
// //             reply_markup: {
// //               keyboard: [[{ text: 'Регистрация' }]],
// //               resize_keyboard: true,
// //               one_time_keyboard: true,
// //             },
// //           },
// //         );
// //       }

// //       return NextResponse.json({ ok: true });
// //     }

// //     // Обработка кнопки "Регистрация"
// //     if (update.message?.text === 'Регистрация') {
// //       const chatId = update.message.chat.id;

// //       // Начинаем процесс регистрации
// //       await bot.api.sendMessage(chatId, 'Введите ваше имя:', {
// //         reply_markup: { remove_keyboard: true },
// //       });

// //       // Инициализируем данные регистрации
// //       registrationData.set(chatId, { step: 'name' });

// //       return NextResponse.json({ ok: true });
// //     }

// //     // Обработка текстовых сообщений для регистрации
// //     if (
// //       update.message?.text &&
// //       update.message.text !== '/start' &&
// //       update.message.text !== 'Регистрация'
// //     ) {
// //       const chatId = update.message.chat.id;
// //       const text = update.message.text;

// //       // Получаем текущий шаг регистрации
// //       const userData = registrationData.get(chatId);

// //       if (!userData) {
// //         // Проверяем, может быть это команда меню
// //         const { data: user } = await supabase
// //           .from('users')
// //           .select('*')
// //           .eq('telegram_id', chatId)
// //           .single();

// //         if (user) {
// //           // Обрабатываем команды меню
// //           await handleMenuCommands(chatId, text, bot, supabase);
// //         } else {
// //           // Если пользователь не зарегистрирован, предлагаем начать с /start
// //           await bot.api.sendMessage(
// //             chatId,
// //             'Для начала работы отправьте команду /start',
// //           );
// //         }
// //         return NextResponse.json({ ok: true });
// //       }

// //       // Обрабатываем шаги регистрации
// //       switch (userData.step) {
// //         case 'name':
// //           // Сохраняем имя и запрашиваем телефон
// //           userData.name = text;
// //           userData.step = 'phone';
// //           registrationData.set(chatId, userData);
// //           await bot.api.sendMessage(chatId, 'Введите ваш номер телефона:');
// //           break;

// //         case 'phone':
// //           // Сохраняем телефон и запрашиваем email
// //           userData.phone = text;
// //           userData.step = 'email';
// //           registrationData.set(chatId, userData);
// //           await bot.api.sendMessage(chatId, 'Введите ваш email:');
// //           break;

// //         case 'email':
// //           // Сохраняем email и запрашиваем страну
// //           userData.email = text;
// //           userData.step = 'country';
// //           userData.address = {};
// //           registrationData.set(chatId, userData);
// //           await bot.api.sendMessage(chatId, 'Введите вашу страну:');
// //           break;

// //         case 'country':
// //           // Сохраняем страну и запрашиваем город
// //           userData.address.country = text;
// //           userData.step = 'city';
// //           registrationData.set(chatId, userData);
// //           await bot.api.sendMessage(chatId, 'Введите ваш город:');
// //           break;

// //         case 'city':
// //           // Сохраняем город и запрашиваем улицу
// //           userData.address.city = text;
// //           userData.step = 'street';
// //           registrationData.set(chatId, userData);
// //           await bot.api.sendMessage(chatId, 'Введите улицу:');
// //           break;

// //         case 'street':
// //           // Сохраняем улицу и запрашиваем дом
// //           userData.address.street = text;
// //           userData.step = 'house';
// //           registrationData.set(chatId, userData);
// //           await bot.api.sendMessage(chatId, 'Введите номер дома:');
// //           break;

// //         case 'house':
// //           // Сохраняем дом и спрашиваем о типе дома
// //           userData.address.house = text;
// //           userData.step = 'house_type';
// //           registrationData.set(chatId, userData);
// //           await bot.api.sendMessage(chatId, 'Это частный дом?', {
// //             reply_markup: {
// //               keyboard: [[{ text: 'Да' }, { text: 'Нет' }]],
// //               resize_keyboard: true,
// //               one_time_keyboard: true,
// //             },
// //           });
// //           break;

// //         case 'house_type':
// //           // Обрабатываем ответ о типе дома
// //           const isPrivateHouse = text === 'Да';
// //           userData.address.isPrivateHouse = isPrivateHouse;

// //           if (isPrivateHouse) {
// //             // Если частный дом, завершаем регистрацию
// //             if (userData.isUpdating) {
// //               // Если это обновление адреса
// //               await updateUserAddress(chatId, userData.address, supabase, bot);
// //               registrationData.delete(chatId);
// //               // Показываем главное меню
// //               await bot.api.sendMessage(chatId, 'Главное меню:', {
// //                 reply_markup: {
// //                   keyboard: [
// //                     [{ text: 'Изменить адрес доставки' }],
// //                     [{ text: 'Мои заказы' }, { text: 'История заказов' }],
// //                     [{ text: 'Обо мне' }, { text: 'Перейти на сайт' }],
// //                   ],
// //                   resize_keyboard: true,
// //                 },
// //               });
// //             } else {
// //               // Если это регистрация
// //               await completeRegistration(chatId, userData, bot, supabase);
// //               registrationData.delete(chatId);
// //             }
// //           } else {
// //             // Если квартира, запрашиваем номер квартиры
// //             userData.step = 'apartment';
// //             registrationData.set(chatId, userData);
// //             await bot.api.sendMessage(chatId, 'Введите номер квартиры:');
// //           }
// //           break;

// //         case 'apartment':
// //           // Сохраняем квартиру и запрашиваем подъезд
// //           userData.address.apartment = text;
// //           userData.step = 'entrance';
// //           registrationData.set(chatId, userData);
// //           await bot.api.sendMessage(chatId, 'Введите номер подъезда:');
// //           break;

// //         case 'entrance':
// //           // Сохраняем подъезд и запрашиваем этаж
// //           userData.address.entrance = text;
// //           userData.step = 'floor';
// //           registrationData.set(chatId, userData);
// //           await bot.api.sendMessage(chatId, 'Введите этаж:');
// //           break;

// //         case 'floor':
// //           // Сохраняем этаж и запрашиваем домофон
// //           userData.address.floor = text;
// //           userData.step = 'intercom';
// //           registrationData.set(chatId, userData);
// //           await bot.api.sendMessage(
// //             chatId,
// //             'Введите код домофона (если есть):',
// //           );
// //           break;

// //         case 'intercom':
// //           // Сохраняем домофон и завершаем регистрацию
// //           userData.address.intercom = text;
// //           if (userData.isUpdating) {
// //             // Если это обновление адреса
// //             await updateUserAddress(chatId, userData.address, supabase, bot);
// //             registrationData.delete(chatId);
// //             // Показываем главное меню
// //             await bot.api.sendMessage(chatId, 'Главное меню:', {
// //               reply_markup: {
// //                 keyboard: [
// //                   [{ text: 'Изменить адрес доставки' }],
// //                   [{ text: 'Мои заказы' }, { text: 'История заказов' }],
// //                   [{ text: 'Обо мне' }, { text: 'Перейти на сайт' }],
// //                 ],
// //                 resize_keyboard: true,
// //               },
// //             });
// //           } else {
// //             // Если это регистрация
// //             await completeRegistration(chatId, userData, bot, supabase);
// //             registrationData.delete(chatId);
// //           }
// //           break;

// //         default:
// //           await bot.api.sendMessage(
// //             chatId,
// //             'Произошла ошибка. Пожалуйста, начните регистрацию заново с команды /start',
// //           );
// //           registrationData.delete(chatId);
// //           break;
// //       }

// //       return NextResponse.json({ ok: true });
// //     }

// //     return NextResponse.json({ ok: true });
// //   } catch (error: any) {
// //     console.error('Ошибка обработки вебхука:', error);
// //     return NextResponse.json(
// //       {
// //         error: 'Internal server error',
// //         message: error.message || 'Unknown error',
// //       },
// //       { status: 500 },
// //     );
// //   }
// // }

// // // Функция для завершения регистрации
// // async function completeRegistration(
// //   chatId: number,
// //   userData: any,
// //   bot: any,
// //   supabase: any,
// // ) {
// //   try {
// //     // Получаем данные пользователя из Telegram
// //     const telegramUser = await bot.api.getChat(chatId);

// //     // Создаем пользователя в базе данных
// //     const { error } = await supabase.from('users').insert({
// //       telegram_id: chatId,
// //       name:
// //         userData.name ||
// //         `${telegramUser.first_name || ''} ${telegramUser.last_name || ''}`.trim(),
// //       username: telegramUser.username || '',
// //       email: userData.email || '',
// //       phone: userData.phone || '',
// //       country: userData.address?.country || '',
// //       city: userData.address?.city || '',
// //       street: userData.address?.street || '',
// //       house_number: userData.address?.house || '',
// //       is_private_house: userData.address?.isPrivateHouse || false,
// //       apartment: userData.address?.apartment
// //         ? parseInt(userData.address.apartment)
// //         : null,
// //       entrance: userData.address?.entrance
// //         ? parseInt(userData.address.entrance)
// //         : null,
// //       floor: userData.address?.floor ? parseInt(userData.address.floor) : null,
// //       intercom_code: userData.address?.intercom || '',
// //       manager: false,
// //     });

// //     if (error) {
// //       console.error('Ошибка при создании пользователя:', error);
// //       await bot.api.sendMessage(
// //         chatId,
// //         'Произошла ошибка при регистрации. Пожалуйста, попробуйте еще раз с команды /start',
// //       );
// //       return;
// //     }

// //     // Отправляем сообщение об успешной регистрации
// //     await bot.api.sendMessage(
// //       chatId,
// //       'Регистрация успешно завершена! Теперь вы можете использовать все функции бота.',
// //       {
// //         reply_markup: {
// //           keyboard: [
// //             [{ text: 'Изменить адрес доставки' }],
// //             [{ text: 'Мои заказы' }, { text: 'История заказов' }],
// //             [{ text: 'Обо мне' }, { text: 'Перейти на сайт' }],
// //           ],
// //           resize_keyboard: true,
// //         },
// //       },
// //     );
// //   } catch (error) {
// //     console.error('Ошибка при завершении регистрации:', error);
// //     await bot.api.sendMessage(
// //       chatId,
// //       'Произошла ошибка при регистрации. Пожалуйста, попробуйте еще раз с команды /start',
// //     );
// //   }
// // }

// // // Функция для обновления адреса пользователя
// // async function updateUserAddress(
// //   chatId: number,
// //   addressData: any,
// //   supabase: any,
// //   bot: any,
// // ) {
// //   try {
// //     const { error } = await supabase
// //       .from('users')
// //       .update({
// //         country: addressData.country || '',
// //         city: addressData.city || '',
// //         street: addressData.street || '',
// //         house_number: addressData.house || '',
// //         is_private_house: addressData.isPrivateHouse || false,
// //         apartment: addressData.apartment
// //           ? parseInt(addressData.apartment)
// //           : null,
// //         entrance: addressData.entrance ? parseInt(addressData.entrance) : null,
// //         floor: addressData.floor ? parseInt(addressData.floor) : null,
// //         intercom_code: addressData.intercom || '',
// //       })
// //       .eq('telegram_id', chatId);

// //     if (error) {
// //       console.error('Ошибка при обновлении адреса:', error);
// //       await bot.api.sendMessage(
// //         chatId,
// //         'Произошла ошибка при обновлении адреса. Пожалуйста, попробуйте еще раз.',
// //       );
// //       return false;
// //     }

// //     await bot.api.sendMessage(chatId, 'Адрес успешно обновлен!');
// //     return true;
// //   } catch (error) {
// //     console.error('Ошибка при обновлении адреса:', error);
// //     await bot.api.sendMessage(
// //       chatId,
// //       'Произошла ошибка при обновлении адреса. Пожалуйста, попробуйте еще раз.',
// //     );
// //     return false;
// //   }
// // }

// // // Функция для обработки команд меню
// // async function handleMenuCommands(
// //   chatId: number,
// //   text: string,
// //   bot: any,
// //   supabase: any,
// // ) {
// //   switch (text) {
// //     case 'Изменить адрес доставки':
// //       // Начинаем процесс изменения адреса
// //       registrationData.set(chatId, {
// //         step: 'country',
// //         address: {},
// //         isUpdating: true,
// //       });
// //       await bot.api.sendMessage(chatId, 'Введите вашу страну:');
// //       break;

// //     case 'Мои заказы':
// //       // Получаем активные заказы пользователя
// //       const { data: activeOrders } = await supabase
// //         .from('orders')
// //         .select('*')
// //         .eq('user_id', chatId)
// //         .neq('status', 'completed')
// //         .neq('status', 'cancelled')
// //         .order('created_at', { ascending: false });

// //       if (!activeOrders || activeOrders.length === 0) {
// //         await bot.api.sendMessage(chatId, 'У вас нет активных заказов.');
// //       } else {
// //         await bot.api.sendMessage(
// //           chatId,
// //           `У вас ${activeOrders.length} активных заказов:`,
// //         );

// //         for (const order of activeOrders) {
// //           await bot.api.sendMessage(
// //             chatId,
// //             `Заказ #${order.id}\nСтатус: ${getStatusText(order.status)}\nСумма: ${
// //               order.total_amount
// //             } ₽\nДата: ${new Date(order.created_at).toLocaleString('ru-RU')}`,
// //           );
// //         }
// //       }
// //       break;

// //     case 'История заказов':
// //       // Получаем историю заказов пользователя
// //       const { data: orderHistory } = await supabase
// //         .from('orders')
// //         .select('*')
// //         .eq('user_id', chatId)
// //         .in('status', ['completed', 'cancelled'])
// //         .order('created_at', { ascending: false })
// //         .limit(5);

// //       if (!orderHistory || orderHistory.length === 0) {
// //         await bot.api.sendMessage(chatId, 'У вас нет завершенных заказов.');
// //       } else {
// //         await bot.api.sendMessage(
// //           chatId,
// //           `История заказов (последние ${orderHistory.length}):`,
// //         );

// //         for (const order of orderHistory) {
// //           await bot.api.sendMessage(
// //             chatId,
// //             `Заказ #${order.id}\nСтатус: ${getStatusText(order.status)}\nСумма: ${
// //               order.total_amount
// //             } ₽\nДата: ${new Date(order.created_at).toLocaleString('ru-RU')}`,
// //           );
// //         }
// //       }
// //       break;

// //     case 'Обо мне':
// //       // Получаем данные пользователя
// //       const { data: user } = await supabase
// //         .from('users')
// //         .select('*')
// //         .eq('telegram_id', chatId)
// //         .single();

// //       if (!user) {
// //         await bot.api.sendMessage(
// //           chatId,
// //           'Информация о пользователе не найдена.',
// //         );
// //         return;
// //       }

// //       // Форматируем адрес из отдельных полей, а не из default_address
// //       let addressText = 'Не указан';
// //       if (user.country || user.city || user.street || user.house_number) {
// //         addressText = formatAddressFromUser(user);
// //       }

// //       await bot.api.sendMessage(
// //         chatId,
// //         `Ваш профиль:\n\nИмя: ${user.name}\nТелефон: ${
// //           user.phone || 'Не указан'
// //         }\nEmail: ${user.email || 'Не указан'}\n\nАдрес доставки:\n${addressText}`,
// //       );
// //       break;

// //     case 'Перейти на сайт':
// //       // Получаем ID магазина из базы данных
// //       const { data: shops } = await supabase
// //         .from('shops')
// //         .select('id')
// //         .eq('status', 'active')
// //         .limit(1);

// //       const shopId = shops && shops.length > 0 ? shops[0].id : null;

// //       if (!shopId) {
// //         await bot.api.sendMessage(
// //           chatId,
// //           'Извините, магазин временно недоступен.',
// //         );
// //         return;
// //       }

// //       // Отправляем ссылку на сайт
// //       await bot.api.sendMessage(
// //         chatId,
// //         'Нажмите на кнопку ниже, чтобы перейти на сайт:',
// //         {
// //           reply_markup: {
// //             inline_keyboard: [
// //               [
// //                 {
// //                   text: 'Открыть сайт',
// //                   web_app: {
// //                     url: `https://telegram-mini-app-tan-ten.vercel.app/shop/${shopId}`,
// //                   },
// //                 },
// //               ],
// //             ],
// //           },
// //         },
// //       );
// //       break;

// //     default:
// //       await bot.api.sendMessage(
// //         chatId,
// //         'Используйте кнопки меню для навигации.',
// //       );
// //       break;
// //   }
// // }

// // // Вспомогательная функция для форматирования адреса
// // function formatAddressFromUser(user: any): string {
// //   const parts = [];

// //   if (user.country) parts.push(user.country);
// //   if (user.city) parts.push(user.city);
// //   if (user.street) parts.push(`ул. ${user.street}`);
// //   if (user.house_number) parts.push(`д. ${user.house_number}`);

// //   if (!user.is_private_house) {
// //     if (user.apartment) parts.push(`кв. ${user.apartment}`);
// //     if (user.entrance) parts.push(`подъезд ${user.entrance}`);
// //     if (user.floor) parts.push(`этаж ${user.floor}`);
// //     if (user.intercom_code) parts.push(`домофон ${user.intercom_code}`);
// //   }

// //   return parts.length > 0 ? parts.join(', ') : 'Не указан';
// // }

// // // Вспомогательная функция для получения текста статуса
// // function getStatusText(status: string): string {
// //   switch (status) {
// //     case 'pending':
// //       return 'Ожидает обработки';
// //     case 'processing':
// //       return 'В обработке';
// //     case 'shipping':
// //       return 'Доставляется';
// //     case 'completed':
// //       return 'Выполнен';
// //     case 'cancelled':
// //       return 'Отменен';
// //     default:
// //       return status;
// //   }
// // }
// // app/api/bot/webhook/[token]/route.ts
// import { NextRequest, NextResponse } from 'next/server';
// import { createBot } from '@/lib/bot';

// export async function POST(
//   request: NextRequest,
//   { params }: { params: { token: string } },
// ) {
//   try {
//     const token = params.token;
//     console.log('Получен вебхук от Telegram, токен:', token);

//     // Проверяем, что токен совпадает с токеном бота
//     if (token !== process.env.TELEGRAM_BOT_TOKEN) {
//       console.error('Неверный токен:', token);
//       return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
//     }

//     const update = await request.json();
//     console.log('Данные вебхука:', JSON.stringify(update));

//     // Создаем экземпляр бота из модульной структуры
//     const bot = createBot();

//     // Обрабатываем обновление
//     await bot.handleUpdate(update);

//     return NextResponse.json({ ok: true });
//   } catch (error: any) {
//     console.error('Ошибка обработки вебхука:', error);
//     return NextResponse.json(
//       {
//         error: 'Internal server error',
//         message: error.message || 'Unknown error',
//       },
//       { status: 500 },
//     );
//   }
// }
