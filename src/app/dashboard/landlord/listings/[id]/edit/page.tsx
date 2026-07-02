import { getServerSession } from "next-auth"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, ImagePlus } from "lucide-react"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { EditListingForm } from "./EditListingForm"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Edit Listing" }

const STATUS_BADGE: Record<string, { label: string; variant: "secondary" | "warning" | "success" | "outline" | "danger" }> = {
  DRAFT: { label: "Draft", variant: "secondary" },
  PENDING: { label: "Pending Review", variant: "warning" },
  ACTIVE: { label: "Active", variant: "success" },
  PAUSED: { label: "Paused", variant: "outline" },
  REJECTED: { label: "Rejected", variant: "danger" },
  ARCHIVED: { label: "Archived", variant: "secondary" },
}

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditListingPage({ params }: Props) {
  const session = await getServerSession(authOptions)
  if (!session) redirect("/login?callbackUrl=/dashboard/landlord")

  const { id } = await params
  const listing = await db.listing.findUnique({ where: { id } })

  const canEdit =
    listing &&
    (listing.ownerId === session.user.id ||
      session.user.role === "ADMIN" ||
      session.user.role === "SUPER_ADMIN")

  if (!listing || !canEdit) notFound()

  const badge = STATUS_BADGE[listing.status] ?? { label: listing.status, variant: "secondary" as const }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Link
        href="/dashboard/landlord"
        className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mb-4"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back to dashboard
      </Link>

      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold text-gray-900">Edit listing</h1>
            <Badge variant={badge.variant}>{badge.label}</Badge>
          </div>
          <p className="text-gray-500 text-sm">Changes are saved to your listing immediately.</p>
        </div>
        <Link href={`/dashboard/landlord/listings/${id}/photos`}>
          <Button variant="outline" size="sm" className="gap-1.5 shrink-0">
            <ImagePlus className="w-4 h-4" /> Manage photos
          </Button>
        </Link>
      </div>

      {listing.status === "REJECTED" && listing.rejectedReason && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 mb-6">
          <strong>Rejected:</strong> {listing.rejectedReason}
        </div>
      )}

      <EditListingForm
        listing={{
          id: listing.id,
          status: listing.status,
          title: listing.title,
          description: listing.description,
          address: listing.address,
          neighbourhood: listing.neighbourhood ?? "",
          city: listing.city,
          price: listing.price,
          pricePeriod: listing.pricePeriod,
          deposit: listing.deposit,
          depositMonths: listing.depositMonths,
          sizeSqft: listing.sizeSqft,
          bedrooms: listing.bedrooms,
          bathrooms: listing.bathrooms,
          floor: listing.floor,
          parkingSpots: listing.parkingSpots,
          minLeaseMonths: listing.minLeaseMonths,
          availableFrom: listing.availableFrom?.toISOString().slice(0, 10) ?? "",
          furnished: listing.furnished,
          petsAllowed: listing.petsAllowed,
        }}
      />
    </div>
  )
}
