-- Добавляем поля для хранения контактной информации
ALTER TABLE telegram_users 
ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20),
ADD COLUMN IF NOT EXISTS has_shared_contact BOOLEAN DEFAULT false;

-- Создаем индекс для быстрого поиска по номеру телефона
CREATE INDEX IF NOT EXISTS idx_telegram_users_phone_number ON telegram_users(phone_number);

-- Комментарии к новым полям
COMMENT ON COLUMN telegram_users.phone_number IS 'Номер телефона пользователя, полученный через Telegram';
COMMENT ON COLUMN telegram_users.has_shared_contact IS 'Поделился ли пользователь своим контактом';
