import { NextResponse } from "next/server"
import { db } from "@/lib/db"

// Pinged daily by Vercel cron (see vercel.json) so the free-tier Supabase
// project never goes a week without activity and auto-pauses.
export async function GET() {
  try {
    await db.$queryRaw`SELECT 1`
    return NextResponse.json({ ok: true, db: "up", at: new Date().toISOString() })
  } catch (err) {
    console.error("[health]", err)
    return NextResponse.json(
      { ok: false, db: "down", at: new Date().toISOString() },
      { status: 503 }
    )
  }
}
