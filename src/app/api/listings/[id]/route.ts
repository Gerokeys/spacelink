import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { z } from "zod"

// Only content fields are editable — never status, isFeatured, ownerId,
// viewCount or publishedAt, which would bypass moderation
const updateListingSchema = z.object({
  type: z.enum(["RESIDENTIAL", "OFFICE", "COMMERCIAL", "SHORT_TERM"]).optional(),
  title: z.string().min(10).max(120).optional(),
  description: z.string().min(30).max(5000).optional(),
  address: z.string().min(5).optional(),
  neighbourhood: z.string().nullable().optional(),
  city: z.string().min(2).optional(),
  county: z.string().nullable().optional(),
  lat: z.number().nullable().optional(),
  lng: z.number().nullable().optional(),
  price: z.number().positive().optional(),
  pricePeriod: z.enum(["NIGHTLY", "WEEKLY", "MONTHLY", "YEARLY"]).optional(),
  currency: z.string().optional(),
  deposit: z.number().nullable().optional(),
  depositMonths: z.number().int().min(0).max(12).nullable().optional(),
  sizeSqft: z.number().positive().nullable().optional(),
  bedrooms: z.number().int().min(0).nullable().optional(),
  bathrooms: z.number().min(0).nullable().optional(),
  floor: z.number().int().nullable().optional(),
  totalFloors: z.number().int().nullable().optional(),
  yearBuilt: z.number().int().min(1900).max(new Date().getFullYear()).nullable().optional(),
  parkingSpots: z.number().int().min(0).optional(),
  availableFrom: z.string().nullable().optional(),
  minLeaseMonths: z.number().int().min(1).nullable().optional(),
  petsAllowed: z.boolean().optional(),
  furnished: z.boolean().optional(),
  // Owners may only pause/unpause an already-approved listing
  status: z.enum(["ACTIVE", "PAUSED"]).optional(),
  amenityIds: z.array(z.string()).optional(),
})

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const listing = await db.listing.findUnique({
      where: { id },
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
        reviews: {
          take: 5,
          orderBy: { createdAt: "desc" },
          include: {
            reviewer: { select: { id: true, name: true, image: true } },
          },
        },
        _count: { select: { reviews: true } },
      },
    })

    if (!listing || (listing.status !== "ACTIVE" && listing.status !== "PAUSED")) {
      return NextResponse.json({ success: false, error: "Listing not found" }, { status: 404 })
    }

    const avgRating =
      listing.reviews.length > 0
        ? listing.reviews.reduce((sum, r) => sum + r.rating, 0) / listing.reviews.length
        : null

    return NextResponse.json({
      success: true,
      data: {
        ...listing,
        createdAt: listing.createdAt.toISOString(),
        updatedAt: listing.updatedAt.toISOString(),
        publishedAt: listing.publishedAt?.toISOString() ?? null,
        availableFrom: listing.availableFrom?.toISOString() ?? null,
        amenities: listing.amenities.map((a) => a.amenity),
        averageRating: avgRating,
        reviewCount: listing._count.reviews,
        owner: {
          ...listing.owner,
          createdAt: listing.owner.createdAt.toISOString(),
        },
        reviews: listing.reviews.map((r) => ({
          ...r,
          createdAt: r.createdAt.toISOString(),
          updatedAt: r.updatedAt.toISOString(),
        })),
      },
    })
  } catch (err) {
    console.error("[listings/GET]", err)
    return NextResponse.json({ success: false, error: "Failed to load listing" }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const listing = await db.listing.findUnique({ where: { id } })
  if (!listing) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 })

  const canEdit =
    listing.ownerId === session.user.id ||
    session.user.role === "ADMIN" ||
    session.user.role === "SUPER_ADMIN"

  if (!canEdit) return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 })

  try {
    const body = await req.json()
    const data = updateListingSchema.parse(body)

    // Status can only be toggled between ACTIVE and PAUSED on an
    // already-approved listing — never used to skip review
    if (data.status && listing.status !== "ACTIVE" && listing.status !== "PAUSED") {
      delete data.status
    }

    const { amenityIds, ...fields } = data

    const updated = await db.listing.update({
      where: { id },
      data: {
        ...fields,
        availableFrom:
          fields.availableFrom === undefined
            ? undefined
            : fields.availableFrom === null
              ? null
              : new Date(fields.availableFrom),
        // Replace the amenity set when provided
        ...(amenityIds !== undefined && {
          amenities: {
            deleteMany: {},
            create: amenityIds.map((amenityId) => ({ amenityId })),
          },
        }),
      },
    })
    return NextResponse.json({ success: true, data: updated })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: err.flatten().fieldErrors },
        { status: 422 }
      )
    }
    console.error("[listings/PATCH]", err)
    return NextResponse.json({ success: false, error: "Failed to update listing" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const listing = await db.listing.findUnique({ where: { id } })
  if (!listing) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 })

  const canDelete =
    listing.ownerId === session.user.id ||
    session.user.role === "ADMIN" ||
    session.user.role === "SUPER_ADMIN"

  if (!canDelete) return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 })

  await db.listing.update({ where: { id }, data: { status: "ARCHIVED" } })
  return NextResponse.json({ success: true, data: null })
}
