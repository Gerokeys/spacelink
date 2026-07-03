"use client"

import "mapbox-gl/dist/mapbox-gl.css"
import { useEffect, useRef, useState } from "react"
import { MapPin } from "lucide-react"
import type { Map as MapboxMap, Marker as MapboxMarker } from "mapbox-gl"
import type { ListingCard } from "@/types"

interface MapViewProps {
  listings: ListingCard[]
}

const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
const NAIROBI: [number, number] = [36.8172, -1.2864]

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

export function MapView({ listings }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MapboxMap | null>(null)
  const markersRef = useRef<MapboxMarker[]>([])
  const [mapReady, setMapReady] = useState(false)

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
        center: NAIROBI,
        zoom: 11,
      })
      map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right")
      mapRef.current = map
      map.on("load", () => setMapReady(true))
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

      map.fitBounds(bounds, { padding: 60, maxZoom: 15, duration: 600 })
    })

    return () => { cancelled = true }
  }, [listings, mapReady])

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
      {unlocatedCount > 0 && (
        <div className="absolute bottom-3 left-3 bg-white/95 text-xs text-gray-600 rounded-lg shadow px-3 py-1.5">
          {unlocatedCount} listing{unlocatedCount > 1 ? "s" : ""} without a map location
        </div>
      )}
    </div>
  )
}
