import { db } from "@/lib/db"
import { ListingsManager } from "./ListingsManager"

interface Props {
  searchParams: Promise<{ status?: string }>
}

export default async function AdminListingsPage({ searchParams }: Props) {
  const { status = "PENDING" } = await searchParams

  const listings = await db.listing.findMany({
    orderBy: { createdAt: "desc" },
    include: { owner: { select: { name: true, email: true } } },
  })

  const serialized = listings.map((l) => ({
    id: l.id,
    title: l.title,
    type: l.type,
    status: l.status,
    price: l.price,
    currency: l.currency,
    city: l.city,
    neighbourhood: l.neighbourhood,
    createdAt: l.createdAt.toISOString(),
    rejectedReason: l.rejectedReason,
    owner: { name: l.owner.name, email: l.owner.email },
  }))

  return (
    <div className="max-w-6xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Listings</h1>
        <p className="text-gray-500 text-sm mt-1">Approve or reject submitted listings</p>
      </div>
      <ListingsManager listings={serialized} activeStatus={status} />
    </div>
  )
}
