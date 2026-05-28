import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { CreateListingForm } from "./CreateListingForm"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Post a New Listing" }

export default async function NewListingPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect("/login?callbackUrl=/dashboard/landlord/listings/new")

  const amenities = await db.amenity.findMany({ orderBy: [{ category: "asc" }, { name: "asc" }] })

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Post a new listing</h1>
        <p className="text-gray-500 text-sm mt-1">Fill in the details below. Your listing will go live after a quick review.</p>
      </div>
      <CreateListingForm amenities={amenities} />
    </div>
  )
}
