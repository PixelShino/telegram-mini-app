import { Context, SessionFlavor } from 'grammy';

// Определяем типы для сессии
export interface SessionData {
  step: string;
  addressData?: any;
  userId?: number;
  registrationComplete?: boolean;
  email?: string;
  phone?: string;
}

// Создаем тип контекста с сессией
export type MyContext = Context & SessionFlavor<SessionData>;
