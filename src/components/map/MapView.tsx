"use client"

import "mapbox-gl/dist/mapbox-gl.css"
import { useEffect, useRef, useState } from "react"
import { MapPin, X } from "lucide-react"
import type { Map as MapboxMap, Marker as MapboxMarker, GeoJSONSource } from "mapbox-gl"
import type { ListingCard } from "@/types"

export interface MapBounds {
  west: number
  south: number
  east: number
  north: number
}

export interface SearchArea {
  name: string
  bbox: [number, number, number, number] // [west, south, east, north]
}

interface MapViewProps {
  listings: ListingCard[]
  /** Called with the visible area when the user pans/zooms, or null to clear */
  onBoundsChange?: (bounds: MapBounds | null) => void
  /** True while results are being filtered to the map viewport */
  boundsActive?: boolean
  /** A searched place to outline on the map; null to clear the outline */
  area?: SearchArea | null
  /** Invoked by the on-map "Remove boundary" control */
  onClearArea?: () => void
}

const AREA_SRC = "search-area"
const AREA_FILL = "search-area-fill"
const AREA_LINE = "search-area-line"

const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
// Kenya-wide default view
const KENYA_CENTER: [number, number] = [37.9, 0.2]
const KENYA_ZOOM = 5.6

function compactPrice(price: number): string {
  if (price >= 1_000_000) return `${(price / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`
  if (price >= 1_000) return `${Math.round(price / 1_000)}K`
  return String(price)
}

// Popup content built with DOM APIs so listing text can't inject HTML
function buildPopupContent(listing: ListingCard): HTMLElement {
  const root = document.createElement("a")
  root.href = `/listings/${listing.id}`
  root.className = "block w-52 no-underline"

  if (listing.primaryPhoto) {
    const img = document.createElement("img")
    img.src = listing.primaryPhoto
    img.alt = listing.title
    img.className = "w-full h-24 object-cover rounded-lg mb-2"
    root.appendChild(img)
  }

  const price = document.createElement("div")
  price.textContent = `KES ${listing.price.toLocaleString()}`
  price.className = "font-bold text-gray-900 text-sm"
  root.appendChild(price)

  const title = document.createElement("div")
  title.textContent = listing.title
  title.className = "text-xs text-gray-600 truncate mt-0.5"
  root.appendChild(title)

  const loc = document.createElement("div")
  loc.textContent = [listing.neighbourhood, listing.city].filter(Boolean).join(", ")
  loc.className = "text-xs text-gray-400 mt-0.5"
  root.appendChild(loc)

  return root
}

