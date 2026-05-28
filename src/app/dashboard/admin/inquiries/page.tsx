import { db } from "@/lib/db"
import { MessageSquare, Clock, CheckCircle } from "lucide-react"
import Link from "next/link"

const STATUS_STYLES = {
  PENDING: "bg-amber-100 text-amber-700",
  RESPONDED: "bg-green-100 text-green-700",
  CLOSED: "bg-gray-100 text-gray-600",
  ARCHIVED: "bg-gray-100 text-gray-400",
}

export default async function AdminInquiriesPage() {
  const inquiries = await db.inquiry.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      listing: { select: { title: true, city: true } },
      tenant: { select: { name: true, email: true } },
    },
  })

  const counts = {
    PENDING: inquiries.filter((i) => i.status === "PENDING").length,
    RESPONDED: inquiries.filter((i) => i.status === "RESPONDED").length,
    CLOSED: inquiries.filter((i) => i.status === "CLOSED").length,
  }

  return (
    <div className="max-w-6xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Inquiries</h1>
        <p className="text-gray-500 text-sm mt-1">All tenant inquiries across the platform</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Pending", count: counts.PENDING, icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
          { label: "Responded", count: counts.RESPONDED, icon: CheckCircle, color: "text-green-600", bg: "bg-green-50" },
          { label: "Closed", count: counts.CLOSED, icon: MessageSquare, color: "text-gray-500", bg: "bg-gray-50" },
        ].map(({ label, count, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center`}>
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <div>
              <div className="text-xl font-bold text-gray-900">{count}</div>
              <div className="text-xs text-gray-500">{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-gray-400 border-b border-gray-100 bg-gray-50">
              <th className="text-left px-5 py-3 font-medium">Tenant</th>
              <th className="text-left px-5 py-3 font-medium">Listing</th>
              <th className="text-left px-5 py-3 font-medium">Message</th>
              <th className="text-left px-5 py-3 font-medium">Status</th>
              <th className="text-left px-5 py-3 font-medium">Date</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {inquiries.map((inquiry) => (
              <tr key={inquiry.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-5 py-4">
                  <div className="font-medium text-gray-900">{inquiry.tenant.name ?? "—"}</div>
                  <div className="text-xs text-gray-400">{inquiry.tenant.email}</div>
                </td>
                <td className="px-5 py-4">
                  <div className="text-gray-800 max-w-[180px] truncate">{inquiry.listing.title}</div>
                  <div className="text-xs text-gray-400">{inquiry.listing.city}</div>
                </td>
                <td className="px-5 py-4">
                  <p className="text-gray-600 max-w-[220px] truncate text-xs">{inquiry.message}</p>
                </td>
                <td className="px-5 py-4">
                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[inquiry.status]}`}>
                    {inquiry.status}
                  </span>
                </td>
                <td className="px-5 py-4 text-gray-400 text-xs">
                  {new Date(inquiry.createdAt).toLocaleDateString()}
                </td>
                <td className="px-5 py-4">
                  <Link
                    href={`/listings/${inquiry.listingId}`}
                    target="_blank"
                    className="text-indigo-600 hover:text-indigo-700 text-xs font-medium"
                  >
                    View listing →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {inquiries.length === 0 && (
          <div className="py-16 text-center text-gray-400">
            <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p>No inquiries yet</p>
          </div>
        )}
      </div>
    </div>
  )
}
