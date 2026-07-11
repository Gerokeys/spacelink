import Link from "next/link"
import Image from "next/image"
import { MapPin, Mail } from "lucide-react"

const LINKS = {
  Discover: [
    { label: "Residential", href: "/search?type=RESIDENTIAL" },
    { label: "Office Spaces", href: "/search?type=OFFICE" },
    { label: "Commercial", href: "/search?type=COMMERCIAL" },
    { label: "Short-term", href: "/search?type=SHORT_TERM" },
    { label: "Browse all", href: "/search" },
  ],
  Landlords: [
    { label: "Post a listing", href: "/dashboard/landlord/listings/new" },
    { label: "Dashboard", href: "/dashboard/landlord" },
    { label: "Manage inquiries", href: "/dashboard/landlord/inquiries" },
  ],
  Company: [
    { label: "About Locale", href: "/about" },
    { label: "Contact us", href: "/contact" },
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms of Service", href: "/terms" },
  ],
}

export function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200">
      <div className="container mx-auto px-4 pt-14 pb-8">

        {/* Main grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 pb-10 border-b border-gray-100">

          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="inline-flex items-center mb-4">
              <Image
                src="/images/logo.png"
                alt="Locale"
                width={140}
                height={48}
                className="h-12 w-auto"
              />
            </Link>
            <p className="text-sm text-gray-500 leading-relaxed mb-5">
              Kenya's modern platform for finding residential, office, and commercial spaces — directly from verified landlords.
            </p>
            <div className="space-y-2 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 shrink-0 text-brand-500" />
                Nairobi, Kenya
              </div>
              <a
                href="mailto:hello@locale.co.ke"
                className="flex items-center gap-2 hover:text-brand-600 transition-colors"
              >
                <Mail className="w-3.5 h-3.5 shrink-0 text-brand-500" />
                hello@locale.co.ke
              </a>
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(LINKS).map(([heading, links]) => (
            <div key={heading}>
              <h4 className="text-gray-900 font-semibold text-sm mb-4">{heading}</h4>
              <ul className="space-y-2.5">
                {links.map(({ label, href }) => (
                  <li key={label}>
                    <Link
                      href={href}
                      className="text-sm text-gray-500 hover:text-brand-600 transition-colors"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-6 text-xs text-gray-400">
          <p>© {new Date().getFullYear()} Locale Technologies Ltd. All rights reserved.</p>
          <p className="flex items-center gap-1">
            <MapPin className="w-3 h-3 text-brand-500" /> Built in Nairobi, Kenya
          </p>
        </div>

      </div>
    </footer>
  )
}
