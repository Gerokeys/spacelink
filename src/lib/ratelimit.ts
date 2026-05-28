import { NextResponse } from "next/server"

/**
 * Simple in-memory sliding window rate limiter.
 *
 * ⚠️  In-memory only — does NOT persist across serverless function instances.
 * For production on Vercel, replace with @upstash/ratelimit + Upstash Redis:
 *   npm i @upstash/ratelimit @upstash/redis
 *   https://github.com/upstash/ratelimit
 */

type Entry = { count: number; resetAt: number }
const store = new Map<string, Entry>()

// Periodically purge expired entries to prevent memory leaks
const CLEANUP_INTERVAL = 10 * 60 * 1000 // 10 min
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of store) {
      if (now > entry.resetAt) store.delete(key)
    }
  }, CLEANUP_INTERVAL)
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetIn: number // ms until window resets
}

export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now()
  const entry = store.get(key)

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, remaining: limit - 1, resetIn: windowMs }
  }

  if (entry.count >= limit) {
    return { allowed: false, remaining: 0, resetIn: entry.resetAt - now }
  }

  entry.count++
  return { allowed: true, remaining: limit - entry.count, resetIn: entry.resetAt - now }
}

export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for")
  if (forwarded) return forwarded.split(",")[0].trim()
  return req.headers.get("x-real-ip") ?? "unknown"
}

export function tooManyRequests(resetIn: number) {
  return NextResponse.json(
    { success: false, error: "Too many requests. Please try again later." },
    {
      status: 429,
      headers: {
        "Retry-After": String(Math.ceil(resetIn / 1000)),
      },
    }
  )
}

// Pre-defined limits used across the app
export const LIMITS = {
  // Public actions
  INQUIRY:        { limit: 5,   windowMs: 60 * 60 * 1000 },       // 5 per hour
  LISTING_CREATE: { limit: 10,  windowMs: 24 * 60 * 60 * 1000 },  // 10 per day
  SEARCH:         { limit: 120, windowMs: 60 * 1000 },             // 120 per minute

  // Admin actions — higher limit, still protected
  ADMIN_ACTION:   { limit: 60,  windowMs: 60 * 1000 },             // 60 per minute
}
