"use client"

import "mapbox-gl/dist/mapbox-gl.css"
import { useEffect, useRef, useState } from "react"
import { Search, Loader2, MapPin, X } from "lucide-react"
import type { Map as MapboxMap, Marker as MapboxMarker } from "mapbox-gl"

const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
const NAIROBI: [number, number] = [36.8172, -1.2864]

interface GeocodeResult {
  id: string
  place_name: string
  center: [number, number] // [lng, lat]
}

interface LocationPickerProps {
  lat: number | null
  lng: number | null
  onChange: (lat: number | null, lng: number | null) => void
  /** Used to seed the geocoder search box, e.g. the address the user typed */
  searchHint?: string
}

export function LocationPicker({ lat, lng, onChange, searchHint }: LocationPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MapboxMap | null>(null)
  const markerRef = useRef<MapboxMarker | null>(null)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  const [query, setQuery] = useState(searchHint ?? "")
  const [results, setResults] = useState<GeocodeResult[]>([])
  const [searching, setSearching] = useState(false)
  const hasPin = lat !== null && lng !== null

  // Create map + marker plumbing once
  useEffect(() => {
    if (!TOKEN || !containerRef.current || mapRef.current) return
    let cancelled = false

    import("mapbox-gl").then(({ default: mapboxgl }) => {
      if (cancelled || !containerRef.current || mapRef.current) return
      mapboxgl.accessToken = TOKEN

      const start: [number, number] = lng !== null && lat !== null ? [lng, lat] : NAIROBI
      const map = new mapboxgl.Map({
        container: containerRef.current,
        style: "mapbox://styles/mapbox/streets-v12",
        center: start,
        zoom: lng !== null && lat !== null ? 15 : 11,
      })
      map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right")
      mapRef.current = map

      const marker = new mapboxgl.Marker({ draggable: true, color: "#006aff" })
      markerRef.current = marker
      if (lng !== null && lat !== null) marker.setLngLat([lng, lat]).addTo(map)

      marker.on("dragend", () => {
        const pos = marker.getLngLat()
        onChangeRef.current(pos.lat, pos.lng)
      })

      map.on("click", (e) => {
        marker.setLngLat(e.lngLat).addTo(map)
        onChangeRef.current(e.lngLat.lat, e.lngLat.lng)
      })
    })

    return () => {
      cancelled = true
      mapRef.current?.remove()
      mapRef.current = null
      markerRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function search() {
    if (!query.trim() || !TOKEN) return
    setSearching(true)
    try {
      const res = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${TOKEN}&country=ke&limit=5`
      )
      const json = await res.json()
      setResults(json.features ?? [])
    } catch {
      setResults([])
    } finally {
      setSearching(false)
    }
  }

  function pickResult(r: GeocodeResult) {
    const [lngVal, latVal] = r.center
    setResults([])
    setQuery(r.place_name)
    onChangeRef.current(latVal, lngVal)
    const map = mapRef.current
    const marker = markerRef.current
    if (map && marker) {
      marker.setLngLat(r.center).addTo(map)
      map.flyTo({ center: r.center, zoom: 15, duration: 800 })
    }
  }

  function clearPin() {
    markerRef.current?.remove()
    onChangeRef.current(null, null)
  }

  if (!TOKEN) {
    return (
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-500">
        Map unavailable — set <code className="text-xs bg-gray-100 px-1 rounded">NEXT_PUBLIC_MAPBOX_TOKEN</code> to pick a location.
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {/* Geocoder */}
      <div className="relative">
        <div className="flex gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                search()
              }
            }}
            placeholder="Search address or place, e.g. Westlands, Nairobi"
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <button
            type="button"
            onClick={search}
            disabled={searching}
            className="px-3 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50"
            aria-label="Search location"
          >
            {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          </button>
        </div>

        {results.length > 0 && (
          <ul className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
            {results.map((r) => (
              <li key={r.id}>
                <button
                  type="button"
                  onClick={() => pickResult(r)}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-brand-50 flex items-start gap-2"
                >
                  <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0 text-brand-500" />
                  {r.place_name}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Map */}
      <div ref={containerRef} className="h-64 rounded-xl overflow-hidden border border-gray-200" />

      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>
          {hasPin
            ? "Drag the pin to fine-tune the exact location."
            : "Search above or click the map to drop a pin."}
        </span>
        {hasPin && (
          <button
            type="button"
            onClick={clearPin}
            className="flex items-center gap-1 text-gray-400 hover:text-red-500 transition-colors"
          >
            <X className="w-3 h-3" /> Remove pin
          </button>
        )}
      </div>
    </div>
  )
}
