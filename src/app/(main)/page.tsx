import Link from "next/link"
import { ArrowRight, MapPin, Shield, Zap, Home, Building2, Store, Moon } from "lucide-react"
import { SearchBar } from "@/components/search/SearchBar"
import { ListingCard } from "@/components/listings/ListingCard"
import { Button } from "@/components/ui/button"
import { db } from "@/lib/db"
import type { ListingCard as ListingCardType } from "@/types"

async function getFeaturedListings(): Promise<ListingCardType[]> {
  try {
    const listings = await db.listing.findMany({
      where: { status: "ACTIVE" },
      orderBy: [{ isFeatured: "desc" }, { publishedAt: "desc" }],
      take: 8,
      include: {
        media: { where: { isPrimary: true }, take: 1 },
        owner: { include: { profile: true } },
        _count: { select: { reviews: true } },
        tourConfig: { select: { id: true } },
      },
    })
    return listings.map((l) => ({
      id: l.id,
      type: l.type,
      status: l.status,
      title: l.title,
      price: l.price,
      pricePeriod: l.pricePeriod,
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
      hasVideo: l.media.some((m) => m.type === "VIDEO"),
      isFeatured: l.isFeatured,
      viewCount: l.viewCount,
      createdAt: l.createdAt.toISOString(),
      owner: {
        id: l.owner.id,
        name: l.owner.name,
        image: l.owner.image,
        profile: l.owner.profile ? {
          idVerificationStatus: l.owner.profile.idVerificationStatus,
          responseRate: l.owner.profile.responseRate,
          responseTimeHours: l.owner.profile.responseTimeHours,
          company: l.owner.profile.company,
        } : null,
      },
    }))
  } catch {
    return []
  }
}

const PROPERTY_TYPES = [
  { label: "Residential", icon: Home, href: "/search?type=RESIDENTIAL" },
  { label: "Office", icon: Building2, href: "/search?type=OFFICE" },
  { label: "Commercial", icon: Store, href: "/search?type=COMMERCIAL" },
  { label: "Short-term", icon: Moon, href: "/search?type=SHORT_TERM" },
]

const NAIROBI_AREAS = [
  { name: "Westlands", slug: "Westlands" },
  { name: "Kilimani", slug: "Kilimani" },
  { name: "Karen", slug: "Karen" },
  { name: "Lavington", slug: "Lavington" },
  { name: "Upperhill", slug: "Upperhill" },
  { name: "Parklands", slug: "Parklands" },
  { name: "Kileleshwa", slug: "Kileleshwa" },
  { name: "Ngong Road", slug: "Ngong Road" },
]

export default async function HomePage() {
  const listings = await getFeaturedListings()

  return (
    <div className="bg-white">

      {/* ── Hero ── */}
      <section className="relative min-h-[580px] flex items-center">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1600&q=80')",
          }}
        />
        <div className="absolute inset-0 bg-slate-900/65" />

        <div className="relative w-full container mx-auto px-4 py-20">
          <div className="max-w-2xl mx-auto text-center">
            <p className="text-indigo-300 text-sm font-medium tracking-widest uppercase mb-4">
              Kenya's property platform
            </p>
            <h1 className="text-4xl md:text-6xl font-bold text-white leading-tight mb-5">
              Find your next space in Kenya
            </h1>
            <p className="text-slate-300 text-lg mb-8">
              Homes, offices and commercial spaces — direct from verified landlords.
            </p>

            <div className="bg-white rounded-2xl p-3 shadow-2xl">
              <SearchBar />
            </div>

            <div className="flex items-center justify-center gap-6 mt-6 text-sm text-slate-400 flex-wrap">
              <span className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-indigo-400" /> Verified landlords
              </span>
              <span className="flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-indigo-400" /> Virtual tours
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-indigo-400" /> Nairobi · Mombasa · Kisumu
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Property type strip ── */}
      <section className="border-b border-slate-200 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex items-center overflow-x-auto scrollbar-hide">
            {PROPERTY_TYPES.map(({ label, icon: Icon, href }) => (
              <Link
                key={label}
                href={href}
                className="flex flex-col items-center gap-1.5 px-8 py-4 text-sm font-medium text-slate-500 hover:text-indigo-600 border-b-2 border-transparent hover:border-indigo-600 transition-colors whitespace-nowrap shrink-0"
              >
                <Icon className="w-5 h-5" />
                {label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Featured Listings ── */}
      <section className="container mx-auto px-4 py-12">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              {listings.length > 0 ? "Latest listings" : "Be the first to list"}
            </h2>
            <p className="text-slate-500 text-sm mt-1">Fresh spaces from verified landlords</p>
          </div>
          <Link
            href="/search"
            className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
          >
            View all <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {listings.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {listings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        ) : (
          <div className="border border-dashed border-slate-200 rounded-2xl py-16 text-center bg-slate-50">
            <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium mb-1">No listings yet</p>
            <p className="text-slate-400 text-sm mb-5">Be the first to post a space on SpaceLink</p>
            <Link href="/dashboard/landlord/listings/new">
              <Button>Post your first listing</Button>
            </Link>
          </div>
        )}
      </section>

      {/* ── Browse by neighbourhood ── */}
      <section className="bg-slate-50 border-y border-slate-200 py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-end justify-between mb-6">
            <h2 className="text-2xl font-bold text-slate-900">Browse by neighbourhood</h2>
            <Link
              href="/search?city=Nairobi"
              className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
            >
              All areas <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="flex flex-wrap gap-2">
            {NAIROBI_AREAS.map((area) => (
              <Link
                key={area.slug}
                href={`/search?neighbourhood=${area.slug}`}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-slate-200 bg-white text-sm text-slate-700 hover:border-indigo-400 hover:text-indigo-600 transition-colors"
              >
                <MapPin className="w-3.5 h-3.5" />
                {area.name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="container mx-auto px-4 py-14">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">How SpaceLink works</h2>
            <p className="text-slate-500 text-sm">Three simple steps to find your next space</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                step: "01",
                title: "Search",
                desc: "Filter by location, price, type and amenities. View on a map or as a list.",
              },
              {
                step: "02",
                title: "Explore virtually",
                desc: "View 360° photo tours and video walkthroughs before visiting.",
              },
              {
                step: "03",
                title: "Contact directly",
                desc: "Send an inquiry straight to the landlord. No agents, no middlemen.",
              },
            ].map(({ step, title, desc }) => (
              <div key={step} className="flex gap-4">
                <span className="text-3xl font-bold text-slate-200 shrink-0 leading-none mt-0.5">
                  {step}
                </span>
                <div>
                  <h3 className="font-semibold text-slate-900 mb-1">{title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Landlord CTA ── */}
      <section className="bg-slate-900">
        <div className="container mx-auto px-4 py-14">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">
                Have a space to rent out?
              </h2>
              <p className="text-slate-400">
                List for free and reach thousands of tenants across Kenya.
              </p>
            </div>
            <div className="flex gap-3 shrink-0">
              <Link href="/dashboard/landlord/listings/new">
                <Button size="lg" className="bg-indigo-600 hover:bg-indigo-500">
                  List your space
                </Button>
              </Link>
              <Link href="/search">
                <Button size="lg" variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white">
                  Browse listings
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

    </div>
  )
}
