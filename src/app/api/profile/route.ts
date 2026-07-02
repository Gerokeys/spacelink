import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { Prisma } from "@prisma/client"
import { z } from "zod"

const schema = z.object({
  name: z.string().min(2).max(80),
  phone: z
    .string()
    .regex(/^\+?[0-9\s-]{9,15}$/, "Enter a valid phone number")
    .optional()
    .or(z.literal("")),
  company: z.string().max(100).optional().or(z.literal("")),
  bio: z.string().max(1000).optional().or(z.literal("")),
  website: z.string().url().optional().or(z.literal("")),
  city: z.string().max(60).optional().or(z.literal("")),
})

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })

  try {
    const data = schema.parse(await req.json())

    await db.user.update({
      where: { id: session.user.id },
      data: {
        name: data.name,
        phone: data.phone || null,
        profile: {
          upsert: {
            create: {
              company: data.company || null,
              bio: data.bio || null,
              website: data.website || null,
              city: data.city || null,
            },
            update: {
              company: data.company || null,
              bio: data.bio || null,
              website: data.website || null,
              city: data.city || null,
            },
          },
        },
      },
    })

    return NextResponse.json({ success: true, data: null })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: err.flatten().fieldErrors },
        { status: 422 }
      )
    }
    // Unique constraint — phone already in use by another account
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return NextResponse.json(
        { success: false, error: "That phone number is already in use on another account." },
        { status: 409 }
      )
    }
    console.error("[profile/PATCH]", err)
    return NextResponse.json({ success: false, error: "Failed to update profile" }, { status: 500 })
  }
}
