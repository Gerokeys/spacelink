import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

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

    db.listing.update({ where: { id }, data: { viewCount: { increment: 1 } } }).catch(() => {})

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

  const body = await req.json()
  const updated = await db.listing.update({ where: { id }, data: body })
  return NextResponse.json({ success: true, data: updated })
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
