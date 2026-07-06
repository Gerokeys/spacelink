"use client"

import { useState, useCallback, useMemo, useRef } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { LayoutList, Map, SlidersHorizontal, X, MapPin } from "lucide-react"
import { ListingCard } from "@/components/listings/ListingCard"
import { SearchBar } from "@/components/search/SearchBar"
import { SearchFiltersPanel } from "@/components/search/SearchFiltersPanel"
import { MapView, type MapBounds, type SearchArea } from "@/components/map/MapView"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { SearchFilters, SearchResult, ListingType } from "@/types"

// A searched place, carried in the URL as area=<name> & abbox=w,s,e,n
function parseAreaFromUrl(searchParams: URLSearchParams): SearchArea | null {
  const name = searchParams.get("area")
  const abbox = searchParams.get("abbox")
  if (!name || !abbox) return null
  const parts = abbox.split(",").map(Number)
  if (parts.length !== 4 || !parts.every(Number.isFinite)) return null
  return { name, bbox: parts as [number, number, number, number] }
}

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
    sortBy: (searchParams.get("sortBy") as SearchFilters["sortBy"]) ?? "newest",
    page: searchParams.get("page") ? Number(searchParams.get("page")) : 1,
  }
}

// Canonical serialization. The API reads the text query as `q`, so the
// `query` field must be mapped — this mismatch is what broke location search.
function filtersToParams(filters: SearchFilters): URLSearchParams {
  const params = new URLSearchParams()
  if (filters.query) params.set("q", filters.query)
  if (filters.type && !Array.isArray(filters.type)) params.set("type", filters.type)
  if (filters.city) params.set("city", filters.city)
  if (filters.neighbourhood) params.set("neighbourhood", filters.neighbourhood)
  if (filters.minPrice !== undefined) params.set("minPrice", String(filters.minPrice))
  if (filters.maxPrice !== undefined) params.set("maxPrice", String(filters.maxPrice))
  if (filters.minBedrooms !== undefined) params.set("minBedrooms", String(filters.minBedrooms))
  if (filters.furnished) params.set("furnished", "true")
  if (filters.petsAllowed) params.set("petsAllowed", "true")
  if (filters.sortBy && filters.sortBy !== "newest") params.set("sortBy", filters.sortBy)
  if (filters.page && filters.page > 1) params.set("page", String(filters.page))
  return params
}

