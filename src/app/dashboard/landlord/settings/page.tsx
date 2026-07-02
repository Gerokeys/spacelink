import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { SettingsForm } from "./SettingsForm"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Settings" }

export default async function LandlordSettingsPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect("/login?callbackUrl=/dashboard/landlord/settings")

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      email: true,
      phone: true,
      profile: {
        select: { company: true, bio: true, website: true, city: true, idVerificationStatus: true },
      },
    },
  })

  if (!user) redirect("/login")

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 text-sm mt-1">
          Your public profile — tenants see this on your listings
        </p>
      </div>

      <SettingsForm
        initial={{
          name: user.name ?? "",
          email: user.email ?? "",
          phone: user.phone ?? "",
          company: user.profile?.company ?? "",
          bio: user.profile?.bio ?? "",
          website: user.profile?.website ?? "",
          city: user.profile?.city ?? "",
          idVerificationStatus: user.profile?.idVerificationStatus ?? "UNVERIFIED",
        }}
      />
    </div>
  )
}
