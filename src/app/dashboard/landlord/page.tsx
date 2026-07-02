import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Plus, Eye, MessageSquare, Star, TrendingUp } from "lucide-react"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatPrice, timeAgo } from "@/lib/utils"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Landlord Dashboard" }

const STATUS_BADGE: Record<string, { label: string; variant: "default" | "secondary" | "success" | "warning" | "danger" | "outline" }> = {
  DRAFT: { label: "Draft", variant: "secondary" },
  PENDING: { label: "Pending Review", variant: "warning" },
  ACTIVE: { label: "Active", variant: "success" },
  PAUSED: { label: "Paused", variant: "outline" },
  REJECTED: { label: "Rejected", variant: "danger" },
  ARCHIVED: { label: "Archived", variant: "secondary" },
}

export default async function LandlordDashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect("/login?callbackUrl=/dashboard/landlord")

  const [listings, recentInquiries] = await Promise.all([
    db.listing.findMany({
      where: { ownerId: session.user.id },
      orderBy: { createdAt: "desc" },
      include: {
        media: { where: { isPrimary: true }, take: 1 },
        _count: { select: { inquiries: true, reviews: true } },
      },
    }),
    db.inquiry.findMany({
      where: { landlordId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        listing: { select: { title: true, id: true } },
        tenant: { select: { name: true, email: true } },
      },
    }),
  ])

  const totalViews = listings.reduce((sum, l) => sum + l.viewCount, 0)
  const totalInquiries = listings.reduce((sum, l) => sum + l._count.inquiries, 0)
  const activeCount = listings.filter((l) => l.status === "ACTIVE").length

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Welcome back, {session.user.name}</p>
        </div>
        <Link href="/dashboard/landlord/listings/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            New Listing
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Active listings", value: activeCount, icon: Star },
          { label: "Total listings", value: listings.length, icon: TrendingUp },
          { label: "Total views", value: totalViews, icon: Eye },
          { label: "Total inquiries", value: totalInquiries, icon: MessageSquare },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <Icon className="w-4 h-4 text-brand-500" />
              <span className="text-xs text-gray-400">{label}</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{value.toLocaleString()}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Listings */}
        <div className="lg:col-span-2">
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">My Listings</h2>
              <span className="text-sm text-gray-400">{listings.length} total</span>
            </div>
            {listings.length === 0 ? (
              <div className="text-center py-16 px-6">
                <p className="text-gray-400 mb-4">No listings yet.</p>
                <Link href="/dashboard/landlord/listings/new">
                  <Button size="sm">Post your first listing</Button>
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {listings.map((listing) => {
                  const badge = STATUS_BADGE[listing.status] ?? { label: listing.status, variant: "secondary" as const }
                  return (
                    <div key={listing.id} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors">
                      <div className="relative w-14 h-14 rounded-lg bg-gray-100 shrink-0 overflow-hidden">
                        {listing.media[0] && (
                          <Image
                            src={listing.media[0].cdnUrl ?? listing.media[0].url}
                            alt=""
                            fill
                            sizes="56px"
                            className="object-cover"
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="font-medium text-gray-900 text-sm truncate">{listing.title}</p>
                          <Badge variant={badge.variant} className="shrink-0">{badge.label}</Badge>
                        </div>
                        <p className="text-sm text-gray-500">
                          {formatPrice(listing.price, listing.currency, listing.pricePeriod)}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
                          <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{listing.viewCount} views</span>
                          <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" />{listing._count.inquiries} inquiries</span>
                          <span>{timeAgo(listing.createdAt)}</span>
                        </div>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <Link href={`/listings/${listing.id}`}>
                          <Button variant="outline" size="sm">View</Button>
                        </Link>
                        <Link href={`/dashboard/landlord/listings/${listing.id}/edit`}>
                          <Button variant="ghost" size="sm">Edit</Button>
                        </Link>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Recent Inquiries */}
        <div>
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Recent Inquiries</h2>
              <Link href="/dashboard/landlord/inquiries" className="text-xs text-brand-600 hover:underline">
                View all
              </Link>
            </div>
            {recentInquiries.length === 0 ? (
              <div className="text-center py-12 px-4">
                <p className="text-gray-400 text-sm">No inquiries yet.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {recentInquiries.map((inq) => (
                  <div key={inq.id} className="px-5 py-4">
                    <p className="font-medium text-sm text-gray-800 mb-0.5">
                      {inq.tenant.name ?? inq.tenant.email}
                    </p>
                    <p className="text-xs text-gray-500 truncate mb-1">re: {inq.listing.title}</p>
                    <div className="flex items-center justify-between">
                      <Badge
                        variant={inq.status === "PENDING" ? "warning" : "secondary"}
                        className="text-xs"
                      >
                        {inq.status}
                      </Badge>
                      <span className="text-xs text-gray-400">{timeAgo(inq.createdAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
