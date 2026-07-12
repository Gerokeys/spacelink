"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import { useEffect, useState } from "react"
import { Menu, X, Heart, MessageSquare, LayoutDashboard, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/layout/Logo"
import { cn, getInitials } from "@/lib/utils"

export function Navbar() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  const isLandlord = session?.user.role === "LANDLORD" || session?.user.role === "AGENT"
  const isAdmin = session?.user.role === "ADMIN" || session?.user.role === "SUPER_ADMIN"

  // Homepage: navbar floats transparent over the hero, turns solid on scroll
  const overlay = pathname === "/"

  useEffect(() => {
    if (!overlay) return
    const onScroll = () => setScrolled(window.scrollY > 16)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [overlay])

  // Close the mobile menu whenever the route changes
  useEffect(() => setMobileOpen(false), [pathname])

  const transparent = overlay && !scrolled && !mobileOpen

  return (
    <header
      className={cn(
        "top-0 z-50 w-full transition-colors duration-300",
        overlay ? "fixed" : "sticky",
        transparent
          ? "bg-transparent border-b border-transparent"
          : "bg-white/95 backdrop-blur-sm border-b border-gray-200"
      )}
    >
      <div className="container relative mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Mobile: hamburger (left) */}
        <button
          className={cn(
            "md:hidden p-2 rounded-lg transition-colors",
            transparent ? "text-white hover:bg-white/10" : "text-gray-700 hover:bg-gray-100"
          )}
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        {/* Logo — centered on mobile, left on desktop */}
        <Link
          href="/"
          aria-label="Locale home"
          className="absolute left-1/2 -translate-x-1/2 md:static md:translate-x-0 flex items-center shrink-0"
        >
          <Logo onDark={transparent} className="text-2xl" />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {[
            { href: "/search?type=RESIDENTIAL", label: "Residential" },
            { href: "/search?type=OFFICE", label: "Office" },
            { href: "/search?type=COMMERCIAL", label: "Commercial" },
            { href: "/search?type=SHORT_TERM", label: "Short-term" },
          ].map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "px-3 py-2 text-sm rounded-lg transition-colors",
                transparent
                  ? "text-white/85 hover:text-white hover:bg-white/10"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              )}
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Desktop actions */}
        <div className="hidden md:flex items-center gap-2">
          {session ? (
            <>
              <Link href="/saved" aria-label="Saved listings" title="Saved listings">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className={transparent ? "text-white hover:bg-white/10" : undefined}
                >
                  <Heart className="w-4 h-4" />
                </Button>
              </Link>
              <Link href="/my-inquiries" aria-label="My inquiries" title="My inquiries">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className={transparent ? "text-white hover:bg-white/10" : undefined}
                >
                  <MessageSquare className="w-4 h-4" />
                </Button>
              </Link>
              {isAdmin && (
                <Link href="/dashboard/admin">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={transparent ? "text-white hover:bg-white/10" : undefined}
                  >
                    Admin
                  </Button>
                </Link>
              )}
              {(isLandlord || isAdmin) ? (
                <Link href="/dashboard/landlord">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "flex items-center gap-1.5",
                      transparent && "text-white hover:bg-white/10"
                    )}
                  >
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
                className={cn(
                  "text-sm px-2 transition-colors",
                  transparent ? "text-white/70 hover:text-white" : "text-gray-500 hover:text-gray-700"
                )}
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button
                  variant="outline"
                  size="sm"
                  className={transparent ? "border-white/40 bg-transparent text-white hover:bg-white/10" : undefined}
                >
                  Sign in
                </Button>
              </Link>
              <Link href="/dashboard/landlord/listings/new">
                <Button size="sm">List a Space</Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile right slot: Sign in when signed out (encourages sign-ups),
            account avatar when signed in */}
        <div className="md:hidden">
          {session ? (
            <Link
              href={(isLandlord || isAdmin) ? "/dashboard/landlord" : "/saved"}
              aria-label="Your account"
              className={cn(
                "flex items-center justify-center w-9 h-9 rounded-full text-sm font-semibold shrink-0 border",
                transparent
                  ? "bg-white/15 text-white border-white/40"
                  : "bg-brand-600 text-white border-brand-600"
              )}
            >
              {getInitials(session.user.name ?? null)}
            </Link>
          ) : (
            <Link href="/login">
              <Button
                size="sm"
                variant={transparent ? "outline" : "default"}
                className={transparent ? "border-white/40 bg-transparent text-white hover:bg-white/10" : undefined}
              >
                Sign in
              </Button>
            </Link>
          )}
        </div>
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
                <Link href="/my-inquiries" className="block">
                  <Button variant="outline" size="sm" className="w-full justify-start gap-2">
                    <MessageSquare className="w-4 h-4" /> My inquiries
                  </Button>
                </Link>
                {(isLandlord || isAdmin) && (
                  <Link href="/dashboard/landlord" className="block">
                    <Button variant="outline" size="sm" className="w-full justify-start gap-2">
                      <LayoutDashboard className="w-4 h-4" /> Dashboard
                    </Button>
                  </Link>
                )}
                <Link href="/dashboard/landlord/listings/new" className="block">
                  <Button size="sm" className="w-full justify-start gap-2">
                    <Plus className="w-4 h-4" /> List a Space
                  </Button>
                </Link>
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="w-full text-left px-3 py-2 text-sm text-gray-500 hover:text-gray-700"
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="block">
                  <Button size="sm" className="w-full">Sign in</Button>
                </Link>
                <Link href="/dashboard/landlord/listings/new" className="block">
                  <Button variant="outline" size="sm" className="w-full">List a Space</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
