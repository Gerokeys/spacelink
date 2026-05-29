import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { z } from "zod"

const createSchema = z.object({
  cdnUrl: z.string().url(),
  isPrimary: z.boolean().default(false),
  order: z.number().int().default(0),
})

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const listing = await db.listing.findUnique({ where: { id } })
  if (!listing || listing.ownerId !== session.user.id) {
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
  if (listing.ownerId !== session.user.id) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 })
  }

  try {
    const body = await req.json()
    const data = createSchema.parse(body)

    const existing = await db.listingMedia.count({ where: { listingId: id } })
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

    return NextResponse.json({ success: true, data: media }, { status: 201 })
  } catch (err) {
    console.error("[media/POST]", err)
    return NextResponse.json({ success: false, error: "Failed to save photo" }, { status: 500 })
  }
}
