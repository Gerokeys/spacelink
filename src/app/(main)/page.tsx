import Link from "next/link"
import {
  ArrowRight, MapPin, Shield, Zap, Home, Building2, Store, Moon,
  CheckCircle, Video, Map, MessageCircle, Star, Clock, BadgeCheck,
  TrendingUp,
} from "lucide-react"
import { SearchBar } from "@/components/search/SearchBar"
import { ListingCard } from "@/components/listings/ListingCard"
import { Button } from "@/components/ui/button"
import { SignInBanner } from "@/components/auth/SignInBanner"
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
      id: l.id, type: l.type, status: l.status, title: l.title,
      price: l.price, pricePeriod: l.pricePeriod, currency: l.currency,
      address: l.address, neighbourhood: l.neighbourhood, city: l.city,
      lat: l.lat, lng: l.lng, bedrooms: l.bedrooms, bathrooms: l.bathrooms,
      sizeSqft: l.sizeSqft, furnished: l.furnished, petsAllowed: l.petsAllowed,
      primaryPhoto: l.media[0]?.cdnUrl ?? l.media[0]?.url ?? null,
      blurHash: l.media[0]?.blurHash ?? null, hasTour360: !!l.tourConfig,
      hasVideo: l.media.some((m) => m.type === "VIDEO"), isFeatured: l.isFeatured,
      viewCount: l.viewCount, createdAt: l.createdAt.toISOString(),
      owner: {
        id: l.owner.id, name: l.owner.name, image: l.owner.image,
        profile: l.owner.profile ? {
          idVerificationStatus: l.owner.profile.idVerificationStatus,
          responseRate: l.owner.profile.responseRate,
          responseTimeHours: l.owner.profile.responseTimeHours,
          company: l.owner.profile.company,
        } : null,
      },
    }))
  } catch { return [] }
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

const FEATURES = [
  {
    icon: BadgeCheck,
    title: "Verified landlords",
    desc: "Every landlord goes through an ID verification process. No fake listings, no wasted viewings.",
  },
  {
    icon: Video,
    title: "Virtual 360° tours",
    desc: "Explore every room before you visit in person. Save time and only view properties you love.",
  },
  {
    icon: Map,
    title: "Search on a map",
    desc: "See exactly where every property sits. Filter by neighbourhood, commute distance, or proximity to amenities.",
  },
  {
    icon: MessageCircle,
    title: "Direct to landlord",
    desc: "Message landlords directly with no agents or middlemen. Faster responses, lower fees.",
  },
]

const TENANT_BENEFITS = [
  "Browse hundreds of verified listings for free",
  "See 360° virtual tours before visiting",
  "Send inquiries directly — no agent fees",
  "Search on a map and filter by what matters to you",
  "Know if you qualify before you apply",
]

const LANDLORD_BENEFITS = [
  "List your property for free in minutes",
  "Reach thousands of verified tenants",
  "Manage all inquiries from one dashboard",
  "Upload photos and virtual tours",
  "Get notified by email when tenants inquire",
]

