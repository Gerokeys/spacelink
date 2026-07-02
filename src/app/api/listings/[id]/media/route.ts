import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { z } from "zod"
import { isOwnedCdnUrl, MAX_PHOTOS_PER_LISTING, MIN_PHOTOS_PER_LISTING } from "@/lib/media"
import type { Session } from "next-auth"
import type { Listing } from "@prisma/client"

const createSchema = z.object({
  cdnUrl: z.string().url(),
  isPrimary: z.boolean().default(false),
  order: z.number().int().default(0),
})

function canManageListing(session: Session, listing: Listing): boolean {
  return (
    listing.ownerId === session.user.id ||
    session.user.role === "ADMIN" ||
    session.user.role === "SUPER_ADMIN"
  )
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const listing = await db.listing.findUnique({ where: { id } })
  if (!listing || !canManageListing(session, listing)) {
    return NextResponse.json({ success: false, error: "Not found" }, { status: 404 })
  }

  const media = await db.listingMedia.findMany({
    where: { listingId: id },
    orderBy: [{ isPrimary: "desc" }, { order: "asc" }],
  })

  return NextResponse.json({ success: true, data: media })
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const listing = await db.listing.findUnique({ where: { id } })
  if (!listing) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 })
  if (!canManageListing(session, listing)) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 })
  }

  try {
    const body = await req.json()
    const data = createSchema.parse(body)

    if (!isOwnedCdnUrl(data.cdnUrl)) {
      return NextResponse.json({ success: false, error: "Invalid media URL" }, { status: 422 })
    }

    const existing = await db.listingMedia.count({ where: { listingId: id } })
    if (existing >= MAX_PHOTOS_PER_LISTING) {
      return NextResponse.json(
        { success: false, error: `Maximum ${MAX_PHOTOS_PER_LISTING} photos per listing` },
        { status: 422 }
      )
    }

    const isPrimary = existing === 0 ? true : data.isPrimary

    if (isPrimary) {
      await db.listingMedia.updateMany({ where: { listingId: id }, data: { isPrimary: false } })
    }

    const media = await db.listingMedia.create({
      data: {
        listingId: id,
        type: "PHOTO",
        url: data.cdnUrl,
        cdnUrl: data.cdnUrl,
        isPrimary,
        order: data.order,
      },
    })

    // Drafts go to review automatically once they have enough photos
    if (listing.status === "DRAFT" && existing + 1 >= MIN_PHOTOS_PER_LISTING) {
      await db.listing.update({ where: { id }, data: { status: "PENDING" } })
    }

    return NextResponse.json({ success: true, data: media }, { status: 201 })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: "Validation failed" }, { status: 422 })
    }
    console.error("[media/POST]", err)
    return NextResponse.json({ success: false, error: "Failed to save photo" }, { status: 500 })
  }
}
