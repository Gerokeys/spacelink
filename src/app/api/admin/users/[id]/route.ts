import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { z } from "zod"
import { checkRateLimit, getClientIp, tooManyRequests, LIMITS } from "@/lib/ratelimit"

const schema = z.object({
  role: z.enum(["TENANT", "LANDLORD", "AGENT", "ADMIN", "SUPER_ADMIN"]),
})

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 })
  }

  // Rate limit admin actions: 60 per minute per IP
  const ip = getClientIp(req)
  const rl = await checkRateLimit(`admin:${ip}`, LIMITS.ADMIN_ACTION.limit, LIMITS.ADMIN_ACTION.windowMs)
  if (!rl.allowed) return tooManyRequests(rl.resetIn)

  try {
    const { id } = await params
    const body = await req.json()
    const { role } = schema.parse(body)

    const user = await db.user.update({
      where: { id },
      data: { role },
      select: { id: true, name: true, email: true, role: true },
    })

    return NextResponse.json({ success: true, data: user })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: "Invalid role" }, { status: 422 })
    }
    console.error("[admin/users/PATCH]", err)
    return NextResponse.json({ success: false, error: "Failed to update user" }, { status: 500 })
  }
}
