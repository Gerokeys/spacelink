"use client"

import { useState, useEffect, useCallback } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { LayoutList, Map, SlidersHorizontal, X } from "lucide-react"
import { ListingCard } from "@/components/listings/ListingCard"
import { SearchBar } from "@/components/search/SearchBar"
import { SearchFiltersPanel } from "@/components/search/SearchFiltersPanel"
import { MapView } from "@/components/map/MapView"
import { Button } from "@/components/ui/button"
import { buildSearchParams, cn } from "@/lib/utils"
import type { SearchFilters, SearchResult, ListingType } from "@/types"

function parseFiltersFromUrl(searchParams: URLSearchParams): SearchFilters {
  return {
    query: searchParams.get("q") ?? undefined,
    type: (searchParams.get("type") as ListingType) ?? undefined,
    city: searchParams.get("city") ?? undefined,
    neighbourhood: searchParams.get("neighbourhood") ?? undefined,
    minPrice: searchParams.get("minPrice") ? Number(searchParams.get("minPrice")) : undefined,
    maxPrice: searchParams.get("maxPrice") ? Number(searchParams.get("maxPrice")) : undefined,
    minBedrooms: searchParams.get("minBedrooms") ? Number(searchParams.get("minBedrooms")) : undefined,
    furnished: searchParams.get("furnished") === "true" ? true : undefined,
    petsAllowed: searchParams.get("petsAllowed") === "true" ? true : undefined,
    hasVirtualTour: searchParams.get("hasVirtualTour") === "true" ? true : undefined,
    sortBy: (searchParams.get("sortBy") as SearchFilters["sortBy"]) ?? "newest",
    page: searchParams.get("page") ? Number(searchParams.get("page")) : 1,
  }
}

async function fetchListings(filters: SearchFilters): Promise<SearchResult> {
  const params = buildSearchParams(filters as Record<string, unknown>)
  const res = await fetch(`/api/search?${params}`)
  if (!res.ok) throw new Error("Search failed")
  const json = await res.json()
  return json.data
}

type ViewMode = "list" | "map"

