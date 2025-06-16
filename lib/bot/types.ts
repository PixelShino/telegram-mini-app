import { Context, SessionFlavor } from 'grammy';

// Определяем типы для сессии
export interface SessionData {
  step: string;
  addressData?: {
    name?: string;
    phone?: string;
    email?: string;
    country?: string;
    city?: string;
    street?: string;
    house?: string;
    isPrivateHouse?: boolean;
    apartment?: string;
    entrance?: string;
    floor?: string;
    intercom?: string;
  };
  userId?: number;
  registrationComplete?: boolean;
}

// Создаем тип контекста с сессией
export type MyContext = Context & SessionFlavor<SessionData>;
