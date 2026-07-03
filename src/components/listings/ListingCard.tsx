"use client"

import Image from "next/image"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { Heart, MapPin, Video, Eye, Clock } from "lucide-react"
import { useSession } from "next-auth/react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { formatPrice, sizeLabelSqft, timeAgo, cn } from "@/lib/utils"
import { LISTING_TYPE_LABELS } from "@/types"
import type { ListingCard as ListingCardType } from "@/types"

interface ListingCardProps {
  listing: ListingCardType
  onSave?: (id: string, saved: boolean) => void
  className?: string
  compact?: boolean
}

async function fetchSavedIds(): Promise<string[]> {
  const res = await fetch("/api/saved?ids=true")
  if (!res.ok) return []
  const json = await res.json()
  return json.success ? json.data : []
}

export function ListingCard({ listing, onSave, className, compact = false }: ListingCardProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const queryClient = useQueryClient()

  const { data: savedIds } = useQuery({
    queryKey: ["saved-ids"],
    queryFn: fetchSavedIds,
    enabled: !!session,
  })
  const saved = savedIds?.includes(listing.id) ?? false

  const photo = listing.primaryPhoto ?? "/images/listing-placeholder.svg"

  async function handleSave(e: React.MouseEvent) {
    e.preventDefault()
    if (!session) {
      toast.info("Sign in to save listings")
      router.push(`/login?callbackUrl=${encodeURIComponent(pathname)}`)
      return
    }

    const next = !saved
    // Optimistic update of the shared saved-ids cache
    queryClient.setQueryData<string[]>(["saved-ids"], (prev = []) =>
      next ? [...prev, listing.id] : prev.filter((id) => id !== listing.id)
    )
    onSave?.(listing.id, next)

    try {
      const res = await fetch("/api/saved", {
        method: next ? "POST" : "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId: listing.id }),
      })
      if (!res.ok) throw new Error()
      if (next) toast.success("Saved to your list")
    } catch {
      // Revert on failure
      queryClient.setQueryData<string[]>(["saved-ids"], (prev = []) =>
        next ? prev.filter((id) => id !== listing.id) : [...prev, listing.id]
      )
      onSave?.(listing.id, !next)
      toast.error("Something went wrong. Please try again.")
    }
  }

  // Zillow-style compact facts line: "3 bd · 2 ba · 1,200 sqft"
  const facts = [
    listing.bedrooms !== null ? `${listing.bedrooms === 0 ? "Studio" : `${listing.bedrooms} bd`}` : null,
    listing.bathrooms !== null ? `${listing.bathrooms} ba` : null,
    listing.sizeSqft ? sizeLabelSqft(listing.sizeSqft) : null,
  ].filter(Boolean)

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

          {/* Dark gradient at bottom for readability */}
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

          {/* Video badge top-right (leave space for save button) */}
          <div className="absolute top-3 right-12 flex gap-1">
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

      {/* Content — Zillow-style: price leads, compact facts line under it */}
      <Link href={`/listings/${listing.id}`} className="block p-4">
        <div className="flex items-start justify-between gap-2">
          <span className="text-2xl font-bold text-gray-900 tracking-tight">
            {formatPrice(listing.price, listing.currency, listing.pricePeriod)}
          </span>
          <span className="flex items-center gap-0.5 text-gray-400 text-xs mt-1.5 shrink-0">
            <Eye className="w-3 h-3" />
            {listing.viewCount}
          </span>
        </div>

        {facts.length > 0 && (
          <p className="text-sm text-gray-700 mt-1">
            {facts.map((f, i) => (
              <span key={i}>
                {i > 0 && <span className="text-gray-300 mx-1.5">|</span>}
                {f}
              </span>
            ))}
          </p>
        )}

        <p className="text-sm text-gray-500 line-clamp-1 mt-1.5">{listing.title}</p>

        <p className="flex items-center gap-1 text-xs text-gray-400 mt-1">
          <MapPin className="w-3 h-3 shrink-0" />
          <span className="truncate">
            {listing.neighbourhood ? `${listing.neighbourhood}, ` : ""}{listing.city}
          </span>
        </p>
      </Link>
    </div>
  )
}
