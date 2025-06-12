-- Добавляем дополнения для тестового магазина
INSERT INTO products (shop_id, name, description, price, product_type, is_addon, allow_quantity_change, addon_category, related_categories, sort_order, status) VALUES 
-- Дополнения для техники
('550e8400-e29b-41d4-a716-446655440000', 'Защитный чехол', 'Прозрачный силиконовый чехол для защиты устройства', 15.00, 'addon', true, true, 'case', '{"electronics"}', 1, 'active'),
('550e8400-e29b-41d4-a716-446655440000', 'Расширенная гарантия', 'Дополнительный год гарантии на устройство', 99.00, 'service', true, false, 'warranty', '{"electronics", "computers"}', 2, 'active'),
('550e8400-e29b-41d4-a716-446655440000', 'Защитное стекло', 'Закаленное стекло для экрана', 12.00, 'addon', true, true, 'protection', '{"electronics"}', 3, 'active'),

-- Дополнения для суши (для будущих магазинов)
('550e8400-e29b-41d4-a716-446655440000', 'Соевый соус', 'Классический соевый соус', 2.00, 'addon', true, true, 'sauce', '{"food", "sushi"}', 1, 'active'),
('550e8400-e29b-41d4-a716-446655440000', 'Васаби', 'Острый японский хрен', 3.00, 'addon', true, true, 'sauce', '{"food", "sushi"}', 2, 'active'),
('550e8400-e29b-41d4-a716-446655440000', 'Имбирь маринованный', 'Маринованный имбирь для суши', 2.50, 'addon', true, true, 'sauce', '{"food", "sushi"}', 3, 'active'),
('550e8400-e29b-41d4-a716-446655440000', 'Палочки для суши', 'Одноразовые деревянные палочки', 1.00, 'addon', true, false, 'utensils', '{"food", "sushi"}', 4, 'active');
