-- Добавление тестовых данных

-- Тестовый магазин
INSERT INTO shops (name, description, bot_username, status, settings) VALUES 
('Демо Магазин', 'Пример магазина для демонстрации', 'demo_shop_bot', 'active', 
 '{"welcome_message": "Добро пожаловать в демо магазин!", "currency": "USD"}');

-- Получаем ID созданного магазина
DO $$
DECLARE
    shop_uuid UUID;
BEGIN
    SELECT id INTO shop_uuid FROM shops WHERE name = 'Демо Магазин' LIMIT 1;
    
    -- Добавляем тестовые товары
    INSERT INTO products (shop_id, name, description, price, imageUrl) VALUES 
    (shop_uuid, 'iPhone 15 Pro', 'Новейший iPhone с камерой Pro и чипом A17 Pro', 999.00, 'https://example.com/iphone15.jpg'),
    (shop_uuid, 'MacBook Air M3', 'Мощный и легкий ноутбук с чипом M3', 1299.00, 'https://example.com/macbook.jpg'),
    (shop_uuid, 'AirPods Pro', 'Беспроводные наушники с активным шумоподавлением', 249.00, 'https://example.com/airpods.jpg'),
    (shop_uuid, 'Apple Watch Series 9', 'Умные часы с множеством функций для здоровья', 399.00, 'https://example.com/watch.jpg');
END $$;
