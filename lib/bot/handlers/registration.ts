import { MyContext } from '../types';
import { Keyboard } from 'grammy';
import { completeRegistration } from '../services/user';
import {
  validateName,
  validatePhone,
  validateEmail,
  validateAddress,
  validateNumber,
} from '../validation';

// Обработчик кнопки "Регистрация"
export async function handleRegistrationStart(ctx: MyContext) {
  ctx.session.step = 'registration_name';
  await ctx.reply('Введите ваше имя:');
}

// Обработчик ответа о частном доме
export async function handleHouseTypeResponse(ctx: MyContext) {
  if (!ctx.message || !ctx.message.text) return;

  if (ctx.session.step === 'registration_private_house') {
    if (!ctx.session.addressData) ctx.session.addressData = {};
    ctx.session.addressData.isPrivateHouse = ctx.message.text === 'Да';

    if (ctx.message.text === 'Нет') {
      ctx.session.step = 'registration_apartment';
      await ctx.reply('Введите номер квартиры:');
    } else {
      // Завершаем регистрацию для частного дома
      await completeRegistration(ctx);
    }
  }
}

// Обработчик текстовых сообщений для регистрации
export async function handleRegistrationMessage(ctx: MyContext) {
  if (!ctx.message || !ctx.message.text) return;

  // Если шаг не установлен или не связан с регистрацией, не обрабатываем
  if (!ctx.session.step || !ctx.session.step.startsWith('registration_')) {
    return;
  }

  switch (ctx.session.step) {
    case 'registration_name':
      return await handleNameInput(ctx);
    case 'registration_phone':
      return await handlePhoneInput(ctx);
    case 'registration_email':
      return await handleEmailInput(ctx);
    case 'registration_country':
      return await handleCountryInput(ctx);
    case 'registration_city':
      return await handleCityInput(ctx);
    case 'registration_street':
      return await handleStreetInput(ctx);
    case 'registration_house':
      return await handleHouseInput(ctx);
    case 'registration_apartment':
      return await handleApartmentInput(ctx);
    case 'registration_entrance':
      return await handleEntranceInput(ctx);
    case 'registration_floor':
      return await handleFloorInput(ctx);
    case 'registration_intercom':
      return await handleIntercomInput(ctx);
  }
}

// Обработчики отдельных шагов регистрации
async function handleNameInput(ctx: MyContext) {
  const name = ctx.message!.text;

  // Проверяем валидность имени
  if (!validateName(name!)) {
    console.log('Имя не прошло валидацию:', name);
    await ctx.reply(
      'Имя должно содержать от 2 до 50 символов. Пожалуйста, введите корректное имя:',
    );
    return;
  }

  if (!ctx.session.addressData) ctx.session.addressData = {};
  ctx.session.addressData.name = name;
  ctx.session.step = 'registration_phone';
  await ctx.reply('Введите ваш номер телефона в формате +79001234567:');
}

async function handlePhoneInput(ctx: MyContext) {
  const phone = ctx.message!.text;

  // Проверяем валидность телефона
  if (!validatePhone(phone!)) {
    console.log('Телефон не прошел валидацию:', phone);
    await ctx.reply(
      'Неверный формат номера телефона. Пожалуйста, введите номер в формате +79001234567:',
    );
    return;
  }

  if (!ctx.session.addressData) ctx.session.addressData = {};
  ctx.session.addressData.phone = phone;
  ctx.session.step = 'registration_email';
  await ctx.reply('Введите ваш email:');
}

async function handleEmailInput(ctx: MyContext) {
  const email = ctx.message!.text;

  // Проверяем валидность email
  if (!validateEmail(email!)) {
    console.log('Email не прошел валидацию:', email);
    await ctx.reply(
      'Неверный формат email. Пожалуйста, введите корректный email:',
    );
    return;
  }

  if (!ctx.session.addressData) ctx.session.addressData = {};
  ctx.session.addressData.email = email;
  ctx.session.step = 'registration_country';
  await ctx.reply('Введите вашу страну:');
}

