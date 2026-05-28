import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { Prisma } from "@prisma/client"
import type { ListingCard, SearchResult, ListingType, PricePeriod } from "@/types"
import { checkRateLimit, getClientIp, tooManyRequests, LIMITS } from "@/lib/ratelimit"

const PAGE_SIZE = 24

export async function GET(req: NextRequest) {
  // Rate limit: 120 searches per IP per minute
  const ip = getClientIp(req)
  const rl = checkRateLimit(`search:${ip}`, LIMITS.SEARCH.limit, LIMITS.SEARCH.windowMs)
  if (!rl.allowed) return tooManyRequests(rl.resetIn)

  try {
    const sp = req.nextUrl.searchParams
    const page = Math.max(1, Number(sp.get("page") ?? 1))
    const limit = Math.min(PAGE_SIZE, Number(sp.get("limit") ?? PAGE_SIZE))
    const skip = (page - 1) * limit

    const where: Prisma.ListingWhereInput = {
      status: "ACTIVE",
    }

    // Type filter
    const type = sp.get("type")
    if (type) where.type = type as ListingType

    // Text search (simple DB-level, replace with Typesense later)
    const q = sp.get("q")
    if (q) {
      where.OR = [
        { title: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
        { neighbourhood: { contains: q, mode: "insensitive" } },
        { city: { contains: q, mode: "insensitive" } },
        { address: { contains: q, mode: "insensitive" } },
      ]
    }

    // Location filters
    const city = sp.get("city")
    if (city) where.city = { equals: city, mode: "insensitive" }

    const neighbourhood = sp.get("neighbourhood")
    if (neighbourhood) where.neighbourhood = { contains: neighbourhood, mode: "insensitive" }

    // Price filters
    const minPrice = sp.get("minPrice")
    const maxPrice = sp.get("maxPrice")
    if (minPrice || maxPrice) {
      where.price = {}
      if (minPrice) where.price.gte = Number(minPrice)
      if (maxPrice) where.price.lte = Number(maxPrice)
    }

    // Bedrooms
    const minBedrooms = sp.get("minBedrooms")
    if (minBedrooms !== null) where.bedrooms = { gte: Number(minBedrooms) }

    // Toggles
    if (sp.get("furnished") === "true") where.furnished = true
    if (sp.get("petsAllowed") === "true") where.petsAllowed = true

    // Sort
    const sortBy = sp.get("sortBy") ?? "newest"
    let orderBy: Prisma.ListingOrderByWithRelationInput[] = [
      { isFeatured: "desc" },
      { publishedAt: "desc" },
    ]
    if (sortBy === "price_asc") orderBy = [{ price: "asc" }]
    if (sortBy === "price_desc") orderBy = [{ price: "desc" }]
    if (sortBy === "popular") orderBy = [{ viewCount: "desc" }]

    // Virtual tour filter — applied post-query for simplicity
    const hasVirtualTour = sp.get("hasVirtualTour") === "true"
    if (hasVirtualTour) where.tourConfig = { isNot: null }

    const [listings, total] = await Promise.all([
      db.listing.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          media: {
            where: { isPrimary: true },
            take: 1,
            select: { url: true, cdnUrl: true, blurHash: true, type: true },
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
      }),
      db.listing.count({ where }),
    ])

    const result: SearchResult = {
      listings: listings.map((l) => ({
        id: l.id,
        type: l.type,
        status: l.status,
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
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    }

    return NextResponse.json({ success: true, data: result })
  } catch (err) {
    console.error("[search]", err)
    return NextResponse.json({ success: false, error: "Search failed" }, { status: 500 })
  }
}
