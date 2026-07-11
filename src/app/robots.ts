import type { MetadataRoute } from "next"

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL?.startsWith("https")
  ? process.env.NEXT_PUBLIC_APP_URL
  : "https://locale.co.ke"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/dashboard/", "/api/", "/saved", "/login"],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  }
}
