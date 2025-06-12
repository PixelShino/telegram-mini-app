"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Search, X } from "lucide-react"

interface SearchBarProps {
  onSearch: (query: string) => void
  placeholder?: string
}

export default function SearchBar({ onSearch, placeholder = "Поиск товаров..." }: SearchBarProps) {
  const [query, setQuery] = useState("")

  const handleSearch = (value: string) => {
    setQuery(value)
    onSearch(value)
  }

  return (
    <div className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-sm p-2 z-40">
      <div className="max-w-md mx-auto relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder={placeholder}
            className="pl-10 pr-10 h-10 bg-background/50 border-0 shadow-sm"
          />
          {query && (
            <button
              onClick={() => handleSearch("")}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
