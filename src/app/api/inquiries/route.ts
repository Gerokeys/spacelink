import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { z } from "zod"
import { sendInquiryNotification, sendInquiryConfirmation } from "@/lib/email"
import { checkRateLimit, getClientIp, tooManyRequests, LIMITS } from "@/lib/ratelimit"

const schema = z.object({
  listingId: z.string(),
  name: z.string().min(2).max(100),
  email: z.string().email(),
  phone: z.string().min(10).max(20),
  message: z.string().min(20).max(2000),
  moveInDate: z.string().optional(),
})

export async function POST(req: NextRequest) {
  // Rate limit: 5 inquiries per IP per hour
  const ip = getClientIp(req)
  const rl = checkRateLimit(`inquiry:${ip}`, LIMITS.INQUIRY.limit, LIMITS.INQUIRY.windowMs)
  if (!rl.allowed) return tooManyRequests(rl.resetIn)

  try {
    const body = await req.json()
    const data = schema.parse(body)

    // Prevent duplicate inquiries from same email to same listing within 24h
    const recent = await db.inquiry.findFirst({
      where: {
        listingId: data.listingId,
        tenant: { email: data.email },
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
    })
    if (recent) {
      return NextResponse.json(
        { success: false, error: "You already sent an inquiry for this listing recently." },
        { status: 429 }
      )
    }

    const listing = await db.listing.findUnique({
      where: { id: data.listingId, status: "ACTIVE" },
      include: {
        owner: {
          select: { id: true, name: true, email: true },
        },
      },
    })

    if (!listing || !listing.owner.email) {
      return NextResponse.json({ success: false, error: "Listing not found" }, { status: 404 })
    }

    // Find or create a guest user record for the tenant
    let tenant = await db.user.findUnique({ where: { email: data.email } })
    if (!tenant) {
      tenant = await db.user.create({
        data: { email: data.email, name: data.name, role: "TENANT" },
      })
    }

    const inquiry = await db.inquiry.create({
      data: {
        listingId: data.listingId,
        tenantId: tenant.id,
        landlordId: listing.owner.id,
        message: data.message,
        moveInDate: data.moveInDate ? new Date(data.moveInDate) : undefined,
      },
    })

    // Increment inquiry counter
    await db.listing.update({
      where: { id: data.listingId },
      data: { inquiryCount: { increment: 1 } },
    })

    // Send emails (non-blocking)
    sendInquiryNotification({
      landlordEmail: listing.owner.email,
      landlordName: listing.owner.name ?? "Landlord",
      tenantName: data.name,
      tenantEmail: data.email,
      tenantPhone: data.phone,
      listingTitle: listing.title,
      listingId: listing.id,
      message: data.message,
      moveInDate: data.moveInDate,
    }).catch(console.error)

    sendInquiryConfirmation({
      tenantEmail: data.email,
      tenantName: data.name,
      listingTitle: listing.title,
      listingId: listing.id,
    }).catch(console.error)

    return NextResponse.json({ success: true, data: { id: inquiry.id } }, { status: 201 })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: err.flatten().fieldErrors },
        { status: 422 }
      )
    }
    console.error("[inquiries/POST]", err)
    return NextResponse.json({ success: false, error: "Failed to submit inquiry" }, { status: 500 })
  }
}
