"use client"

import { MapPin } from "lucide-react"
import type { ListingCard } from "@/types"

interface MapViewProps {
  listings: ListingCard[]
}

const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN

export function MapView({ listings }: MapViewProps) {
  const hasToken = TOKEN && !TOKEN.startsWith("pk.eyJ1Ijoi...")

  if (!hasToken) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-100 to-teal-50 relative overflow-hidden">
        {/* Fake map grid */}
        <svg className="absolute inset-0 w-full h-full opacity-20" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#0D9488" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>

        {/* Fake road lines */}
        <svg className="absolute inset-0 w-full h-full opacity-15" xmlns="http://www.w3.org/2000/svg">
          <line x1="0" y1="35%" x2="100%" y2="35%" stroke="#0F766E" strokeWidth="3"/>
          <line x1="0" y1="65%" x2="100%" y2="65%" stroke="#0F766E" strokeWidth="2"/>
          <line x1="30%" y1="0" x2="30%" y2="100%" stroke="#0F766E" strokeWidth="3"/>
          <line x1="70%" y1="0" x2="70%" y2="100%" stroke="#0F766E" strokeWidth="2"/>
          <line x1="55%" y1="0" x2="55%" y2="100%" stroke="#0F766E" strokeWidth="1"/>
          <line x1="0" y1="50%" x2="100%" y2="50%" stroke="#0F766E" strokeWidth="1"/>
        </svg>

        {/* Fake location pins */}
        {listings.slice(0, 6).map((_, i) => (
          <div
            key={i}
            className="absolute"
            style={{
              left: `${20 + (i % 3) * 25 + Math.sin(i) * 8}%`,
              top: `${25 + Math.floor(i / 3) * 30 + Math.cos(i) * 8}%`,
            }}
          >
            <div className="bg-teal-600 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-md">
              KES
            </div>
            <div className="w-2 h-2 bg-teal-600 rounded-full mx-auto mt-0.5" />
          </div>
        ))}

        {/* Center message */}
        <div className="relative z-10 text-center bg-white/90 backdrop-blur-sm rounded-2xl px-8 py-6 shadow-lg border border-white">
          <div className="w-12 h-12 rounded-xl bg-teal-100 flex items-center justify-center mx-auto mb-3">
            <MapPin className="w-6 h-6 text-teal-600" />
          </div>
          <p className="font-semibold text-gray-800 mb-1">Map view</p>
          <p className="text-sm text-gray-500 max-w-[200px]">
            Add your Mapbox token in <code className="text-xs bg-gray-100 px-1 rounded">.env.local</code> to enable the map
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-full flex items-center justify-center bg-gray-100">
      <p className="text-gray-500">Map loading…</p>
    </div>
  )
}
