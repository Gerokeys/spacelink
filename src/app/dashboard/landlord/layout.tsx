import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { Navbar } from "@/components/layout/Navbar"
import Link from "next/link"
import { LayoutDashboard, List, MessageSquare, Settings } from "lucide-react"

const NAV = [
  { href: "/dashboard/landlord", icon: LayoutDashboard, label: "Overview" },
  { href: "/dashboard/landlord/listings/new", icon: List, label: "New Listing" },
  { href: "/dashboard/landlord/inquiries", icon: MessageSquare, label: "Inquiries" },
  { href: "/dashboard/landlord/settings", icon: Settings, label: "Settings" },
]

export default async function LandlordDashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  if (!session) redirect("/login?callbackUrl=/dashboard/landlord")

  return (
    <>
      <Navbar />
      <div className="flex min-h-screen bg-gray-50">
        {/* Desktop sidebar */}
        <aside className="hidden md:flex w-56 shrink-0 flex-col border-r border-gray-200 bg-white px-3 py-6 gap-1">
          {NAV.map(({ href, icon: Icon, label }) => (
            <Link key={href} href={href}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          ))}
        </aside>

        <div className="flex-1 min-w-0 flex flex-col">
          {/* Mobile top nav */}
          <div className="md:hidden flex items-center gap-1 px-4 py-2 bg-white border-b border-gray-200 overflow-x-auto scrollbar-hide">
            {NAV.map(({ href, icon: Icon, label }) => (
              <Link key={href} href={href}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs text-gray-600 hover:bg-gray-50 whitespace-nowrap shrink-0"
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </Link>
            ))}
          </div>
          <main className="flex-1 min-w-0">{children}</main>
        </div>
      </div>
    </>
  )
}
