import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { z } from "zod"

const bodySchema = z.object({ listingId: z.string() })

// GET /api/saved?ids=true → just the listing IDs (used for heart state on cards)
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })

  const saved = await db.savedListing.findMany({
    where: { userId: session.user.id },
    select: { listingId: true },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json({ success: true, data: saved.map((s) => s.listingId) })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })

  try {
    const { listingId } = bodySchema.parse(await req.json())

    const listing = await db.listing.findUnique({ where: { id: listingId }, select: { id: true } })
    if (!listing) return NextResponse.json({ success: false, error: "Listing not found" }, { status: 404 })

    await db.savedListing.upsert({
      where: { userId_listingId: { userId: session.user.id, listingId } },
      create: { userId: session.user.id, listingId },
      update: {},
    })

    return NextResponse.json({ success: true, data: null }, { status: 201 })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: "Invalid request" }, { status: 422 })
    }
    console.error("[saved/POST]", err)
    return NextResponse.json({ success: false, error: "Failed to save listing" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })

  try {
    const { listingId } = bodySchema.parse(await req.json())

    await db.savedListing.deleteMany({
      where: { userId: session.user.id, listingId },
    })

    return NextResponse.json({ success: true, data: null })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: "Invalid request" }, { status: 422 })
    }
    console.error("[saved/DELETE]", err)
    return NextResponse.json({ success: false, error: "Failed to remove listing" }, { status: 500 })
  }
}
