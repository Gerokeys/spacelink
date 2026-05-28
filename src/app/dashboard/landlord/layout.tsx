import { Navbar } from "@/components/layout/Navbar"
import Link from "next/link"
import { LayoutDashboard, List, MessageSquare, Settings } from "lucide-react"

export default function LandlordDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside className="hidden md:flex w-56 shrink-0 flex-col border-r border-gray-200 bg-gray-50 px-3 py-6 gap-1">
          {[
            { href: "/dashboard/landlord", icon: LayoutDashboard, label: "Overview" },
            { href: "/dashboard/landlord/listings/new", icon: List, label: "New Listing" },
            { href: "/dashboard/landlord/inquiries", icon: MessageSquare, label: "Inquiries" },
            { href: "/dashboard/landlord/settings", icon: Settings, label: "Settings" },
          ].map(({ href, icon: Icon, label }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-gray-600 hover:bg-white hover:text-gray-900 hover:shadow-sm transition-all"
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          ))}
        </aside>
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </>
  )
}
