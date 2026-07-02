"use client"

import { useState } from "react"
import Link from "next/link"
import { Heart, Search } from "lucide-react"
import { ListingCard } from "@/components/listings/ListingCard"
import { Button } from "@/components/ui/button"
import type { ListingCard as ListingCardType } from "@/types"

export function SavedGrid({ initialListings }: { initialListings: ListingCardType[] }) {
  const [listings, setListings] = useState(initialListings)

  function handleSave(id: string, saved: boolean) {
    if (!saved) setListings((prev) => prev.filter((l) => l.id !== id))
  }

  if (listings.length === 0) {
    return (
      <div className="text-center py-24">
        <div className="w-16 h-16 rounded-full bg-brand-50 flex items-center justify-center mx-auto mb-4">
          <Heart className="w-7 h-7 text-brand-400" />
        </div>
        <p className="text-lg font-medium text-gray-700 mb-1">No saved listings yet</p>
        <p className="text-sm text-gray-400 mb-6">
          Tap the heart on any listing to keep it here for later.
        </p>
        <Link href="/search">
          <Button className="gap-2">
            <Search className="w-4 h-4" /> Browse listings
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {listings.map((listing) => (
        <ListingCard key={listing.id} listing={listing} onSave={handleSave} />
      ))}
    </div>
  )
}
