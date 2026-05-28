"use client"

import Image from "next/image"
import Link from "next/link"
import { Heart, MapPin, Bed, Bath, Maximize, Video, Eye, Clock } from "lucide-react"
import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { formatPrice, bedroomLabel, sizeLabelSqft, timeAgo, cn } from "@/lib/utils"
import { LISTING_TYPE_LABELS } from "@/types"
import type { ListingCard as ListingCardType } from "@/types"

interface ListingCardProps {
  listing: ListingCardType
  isSaved?: boolean
  onSave?: (id: string) => void
  className?: string
  compact?: boolean
}

export function ListingCard({
  listing,
  isSaved: initialSaved = false,
  onSave,
  className,
  compact = false,
}: ListingCardProps) {
  const [saved, setSaved] = useState(initialSaved)
  const photo = listing.primaryPhoto ?? "/images/listing-placeholder.svg"

  function handleSave(e: React.MouseEvent) {
    e.preventDefault()
    setSaved((v) => !v)
    onSave?.(listing.id)
  }

  return (
    <div className={cn("group relative bg-white rounded-2xl overflow-hidden border border-gray-200 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300", className)}>
      {/* Photo */}
      <Link href={`/listings/${listing.id}`} className="block relative">
        <div className={cn("relative overflow-hidden bg-gray-100", compact ? "h-44" : "h-52")}>
          <Image
            src={photo}
            alt={listing.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-700"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            placeholder={listing.blurHash ? "blur" : "empty"}
            blurDataURL={listing.blurHash ?? undefined}
          />

          {/* Dark gradient at bottom for price readability */}
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/40 to-transparent" />

          {/* Badges top-left */}
          <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap">
            {listing.isFeatured && (
              <Badge variant="warning" className="text-xs font-semibold shadow-sm">Featured</Badge>
            )}
            <Badge variant="secondary" className="text-xs shadow-sm bg-white/90 text-gray-700 border-0">
              {LISTING_TYPE_LABELS[listing.type]}
            </Badge>
          </div>

          {/* Tour/Video badges top-right (leave space for save button) */}
          <div className="absolute top-3 right-12 flex gap-1">
            {listing.hasTour360 && (
              <span className="bg-black/70 text-white text-xs px-1.5 py-0.5 rounded font-medium backdrop-blur-sm">
                360°
              </span>
            )}
            {listing.hasVideo && (
              <span className="bg-black/70 text-white text-xs px-1.5 py-0.5 rounded font-medium flex items-center gap-0.5 backdrop-blur-sm">
                <Video className="w-3 h-3" /> Video
              </span>
            )}
          </div>

          {/* Time ago bottom-left */}
          <div className="absolute bottom-2 left-3 flex items-center gap-1 text-white/80 text-xs">
            <Clock className="w-3 h-3" />
            {timeAgo(listing.createdAt)}
          </div>
        </div>
      </Link>

      {/* Save button — always visible */}
      <button
        onClick={handleSave}
        className="absolute top-3 right-3 z-10 p-2 rounded-full bg-white/90 hover:bg-white shadow-md transition-all hover:scale-110"
        aria-label={saved ? "Remove from saved" : "Save listing"}
      >
        <Heart
          className={cn("w-4 h-4 transition-colors", saved ? "fill-red-500 text-red-500" : "text-gray-500")}
        />
      </button>

      {/* Content */}
      <Link href={`/listings/${listing.id}`} className="block p-4">
        {/* Price */}
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <span className="text-xl font-bold text-gray-900">
            {formatPrice(listing.price, listing.currency, listing.pricePeriod)}
          </span>
          <span className="flex items-center gap-0.5 text-gray-400 text-xs mt-1">
            <Eye className="w-3 h-3" />
            {listing.viewCount}
          </span>
        </div>

        {/* Title */}
        <h3 className="font-semibold text-gray-800 line-clamp-1 mb-1 text-sm">{listing.title}</h3>

        {/* Location */}
        <p className="flex items-center gap-1 text-xs text-gray-400 mb-3">
          <MapPin className="w-3 h-3 shrink-0" />
          <span className="truncate">
            {listing.neighbourhood ? `${listing.neighbourhood}, ` : ""}{listing.city}
          </span>
        </p>

        {/* Stats */}
        {!compact && (listing.bedrooms !== null || listing.bathrooms !== null || listing.sizeSqft) && (
          <div className="flex items-center gap-3 text-xs text-gray-500 border-t border-gray-100 pt-3">
            {listing.bedrooms !== null && (
              <span className="flex items-center gap-1">
                <Bed className="w-3.5 h-3.5 text-gray-400" />
                {bedroomLabel(listing.bedrooms)}
              </span>
            )}
            {listing.bathrooms !== null && (
              <span className="flex items-center gap-1">
                <Bath className="w-3.5 h-3.5 text-gray-400" />
                {listing.bathrooms} bath
              </span>
            )}
            {listing.sizeSqft && (
              <span className="flex items-center gap-1">
                <Maximize className="w-3.5 h-3.5 text-gray-400" />
                {sizeLabelSqft(listing.sizeSqft)}
              </span>
            )}
          </div>
        )}
      </Link>
    </div>
  )
}
