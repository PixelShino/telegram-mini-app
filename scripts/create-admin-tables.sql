-- Создание таблицы администраторов магазинов
CREATE TABLE IF NOT EXISTS shop_admins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
  telegram_id BIGINT NOT NULL,
  role VARCHAR(20) DEFAULT 'admin' CHECK (role IN ('owner', 'admin', 'manager')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(shop_id, telegram_id)
);

-- Создание индекса для быстрого поиска администраторов
CREATE INDEX IF NOT EXISTS idx_shop_admins_telegram_id ON shop_admins(telegram_id);
CREATE INDEX IF NOT EXISTS idx_shop_admins_shop_id ON shop_admins(shop_id);

-- Добавление поля для хранения состояния диалога с ботом
ALTER TABLE telegram_users 
ADD COLUMN IF NOT EXISTS bot_state JSONB DEFAULT NULL;

-- Функция для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Триггер для автоматического обновления updated_at
CREATE TRIGGER update_shop_admins_updated_at 
BEFORE UPDATE ON shop_admins
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
