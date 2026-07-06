"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Search, MapPin, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { ListingType } from "@/types"

// Bias suggestions toward the Nairobi metro so small towns nearby
// (Kimbo, Kihunguro, Ruaka…) surface ahead of distant same-name places
const NAIROBI = { lat: -1.2921, lng: 36.8219 }

const TYPES: { value: ListingType | "ALL"; label: string }[] = [
  { value: "ALL", label: "All Spaces" },
  { value: "RESIDENTIAL", label: "Residential" },
  { value: "OFFICE", label: "Office" },
  { value: "COMMERCIAL", label: "Commercial" },
  { value: "SHORT_TERM", label: "Short-term" },
]

export interface PlaceSuggestion {
  id: string
  name: string       // short label, e.g. "Kimbo"
  placeName: string  // full context, e.g. "Ruiru, Kiambu, Kenya"
  bbox: [number, number, number, number] // [west, south, east, north]
}

// Small features (neighbourhoods, points) often have no extent — build a
// ~1.5km box around the point so we still have an area to outline
function synthBbox(lng: number, lat: number, km = 1.5): [number, number, number, number] {
  const dLat = km / 111
  const dLng = km / (111 * Math.cos((lat * Math.PI) / 180))
  return [lng - dLng, lat - dLat, lng + dLng, lat + dLat]
}

// Real place types rank above POIs (cafes, schools) so an area search
// returns towns/estates first
const PLACE_KEYS = new Set(["place", "boundary"])
function placeRank(key: string, value: string): number {
  if (key === "place" && ["city", "town", "suburb", "neighbourhood", "quarter", "village", "hamlet", "locality"].includes(value)) return 0
  if (PLACE_KEYS.has(key)) return 1
  return 2
}

interface PhotonFeature {
  geometry: { coordinates: [number, number] }
  properties: {
    osm_id: number
    osm_key: string
    osm_value: string
    name?: string
    countrycode?: string
    city?: string
    district?: string
    county?: string
    state?: string
    extent?: [number, number, number, number] // [west, north, east, south]
  }
}

// Photon (komoot) — OSM-based, keyless, autocomplete-tuned. Covers small
// Kenyan towns and estates that Mapbox's geocoder misses.
async function geocode(q: string, signal: AbortSignal): Promise<PlaceSuggestion[]> {
  if (q.trim().length < 2) return []
  const url =
    `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}` +
    `&limit=15&lang=en&lat=${NAIROBI.lat}&lon=${NAIROBI.lng}`
  const res = await fetch(url, { signal })
  if (!res.ok) return []
  const json = await res.json()
  const feats: PhotonFeature[] = (json.features ?? []).filter(
    (f: PhotonFeature) => f.properties.countrycode === "KE" && f.properties.name
  )

  const seen = new Set<string>()
  const out: (PlaceSuggestion & { rank: number })[] = []
  for (const f of feats) {
    const p = f.properties
    const name = p.name as string
    const context = Array.from(
      new Set([p.district, p.city, p.county, p.state].filter(Boolean) as string[])
    )
    const key = `${name.toLowerCase()}|${(p.city ?? p.district ?? "").toLowerCase()}`
    if (seen.has(key)) continue
    seen.add(key)

    const [lng, lat] = f.geometry.coordinates
    // Photon extent is [west, north, east, south]; convert to [w, s, e, n]
    const bbox: [number, number, number, number] = p.extent
      ? [p.extent[0], p.extent[3], p.extent[2], p.extent[1]]
      : synthBbox(lng, lat)

    out.push({
      id: `${p.osm_id}-${name}`,
      name,
      placeName: [...context, "Kenya"].join(", "),
      bbox,
      rank: placeRank(p.osm_key, p.osm_value),
    })
  }

  return out.sort((a, b) => a.rank - b.rank).slice(0, 6).map(({ rank: _rank, ...s }) => s)
}

interface SearchBarProps {
  className?: string
  defaultType?: ListingType | "ALL"
  defaultQuery?: string
}

export function SearchBar({ className, defaultType = "ALL", defaultQuery = "" }: SearchBarProps) {
  const router = useRouter()
  const [query, setQuery] = useState(defaultQuery)
  const [selectedType, setSelectedType] = useState<ListingType | "ALL">(defaultType)
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)

  const wrapRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  // Debounced autocomplete
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (query.trim().length < 2) {
      setSuggestions([])
      setLoading(false)
      return
    }
    setLoading(true)
    debounceRef.current = setTimeout(async () => {
      abortRef.current?.abort()
      const ctrl = new AbortController()
      abortRef.current = ctrl
      try {
        const results = await geocode(query, ctrl.signal)
        setSuggestions(results)
        setActiveIndex(-1)
        setOpen(true)
      } catch {
        /* aborted or network error — leave prior suggestions */
      } finally {
        setLoading(false)
      }
    }, 220)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query])

  // Close dropdown on outside click
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onDocClick)
    return () => document.removeEventListener("mousedown", onDocClick)
  }, [])

  const withType = useCallback(
    (params: URLSearchParams) => {
      if (selectedType !== "ALL") params.set("type", selectedType)
      return params
    },
    [selectedType]
  )

  function goToArea(s: PlaceSuggestion) {
    const params = new URLSearchParams()
    params.set("area", s.name)
    params.set("abbox", s.bbox.join(","))
    router.push(`/search?${withType(params)}`)
    setOpen(false)
  }

  function goToText(text: string) {
    const params = new URLSearchParams()
    if (text.trim()) params.set("q", text.trim())
    router.push(`/search?${withType(params)}`)
    setOpen(false)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (open && activeIndex >= 0 && suggestions[activeIndex]) {
      goToArea(suggestions[activeIndex])
    } else {
      goToText(query)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || suggestions.length === 0) return
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setActiveIndex((i) => (i + 1) % suggestions.length)
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setActiveIndex((i) => (i <= 0 ? suggestions.length - 1 : i - 1))
    } else if (e.key === "Escape") {
      setOpen(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className={cn("w-full", className)}>
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
                ? "bg-brand-600 text-white"
                : "bg-white/80 text-gray-700 hover:bg-white border border-gray-200"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Search input + autocomplete */}
      <div className="flex gap-2">
        <div ref={wrapRef} className="flex-1 relative">
          <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 z-10" />
          {loading && (
            <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 animate-spin z-10" />
          )}
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => suggestions.length > 0 && setOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder="Search a town, estate or city — e.g. Kimbo, Kilimani…"
            autoComplete="off"
            className="w-full h-12 pl-10 pr-9 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-sm"
          />

          {open && suggestions.length > 0 && (
            <ul className="absolute z-30 mt-1.5 w-full bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden text-left">
              {suggestions.map((s, i) => (
                <li key={s.id}>
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault()
                      goToArea(s)
                    }}
                    onMouseEnter={() => setActiveIndex(i)}
                    className={cn(
                      "w-full flex items-start gap-2.5 px-3.5 py-2.5 text-left transition-colors",
                      i === activeIndex ? "bg-brand-50" : "hover:bg-gray-50"
                    )}
                  >
                    <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-brand-500" />
                    <span className="min-w-0">
                      <span className="block text-sm font-medium text-gray-900 truncate">{s.name}</span>
                      <span className="block text-xs text-gray-400 truncate">{s.placeName}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <Button type="submit" size="lg" className="h-12 px-6 rounded-xl shadow-sm">
          <Search className="w-4 h-4 mr-2" />
          Search
        </Button>
      </div>
    </form>
  )
}
