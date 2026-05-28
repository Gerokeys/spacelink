"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Search, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { LISTING_TYPE_LABELS } from "@/types"
import type { ListingType } from "@/types"
import { cn } from "@/lib/utils"

const TYPES: { value: ListingType | "ALL"; label: string }[] = [
  { value: "ALL", label: "All Spaces" },
  { value: "RESIDENTIAL", label: "Residential" },
  { value: "OFFICE", label: "Office" },
  { value: "COMMERCIAL", label: "Commercial" },
  { value: "SHORT_TERM", label: "Short-term" },
]

interface SearchBarProps {
  className?: string
  defaultType?: ListingType | "ALL"
  defaultQuery?: string
}

export function SearchBar({ className, defaultType = "ALL", defaultQuery = "" }: SearchBarProps) {
  const router = useRouter()
  const [query, setQuery] = useState(defaultQuery)
  const [selectedType, setSelectedType] = useState<ListingType | "ALL">(defaultType)

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    const params = new URLSearchParams()
    if (query.trim()) params.set("q", query.trim())
    if (selectedType !== "ALL") params.set("type", selectedType)
    router.push(`/search?${params.toString()}`)
  }

  return (
    <form onSubmit={handleSearch} className={cn("w-full", className)}>
      {/* Type tabs */}
      <div className="flex gap-1 mb-3 overflow-x-auto pb-1 scrollbar-hide">
        {TYPES.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            onClick={() => setSelectedType(value)}
            className={cn(
              "px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors shrink-0",
              selectedType === value
                ? "bg-indigo-600 text-white"
                : "bg-white/80 text-gray-700 hover:bg-white border border-gray-200"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Search input */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by location, neighbourhood, city…"
            className="w-full h-12 pl-10 pr-4 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
          />
        </div>
        <Button type="submit" size="lg" className="h-12 px-6 rounded-xl shadow-sm">
          <Search className="w-4 h-4 mr-2" />
          Search
        </Button>
      </div>
    </form>
  )
}
