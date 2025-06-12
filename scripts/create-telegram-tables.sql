-- Создание таблицы пользователей Telegram
CREATE TABLE IF NOT EXISTS telegram_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  telegram_id BIGINT UNIQUE NOT NULL,
  username VARCHAR(255),
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  language_code VARCHAR(10),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Обновление таблицы заказов для связи с пользователями Telegram
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS telegram_user_id BIGINT,
ADD COLUMN IF NOT EXISTS telegram_username VARCHAR(255);

-- Создание индексов
CREATE INDEX IF NOT EXISTS idx_telegram_users_telegram_id ON telegram_users(telegram_id);
CREATE INDEX IF NOT EXISTS idx_orders_telegram_user_id ON orders(telegram_user_id);

-- Функция для автоматического обновления last_active
CREATE OR REPLACE FUNCTION update_last_active()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_active = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Триггер для автоматического обновления last_active
CREATE TRIGGER update_telegram_users_last_active 
BEFORE UPDATE ON telegram_users
FOR EACH ROW EXECUTE FUNCTION update_last_active();