async function handleCountryInput(ctx: MyContext) {
  const country = ctx.message!.text;

  // Проверяем валидность страны
  if (!validateAddress(country!)) {
    console.log('Страна не прошла валидацию:', country);
    await ctx.reply(
      'Название страны должно содержать от 2 до 100 символов. Пожалуйста, введите корректное название:',
    );
    return;
  }

  if (!ctx.session.addressData) ctx.session.addressData = {};
  ctx.session.addressData.country = country;
  ctx.session.step = 'registration_city';
  await ctx.reply('Введите ваш город:');
}

async function handleCityInput(ctx: MyContext) {
  const city = ctx.message!.text;

  // Проверяем валидность города
  if (!validateAddress(city!)) {
    console.log('Город не прошел валидацию:', city);
    await ctx.reply(
      'Название города должно содержать от 2 до 100 символов. Пожалуйста, введите корректное название:',
    );
    return;
  }

  if (!ctx.session.addressData) ctx.session.addressData = {};
  ctx.session.addressData.city = city;
  ctx.session.step = 'registration_street';
  await ctx.reply('Введите улицу:');
}

async function handleStreetInput(ctx: MyContext) {
  const street = ctx.message!.text;

  // Проверяем валидность улицы
  if (!validateAddress(street!)) {
    console.log('Улица не прошла валидацию:', street);
    await ctx.reply(
      'Название улицы должно содержать от 2 до 100 символов. Пожалуйста, введите корректное название:',
    );
    return;
  }

  if (!ctx.session.addressData) ctx.session.addressData = {};
  ctx.session.addressData.street = street;
  ctx.session.step = 'registration_house';
  await ctx.reply('Введите номер дома:');
}

async function handleHouseInput(ctx: MyContext) {
  const house = ctx.message!.text;

  // Проверяем валидность номера дома
  if (!house || house.length === 0) {
    console.log('Номер дома не прошел валидацию:', house);
    await ctx.reply(
      'Номер дома не может быть пустым. Пожалуйста, введите номер дома:',
    );
    return;
  }

  if (!ctx.session.addressData) ctx.session.addressData = {};
  ctx.session.addressData.house = house;
  ctx.session.step = 'registration_private_house';
  await ctx.reply('Это частный дом?', {
    reply_markup: new Keyboard().text('Да').text('Нет').resized().oneTime(),
  });
}

async function handleApartmentInput(ctx: MyContext) {
  const apartment = ctx.message!.text;

  // Проверяем валидность номера квартиры
  if (!validateNumber(apartment!)) {
    console.log('Номер квартиры не прошел валидацию:', apartment);
    await ctx.reply(
      'Номер квартиры должен содержать только цифры. Пожалуйста, введите корректный номер:',
    );
    return;
  }

  if (!ctx.session.addressData) ctx.session.addressData = {};
  ctx.session.addressData.apartment = apartment;
  ctx.session.step = 'registration_entrance';
  await ctx.reply('Введите номер подъезда:');
}

async function handleEntranceInput(ctx: MyContext) {
  const entrance = ctx.message!.text;

  // Проверяем валидность номера подъезда
  if (!validateNumber(entrance!)) {
    console.log('Номер подъезда не прошел валидацию:', entrance);
    await ctx.reply(
      'Номер подъезда должен содержать только цифры. Пожалуйста, введите корректный номер:',
    );
    return;
  }

  if (!ctx.session.addressData) ctx.session.addressData = {};
  ctx.session.addressData.entrance = entrance;
  ctx.session.step = 'registration_floor';
  await ctx.reply('Введите этаж:');
}

async function handleFloorInput(ctx: MyContext) {
  const floor = ctx.message!.text;

  // Проверяем валидность номера этажа
  if (!validateNumber(floor!)) {
    console.log('Номер этажа не прошел валидацию:', floor);
    await ctx.reply(
      'Номер этажа должен содержать только цифры. Пожалуйста, введите корректный номер:',
    );
    return;
  }

  if (!ctx.session.addressData) ctx.session.addressData = {};
  ctx.session.addressData.floor = floor;
  ctx.session.step = 'registration_intercom';
  await ctx.reply('Введите код домофона (если есть):');
}

async function handleIntercomInput(ctx: MyContext) {
  const intercom = ctx.message!.text;

  if (!ctx.session.addressData) ctx.session.addressData = {};
  ctx.session.addressData.intercom = intercom;
  await completeRegistration(ctx);
}
