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

  switch (ctx.session.step) {
    case 'registration_name':
      return handleNameInput(ctx);
    case 'registration_phone':
      return handlePhoneInput(ctx);
    case 'registration_email':
      return handleEmailInput(ctx);
    case 'registration_country':
      return handleCountryInput(ctx);
    case 'registration_city':
      return handleCityInput(ctx);
    case 'registration_street':
      return handleStreetInput(ctx);
    case 'registration_house':
      return handleHouseInput(ctx);
    case 'registration_apartment':
      return handleApartmentInput(ctx);
    case 'registration_entrance':
      return handleEntranceInput(ctx);
    case 'registration_floor':
      return handleFloorInput(ctx);
    case 'registration_intercom':
      return handleIntercomInput(ctx);
  }
}

// Обработчики отдельных шагов регистрации
async function handleNameInput(ctx: MyContext) {
  const name = ctx.message!.text;

  if (!validateName(name!)) {
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

  if (!validatePhone(phone!)) {
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

  if (!validateEmail(email!)) {
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

  if (!validateAddress(country!)) {
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

  if (!validateAddress(city!)) {
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

  if (!validateAddress(street!)) {
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

  if (!house || house.length === 0) {
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

  if (!validateNumber(apartment!)) {
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

  if (!validateNumber(entrance!)) {
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

  if (!validateNumber(floor!)) {
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
