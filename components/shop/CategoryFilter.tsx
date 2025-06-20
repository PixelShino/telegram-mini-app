'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, Grid3X3 } from 'lucide-react';
import { useState } from 'react';

// Обновленные интерфейсы для соответствия структуре базы данных
interface Category {
  id: number | string; // Может быть как number, так и string (для "all")
  name: string;
  slug?: string;
  parent_id?: number | null;
  shop_id?: string;
  sort_order?: number;
  created_at?: string;
  updated_at?: string;
  children?: Category[]; // Добавляем children прямо в базовый интерфейс
}

interface CategoryFilterProps {
  categories: Category[];
  selectedCategory: string | null;
  selectedSubcategory: string | null;
  onCategorySelect: (
    categoryId: string | null,
    subcategoryId?: string | null,
  ) => void;
}

export default function CategoryFilter({
  categories,
  selectedCategory,
  selectedSubcategory,
  onCategorySelect,
}: CategoryFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  // Создаем специальную категорию "Все товары"
  const allCategories: Category[] = [
    { id: 'all', name: 'Все товары' },
    ...categories,
  ];

  const getSelectedText = () => {
    if (!selectedCategory) return 'Все товары';

    const category = categories.find(
      (c) => c.id.toString() === selectedCategory,
    );
    if (!category) return 'Все товары';

    if (selectedSubcategory) {
      const subcategory = category.children?.find(
        (s) => s.id.toString() === selectedSubcategory,
      );
      return subcategory
        ? `${category.name} • ${subcategory.name}`
        : category.name;
    }

    return category.name;
  };

  const handleCategoryClick = (categoryId: string) => {
    if (categoryId === 'all') {
      onCategorySelect(null, null);
      setIsOpen(false);
      return;
    }

    const category = categories.find((c) => c.id.toString() === categoryId);
    if (category?.children && category.children.length > 0) {
      // Если есть подкатегории, разворачиваем/сворачиваем
      setExpandedCategory(expandedCategory === categoryId ? null : categoryId);
    } else {
      // Если нет подкатегорий, выбираем категорию
      onCategorySelect(categoryId, null);
      setIsOpen(false);
    }
  };

  const handleSubcategoryClick = (
    categoryId: string,
    subcategoryId: string,
  ) => {
    onCategorySelect(categoryId, subcategoryId);
    setIsOpen(false);
  };

  return (
    <div className='fixed top-[48px] left-0 right-0 bg-white/95 backdrop-blur-sm z-30'>
      <div className='max-w-md p-2 mx-auto'>
        <Button
          variant='outline'
          className='justify-between w-full h-10 border-0 shadow-sm'
          onClick={() => setIsOpen(!isOpen)}
        >
          <div className='flex items-center space-x-2'>
            <Grid3X3 className='w-4 h-4' />
            <span className='font-medium'>{getSelectedText()}</span>
          </div>
          <ChevronDown
            className={`h-4 w-4 transition-transform ${isOpen ? 'transform rotate-180' : ''}`}
          />
        </Button>

        {isOpen && (
          <div className='mt-1 overflow-y-auto bg-white border rounded-md shadow-lg border-border max-h-64'>
            <div className='p-2 space-y-1'>
              {allCategories.map((category) => (
                <div key={category.id.toString()}>
                  <button
                    onClick={() => handleCategoryClick(category.id.toString())}
                    className={`w-full flex items-center justify-between p-2 rounded-lg transition-colors text-left ${
                      selectedCategory === category.id.toString() ||
                      (!selectedCategory && category.id === 'all')
                        ? 'bg-primary/10 text-primary'
                        : 'hover:bg-muted/50'
                    }`}
                  >
                    <span className='font-medium'>{category.name}</span>
                    <div className='flex items-center gap-2'>
                      {(selectedCategory === category.id.toString() ||
                        (!selectedCategory && category.id === 'all')) && (
                        <Badge variant='secondary' className='text-xs'>
                          ✓
                        </Badge>
                      )}
                      {category.id !== 'all' &&
                        categories.find(
                          (c) => c.id.toString() === category.id.toString(),
                        )?.children &&
                        (categories.find(
                          (c) => c.id.toString() === category.id.toString(),
                        )?.children?.length || 0) > 0 && (
                          <ChevronDown
                            className={`h-3 w-3 transition-transform ${
                              expandedCategory === category.id.toString()
                                ? 'transform rotate-180'
                                : ''
                            }`}
                          />
                        )}
                    </div>
                  </button>

                  {/* Подкатегории */}
                  {category.id !== 'all' &&
                    expandedCategory === category.id.toString() && (
                      <div className='mt-1 ml-4 space-y-1'>
                        {categories
                          .find(
                            (c) => c.id.toString() === category.id.toString(),
                          )
                          ?.children?.map((subcategory) => (
                            <button
                              key={subcategory.id.toString()}
                              onClick={() =>
                                handleSubcategoryClick(
                                  category.id.toString(),
                                  subcategory.id.toString(),
                                )
                              }
                              className={`w-full flex items-center justify-between p-2 rounded-lg transition-colors text-left text-sm ${
                                selectedSubcategory ===
                                subcategory.id.toString()
                                  ? 'bg-primary/10 text-primary'
                                  : 'hover:bg-muted/30'
                              }`}
                            >
                              <span>{subcategory.name}</span>
                              {selectedSubcategory ===
                                subcategory.id.toString() && (
                                <Badge variant='secondary' className='text-xs'>
                                  ✓
                                </Badge>
                              )}
                            </button>
                          ))}
                      </div>
                    )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
