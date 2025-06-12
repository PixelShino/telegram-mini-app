-- Добавляем недостающую колонку imageUrl в таблицу products
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS imageUrl TEXT;

-- Обновляем существующие записи с placeholder изображениями
UPDATE products 
SET imageUrl = '/placeholder.svg?height=200&width=200' 
WHERE imageUrl IS NULL;
