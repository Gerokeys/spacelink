"use client"

import "mapbox-gl/dist/mapbox-gl.css"
import { useEffect, useRef } from "react"
import type { Map as MapboxMap } from "mapbox-gl"

const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN

interface ListingMapProps {
  lat: number
  lng: number
}

export function ListingMap({ lat, lng }: ListingMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MapboxMap | null>(null)

  useEffect(() => {
    if (!TOKEN || !containerRef.current || mapRef.current) return
    let cancelled = false

    import("mapbox-gl").then(({ default: mapboxgl }) => {
      if (cancelled || !containerRef.current || mapRef.current) return
      mapboxgl.accessToken = TOKEN

      const map = new mapboxgl.Map({
        container: containerRef.current,
        style: "mapbox://styles/mapbox/streets-v12",
        center: [lng, lat],
        zoom: 14,
        scrollZoom: false,
      })
      map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right")
      new mapboxgl.Marker({ color: "#006aff" }).setLngLat([lng, lat]).addTo(map)
      mapRef.current = map
    })

    return () => {
      cancelled = true
      mapRef.current?.remove()
      mapRef.current = null
    }
  }, [lat, lng])

  if (!TOKEN) return null

  return <div ref={containerRef} className="h-72 rounded-xl overflow-hidden border border-gray-200" />
}
