export function validateName(name: string): boolean {
  const isValid = /^[A-Za-zА-Яа-яЁё\s\-]{2,50}$/.test(name);
  console.log('Валидация имени:', name, isValid);
  return isValid;
}

export function validatePhone(phone: string): boolean {
  // Удаляем все пробелы, скобки и дефисы
  const cleaned = phone.replace(/[\s\(\)\-]/g, '');

  // Проверяем различные форматы:
  // 1. +7XXXXXXXXXX (с плюсом и 11 цифр)
  // 2. +8XXXXXXXXXX (с плюсом и 11 цифр)
  // 3. 7XXXXXXXXXX (без плюса, 11 цифр)
  // 4. 8XXXXXXXXXX (начинается с 8, 11 цифр)
  const isValid =
    /^\+[78]\d{10}$/.test(cleaned) || // +7/+8 и 10 цифр
    /^[78]\d{10}$/.test(cleaned); // 7/8 и 10 цифр

  console.log('Валидация телефона:', phone, '→', cleaned, isValid);
  return isValid;
}

export function validateEmail(email: string): boolean {
  const isValid = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(
    email,
  );
  console.log('Валидация email:', email, isValid);
  return isValid;
}

export function validateAddress(text: string): boolean {
  const isValid = /^[A-Za-zА-Яа-яЁё0-9\s\-\.,]{2,100}$/.test(text);
  console.log('Валидация адреса:', text, isValid);
  return isValid;
}

export function validateNumber(text: string): boolean {
  // Проверяем, что строка содержит хотя бы одну цифру и имеет длину от 1 до 20 символов
  const hasDigit = /\d/.test(text);
  const validLength = text.length >= 1 && text.length <= 20;
  const isValid = hasDigit && validLength;
  console.log('Валидация числа:', text, isValid);
  return isValid;
}
