"use client"

import { useState } from "react"
import { toast } from "sonner"
import { CheckCircle, XCircle, Eye, Clock, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatPrice } from "@/lib/utils"
import Link from "next/link"

type ListingStatus = "PENDING" | "ACTIVE" | "REJECTED" | "DRAFT" | "PAUSED" | "ARCHIVED"

interface Listing {
  id: string
  title: string
  type: string
  status: ListingStatus
  price: number
  currency: string
  city: string
  neighbourhood: string | null
  createdAt: string
  rejectedReason: string | null
  owner: { name: string | null; email: string | null }
}

interface Props {
  listings: Listing[]
  activeStatus: string
}

const STATUS_TABS: { value: string; label: string }[] = [
  { value: "PENDING", label: "Pending" },
  { value: "ACTIVE", label: "Active" },
  { value: "REJECTED", label: "Rejected" },
  { value: "ALL", label: "All" },
]

const STATUS_STYLES: Record<ListingStatus, { label: string; className: string }> = {
  PENDING: { label: "Pending", className: "bg-amber-100 text-amber-700" },
  ACTIVE: { label: "Active", className: "bg-green-100 text-green-700" },
  REJECTED: { label: "Rejected", className: "bg-red-100 text-red-700" },
  DRAFT: { label: "Draft", className: "bg-gray-100 text-gray-600" },
  PAUSED: { label: "Paused", className: "bg-blue-100 text-blue-700" },
  ARCHIVED: { label: "Archived", className: "bg-gray-100 text-gray-500" },
}

export function ListingsManager({ listings: initial, activeStatus }: Props) {
  const [listings, setListings] = useState(initial)
  const [rejectModal, setRejectModal] = useState<{ id: string; title: string } | null>(null)
  const [rejectReason, setRejectReason] = useState("")
  const [loading, setLoading] = useState<string | null>(null)

  async function handleAction(id: string, action: "approve" | "reject", reason?: string) {
    setLoading(id)
    try {
      const res = await fetch(`/api/admin/listings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, reason }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)

      setListings((prev) =>
        prev.map((l) =>
          l.id === id
            ? { ...l, status: action === "approve" ? "ACTIVE" : "REJECTED", rejectedReason: reason ?? null }
            : l
        )
      )
      toast.success(action === "approve" ? "Listing approved and live!" : "Listing rejected.")
      setRejectModal(null)
      setRejectReason("")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Action failed")
    } finally {
      setLoading(null)
    }
  }

  const filtered = activeStatus === "ALL" ? listings : listings.filter((l) => l.status === activeStatus)

  return (
    <div>
      {/* Status tabs */}
      <div className="flex gap-1 mb-6 border-b border-gray-200">
        {STATUS_TABS.map(({ value, label }) => {
          const count = value === "ALL" ? listings.length : listings.filter((l) => l.status === value).length
          return (
            <Link
              key={value}
              href={`/dashboard/admin/listings?status=${value}`}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
                activeStatus === value
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {label}
              {count > 0 && (
                <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${activeStatus === value ? "bg-indigo-100 text-indigo-700" : "bg-gray-100 text-gray-500"}`}>
                  {count}
                </span>
              )}
            </Link>
          )
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 py-16 text-center text-gray-400">
          <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-40" />
          <p>No listings in this category</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-400 border-b border-gray-100 bg-gray-50">
                <th className="text-left px-5 py-3 font-medium">Listing</th>
                <th className="text-left px-5 py-3 font-medium">Owner</th>
                <th className="text-left px-5 py-3 font-medium">Type</th>
                <th className="text-left px-5 py-3 font-medium">Price</th>
                <th className="text-left px-5 py-3 font-medium">Status</th>
                <th className="text-left px-5 py-3 font-medium">Submitted</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((listing) => {
                const statusStyle = STATUS_STYLES[listing.status]
                return (
                  <tr key={listing.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="font-medium text-gray-900 max-w-[200px] truncate">{listing.title}</div>
                      <div className="text-xs text-gray-400">{listing.neighbourhood ? `${listing.neighbourhood}, ` : ""}{listing.city}</div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="text-gray-700">{listing.owner.name ?? "—"}</div>
                      <div className="text-xs text-gray-400">{listing.owner.email}</div>
                    </td>
                    <td className="px-5 py-4 text-gray-500">{listing.type}</td>
                    <td className="px-5 py-4 font-medium text-gray-900">{formatPrice(listing.price, listing.currency)}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusStyle.className}`}>
                        {listing.status === "PENDING" && <Clock className="w-3 h-3" />}
                        {listing.status === "ACTIVE" && <CheckCircle className="w-3 h-3" />}
                        {listing.status === "REJECTED" && <XCircle className="w-3 h-3" />}
                        {statusStyle.label}
                      </span>
                      {listing.rejectedReason && (
                        <div className="text-xs text-red-500 mt-0.5 max-w-[160px] truncate" title={listing.rejectedReason}>
                          {listing.rejectedReason}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-4 text-gray-400 text-xs">
                      {new Date(listing.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2 justify-end">
                        <Link href={`/listings/${listing.id}`} target="_blank">
                          <Button variant="ghost" size="icon-sm" title="Preview">
                            <Eye className="w-3.5 h-3.5" />
                          </Button>
                        </Link>
                        {listing.status === "PENDING" && (
                          <>
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 text-white h-7 px-2.5 text-xs"
                              loading={loading === listing.id}
                              onClick={() => handleAction(listing.id, "approve")}
                            >
                              <CheckCircle className="w-3 h-3 mr-1" /> Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="danger"
                              className="h-7 px-2.5 text-xs"
                              onClick={() => setRejectModal({ id: listing.id, title: listing.title })}
                            >
                              <XCircle className="w-3 h-3 mr-1" /> Reject
                            </Button>
                          </>
                        )}
                        {listing.status === "REJECTED" && (
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white h-7 px-2.5 text-xs"
                            loading={loading === listing.id}
                            onClick={() => handleAction(listing.id, "approve")}
                          >
                            Re-approve
                          </Button>
                        )}
                        {listing.status === "ACTIVE" && (
                          <Button
                            size="sm"
                            variant="danger"
                            className="h-7 px-2.5 text-xs"
                            onClick={() => setRejectModal({ id: listing.id, title: listing.title })}
                          >
                            Reject
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Reject modal */}
      {rejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h3 className="font-semibold text-gray-900 mb-1">Reject listing</h3>
            <p className="text-sm text-gray-500 mb-4 truncate">"{rejectModal.title}"</p>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reason (shown to landlord)</label>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              placeholder="e.g. Incomplete description, missing photos, address unclear..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none mb-4"
            />
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => { setRejectModal(null); setRejectReason("") }}>
                Cancel
              </Button>
              <Button
                variant="danger"
                loading={loading === rejectModal.id}
                onClick={() => handleAction(rejectModal.id, "reject", rejectReason || undefined)}
              >
                Confirm Reject
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
