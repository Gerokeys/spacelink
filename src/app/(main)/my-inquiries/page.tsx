import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { MessageSquare, Search, Calendar } from "lucide-react"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { timeAgo } from "@/lib/utils"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "My Inquiries" }

const STATUS_BADGE: Record<string, { label: string; variant: "warning" | "success" | "secondary" }> = {
  PENDING: { label: "Waiting for reply", variant: "warning" },
  RESPONDED: { label: "Landlord replied", variant: "success" },
  CLOSED: { label: "Closed", variant: "secondary" },
  ARCHIVED: { label: "Archived", variant: "secondary" },
}

export default async function MyInquiriesPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect("/login?callbackUrl=/my-inquiries")

  const inquiries = await db.inquiry.findMany({
    where: { tenantId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      listing: {
        select: {
          id: true,
          title: true,
          city: true,
          neighbourhood: true,
          status: true,
          media: { where: { isPrimary: true }, take: 1, select: { cdnUrl: true, url: true } },
        },
      },
    },
  })

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl min-h-[60vh]">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My inquiries</h1>
        <p className="text-gray-500 text-sm mt-1">
          Messages you&apos;ve sent to landlords and their status
        </p>
      </div>

      {inquiries.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl text-center py-20 px-6">
          <MessageSquare className="w-10 h-10 mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500 font-medium mb-1">No inquiries yet</p>
          <p className="text-sm text-gray-400 mb-6">
            When you contact a landlord about a listing, it will show up here.
          </p>
          <Link href="/search">
            <Button className="gap-2">
              <Search className="w-4 h-4" /> Browse listings
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {inquiries.map((inquiry) => {
            const badge = STATUS_BADGE[inquiry.status] ?? STATUS_BADGE.PENDING
            const photo = inquiry.listing.media[0]?.cdnUrl ?? inquiry.listing.media[0]?.url
            const listingGone = inquiry.listing.status !== "ACTIVE"
            return (
              <div key={inquiry.id} className="bg-white border border-gray-200 rounded-xl p-4 flex gap-4">
                <div className="w-20 h-20 rounded-lg bg-gray-100 shrink-0 overflow-hidden">
                  {photo && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={photo} alt="" className="w-full h-full object-cover" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    {listingGone ? (
                      <span className="font-medium text-gray-500 text-sm truncate">
                        {inquiry.listing.title}{" "}
                        <span className="text-xs text-gray-400">(no longer available)</span>
                      </span>
                    ) : (
                      <Link
                        href={`/listings/${inquiry.listing.id}`}
                        className="font-medium text-gray-900 text-sm truncate hover:text-brand-600"
                      >
                        {inquiry.listing.title}
                      </Link>
                    )}
                    <Badge variant={badge.variant} className="shrink-0">{badge.label}</Badge>
                  </div>
                  <p className="text-xs text-gray-400 mb-2">
                    {[inquiry.listing.neighbourhood, inquiry.listing.city].filter(Boolean).join(", ")}
                    {" · "}sent {timeAgo(inquiry.createdAt)}
                  </p>
                  <p className="text-sm text-gray-600 line-clamp-2">{inquiry.message}</p>
                  {inquiry.moveInDate && (
                    <p className="flex items-center gap-1 text-xs text-gray-400 mt-1.5">
                      <Calendar className="w-3 h-3" />
                      Preferred move-in:{" "}
                      {new Date(inquiry.moveInDate).toLocaleDateString("en-KE", {
                        year: "numeric", month: "long", day: "numeric",
                      })}
                    </p>
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
