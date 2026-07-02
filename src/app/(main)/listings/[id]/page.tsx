import { notFound } from "next/navigation"
import Link from "next/link"
import {
  MapPin, Bed, Bath, Maximize, Car, CheckCircle2,
  Calendar, Star, Shield, Clock, ChevronLeft,
} from "lucide-react"
import { db } from "@/lib/db"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { InquiryForm } from "@/components/forms/InquiryForm"
import { PhotoGallery } from "@/components/listings/PhotoGallery"
import { formatPrice, bedroomLabel, sizeLabelSqft, timeAgo } from "@/lib/utils"
import { LISTING_TYPE_LABELS, PRICE_PERIOD_LABELS } from "@/types"
import type { Metadata } from "next"

interface Props {
  params: Promise<{ id: string }>
}

async function getListing(id: string) {
  const listing = await db.listing.findUnique({
    where: { id, status: "ACTIVE" },
    include: {
      media: { orderBy: [{ isPrimary: "desc" }, { order: "asc" }] },
      amenities: { include: { amenity: true } },
      tourConfig: { include: { scenes: { orderBy: { order: "asc" } } } },
      owner: {
        select: {
          id: true,
          name: true,
          image: true,
          createdAt: true,
          profile: {
            select: {
              bio: true,
              company: true,
              idVerificationStatus: true,
              responseRate: true,
              responseTimeHours: true,
            },
          },
        },
      },
      _count: { select: { reviews: true } },
    },
  })
  return listing
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const listing = await getListing(id)
  if (!listing) return { title: "Listing not found" }
  return {
    title: listing.title,
    description: listing.description.slice(0, 160),
    openGraph: {
      images: listing.media[0]?.cdnUrl ?? listing.media[0]?.url ? [
        { url: listing.media[0].cdnUrl ?? listing.media[0].url }
      ] : [],
    },
  }
}

