import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { InquiriesManager } from "./InquiriesManager"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Inquiries" }

export default async function LandlordInquiriesPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect("/login?callbackUrl=/dashboard/landlord/inquiries")

  const inquiries = await db.inquiry.findMany({
    where: { landlordId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      listing: { select: { id: true, title: true, city: true } },
      tenant: { select: { name: true, email: true } },
    },
  })

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Inquiries</h1>
        <p className="text-gray-500 text-sm mt-1">
          Messages from tenants interested in your listings
        </p>
      </div>

      <InquiriesManager
        initialInquiries={inquiries.map((i) => ({
          id: i.id,
          message: i.message,
          status: i.status,
          moveInDate: i.moveInDate?.toISOString() ?? null,
          createdAt: i.createdAt.toISOString(),
          listing: i.listing,
          tenant: i.tenant,
        }))}
      />
    </div>
  )
}
