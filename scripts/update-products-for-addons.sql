-- Добавляем новые поля для системы дополнений
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS product_type VARCHAR(20) DEFAULT 'product' CHECK (product_type IN ('product', 'addon', 'service')),
ADD COLUMN IF NOT EXISTS allow_quantity_change BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS is_addon BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS related_categories TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS addon_category VARCHAR(50),
ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- Создаем индексы для оптимизации
CREATE INDEX IF NOT EXISTS idx_products_product_type ON products(product_type);
CREATE INDEX IF NOT EXISTS idx_products_is_addon ON products(is_addon);
CREATE INDEX IF NOT EXISTS idx_products_addon_category ON products(addon_category);

-- Комментарии к новым полям
COMMENT ON COLUMN products.product_type IS 'Тип товара: product (обычный товар), addon (дополнение), service (услуга)';
COMMENT ON COLUMN products.allow_quantity_change IS 'Можно ли изменять количество товара';
COMMENT ON COLUMN products.is_addon IS 'Является ли товар дополнением к другим товарам';
COMMENT ON COLUMN products.related_categories IS 'Категории товаров, к которым подходит это дополнение';
COMMENT ON COLUMN products.addon_category IS 'Категория дополнения (sauce, case, warranty, etc.)';
COMMENT ON COLUMN products.sort_order IS 'Порядок сортировки в списке дополнений';
