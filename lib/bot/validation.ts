// Функции валидации
export function validateName(name: string): boolean {
  return name.length >= 2 && name.length <= 50;
}

export function validatePhone(phone: string): boolean {
  // Проверка формата телефона: +7XXXXXXXXXX или 8XXXXXXXXXX
  return /^(\+7|8)[0-9]{10}$/.test(phone.replace(/\s+/g, ''));
}

export function validateEmail(email: string): boolean {
  // Простая проверка формата email
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validateAddress(text: string): boolean {
  return text.length >= 2 && text.length <= 100;
}

export function validateNumber(text: string): boolean {
  return /^\d+$/.test(text);
}
