import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Providers } from "./providers"

const inter = Inter({ subsets: ["latin"] })

// maximumScale suppresses the mobile auto-zoom on input focus; browsers
// still allow user-initiated pinch zoom regardless of this value
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
}

const SITE_URL =
  process.env.NEXT_PUBLIC_APP_URL?.startsWith("http")
    ? process.env.NEXT_PUBLIC_APP_URL
    : "https://locale.co.ke"

export const metadata: Metadata = {
  // Makes the generated opengraph-image / icon URLs absolute when shared
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Locale — Find Your Perfect Space in Kenya",
    template: "%s | Locale",
  },
  description:
    "Discover residential, office, and commercial spaces across Kenya. Verified listings, map search, and direct contact with landlords.",
  keywords: ["property Kenya", "houses for rent Kenya", "houses for rent Nairobi", "office space Kenya", "commercial property Kenya"],
  openGraph: {
    type: "website",
    locale: "en_KE",
    siteName: "Locale",
  },
  twitter: {
    card: "summary_large_image",
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen flex flex-col antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
