import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { z } from "zod"
import { checkRateLimit, getClientIp, tooManyRequests, LIMITS } from "@/lib/ratelimit"

const createListingSchema = z.object({
  type: z.enum(["RESIDENTIAL", "OFFICE", "COMMERCIAL", "SHORT_TERM"]),
  title: z.string().min(10).max(120),
  description: z.string().min(30).max(5000),
  address: z.string().min(5),
  neighbourhood: z.string().optional(),
  city: z.string().min(2),
  county: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  price: z.number().positive(),
  pricePeriod: z.enum(["NIGHTLY", "WEEKLY", "MONTHLY", "YEARLY"]).default("MONTHLY"),
  currency: z.string().default("KES"),
  deposit: z.number().optional(),
  depositMonths: z.number().int().min(0).max(12).optional(),
  sizeSqft: z.number().positive().optional(),
  bedrooms: z.number().int().min(0).optional(),
  bathrooms: z.number().min(0).optional(),
  floor: z.number().int().optional(),
  totalFloors: z.number().int().optional(),
  yearBuilt: z.number().int().min(1900).max(new Date().getFullYear()).optional(),
  parkingSpots: z.number().int().min(0).default(0),
  availableFrom: z.string().optional(),
  minLeaseMonths: z.number().int().min(1).optional(),
  petsAllowed: z.boolean().default(false),
  furnished: z.boolean().default(false),
  amenityIds: z.array(z.string()).default([]),
})

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  }

  // Rate limit: 10 new listings per IP per day
  const ip = getClientIp(req)
  const rl = checkRateLimit(`listing:${ip}`, LIMITS.LISTING_CREATE.limit, LIMITS.LISTING_CREATE.windowMs)
  if (!rl.allowed) return tooManyRequests(rl.resetIn)

  try {
    const body = await req.json()
    const data = createListingSchema.parse(body)

    const listing = await db.listing.create({
      data: {
        ownerId: session.user.id,
        type: data.type,
        status: "PENDING",
        title: data.title,
        description: data.description,
        address: data.address,
        neighbourhood: data.neighbourhood,
        city: data.city,
        county: data.county,
        lat: data.lat,
        lng: data.lng,
        price: data.price,
        pricePeriod: data.pricePeriod,
        currency: data.currency,
        deposit: data.deposit,
        depositMonths: data.depositMonths,
        sizeSqft: data.sizeSqft,
        bedrooms: data.bedrooms,
        bathrooms: data.bathrooms,
        floor: data.floor,
        totalFloors: data.totalFloors,
        yearBuilt: data.yearBuilt,
        parkingSpots: data.parkingSpots,
        availableFrom: data.availableFrom ? new Date(data.availableFrom) : undefined,
        minLeaseMonths: data.minLeaseMonths,
        petsAllowed: data.petsAllowed,
        furnished: data.furnished,
        amenities: {
          create: data.amenityIds.map((id) => ({ amenityId: id })),
        },
      },
    })

    return NextResponse.json({ success: true, data: { id: listing.id } }, { status: 201 })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: err.flatten().fieldErrors },
        { status: 422 }
      )
    }
    console.error("[listings/POST]", err)
    return NextResponse.json({ success: false, error: "Failed to create listing" }, { status: 500 })
  }
}
