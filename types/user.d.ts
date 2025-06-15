export interface TelegramUser {
  id?: string;
  username?: string;
  first_name?: string;
  last_name?: string;
  language_code?: string;
}

export interface DatabaseUser {
  id: string;
  telegram_id: string;
  username?: string;
  first_name?: string;
  last_name?: string;
  language_code?: string;
  created_at: string;
  last_active: string;
}
// types/user.ts
export interface AddressData {
  country: string;
  city: string;
  street: string;
  house: string;
  isPrivateHouse: boolean;
  apartment?: string;
  entrance?: string;
  floor?: string;
  intercom?: string;
}