export function MapView({ listings, onBoundsChange, boundsActive = false, area = null, onClearArea }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MapboxMap | null>(null)
  const markersRef = useRef<MapboxMarker[]>([])
  const [mapReady, setMapReady] = useState(false)

  // Refs so the map's event handlers always see current values
  const onBoundsChangeRef = useRef(onBoundsChange)
  onBoundsChangeRef.current = onBoundsChange
  const boundsActiveRef = useRef(boundsActive)
  boundsActiveRef.current = boundsActive
  // While a searched-place boundary is shown it is the active constraint,
  // so map panning should not also trigger viewport search or re-fit
  const areaActiveRef = useRef(!!area)
  areaActiveRef.current = !!area
  // Only moves that started from real user input (pan/zoom/tap) should
  // trigger the area filter — moveend also fires for container resizes
  // and our own fitBounds, which would otherwise feed back into a
  // refetch → layout shift → resize → moveend loop
  const userMoveRef = useRef(false)

  // Create the map once
  useEffect(() => {
    if (!TOKEN || !containerRef.current || mapRef.current) return
    let cancelled = false

    import("mapbox-gl").then(({ default: mapboxgl }) => {
      if (cancelled || !containerRef.current || mapRef.current) return
      mapboxgl.accessToken = TOKEN
      const map = new mapboxgl.Map({
        container: containerRef.current,
        style: "mapbox://styles/mapbox/streets-v12",
        center: KENYA_CENTER,
        zoom: KENYA_ZOOM,
      })
      map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right")
      mapRef.current = map
      map.on("load", () => setMapReady(true))

      // Any pointer/wheel interaction inside the map (including the zoom
      // buttons) marks the next move as user-driven
      const markUserMove = () => { userMoveRef.current = true }
      const container = containerRef.current
      container.addEventListener("pointerdown", markUserMove)
      container.addEventListener("wheel", markUserMove, { passive: true })

      // Zillow-style: panning/zooming filters results to the visible area
      map.on("moveend", () => {
        if (!userMoveRef.current) return
        userMoveRef.current = false
        // A searched-place boundary takes precedence over viewport search
        if (areaActiveRef.current) return
        const b = map.getBounds()
        if (b) {
          onBoundsChangeRef.current?.({
            west: b.getWest(),
            south: b.getSouth(),
            east: b.getEast(),
            north: b.getNorth(),
          })
        }
      })
    })

    return () => {
      cancelled = true
      mapRef.current?.remove()
      mapRef.current = null
    }
  }, [])

  // Sync markers whenever results change
  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapReady) return
    let cancelled = false

    import("mapbox-gl").then(({ default: mapboxgl }) => {
      if (cancelled) return

      markersRef.current.forEach((m) => m.remove())
      markersRef.current = []

      const located = listings.filter((l) => l.lat !== null && l.lng !== null)
      if (located.length === 0) return

      // The area boundary effect owns the camera when a place is searched
      const shouldFit = !boundsActiveRef.current && !areaActiveRef.current
      const bounds = new mapboxgl.LngLatBounds()

      for (const listing of located) {
        const el = document.createElement("div")
        el.className =
          "bg-white text-gray-900 text-xs font-bold px-2.5 py-1 rounded-full shadow-md border border-gray-200 cursor-pointer hover:bg-brand-600 hover:text-white hover:border-brand-600 transition-colors"
        el.textContent = compactPrice(listing.price)

        const popup = new mapboxgl.Popup({ offset: 18, closeButton: false, maxWidth: "240px" })
          .setDOMContent(buildPopupContent(listing))

        const marker = new mapboxgl.Marker({ element: el })
          .setLngLat([listing.lng!, listing.lat!])
          .setPopup(popup)
          .addTo(map)

        markersRef.current.push(marker)
        bounds.extend([listing.lng!, listing.lat!])
      }

      // Don't move the camera while the user is driving the viewport filter
      if (shouldFit) {
        // Clear any stray user-intent flag (e.g. from a marker click) so
        // this programmatic move can't be mistaken for a user pan
        userMoveRef.current = false
        map.fitBounds(bounds, { padding: 60, maxZoom: 15, duration: 600 })
      }
    })

    return () => { cancelled = true }
  }, [listings, mapReady])

  // Draw / clear the searched-place boundary
  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapReady) return
    let cancelled = false

    function removeBoundary() {
      if (!map) return
      if (map.getLayer(AREA_LINE)) map.removeLayer(AREA_LINE)
      if (map.getLayer(AREA_FILL)) map.removeLayer(AREA_FILL)
      if (map.getSource(AREA_SRC)) map.removeSource(AREA_SRC)
    }

    if (!area) {
      removeBoundary()
      return
    }

    function drawFeature(feature: GeoJSON.Feature) {
      if (!map) return
      const existing = map.getSource(AREA_SRC) as GeoJSONSource | undefined
      if (existing) {
        existing.setData(feature)
      } else {
        map.addSource(AREA_SRC, { type: "geojson", data: feature })
        map.addLayer({
          id: AREA_FILL,
          type: "fill",
          source: AREA_SRC,
          paint: { "fill-color": "#006aff", "fill-opacity": 0.07 },
        })
        map.addLayer({
          id: AREA_LINE,
          type: "line",
          source: AREA_SRC,
          paint: { "line-color": "#006aff", "line-width": 2.5, "line-dasharray": [2, 1] },
        })
      }
    }

    // Draw an immediate rectangle from the bbox, then upgrade to a real
    // OSM polygon if one is available (many Kenyan towns/wards have them)
    const [w, s, e, n] = area.bbox
    drawFeature({
      type: "Feature",
      properties: {},
      geometry: { type: "Polygon", coordinates: [[[w, s], [e, s], [e, n], [w, n], [w, s]]] },
    })

    import("mapbox-gl").then(({ default: mapboxgl }) => {
      if (cancelled || !map) return
      map.fitBounds(
        new mapboxgl.LngLatBounds([w, s], [e, n]),
        { padding: 48, duration: 700, maxZoom: 15 }
      )
    })

    fetch(
      `https://nominatim.openstreetmap.org/search?format=json&polygon_geojson=1&limit=1&countrycodes=ke&q=${encodeURIComponent(area.name)}`,
      { headers: { Accept: "application/json" } }
    )
      .then((r) => (r.ok ? r.json() : []))
      .then((arr) => {
        if (cancelled) return
        const geom = arr?.[0]?.geojson
        if (geom && (geom.type === "Polygon" || geom.type === "MultiPolygon")) {
          drawFeature({ type: "Feature", properties: {}, geometry: geom })
        }
      })
      .catch(() => {})

    return () => { cancelled = true }
  }, [area, mapReady])

  if (!TOKEN) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-100 to-brand-50">
        <div className="text-center bg-white/90 backdrop-blur-sm rounded-2xl px-8 py-6 shadow-lg border border-white">
          <div className="w-12 h-12 rounded-xl bg-brand-100 flex items-center justify-center mx-auto mb-3">
            <MapPin className="w-6 h-6 text-brand-600" />
          </div>
          <p className="font-semibold text-gray-800 mb-1">Map unavailable</p>
          <p className="text-sm text-gray-500 max-w-[220px]">
            Set <code className="text-xs bg-gray-100 px-1 rounded">NEXT_PUBLIC_MAPBOX_TOKEN</code> to enable the map.
          </p>
        </div>
      </div>
    )
  }

  const unlocatedCount = listings.filter((l) => l.lat === null || l.lng === null).length

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full" />

      {area && (
        <button
          onClick={onClearArea}
          className="absolute top-3 left-3 z-10 flex items-center gap-1.5 bg-white shadow-md rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 border border-gray-200"
        >
          <X className="w-4 h-4" /> Remove boundary
        </button>
      )}

      {unlocatedCount > 0 && (
        <div className="absolute bottom-3 left-3 bg-white/95 text-xs text-gray-600 rounded-lg shadow px-3 py-1.5">
          {unlocatedCount} listing{unlocatedCount > 1 ? "s" : ""} without a map location
        </div>
      )}
    </div>
  )
}