async function fetchListings(
  filters: SearchFilters,
  bounds: MapBounds | null,
  area: SearchArea | null
): Promise<SearchResult> {
  const params = filtersToParams(filters)
  if (area) {
    // Filter results to the searched place by name (works with listings
    // that aren't geocoded yet); the bbox is only used to draw + zoom
    params.set("q", area.name)
  } else if (bounds) {
    params.set("bounds", `${bounds.west},${bounds.south},${bounds.east},${bounds.north}`)
  }
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
  const [bounds, setBounds] = useState<MapBounds | null>(null)

  // The URL is the single source of truth for filters. Filter changes are
  // router.replace calls; there is no state to sync (a two-way sync here
  // previously raced against itself and flipped filters on and off).
  const filters = useMemo(() => parseFiltersFromUrl(searchParams), [searchParams])
  const area = useMemo(() => parseAreaFromUrl(searchParams), [searchParams])

  // Ref so filter changes can preserve the active area in the URL
  const areaRef = useRef(area)
  areaRef.current = area

  const applyFilters = useCallback(
    (newFilters: SearchFilters) => {
      const params = filtersToParams(newFilters)
      // Keep the searched-place boundary when other filters change
      if (areaRef.current) {
        params.set("area", areaRef.current.name)
        params.set("abbox", areaRef.current.bbox.join(","))
      }
      const qs = params.toString()
      router.replace(`/search${qs ? `?${qs}` : ""}`, { scroll: false })
    },
    [router]
  )

  const clearArea = useCallback(() => {
    // Drop area/abbox but keep every other filter
    const qs = filtersToParams(filters).toString()
    router.replace(`/search${qs ? `?${qs}` : ""}`, { scroll: false })
  }, [router, filters])

  // A searched place is the active constraint; ignore any stale viewport filter
  const effectiveBounds = area ? null : bounds

  const { data, isLoading, isError } = useQuery({
    queryKey: ["search", filtersToParams(filters).toString(), area?.name ?? null, effectiveBounds],
    queryFn: () => fetchListings(filters, effectiveBounds, area),
    placeholderData: (prev) => prev,
  })

  const listings = data?.listings ?? []
  const total = data?.total ?? 0

  const handleFiltersChange = useCallback((newFilters: SearchFilters) => {
    applyFilters(newFilters)
  }, [applyFilters])

  // User panned/zoomed the map → filter results to the visible area
  const handleBoundsChange = useCallback((newBounds: MapBounds | null) => {
    setBounds(newBounds)
  }, [])

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      {/* Top search bar */}
      <div className="border-b border-gray-200 bg-white px-4 py-3 shrink-0">
        <div className="max-w-3xl">
          <SearchBar
            key={area?.name ?? filters.query ?? "all"}
            defaultQuery={area?.name ?? filters.query}
            defaultType={(Array.isArray(filters.type) ? filters.type[0] : filters.type) ?? "ALL"}
          />
        </div>
      </div>

      {/* Results bar */}
      <div className="border-b border-gray-200 bg-white px-4 py-2.5 flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <p className="text-sm text-gray-600 truncate">
            {isLoading ? (
              <span className="inline-block w-24 h-4 bg-gray-200 rounded animate-pulse" />
            ) : (
              <><strong className="text-gray-900">{total.toLocaleString()}</strong> spaces found</>
            )}
          </p>
          {area ? (
            <button
              onClick={clearArea}
              className="flex items-center gap-1 text-xs bg-brand-50 text-brand-700 border border-brand-200 rounded-full px-2.5 py-1 hover:bg-brand-100 transition-colors shrink-0"
            >
              <MapPin className="w-3 h-3" /> {area.name} <X className="w-3 h-3" />
            </button>
          ) : bounds ? (
            <button
              onClick={() => handleBoundsChange(null)}
              className="flex items-center gap-1 text-xs bg-brand-50 text-brand-700 border border-brand-200 rounded-full px-2.5 py-1 hover:bg-brand-100 transition-colors shrink-0"
            >
              Map area <X className="w-3 h-3" />
            </button>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          {/* Mobile filters toggle */}
          <Button
            variant="outline"
            size="sm"
            className="lg:hidden flex items-center gap-1.5"
            onClick={() => setShowFilters(true)}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters
          </Button>

          {/* View mode toggle */}
          <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode("list")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 text-sm transition-colors",
                viewMode === "list" ? "bg-brand-600 text-white" : "text-gray-600 hover:bg-gray-50"
              )}
            >
              <LayoutList className="w-4 h-4" /> List
            </button>
            <button
              onClick={() => setViewMode("map")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 text-sm transition-colors border-l border-gray-200",
                viewMode === "map" ? "bg-brand-600 text-white" : "text-gray-600 hover:bg-gray-50"
              )}
            >
              <Map className="w-4 h-4" /> Map
            </button>
          </div>
        </div>
      </div>

      {/* Mobile filters drawer */}
      {showFilters && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowFilters(false)} />
          <div className="relative ml-auto w-80 max-w-[85vw] h-full bg-white flex flex-col">
            <div className="border-b border-gray-200 px-5 py-4 flex items-center justify-between shrink-0">
              <h2 className="font-semibold text-gray-900">Filters</h2>
              <button onClick={() => setShowFilters(false)} aria-label="Close filters">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              <SearchFiltersPanel
                filters={filters}
                onChange={handleFiltersChange}
                resultCount={total}
                hideHeader
              />
            </div>
            <div className="border-t border-gray-200 p-4 shrink-0">
              <Button className="w-full" onClick={() => setShowFilters(false)}>
                Show {total.toLocaleString()} results
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Main content — split layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left panel — filters + listings */}
        <div className="flex flex-1 overflow-hidden min-w-0">
          {/* Filters sidebar — desktop only; mobile uses the drawer above */}
          <div className="hidden lg:block w-72 shrink-0 border-r border-gray-200 bg-white overflow-y-auto">
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
                  <p className="text-sm">
                    {area
                      ? `No listings in ${area.name} yet. Remove the boundary to search more widely.`
                      : bounds
                        ? "No listings in this map area. Zoom out or clear the map filter."
                        : "Try adjusting your filters or search in a different area."}
                  </p>
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
                    onClick={() => applyFilters({ ...filters, page: (filters.page ?? 1) - 1 })}
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
                    onClick={() => applyFilters({ ...filters, page: (filters.page ?? 1) + 1 })}
                  >
                    Next
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right panel — map */}
        <div className={cn(
          "shrink-0 border-l border-gray-200",
          viewMode === "list" ? "hidden xl:block xl:w-[45%]" : "flex-1"
        )}>
          <MapView
            listings={listings}
            onBoundsChange={handleBoundsChange}
            boundsActive={!!bounds}
            area={area}
            onClearArea={clearArea}
          />
        </div>
      </div>
    </div>
  )
}
