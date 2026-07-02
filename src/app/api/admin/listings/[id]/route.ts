import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { z } from "zod"
import { checkRateLimit, getClientIp, tooManyRequests, LIMITS } from "@/lib/ratelimit"
import { sendListingApproved } from "@/lib/email"

const schema = z.object({
  action: z.enum(["approve", "reject"]),
  reason: z.string().optional(),
})

function isAdmin(role: string) {
  return role === "ADMIN" || role === "SUPER_ADMIN"
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session || !isAdmin(session.user.role)) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 })
  }

  // Rate limit admin actions: 60 per minute per IP
  const ip = getClientIp(req)
  const rl = checkRateLimit(`admin:${ip}`, LIMITS.ADMIN_ACTION.limit, LIMITS.ADMIN_ACTION.windowMs)
  if (!rl.allowed) return tooManyRequests(rl.resetIn)

  try {
    const { id } = await params
    const body = await req.json()
    const { action, reason } = schema.parse(body)

    const listing = await db.listing.update({
      where: { id },
      data:
        action === "approve"
          ? { status: "ACTIVE", publishedAt: new Date(), rejectedReason: null }
          : { status: "REJECTED", rejectedReason: reason ?? "Did not meet listing standards" },
      include: { owner: { select: { email: true, name: true } } },
    })

    if (action === "approve" && listing.owner.email) {
      sendListingApproved({
        ownerEmail: listing.owner.email,
        ownerName: listing.owner.name ?? "there",
        listingTitle: listing.title,
        listingId: listing.id,
      }).catch(console.error)
    }

    return NextResponse.json({ success: true, data: listing })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: "Invalid request" }, { status: 422 })
    }
    console.error("[admin/listings/PATCH]", err)
    return NextResponse.json({ success: false, error: "Failed to update listing" }, { status: 500 })
  }
}
