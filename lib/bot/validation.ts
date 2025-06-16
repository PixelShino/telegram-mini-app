export function validateName(name: string): boolean {
  const isValid = name.length >= 2 && name.length <= 50;
  console.log('Валидация имени:', name, isValid);
  return isValid;
}

export function validatePhone(phone: string): boolean {
  // Проверка формата телефона: +7XXXXXXXXXX или 8XXXXXXXXXX
  const cleaned = phone.replace(/\s+/g, '');
  const isValid = /^(\+7|8)[0-9]{10}$/.test(cleaned);
  console.log('Валидация телефона:', phone, isValid);
  return isValid;
}

export function validateEmail(email: string): boolean {
  // Простая проверка формата email
  const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  console.log('Валидация email:', email, isValid);
  return isValid;
}

export function validateAddress(text: string): boolean {
  const isValid = text.length >= 2 && text.length <= 100;
  console.log('Валидация адреса:', text, isValid);
  return isValid;
}

export function validateNumber(text: string): boolean {
  const isValid = /^\d+$/.test(text);
  console.log('Валидация числа:', text, isValid);
  return isValid;
}
