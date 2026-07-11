"use client"

import { useState } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { Mail, MessageSquare, Calendar, CheckCircle, XCircle, Phone } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { timeAgo, cn, toWhatsAppNumber } from "@/lib/utils"

type InquiryStatus = "PENDING" | "RESPONDED" | "CLOSED" | "ARCHIVED"

interface InquiryRow {
  id: string
  message: string
  phone: string | null
  status: InquiryStatus
  moveInDate: string | null
  createdAt: string
  listing: { id: string; title: string; city: string }
  tenant: { name: string | null; email: string | null }
}

const FILTERS: { label: string; value: InquiryStatus | "ALL" }[] = [
  { label: "All", value: "ALL" },
  { label: "Pending", value: "PENDING" },
  { label: "Responded", value: "RESPONDED" },
  { label: "Closed", value: "CLOSED" },
]

const STATUS_BADGE: Record<InquiryStatus, { label: string; variant: "warning" | "success" | "secondary" }> = {
  PENDING: { label: "Pending", variant: "warning" },
  RESPONDED: { label: "Responded", variant: "success" },
  CLOSED: { label: "Closed", variant: "secondary" },
  ARCHIVED: { label: "Archived", variant: "secondary" },
}

export function InquiriesManager({ initialInquiries }: { initialInquiries: InquiryRow[] }) {
  const [inquiries, setInquiries] = useState(initialInquiries)
  const [filter, setFilter] = useState<InquiryStatus | "ALL">("ALL")
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  async function updateStatus(id: string, status: InquiryStatus) {
    setUpdatingId(id)
    try {
      const res = await fetch(`/api/inquiries/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      setInquiries((prev) => prev.map((i) => (i.id === id ? { ...i, status } : i)))
      toast.success(status === "RESPONDED" ? "Marked as responded" : "Inquiry closed")
    } catch {
      toast.error("Failed to update inquiry")
    } finally {
      setUpdatingId(null)
    }
  }

  const filtered = filter === "ALL" ? inquiries : inquiries.filter((i) => i.status === filter)
  const pendingCount = inquiries.filter((i) => i.status === "PENDING").length

  return (
    <div>
      {/* Filter tabs */}
      <div className="flex items-center gap-1 mb-5 overflow-x-auto scrollbar-hide">
        {FILTERS.map(({ label, value }) => (
          <button
            key={value}
            onClick={() => setFilter(value)}
            className={cn(
              "px-3.5 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors",
              filter === value
                ? "bg-brand-600 text-white"
                : "text-gray-600 hover:bg-gray-100"
            )}
          >
            {label}
            {value === "PENDING" && pendingCount > 0 && (
              <span className={cn("ml-1.5 text-xs", filter === value ? "text-white/80" : "text-brand-600 font-semibold")}>
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl text-center py-20 px-6">
          <MessageSquare className="w-10 h-10 mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500 font-medium mb-1">
            {filter === "ALL" ? "No inquiries yet" : `No ${filter.toLowerCase()} inquiries`}
          </p>
          <p className="text-sm text-gray-400">
            When tenants reach out about your listings, their messages will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((inquiry) => {
            const badge = STATUS_BADGE[inquiry.status]
            return (
              <div key={inquiry.id} className="bg-white border border-gray-200 rounded-xl p-5">
                {/* Header row */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-gray-900">
                        {inquiry.tenant.name ?? inquiry.tenant.email ?? "Tenant"}
                      </span>
                      <Badge variant={badge.variant}>{badge.label}</Badge>
                    </div>
                    <Link
                      href={`/listings/${inquiry.listing.id}`}
                      className="text-sm text-brand-600 hover:underline"
                    >
                      re: {inquiry.listing.title}
                    </Link>
                  </div>
                  <span className="text-xs text-gray-400 shrink-0">{timeAgo(inquiry.createdAt)}</span>
                </div>

                {/* Message */}
                <p className="text-sm text-gray-600 whitespace-pre-wrap bg-gray-50 rounded-lg p-3.5 mb-3">
                  {inquiry.message}
                </p>

                {/* Move-in date */}
                {inquiry.moveInDate && (
                  <p className="flex items-center gap-1.5 text-xs text-gray-500 mb-3">
                    <Calendar className="w-3.5 h-3.5" />
                    Preferred move-in:{" "}
                    {new Date(inquiry.moveInDate).toLocaleDateString("en-KE", {
                      year: "numeric", month: "long", day: "numeric",
                    })}
                  </p>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 flex-wrap">
                  {toWhatsAppNumber(inquiry.phone) && (
                    <a
                      href={`https://wa.me/${toWhatsAppNumber(inquiry.phone)}?text=${encodeURIComponent(
                        `Hi ${inquiry.tenant.name ?? ""}, thanks for your inquiry about "${inquiry.listing.title}" on Locale. `
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button size="sm" className="gap-1.5 bg-[#25D366] hover:bg-[#1EBE5A] text-white">
                        <Phone className="w-3.5 h-3.5" /> Reply on WhatsApp
                      </Button>
                    </a>
                  )}
                  {inquiry.tenant.email && (
                    <a href={`mailto:${inquiry.tenant.email}?subject=${encodeURIComponent(`Re: ${inquiry.listing.title} — Locale`)}`}>
                      <Button size="sm" variant="outline" className="gap-1.5">
                        <Mail className="w-3.5 h-3.5" /> Reply by email
                      </Button>
                    </a>
                  )}
                  {inquiry.status === "PENDING" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5"
                      disabled={updatingId === inquiry.id}
                      onClick={() => updateStatus(inquiry.id, "RESPONDED")}
                    >
                      <CheckCircle className="w-3.5 h-3.5" /> Mark responded
                    </Button>
                  )}
                  {inquiry.status !== "CLOSED" && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="gap-1.5 text-gray-500"
                      disabled={updatingId === inquiry.id}
                      onClick={() => updateStatus(inquiry.id, "CLOSED")}
                    >
                      <XCircle className="w-3.5 h-3.5" /> Close
                    </Button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
