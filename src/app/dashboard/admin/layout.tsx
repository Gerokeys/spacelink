import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { Navbar } from "@/components/layout/Navbar"
import Link from "next/link"
import { LayoutDashboard, List, Users, MessageSquare, ShieldCheck } from "lucide-react"

const NAV = [
  { href: "/dashboard/admin", icon: LayoutDashboard, label: "Overview" },
  { href: "/dashboard/admin/listings", icon: List, label: "Listings" },
  { href: "/dashboard/admin/users", icon: Users, label: "Users" },
  { href: "/dashboard/admin/inquiries", icon: MessageSquare, label: "Inquiries" },
]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  if (!session) redirect("/login")
  if (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN") redirect("/")

  return (
    <>
      <Navbar />
      <div className="flex min-h-screen bg-gray-50">
        <aside className="hidden md:flex w-56 shrink-0 flex-col border-r border-gray-200 bg-white px-3 py-6 gap-1">
          <div className="flex items-center gap-2 px-3 mb-4">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-semibold text-gray-900">Admin Panel</span>
          </div>
          {NAV.map(({ href, icon: Icon, label }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          ))}
        </aside>
        <main className="flex-1 min-w-0 p-6">{children}</main>
      </div>
    </>
  )
}
