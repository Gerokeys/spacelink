import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { SavedGrid } from "./SavedGrid"
import type { ListingCard, ListingType, PricePeriod, ListingStatus } from "@/types"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Saved Listings" }

export default async function SavedPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect("/login?callbackUrl=/saved")

  const saved = await db.savedListing.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      listing: {
        include: {
          media: {
            where: { isPrimary: true },
            take: 1,
            select: { url: true, cdnUrl: true, blurHash: true },
          },
          owner: {
            select: {
              id: true,
              name: true,
              image: true,
              profile: {
                select: {
                  idVerificationStatus: true,
                  responseRate: true,
                  responseTimeHours: true,
                  company: true,
                },
              },
            },
          },
          tourConfig: { select: { id: true } },
          _count: { select: { media: { where: { type: "VIDEO" } } } },
        },
      },
    },
  })

  const listings: ListingCard[] = saved
    .filter((s) => s.listing.status === "ACTIVE" || s.listing.status === "PAUSED")
    .map(({ listing: l }) => ({
      id: l.id,
      type: l.type as ListingType,
      status: l.status as ListingStatus,
      title: l.title,
      price: l.price,
      pricePeriod: l.pricePeriod as PricePeriod,
      currency: l.currency,
      address: l.address,
      neighbourhood: l.neighbourhood,
      city: l.city,
      lat: l.lat,
      lng: l.lng,
      bedrooms: l.bedrooms,
      bathrooms: l.bathrooms,
      sizeSqft: l.sizeSqft,
      furnished: l.furnished,
      petsAllowed: l.petsAllowed,
      primaryPhoto: l.media[0]?.cdnUrl ?? l.media[0]?.url ?? null,
      blurHash: l.media[0]?.blurHash ?? null,
      hasTour360: !!l.tourConfig,
      hasVideo: l._count.media > 0,
      isFeatured: l.isFeatured,
      viewCount: l.viewCount,
      createdAt: l.createdAt.toISOString(),
      owner: {
        id: l.owner.id,
        name: l.owner.name,
        image: l.owner.image,
        profile: l.owner.profile ?? null,
      },
    }))

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl min-h-[60vh]">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Saved listings</h1>
        <p className="text-gray-500 text-sm mt-1">
          {listings.length === 0
            ? "Spaces you save will show up here."
            : `${listings.length} space${listings.length === 1 ? "" : "s"} you've saved`}
        </p>
      </div>

      <SavedGrid initialListings={listings} />
    </div>
  )
}
