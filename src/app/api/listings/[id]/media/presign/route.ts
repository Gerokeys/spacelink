import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { getPresignedUploadUrl, generateMediaKey, getExtFromMime, validateImageMime, MAX_PHOTO_SIZE } from "@/lib/media"
import { checkRateLimit, getClientIp, tooManyRequests } from "@/lib/ratelimit"

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })

  const ip = getClientIp(req)
  const rl = await checkRateLimit(`media:${ip}`, 60, 60 * 1000)
  if (!rl.allowed) return tooManyRequests(rl.resetIn)

  const { id } = await params

  const listing = await db.listing.findUnique({ where: { id } })
  if (!listing) return NextResponse.json({ success: false, error: "Listing not found" }, { status: 404 })
  if (listing.ownerId !== session.user.id && session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 })
  }

  const { contentType, size } = await req.json()

  if (!validateImageMime(contentType)) {
    return NextResponse.json({ success: false, error: "Only JPG, PNG and WebP images are allowed" }, { status: 422 })
  }

  if (typeof size !== "number" || !Number.isFinite(size) || size <= 0 || size > MAX_PHOTO_SIZE) {
    return NextResponse.json(
      { success: false, error: `File size must be between 1 byte and ${MAX_PHOTO_SIZE / 1024 / 1024}MB` },
      { status: 422 }
    )
  }

  const ext = getExtFromMime(contentType)
  const key = generateMediaKey("listings", ext)
  const { uploadUrl, cdnUrl } = await getPresignedUploadUrl(key, contentType, size)

  return NextResponse.json({ success: true, data: { uploadUrl, cdnUrl, key } })
}
