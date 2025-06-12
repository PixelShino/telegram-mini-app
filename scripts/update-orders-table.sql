-- Обновляем таблицу заказов для хранения детальной информации об адресе
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS delivery_address JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS customer_info JSONB DEFAULT '{}';

-- Создаем индекс для быстрого поиска по адресу доставки
CREATE INDEX IF NOT EXISTS idx_orders_delivery_address ON orders USING GIN (delivery_address);
CREATE INDEX IF NOT EXISTS idx_orders_customer_info ON orders USING GIN (customer_info);

-- Комментарий к структуре данных
COMMENT ON COLUMN orders.delivery_address IS 'Детальная информация об адресе доставки: страна, регион, город, улица, дом, квартира, подъезд, этаж, домофон, частный дом, комментарий ко входу';
COMMENT ON COLUMN orders.customer_info IS 'Информация о клиенте: телефон, email, комментарий к заказу, промокод';
