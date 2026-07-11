import { db } from "@/lib/db"
import { formatPrice } from "@/lib/utils"
import Link from "next/link"
import { List, Users, MessageSquare, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react"

async function getStats() {
  const [
    pendingListings,
    activeListings,
    rejectedListings,
    totalUsers,
    totalInquiries,
    recentPending,
  ] = await Promise.all([
    db.listing.count({ where: { status: "PENDING" } }),
    db.listing.count({ where: { status: "ACTIVE" } }),
    db.listing.count({ where: { status: "REJECTED" } }),
    db.user.count(),
    db.inquiry.count(),
    db.listing.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { owner: { select: { name: true, email: true } } },
    }),
  ])
  return { pendingListings, activeListings, rejectedListings, totalUsers, totalInquiries, recentPending }
}

export default async function AdminOverviewPage() {
  const stats = await getStats()

  const STAT_CARDS = [
    { label: "Pending Review", value: stats.pendingListings, icon: Clock, color: "text-amber-600", bg: "bg-amber-50", href: "/dashboard/admin/listings?status=PENDING" },
    { label: "Active Listings", value: stats.activeListings, icon: CheckCircle, color: "text-green-600", bg: "bg-green-50", href: "/dashboard/admin/listings?status=ACTIVE" },
    { label: "Total Users", value: stats.totalUsers, icon: Users, color: "text-brand-600", bg: "bg-brand-50", href: "/dashboard/admin/users" },
    { label: "Total Inquiries", value: stats.totalInquiries, icon: MessageSquare, color: "text-violet-600", bg: "bg-violet-50", href: "/dashboard/admin/inquiries" },
  ]

  return (
    <div className="max-w-5xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Admin Overview</h1>
        <p className="text-gray-500 text-sm mt-1">Manage listings, users, and inquiries across Locale</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        {STAT_CARDS.map(({ label, value, icon: Icon, color, bg, href }) => (
          <Link key={label} href={href} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
            <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center mb-3`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-0.5">{value}</div>
            <div className="text-sm text-gray-500">{label}</div>
          </Link>
        ))}
      </div>

      {/* Pending listings queue */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-500" />
            Pending Review ({stats.pendingListings})
          </h2>
          <Link href="/dashboard/admin/listings?status=PENDING" className="text-sm text-brand-600 hover:text-brand-700 font-medium">
            View all →
          </Link>
        </div>

        {stats.recentPending.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-400">
            <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-400" />
            <p>All caught up — no pending listings</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[600px]">
              <thead>
                <tr className="text-xs text-gray-400 border-b border-gray-100">
                  <th className="text-left px-6 py-3 font-medium">Title</th>
                  <th className="text-left px-6 py-3 font-medium">Owner</th>
                  <th className="text-left px-6 py-3 font-medium">Type</th>
                  <th className="text-left px-6 py-3 font-medium">Price</th>
                  <th className="text-left px-6 py-3 font-medium">Submitted</th>
                  <th className="px-6 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {stats.recentPending.map((listing) => (
                  <tr key={listing.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3 font-medium text-gray-900 max-w-[200px] truncate">{listing.title}</td>
                    <td className="px-6 py-3 text-gray-500">{listing.owner.name ?? listing.owner.email}</td>
                    <td className="px-6 py-3 text-gray-500">{listing.type}</td>
                    <td className="px-6 py-3 text-gray-900">{formatPrice(listing.price, listing.currency)}</td>
                    <td className="px-6 py-3 text-gray-400">{new Date(listing.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-3">
                      <Link href="/dashboard/admin/listings?status=PENDING" className="text-brand-600 hover:text-brand-700 font-medium text-xs">
                        Review →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
