import type { MetadataRoute } from "next"
import { db } from "@/lib/db"

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL?.startsWith("https")
  ? process.env.NEXT_PUBLIC_APP_URL
  : "https://locale.co.ke"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, changeFrequency: "daily", priority: 1 },
    { url: `${BASE_URL}/search`, changeFrequency: "hourly", priority: 0.9 },
    { url: `${BASE_URL}/search?type=RESIDENTIAL`, changeFrequency: "hourly", priority: 0.8 },
    { url: `${BASE_URL}/search?type=OFFICE`, changeFrequency: "hourly", priority: 0.8 },
    { url: `${BASE_URL}/search?type=COMMERCIAL`, changeFrequency: "hourly", priority: 0.8 },
    { url: `${BASE_URL}/search?type=SHORT_TERM`, changeFrequency: "hourly", priority: 0.8 },
    { url: `${BASE_URL}/qualify`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/about`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${BASE_URL}/contact`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${BASE_URL}/privacy`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${BASE_URL}/terms`, changeFrequency: "yearly", priority: 0.2 },
  ]

  try {
    const listings = await db.listing.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, updatedAt: true },
      orderBy: { publishedAt: "desc" },
      take: 5000,
    })

    return [
      ...staticPages,
      ...listings.map((l) => ({
        url: `${BASE_URL}/listings/${l.id}`,
        lastModified: l.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.7,
      })),
    ]
  } catch {
    // If the DB is unreachable, still serve the static portion
    return staticPages
  }
}
