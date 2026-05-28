"use client"

import Link from "next/link"
import Image from "next/image"
import { useSession, signOut } from "next-auth/react"
import { useState } from "react"
import { Menu, X, Search, Heart, LayoutDashboard, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function Navbar() {
  const { data: session } = useSession()
  const [mobileOpen, setMobileOpen] = useState(false)
  const isLandlord = session?.user.role === "LANDLORD" || session?.user.role === "AGENT"
  const isAdmin = session?.user.role === "ADMIN" || session?.user.role === "SUPER_ADMIN"

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/95 backdrop-blur-sm">
      <div className="container mx-auto px-4 h-20 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center shrink-0 overflow-hidden h-20">
          <Image
            src="/images/logo.png"
            alt="SpaceLink"
            width={220}
            height={80}
            className="h-28 w-auto scale-125 border-2 border-red-500 rounded"
            priority
          />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          <Link href="/search?type=RESIDENTIAL" className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors">
            Residential
          </Link>
          <Link href="/search?type=OFFICE" className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors">
            Office
          </Link>
          <Link href="/search?type=COMMERCIAL" className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors">
            Commercial
          </Link>
          <Link href="/search?type=SHORT_TERM" className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors">
            Short-term
          </Link>
        </nav>

        {/* Desktop actions */}
        <div className="hidden md:flex items-center gap-2">
          {session ? (
            <>
              <Link href="/saved">
                <Button variant="ghost" size="icon-sm">
                  <Heart className="w-4 h-4" />
                </Button>
              </Link>
              {isAdmin && (
                <Link href="/dashboard/admin">
                  <Button variant="ghost" size="sm">Admin</Button>
                </Link>
              )}
              {(isLandlord || isAdmin) ? (
                <Link href="/dashboard/landlord">
                  <Button variant="ghost" size="sm" className="flex items-center gap-1.5">
                    <LayoutDashboard className="w-4 h-4" />
                    Dashboard
                  </Button>
                </Link>
              ) : null}
              <Link href="/dashboard/landlord/listings/new">
                <Button size="sm" className="flex items-center gap-1.5">
                  <Plus className="w-4 h-4" />
                  List a Space
                </Button>
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="text-sm text-gray-500 hover:text-gray-700 px-2"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="outline" size="sm">Sign in</Button>
              </Link>
              <Link href="/dashboard/landlord/listings/new">
                <Button size="sm">List a Space</Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu toggle */}
        <button
          className="md:hidden p-2 rounded-lg hover:bg-gray-100"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white px-4 py-4 space-y-1">
          {[
            { href: "/search?type=RESIDENTIAL", label: "Residential" },
            { href: "/search?type=OFFICE", label: "Office Spaces" },
            { href: "/search?type=COMMERCIAL", label: "Commercial" },
            { href: "/search?type=SHORT_TERM", label: "Short-term" },
          ].map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="block px-3 py-2.5 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
              onClick={() => setMobileOpen(false)}
            >
              {label}
            </Link>
          ))}
          <div className="pt-3 border-t border-gray-100 space-y-2">
            {session ? (
              <>
                <Link href="/saved" className="block">
                  <Button variant="outline" size="sm" className="w-full justify-start gap-2">
                    <Heart className="w-4 h-4" /> Saved
                  </Button>
                </Link>
                <Link href="/dashboard/landlord" className="block">
                  <Button variant="outline" size="sm" className="w-full justify-start gap-2">
                    <LayoutDashboard className="w-4 h-4" /> Dashboard
                  </Button>
                </Link>
                <Link href="/dashboard/landlord/listings/new" className="block">
                  <Button size="sm" className="w-full justify-start gap-2">
                    <Plus className="w-4 h-4" /> List a Space
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Link href="/login" className="block">
                  <Button variant="outline" size="sm" className="w-full">Sign in</Button>
                </Link>
                <Link href="/dashboard/landlord/listings/new" className="block">
                  <Button size="sm" className="w-full">List a Space</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