export function SearchPageClient() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [viewMode, setViewMode] = useState<ViewMode>("list")
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<SearchFilters>(() =>
    parseFiltersFromUrl(searchParams)
  )

  useEffect(() => {
    const params = buildSearchParams(filters as Record<string, unknown>)
    router.replace(`/search?${params}`, { scroll: false })
  }, [filters, router])

  const { data, isLoading, isError } = useQuery({
    queryKey: ["search", filters],
    queryFn: () => fetchListings(filters),
    placeholderData: (prev) => prev,
  })

  const listings = data?.listings ?? []
  const total = data?.total ?? 0

  const handleFiltersChange = useCallback((newFilters: SearchFilters) => {
    setFilters(newFilters)
  }, [])

  return (
    <div className="flex flex-col h-[calc(100vh-80px)]">
      {/* Top search bar */}
      <div className="border-b border-gray-200 bg-white px-4 py-3 shrink-0">
        <div className="max-w-3xl">
          <SearchBar
            defaultQuery={filters.query}
            defaultType={(Array.isArray(filters.type) ? filters.type[0] : filters.type) ?? "ALL"}
          />
        </div>
      </div>

      {/* Results bar */}
      <div className="border-b border-gray-200 bg-white px-4 py-2.5 flex items-center justify-between gap-4 shrink-0">
        <p className="text-sm text-gray-600">
          {isLoading ? (
            <span className="inline-block w-24 h-4 bg-gray-200 rounded animate-pulse" />
          ) : (
            <><strong className="text-gray-900">{total.toLocaleString()}</strong> spaces found</>
          )}
        </p>

        <div className="flex items-center gap-2">
          {/* Mobile filters toggle */}
          <Button
            variant="outline"
            size="sm"
            className="lg:hidden flex items-center gap-1.5"
            onClick={() => setShowFilters((v) => !v)}
          >
            {showFilters ? <X className="w-4 h-4" /> : <SlidersHorizontal className="w-4 h-4" />}
            Filters
          </Button>

          {/* View mode toggle */}
          <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode("list")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 text-sm transition-colors",
                viewMode === "list" ? "bg-teal-600 text-white" : "text-gray-600 hover:bg-gray-50"
              )}
            >
              <LayoutList className="w-4 h-4" /> List
            </button>
            <button
              onClick={() => setViewMode("map")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 text-sm transition-colors border-l border-gray-200",
                viewMode === "map" ? "bg-teal-600 text-white" : "text-gray-600 hover:bg-gray-50"
              )}
            >
              <Map className="w-4 h-4" /> Map
            </button>
          </div>
        </div>
      </div>

      {/* Main content — split layout */}
      <div className="flex flex-1 overflow-hidden">

        {/* Mobile filters drawer backdrop */}
        {showFilters && (
          <div
            className="fixed inset-0 z-30 bg-black/40 lg:hidden"
            onClick={() => setShowFilters(false)}
          />
        )}

        {/* Left panel — filters + listings */}
        <div className="flex flex-1 overflow-hidden min-w-0">
          {/* Filters sidebar — desktop: inline, mobile: slide-in drawer */}
          <div className={cn(
            "shrink-0 border-r border-stone-200 bg-white overflow-y-auto transition-transform",
            "w-72",
            showFilters
              ? "fixed inset-y-0 left-0 z-40 shadow-xl lg:relative lg:shadow-none lg:translate-x-0"
              : "hidden lg:block"
          )}>
            <div className="p-4">
              <SearchFiltersPanel
                filters={filters}
                onChange={handleFiltersChange}
                resultCount={total}
              />
            </div>
          </div>

          {/* Listings grid */}
          <div className={cn(
            "flex-1 overflow-y-auto",
            viewMode === "map" ? "hidden xl:block xl:w-[420px] xl:flex-none" : ""
          )}>
            <div className="p-4">
              {isError && (
                <div className="text-center py-20 text-red-500">
                  Something went wrong. Please try again.
                </div>
              )}

              {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-pulse">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="rounded-2xl overflow-hidden border border-slate-100">
                      <div className="h-52 bg-slate-200" />
                      <div className="p-4 space-y-2">
                        <div className="h-5 bg-slate-200 rounded w-28" />
                        <div className="h-4 bg-slate-100 rounded w-3/4" />
                        <div className="h-3 bg-slate-100 rounded w-1/2" />
                        <div className="h-px bg-slate-100 my-2" />
                        <div className="flex gap-3">
                          <div className="h-3 bg-slate-100 rounded w-12" />
                          <div className="h-3 bg-slate-100 rounded w-12" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : listings.length === 0 ? (
                <div className="text-center py-24 text-gray-400">
                  <Map className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="text-xl font-medium mb-2 text-gray-500">No results found</p>
                  <p className="text-sm">Try adjusting your filters or search in a different area.</p>
                </div>
              ) : (
                <div className={cn(
                  "grid gap-4",
                  viewMode === "map"
                    ? "grid-cols-1"
                    : "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3"
                )}>
                  {listings.map((listing) => (
                    <ListingCard key={listing.id} listing={listing} />
                  ))}
                </div>
              )}

              {/* Pagination */}
              {data && data.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8 pb-4">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={filters.page === 1}
                    onClick={() => setFilters((f) => ({ ...f, page: (f.page ?? 1) - 1 }))}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-gray-600">
                    Page {filters.page ?? 1} of {data.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={filters.page === data.totalPages}
                    onClick={() => setFilters((f) => ({ ...f, page: (f.page ?? 1) + 1 }))}
                  >
                    Next
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right panel — map (sticky, full height) */}
        <div className={cn(
          "shrink-0 border-l border-gray-200",
          viewMode === "list" ? "hidden xl:block xl:w-[45%]" : "flex-1"
        )}>
          <MapView listings={listings} />
        </div>
      </div>
    </div>
  )
}