export default async function HomePage() {
  const listings = await getFeaturedListings()

  return (
    <div className="bg-stone-50">

      {/* ── Hero ── */}
      <section className="relative min-h-[580px] flex items-center">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1600&q=80')" }}
        />
        <div className="absolute inset-0 bg-stone-900/60" />
        <div className="relative w-full container mx-auto px-4 py-20">
          <div className="max-w-2xl mx-auto text-center">
            <p className="text-brand-300 text-sm font-medium tracking-widest uppercase mb-4">
              Kenya's modern property platform
            </p>
            <h1 className="text-4xl md:text-6xl font-bold text-white leading-tight mb-5">
              Find your next space in Kenya
            </h1>
            <p className="text-stone-300 text-lg mb-8">
              Homes, offices and commercial spaces — direct from verified landlords, no agents.
            </p>
            <div className="bg-white rounded-2xl p-3 shadow-2xl">
              <SearchBar />
            </div>
            <div className="flex items-center justify-center gap-6 mt-6 text-sm text-stone-400 flex-wrap">
              <span className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-brand-400" /> Verified landlords</span>
              <span className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5 text-brand-400" /> Virtual tours</span>
              <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-brand-400" /> Nairobi · Mombasa · Kisumu</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Property type strip ── */}
      <section className="border-b border-stone-200 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex items-center overflow-x-auto scrollbar-hide">
            {PROPERTY_TYPES.map(({ label, icon: Icon, href }) => (
              <Link key={label} href={href}
                className="flex flex-col items-center gap-1.5 px-8 py-4 text-sm font-medium text-stone-500 hover:text-brand-600 border-b-2 border-transparent hover:border-brand-600 transition-colors whitespace-nowrap shrink-0"
              >
                <Icon className="w-5 h-5" />
                {label}
              </Link>
            ))}
            <Link href="/qualify"
              className="ml-auto flex items-center gap-1.5 px-6 py-4 text-sm font-medium text-brand-600 hover:text-brand-700 whitespace-nowrap shrink-0"
            >
              <TrendingUp className="w-4 h-4" /> What can I afford?
            </Link>
          </div>
        </div>
      </section>

      {/* ── Why SpaceLink ── */}
      <section className="container mx-auto px-4 py-14">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold text-stone-900 mb-2">Why SpaceLink?</h2>
          <p className="text-stone-500 text-sm max-w-lg mx-auto">
            We built SpaceLink because finding a home in Kenya is unnecessarily hard. Here's what makes us different.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-white rounded-2xl border border-stone-200 p-6 hover:shadow-md transition-shadow">
              <div className="w-11 h-11 rounded-xl bg-brand-50 flex items-center justify-center mb-4">
                <Icon className="w-5 h-5 text-brand-600" />
              </div>
              <h3 className="font-semibold text-stone-900 mb-2">{title}</h3>
              <p className="text-sm text-stone-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Featured Listings ── */}
      <section className="bg-white border-y border-stone-200 py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-end justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-stone-900">
                {listings.length > 0 ? "Latest listings" : "Be the first to list"}
              </h2>
              <p className="text-stone-500 text-sm mt-1">Fresh spaces from verified landlords</p>
            </div>
            <Link href="/search" className="text-sm text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1">
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
            <div className="border border-dashed border-stone-200 rounded-2xl py-16 text-center bg-stone-50">
              <Building2 className="w-10 h-10 text-stone-300 mx-auto mb-3" />
              <p className="text-stone-500 font-medium mb-1">No listings yet</p>
              <p className="text-stone-400 text-sm mb-5">Be the first to post a space on SpaceLink</p>
              <Link href="/dashboard/landlord/listings/new"><Button>Post your first listing</Button></Link>
            </div>
          )}
        </div>
      </section>

      {/* ── Sign-in personalization banner ── */}
      <SignInBanner />

      {/* ── For Tenants & Landlords ── */}
      <section className="container mx-auto px-4 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Tenants */}
          <div className="bg-white rounded-2xl border border-stone-200 p-8">
            <div className="w-11 h-11 rounded-xl bg-brand-50 flex items-center justify-center mb-5">
              <Home className="w-5 h-5 text-brand-600" />
            </div>
            <h3 className="text-xl font-bold text-stone-900 mb-2">Looking for a space?</h3>
            <p className="text-stone-500 text-sm mb-5">SpaceLink connects you directly with landlords across Kenya. No agents, no hidden fees.</p>
            <ul className="space-y-2.5 mb-6">
              {TENANT_BENEFITS.map((b) => (
                <li key={b} className="flex items-start gap-2.5 text-sm text-stone-700">
                  <CheckCircle className="w-4 h-4 text-brand-500 shrink-0 mt-0.5" />
                  {b}
                </li>
              ))}
            </ul>
            <div className="flex gap-3">
              <Link href="/search"><Button>Browse listings</Button></Link>
              <Link href="/qualify"><Button variant="outline">Check what I qualify for</Button></Link>
            </div>
          </div>

          {/* Landlords */}
          <div className="bg-stone-900 rounded-2xl p-8 text-white">
            <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center mb-5">
              <Building2 className="w-5 h-5 text-brand-400" />
            </div>
            <h3 className="text-xl font-bold mb-2">Have a space to rent?</h3>
            <p className="text-stone-400 text-sm mb-5">List on SpaceLink and reach thousands of verified tenants. It's completely free to get started.</p>
            <ul className="space-y-2.5 mb-6">
              {LANDLORD_BENEFITS.map((b) => (
                <li key={b} className="flex items-start gap-2.5 text-sm text-stone-300">
                  <CheckCircle className="w-4 h-4 text-brand-400 shrink-0 mt-0.5" />
                  {b}
                </li>
              ))}
            </ul>
            <Link href="/dashboard/landlord/listings/new">
              <Button className="bg-brand-600 hover:bg-brand-500">List your space — it's free</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Neighbourhoods ── */}
      <section className="bg-white border-y border-stone-200 py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-end justify-between mb-6">
            <h2 className="text-2xl font-bold text-stone-900">Browse by neighbourhood</h2>
            <Link href="/search?city=Nairobi" className="text-sm text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1">
              All areas <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="flex flex-wrap gap-2">
            {NAIROBI_AREAS.map((area) => (
              <Link key={area.slug} href={`/search?neighbourhood=${area.slug}`}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-stone-200 bg-stone-50 text-sm text-stone-700 hover:border-brand-400 hover:text-brand-600 transition-colors"
              >
                <MapPin className="w-3.5 h-3.5" />
                {area.name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Affordability CTA ── */}
      <section className="container mx-auto px-4 py-12">
        <div className="bg-brand-50 border border-brand-100 rounded-2xl p-8 md:p-10 flex flex-col md:flex-row items-center gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-2 text-brand-600 text-sm font-medium mb-2">
              <TrendingUp className="w-4 h-4" /> Affordability calculator
            </div>
            <h2 className="text-2xl font-bold text-stone-900 mb-2">
              Not sure what you can afford?
            </h2>
            <p className="text-stone-600">
              Answer 4 quick questions and we'll show you exactly which listings fit your budget and needs.
            </p>
          </div>
          <Link href="/qualify" className="shrink-0">
            <Button size="lg" className="bg-brand-600 hover:bg-brand-700 text-white px-8">
              Find what I qualify for
            </Button>
          </Link>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="bg-white border-y border-stone-200 py-14">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-stone-900 mb-2">How SpaceLink works</h2>
            <p className="text-stone-500 text-sm">Three steps to finding your next space</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { step: "01", title: "Search", desc: "Filter by location, price, type and amenities. View on a map or as a list.", icon: Map },
              { step: "02", title: "Explore virtually", desc: "View 360° photo tours and video walkthroughs before visiting.", icon: Video },
              { step: "03", title: "Contact directly", desc: "Send an inquiry straight to the landlord. No agents, no middlemen.", icon: MessageCircle },
            ].map(({ step, title, desc, icon: Icon }) => (
              <div key={step} className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-brand-600 text-white font-bold text-sm flex items-center justify-center shrink-0">
                  {step}
                </div>
                <div>
                  <h3 className="font-semibold text-stone-900 mb-1">{title}</h3>
                  <p className="text-sm text-stone-500 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Landlord CTA ── */}
      <section className="bg-stone-900">
        <div className="container mx-auto px-4 py-14">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">Have a space to rent out?</h2>
              <p className="text-stone-400">List for free and reach thousands of tenants across Kenya.</p>
            </div>
            <div className="flex gap-3 shrink-0">
              <Link href="/dashboard/landlord/listings/new">
                <Button size="lg" className="bg-brand-600 hover:bg-brand-500">List your space</Button>
              </Link>
              <Link href="/search">
                <Button size="lg" variant="outline" className="border-stone-700 text-stone-300 hover:bg-stone-800 hover:text-white">
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
