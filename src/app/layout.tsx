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

export const metadata: Metadata = {
  title: {
    default: "SpaceLink — Find Your Perfect Space in Kenya",
    template: "%s | SpaceLink",
  },
  description:
    "Discover residential, office, and commercial spaces across Kenya. Verified listings, map search, and direct contact with landlords.",
  keywords: ["property Kenya", "houses for rent Kenya", "houses for rent Nairobi", "office space Kenya", "commercial property Kenya"],
  openGraph: {
    type: "website",
    locale: "en_KE",
    siteName: "SpaceLink",
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
