-- Удаляем старые тестовые данные
DELETE FROM products WHERE shop_id IN (SELECT id FROM shops WHERE name LIKE 'Тестовый%');
DELETE FROM shops WHERE name LIKE 'Тестовый%';

-- Создаем тестовый магазин
INSERT INTO shops (id, name, description, bot_username, status, settings) VALUES 
('550e8400-e29b-41d4-a716-446655440000', 'Тестовый Магазин', 'Демонстрационный магазин для проверки функций', 'test_shop_bot', 'active', 
 '{"welcome_message": "Добро пожаловать в тестовый магазин!", "currency": "USD"}');

-- Добавляем тестовые товары
INSERT INTO products (shop_id, name, description, price, imageUrl, status) VALUES 
('550e8400-e29b-41d4-a716-446655440000', 'iPhone 15 Pro', 'Новейший iPhone с камерой Pro и чипом A17 Pro. Доступен в разных цветах.', 999.00, 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400&h=400&fit=crop', 'active'),
('550e8400-e29b-41d4-a716-446655440000', 'MacBook Air M3', 'Мощный и легкий ноутбук с чипом M3. Идеален для работы и творчества.', 1299.00, 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=400&h=400&fit=crop', 'active'),
('550e8400-e29b-41d4-a716-446655440000', 'AirPods Pro', 'Беспроводные наушники с активным шумоподавлением и пространственным звуком.', 249.00, 'https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?w=400&h=400&fit=crop', 'active'),
('550e8400-e29b-41d4-a716-446655440000', 'Apple Watch Series 9', 'Умные часы с множеством функций для здоровья и фитнеса.', 399.00, 'https://images.unsplash.com/photo-1551816230-ef5deaed4a26?w=400&h=400&fit=crop', 'active'),
('550e8400-e29b-41d4-a716-446655440000', 'iPad Pro', 'Профессиональный планшет с M2 чипом и поддержкой Apple Pencil.', 799.00, 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400&h=400&fit=crop', 'active'),
('550e8400-e29b-41d4-a716-446655440000', 'Magic Keyboard', 'Беспроводная клавиатура с подсветкой клавиш и Touch ID.', 179.00, 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400&h=400&fit=crop', 'active');

-- Создаем тестового пользователя Telegram
INSERT INTO telegram_users (telegram_id, username, first_name, last_name, language_code) VALUES 
(123456789, 'testuser', 'Тест', 'Пользователь', 'ru')
ON CONFLICT (telegram_id) DO UPDATE SET
username = EXCLUDED.username,
first_name = EXCLUDED.first_name,
last_name = EXCLUDED.last_name,
language_code = EXCLUDED.language_code,
last_active = NOW();

-- Создаем тестовый заказ
INSERT INTO orders (shop_id, telegram_user_id, telegram_username, items, total_amount, status) VALUES 
('550e8400-e29b-41d4-a716-446655440000', 123456789, 'testuser', 
'[{"product": {"id": "1", "name": "iPhone 15 Pro", "price": 999}, "quantity": 1}]', 
999.00, 'pending');
