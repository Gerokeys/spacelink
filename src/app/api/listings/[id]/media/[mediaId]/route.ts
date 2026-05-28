import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { deleteMedia } from "@/lib/media"

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; mediaId: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })

  const { id, mediaId } = await params

  const listing = await db.listing.findUnique({ where: { id } })
  if (!listing || listing.ownerId !== session.user.id) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 })
  }

  const media = await db.listingMedia.findUnique({ where: { id: mediaId } })
  if (!media || media.listingId !== id) {
    return NextResponse.json({ success: false, error: "Not found" }, { status: 404 })
  }

  // Delete from R2
  const key = media.cdnUrl?.split("/").pop()
  if (key) await deleteMedia(`listings/${key}`).catch(() => {})

  await db.listingMedia.delete({ where: { id: mediaId } })

  // If deleted photo was primary, set next one as primary
  if (media.isPrimary) {
    const next = await db.listingMedia.findFirst({ where: { listingId: id }, orderBy: { order: "asc" } })
    if (next) await db.listingMedia.update({ where: { id: next.id }, data: { isPrimary: true } })
  }

  return NextResponse.json({ success: true, data: null })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; mediaId: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })

  const { id, mediaId } = await params

  const listing = await db.listing.findUnique({ where: { id } })
  if (!listing || listing.ownerId !== session.user.id) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 })
  }

  // Unset all primary then set this one
  await db.listingMedia.updateMany({ where: { listingId: id }, data: { isPrimary: false } })
  const updated = await db.listingMedia.update({ where: { id: mediaId }, data: { isPrimary: true } })

  return NextResponse.json({ success: true, data: updated })
}
