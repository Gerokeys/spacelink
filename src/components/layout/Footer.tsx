import Link from "next/link"
import { Home, MapPin, Mail } from "lucide-react"

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
    { label: "About SpaceLink", href: "/about" },
    { label: "Contact us", href: "/contact" },
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms of Service", href: "/terms" },
  ],
}

export function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400">
      <div className="container mx-auto px-4 pt-14 pb-8">

        {/* Main grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 pb-10 border-b border-slate-800">

          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center shrink-0">
                <Home className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-white text-lg">SpaceLink</span>
            </Link>
            <p className="text-sm leading-relaxed mb-5">
              Kenya's modern platform for finding residential, office, and commercial spaces — directly from verified landlords.
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-500" />
                Nairobi, Kenya
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 shrink-0 text-slate-500" />
                hello@spacelink.co.ke
              </div>
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(LINKS).map(([heading, links]) => (
            <div key={heading}>
              <h4 className="text-white font-semibold text-sm mb-4">{heading}</h4>
              <ul className="space-y-2.5">
                {links.map(({ label, href }) => (
                  <li key={label}>
                    <Link
                      href={href}
                      className="text-sm hover:text-white transition-colors"
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
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-6 text-xs">
          <p>© {new Date().getFullYear()} SpaceLink Technologies Ltd. All rights reserved.</p>
          <p className="flex items-center gap-1">
            <MapPin className="w-3 h-3" /> Built in Nairobi, Kenya
          </p>
        </div>

      </div>
    </footer>
  )
}
