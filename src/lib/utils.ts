import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import type { ListingCard, PricePeriod } from "@/types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(
  price: number,
  currency: string = "KES",
  period?: PricePeriod
): string {
  const symbol = currency === "KES" ? "KSh" : "$"
  const formatted = new Intl.NumberFormat("en-KE", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price)

  const periodSuffix: Record<PricePeriod, string> = {
    NIGHTLY: "/night",
    WEEKLY: "/wk",
    MONTHLY: "/mo",
    YEARLY: "/yr",
  }

  const suffix = period ? ` ${periodSuffix[period]}` : ""
  return `${symbol} ${formatted}${suffix}`
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat("en-KE").format(n)
}

export function getListingPrimaryPhoto(listing: ListingCard): string {
  return listing.primaryPhoto ?? "/images/listing-placeholder.jpg"
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim()
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength).trimEnd() + "…"
}

export function bedroomLabel(bedrooms: number | null): string {
  if (bedrooms === null) return "Studio"
  if (bedrooms === 0) return "Studio"
  return `${bedrooms} bed${bedrooms !== 1 ? "s" : ""}`
}

export function sizeLabelSqft(sqft: number | null): string | null {
  if (!sqft) return null
  return `${formatNumber(sqft)} sq ft`
}

export function getInitials(name: string | null): string {
  if (!name) return "?"
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

export function timeAgo(date: string | Date): string {
  const now = new Date()
  const d = new Date(date)
  const seconds = Math.floor((now.getTime() - d.getTime()) / 1000)

  if (seconds < 60) return "just now"
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  if (seconds < 2592000) return `${Math.floor(seconds / 86400)}d ago`
  return d.toLocaleDateString("en-KE", { month: "short", day: "numeric", year: "numeric" })
}

export function buildSearchParams(filters: Record<string, unknown>): URLSearchParams {
  const params = new URLSearchParams()
  Object.entries(filters).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return
    if (Array.isArray(value)) {
      value.forEach((v) => params.append(key, String(v)))
    } else {
      params.set(key, String(value))
    }
  })
  return params
}
