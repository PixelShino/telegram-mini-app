"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronDown, Grid3X3 } from "lucide-react"
import { useState } from "react"

interface Subcategory {
  id: string
  name: string
}

interface Category {
  id: string
  name: string
  subcategories?: Subcategory[]
}

interface CategoryFilterProps {
  categories: Category[]
  selectedCategory: string | null
  selectedSubcategory: string | null
  onCategorySelect: (categoryId: string | null, subcategoryId?: string | null) => void
}

export default function CategoryFilter({
  categories,
  selectedCategory,
  selectedSubcategory,
  onCategorySelect,
}: CategoryFilterProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)

  const allCategories = [{ id: "all", name: "Все товары" }, ...categories]

  const getSelectedText = () => {
    if (!selectedCategory) return "Все товары"

    const category = categories.find((c) => c.id === selectedCategory)
    if (!category) return "Все товары"

    if (selectedSubcategory) {
      const subcategory = category.subcategories?.find((s) => s.id === selectedSubcategory)
      return subcategory ? `${category.name} • ${subcategory.name}` : category.name
    }

    return category.name
  }

  const handleCategoryClick = (categoryId: string) => {
    if (categoryId === "all") {
      onCategorySelect(null, null)
      setIsOpen(false)
      return
    }

    const category = categories.find((c) => c.id === categoryId)
    if (category?.subcategories && category.subcategories.length > 0) {
      // Если есть подкатегории, разворачиваем/сворачиваем
      setExpandedCategory(expandedCategory === categoryId ? null : categoryId)
    } else {
      // Если нет подкатегорий, выбираем категорию
      onCategorySelect(categoryId, null)
      setIsOpen(false)
    }
  }

  const handleSubcategoryClick = (categoryId: string, subcategoryId: string) => {
    onCategorySelect(categoryId, subcategoryId)
    setIsOpen(false)
  }

  return (
    <div className="fixed top-[48px] left-0 right-0 bg-white/95 backdrop-blur-sm z-30">
      <div className="max-w-md mx-auto p-2">
        <Button
          variant="outline"
          className="w-full justify-between h-10 border-0 shadow-sm"
          onClick={() => setIsOpen(!isOpen)}
        >
          <div className="flex items-center space-x-2">
            <Grid3X3 className="h-4 w-4" />
            <span className="font-medium">{getSelectedText()}</span>
          </div>
          <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? "transform rotate-180" : ""}`} />
        </Button>

        {isOpen && (
          <div className="bg-white border border-border rounded-md mt-1 shadow-lg max-h-64 overflow-y-auto">
            <div className="p-2 space-y-1">
              {allCategories.map((category) => (
                <div key={category.id}>
                  <button
                    onClick={() => handleCategoryClick(category.id)}
                    className={`w-full flex items-center justify-between p-2 rounded-lg transition-colors text-left ${
                      selectedCategory === category.id || (!selectedCategory && category.id === "all")
                        ? "bg-primary/10 text-primary"
                        : "hover:bg-muted/50"
                    }`}
                  >
                    <span className="font-medium">{category.name}</span>
                    <div className="flex items-center gap-2">
                      {(selectedCategory === category.id || (!selectedCategory && category.id === "all")) && (
                        <Badge variant="secondary" className="text-xs">
                          ✓
                        </Badge>
                      )}
                      {category.id !== "all" && categories.find((c) => c.id === category.id)?.subcategories && (
                        <ChevronDown
                          className={`h-3 w-3 transition-transform ${
                            expandedCategory === category.id ? "transform rotate-180" : ""
                          }`}
                        />
                      )}
                    </div>
                  </button>

                  {/* Подкатегории */}
                  {category.id !== "all" && expandedCategory === category.id && (
                    <div className="ml-4 mt-1 space-y-1">
                      {categories
                        .find((c) => c.id === category.id)
                        ?.subcategories?.map((subcategory) => (
                          <button
                            key={subcategory.id}
                            onClick={() => handleSubcategoryClick(category.id, subcategory.id)}
                            className={`w-full flex items-center justify-between p-2 rounded-lg transition-colors text-left text-sm ${
                              selectedSubcategory === subcategory.id
                                ? "bg-primary/10 text-primary"
                                : "hover:bg-muted/30"
                            }`}
                          >
                            <span>{subcategory.name}</span>
                            {selectedSubcategory === subcategory.id && (
                              <Badge variant="secondary" className="text-xs">
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
  )
}
