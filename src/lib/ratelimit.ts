import { NextResponse } from "next/server"
import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

/**
 * Rate limiting.
 *
 * When UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN are set (production),
 * uses Upstash Redis so limits hold across serverless instances.
 * Otherwise falls back to an in-memory sliding window (fine for local dev,
 * useless across serverless instances).
 */

const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null

// One Ratelimit instance per limit/window combination, cached by config key
const limiters = new Map<string, Ratelimit>()

function getLimiter(limit: number, windowMs: number): Ratelimit | null {
  if (!redis) return null
  const cfgKey = `${limit}:${windowMs}`
  let limiter = limiters.get(cfgKey)
  if (!limiter) {
    limiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(limit, `${windowMs} ms`),
      prefix: "rl",
    })
    limiters.set(cfgKey, limiter)
  }
  return limiter
}

// ── In-memory fallback ────────────────────────────────────────────────────────

type Entry = { count: number; resetAt: number }
const store = new Map<string, Entry>()

const CLEANUP_INTERVAL = 10 * 60 * 1000 // 10 min
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of store) {
      if (now > entry.resetAt) store.delete(key)
    }
  }, CLEANUP_INTERVAL)
}

function checkInMemory(key: string, limit: number, windowMs: number): RateLimitResult {
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

// ── Public API ────────────────────────────────────────────────────────────────

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetIn: number // ms until window resets
}

export async function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  const limiter = getLimiter(limit, windowMs)
  if (!limiter) return checkInMemory(key, limit, windowMs)

  try {
    const { success, remaining, reset } = await limiter.limit(key)
    return { allowed: success, remaining, resetIn: Math.max(0, reset - Date.now()) }
  } catch (err) {
    // Redis hiccup should degrade to letting traffic through, not a 500
    console.error("[ratelimit]", err)
    return { allowed: true, remaining: limit, resetIn: windowMs }
  }
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
