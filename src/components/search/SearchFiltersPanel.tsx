"use client"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { LISTING_TYPE_LABELS, KENYA_CITIES, NAIROBI_NEIGHBOURHOODS } from "@/types"
import type { ListingType, SearchFilters } from "@/types"

interface SearchFiltersPanelProps {
  filters: SearchFilters
  onChange: (filters: SearchFilters) => void
  resultCount: number
}

const PRICE_PRESETS = [
  { label: "Any", min: undefined, max: undefined },
  { label: "Under KSh 20K", min: undefined, max: 20000 },
  { label: "KSh 20K–50K", min: 20000, max: 50000 },
  { label: "KSh 50K–100K", min: 50000, max: 100000 },
  { label: "KSh 100K–200K", min: 100000, max: 200000 },
  { label: "KSh 200K+", min: 200000, max: undefined },
]

const BEDROOM_OPTIONS = [
  { label: "Any", value: undefined },
  { label: "Studio", value: 0 },
  { label: "1+", value: 1 },
  { label: "2+", value: 2 },
  { label: "3+", value: 3 },
  { label: "4+", value: 4 },
]

export function SearchFiltersPanel({ filters, onChange, resultCount }: SearchFiltersPanelProps) {
  const update = (patch: Partial<SearchFilters>) => onChange({ ...filters, ...patch, page: 1 })

  const activeFilterCount = [
    filters.type,
    filters.minPrice || filters.maxPrice,
    filters.minBedrooms,
    filters.furnished,
    filters.petsAllowed,
    filters.neighbourhood,
  ].filter(Boolean).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-gray-900">Filters</h2>
        <span className="text-sm text-gray-400">{resultCount} results</span>
      </div>

      {/* Type */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Property type</label>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(LISTING_TYPE_LABELS) as ListingType[]).map((t) => (
            <button
              key={t}
              onClick={() => update({ type: filters.type === t ? undefined : t })}
              className={cn(
                "px-3 py-1.5 rounded-full text-sm border transition-colors",
                filters.type === t
                  ? "bg-brand-600 text-white border-brand-600"
                  : "border-gray-300 text-gray-600 hover:border-gray-400"
              )}
            >
              {LISTING_TYPE_LABELS[t]}
            </button>
          ))}
        </div>
      </div>

      {/* Price */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Monthly budget</label>
        <div className="flex flex-wrap gap-2">
          {PRICE_PRESETS.map(({ label, min, max }) => (
            <button
              key={label}
              onClick={() => update({ minPrice: min, maxPrice: max })}
              className={cn(
                "px-3 py-1.5 rounded-full text-sm border transition-colors",
                filters.minPrice === min && filters.maxPrice === max
                  ? "bg-brand-600 text-white border-brand-600"
                  : "border-gray-300 text-gray-600 hover:border-gray-400"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Bedrooms */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Bedrooms</label>
        <div className="flex gap-2">
          {BEDROOM_OPTIONS.map(({ label, value }) => (
            <button
              key={label}
              onClick={() => update({ minBedrooms: value })}
              className={cn(
                "flex-1 py-1.5 rounded-lg text-sm border transition-colors text-center",
                filters.minBedrooms === value
                  ? "bg-brand-600 text-white border-brand-600"
                  : "border-gray-300 text-gray-600 hover:border-gray-400"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* City */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">City</label>
        <select
          value={filters.city ?? ""}
          onChange={(e) => update({ city: e.target.value || undefined, neighbourhood: undefined })}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option value="">All cities</option>
          {KENYA_CITIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* Neighbourhood — Nairobi gets a dropdown, other cities free text */}
      {filters.city === "Nairobi" ? (
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Neighbourhood</label>
          <select
            value={filters.neighbourhood ?? ""}
            onChange={(e) => update({ neighbourhood: e.target.value || undefined })}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">All neighbourhoods</option>
            {NAIROBI_NEIGHBOURHOODS.map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>
      ) : filters.city ? (
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Neighbourhood / area</label>
          <input
            type="text"
            defaultValue={filters.neighbourhood ?? ""}
            placeholder="e.g. Nyali, Milimani"
            onBlur={(e) => update({ neighbourhood: e.target.value || undefined })}
            onKeyDown={(e) => {
              if (e.key === "Enter") update({ neighbourhood: e.currentTarget.value || undefined })
            }}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
      ) : null}

      {/* Toggle filters */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Filters</label>
        <div className="space-y-2">
          {[
            { key: "furnished" as const, label: "Furnished" },
            { key: "petsAllowed" as const, label: "Pet friendly" },
          ].map(({ key, label }) => (
            <label key={key} className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={!!filters[key]}
                onChange={(e) => update({ [key]: e.target.checked || undefined })}
                className="w-4 h-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
              />
              <span className="text-sm text-gray-700">{label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Sort */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Sort by</label>
        <select
          value={filters.sortBy ?? "newest"}
          onChange={(e) => update({ sortBy: e.target.value as SearchFilters["sortBy"] })}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option value="newest">Newest first</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
          <option value="popular">Most popular</option>
        </select>
      </div>

      {/* Clear */}
      {activeFilterCount > 0 && (
        <Button
          variant="outline"
          className="w-full"
          onClick={() => onChange({ sortBy: "newest" })}
        >
          Clear all filters ({activeFilterCount})
        </Button>
      )}
    </div>
  )
}