export default async function ListingDetailPage({ params }: Props) {
  const { id } = await params
  const listing = await getListing(id)
  if (!listing) notFound()

  // Fire view count increment non-blocking
  db.listing.update({ where: { id }, data: { viewCount: { increment: 1 } } }).catch(() => {})

  const photos = listing.media.filter((m) => m.type === "PHOTO")
  const hasVirtualTour = !!listing.tourConfig?.scenes.length
  const isVerified = listing.owner.profile?.idVerificationStatus === "VERIFIED"

  const amenitiesByCategory = listing.amenities.reduce<Record<string, typeof listing.amenities>>((acc, la) => {
    const cat = la.amenity.category
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(la)
    return acc
  }, {})

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      {/* Back */}
      <Link href="/search" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4 transition-colors">
        <ChevronLeft className="w-4 h-4" /> Back to search
      </Link>

      {/* Photo gallery */}
      <PhotoGallery
        photos={photos.map((p) => ({ id: p.id, url: p.cdnUrl ?? p.url }))}
        title={listing.title}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Header */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="secondary">{LISTING_TYPE_LABELS[listing.type]}</Badge>
              {listing.isFeatured && <Badge variant="warning">Featured</Badge>}
              {hasVirtualTour && (
                <Badge variant="default" className="bg-brand-100 text-brand-700">360° Tour</Badge>
              )}
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">{listing.title}</h1>
            <p className="flex items-center gap-1.5 text-gray-500">
              <MapPin className="w-4 h-4 shrink-0" />
              {[listing.neighbourhood, listing.city, listing.county].filter(Boolean).join(", ")}
            </p>
          </div>

          {/* Key stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-6 border-y border-gray-100">
            {listing.bedrooms !== null && (
              <div className="flex flex-col items-center gap-1">
                <Bed className="w-5 h-5 text-brand-500" />
                <span className="font-semibold text-gray-800">{bedroomLabel(listing.bedrooms)}</span>
                <span className="text-xs text-gray-400">Bedrooms</span>
              </div>
            )}
            {listing.bathrooms !== null && (
              <div className="flex flex-col items-center gap-1">
                <Bath className="w-5 h-5 text-brand-500" />
                <span className="font-semibold text-gray-800">{listing.bathrooms}</span>
                <span className="text-xs text-gray-400">Bathrooms</span>
              </div>
            )}
            {listing.sizeSqft && (
              <div className="flex flex-col items-center gap-1">
                <Maximize className="w-5 h-5 text-brand-500" />
                <span className="font-semibold text-gray-800">{sizeLabelSqft(listing.sizeSqft)}</span>
                <span className="text-xs text-gray-400">Size</span>
              </div>
            )}
            {listing.parkingSpots !== null && listing.parkingSpots > 0 && (
              <div className="flex flex-col items-center gap-1">
                <Car className="w-5 h-5 text-brand-500" />
                <span className="font-semibold text-gray-800">{listing.parkingSpots}</span>
                <span className="text-xs text-gray-400">Parking</span>
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">About this space</h2>
            <div className="text-gray-600 leading-relaxed whitespace-pre-wrap text-sm">
              {listing.description}
            </div>
          </div>

          {/* Amenities */}
          {Object.keys(amenitiesByCategory).length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Amenities</h2>
              {Object.entries(amenitiesByCategory).map(([category, items]) => (
                <div key={category} className="mb-4">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">{category}</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-2 gap-x-4">
                    {items.map(({ amenity }) => (
                      <div key={amenity.id} className="flex items-center gap-2 text-sm text-gray-700">
                        <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                        {amenity.name}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Lease details */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Lease details</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {listing.availableFrom && (
                <div>
                  <span className="text-gray-400 flex items-center gap-1.5 mb-0.5">
                    <Calendar className="w-3.5 h-3.5" /> Available from
                  </span>
                  <span className="text-gray-800 font-medium">
                    {new Date(listing.availableFrom).toLocaleDateString("en-KE", {
                      year: "numeric", month: "long", day: "numeric",
                    })}
                  </span>
                </div>
              )}
              {listing.minLeaseMonths && (
                <div>
                  <span className="text-gray-400 mb-0.5 block">Min lease</span>
                  <span className="text-gray-800 font-medium">{listing.minLeaseMonths} months</span>
                </div>
              )}
              {listing.deposit && (
                <div>
                  <span className="text-gray-400 mb-0.5 block">Security deposit</span>
                  <span className="text-gray-800 font-medium">
                    {formatPrice(listing.deposit, listing.currency)} ({listing.depositMonths ?? 1} month)
                  </span>
                </div>
              )}
              <div>
                <span className="text-gray-400 mb-0.5 block">Furnished</span>
                <span className="text-gray-800 font-medium">{listing.furnished ? "Yes" : "No"}</span>
              </div>
              <div>
                <span className="text-gray-400 mb-0.5 block">Pets allowed</span>
                <span className="text-gray-800 font-medium">{listing.petsAllowed ? "Yes" : "No"}</span>
              </div>
            </div>
          </div>

          {/* Landlord card */}
          <div className="border border-gray-200 rounded-xl p-5">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">About the landlord</h2>
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold text-lg shrink-0">
                {listing.owner.name?.[0] ?? "?"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-gray-900">{listing.owner.name ?? "Landlord"}</span>
                  {isVerified && (
                    <span className="flex items-center gap-0.5 text-xs text-green-700 bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
                      <Shield className="w-3 h-3" /> Verified
                    </span>
                  )}
                </div>
                {listing.owner.profile?.company && (
                  <p className="text-sm text-gray-500 mb-1">{listing.owner.profile.company}</p>
                )}
                <div className="flex items-center gap-4 text-xs text-gray-400 mt-1">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Joined {timeAgo(listing.owner.createdAt)}
                  </span>
                  {listing.owner.profile?.responseRate && (
                    <span>{listing.owner.profile.responseRate}% response rate</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar — price + inquiry */}
        <div className="lg:col-span-1">
          <div className="sticky top-20 space-y-4">
            {/* Price card */}
            <div className="border border-gray-200 rounded-xl p-5 shadow-sm bg-white">
              <div className="mb-4">
                <div className="text-3xl font-bold text-gray-900">
                  {formatPrice(listing.price, listing.currency)}
                </div>
                <div className="text-sm text-gray-400">{PRICE_PERIOD_LABELS[listing.pricePeriod]}</div>
                {listing.deposit && (
                  <div className="text-xs text-gray-400 mt-1">
                    + {formatPrice(listing.deposit, listing.currency)} deposit
                  </div>
                )}
              </div>
              {listing._count.reviews > 0 && (
                <div className="flex items-center gap-1.5 text-sm text-gray-600 mb-4">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span className="font-medium">4.5</span>
                  <span className="text-gray-400">({listing._count.reviews} reviews)</span>
                </div>
              )}
              <InquiryForm listingId={id} listingTitle={listing.title} />
            </div>

            {/* Virtual tour */}
            {hasVirtualTour && (
              <div className="border border-brand-200 bg-brand-50 rounded-xl p-5 text-center">
                <div className="text-4xl mb-2">360°</div>
                <p className="font-semibold text-brand-900 mb-1">Virtual Tour Available</p>
                <p className="text-xs text-brand-600 mb-3">Explore all rooms before visiting</p>
                <Button variant="default" className="w-full" size="sm">
                  Launch Virtual Tour
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
