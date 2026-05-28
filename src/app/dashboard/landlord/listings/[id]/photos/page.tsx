import { getServerSession } from "next-auth"
import { redirect, notFound } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { PhotoUploader } from "@/components/media/PhotoUploader"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft, ArrowRight, CheckCircle } from "lucide-react"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Add Photos" }

interface Props { params: Promise<{ id: string }> }

export default async function ListingPhotosPage({ params }: Props) {
  const session = await getServerSession(authOptions)
  if (!session) redirect("/login")

  const { id } = await params

  const listing = await db.listing.findUnique({
    where: { id },
    include: {
      media: { where: { type: "PHOTO" }, orderBy: [{ isPrimary: "desc" }, { order: "asc" }] },
    },
  })

  if (!listing || listing.ownerId !== session.user.id) notFound()

  const photos = listing.media.map((m) => ({
    id: m.id,
    cdnUrl: m.cdnUrl ?? m.url,
    isPrimary: m.isPrimary,
    order: m.order,
  }))

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link href="/dashboard/landlord" className="text-sm text-stone-500 hover:text-stone-700 flex items-center gap-1 mb-4">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to dashboard
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-stone-900">Add photos</h1>
            <p className="text-stone-500 text-sm mt-1 max-w-lg">
              Great photos get more inquiries. Add at least 3 photos — the first one becomes the cover image.
            </p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {photos.length >= 3 ? (
              <span className="flex items-center gap-1.5 text-sm text-teal-600 font-medium">
                <CheckCircle className="w-4 h-4" /> {photos.length} photos added
              </span>
            ) : (
              <span className="text-sm text-amber-600 font-medium">
                {photos.length}/3 minimum
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Listing title card */}
      <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 mb-6 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-teal-100 flex items-center justify-center shrink-0">
          <CheckCircle className="w-4 h-4 text-teal-600" />
        </div>
        <div className="min-w-0">
          <p className="font-medium text-stone-900 truncate">{listing.title}</p>
          <p className="text-xs text-stone-400">{listing.city}{listing.neighbourhood ? ` · ${listing.neighbourhood}` : ""} · Submitted for review</p>
        </div>
      </div>

      {/* Uploader */}
      <PhotoUploader listingId={id} initialPhotos={photos} />

      {/* Done button */}
      <div className="mt-8 flex justify-end">
        <Link href="/dashboard/landlord">
          <Button size="lg" className="gap-2">
            Done — go to dashboard <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </div>
    </div>
  )
}
