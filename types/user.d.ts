export interface TelegramUser {
  id?: string
  username?: string
  first_name?: string
  last_name?: string
  language_code?: string
}

export interface DatabaseUser {
  id: string
  telegram_id: string
  username?: string
  first_name?: string
  last_name?: string
  language_code?: string
  created_at: string
  last_active: string
}
