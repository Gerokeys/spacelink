import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { z } from "zod"

const schema = z.object({
  status: z.enum(["PENDING", "RESPONDED", "CLOSED", "ARCHIVED"]),
})

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const inquiry = await db.inquiry.findUnique({ where: { id } })
  if (!inquiry) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 })

  const canUpdate =
    inquiry.landlordId === session.user.id ||
    session.user.role === "ADMIN" ||
    session.user.role === "SUPER_ADMIN"

  if (!canUpdate) return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 })

  try {
    const { status } = schema.parse(await req.json())
    const updated = await db.inquiry.update({ where: { id }, data: { status } })
    return NextResponse.json({ success: true, data: updated })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: "Invalid status" }, { status: 422 })
    }
    console.error("[inquiries/PATCH]", err)
    return NextResponse.json({ success: false, error: "Failed to update inquiry" }, { status: 500 })
  }
}
