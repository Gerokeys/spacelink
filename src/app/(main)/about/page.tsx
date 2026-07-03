import Link from "next/link"
import { Building2, ShieldCheck, MapPin, MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "About SpaceLink",
  description: "SpaceLink is Kenya's modern platform for finding residential, office, and commercial spaces directly from verified landlords.",
}

const VALUES = [
  {
    icon: Building2,
    title: "Every kind of space",
    text: "Apartments, offices, shops, and short-term stays — all in one place, across Kenya's major cities.",
  },
  {
    icon: ShieldCheck,
    title: "Verified landlords",
    text: "Every listing is reviewed before it goes live, and landlords can verify their identity for extra trust.",
  },
  {
    icon: MapPin,
    title: "Search that understands Nairobi",
    text: "Filter by neighbourhood, budget, and amenities — with real map locations for every listing.",
  },
  {
    icon: MessageSquare,
    title: "Direct to the landlord",
    text: "No brokers in the middle. Your inquiry goes straight to the person who owns the space.",
  },
]

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <h1 className="text-3xl font-bold text-gray-900 mb-3">About SpaceLink</h1>
      <p className="text-gray-600 leading-relaxed mb-10">
        SpaceLink is Kenya&apos;s modern platform for finding a space to live and work.
        We connect tenants directly with verified landlords — no agents, no viewing fees,
        no runaround. Whether you&apos;re looking for a bedsitter in Roysambu, an office in
        Westlands, or a shop along Ngong Road, SpaceLink helps you find it, see it, and
        secure it faster.
      </p>

      <div className="grid sm:grid-cols-2 gap-5 mb-12">
        {VALUES.map(({ icon: Icon, title, text }) => (
          <div key={title} className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="w-10 h-10 rounded-lg bg-brand-50 flex items-center justify-center mb-3">
              <Icon className="w-5 h-5 text-brand-600" />
            </div>
            <h2 className="font-semibold text-gray-900 mb-1">{title}</h2>
            <p className="text-sm text-gray-500 leading-relaxed">{text}</p>
          </div>
        ))}
      </div>

      <div className="bg-brand-600 rounded-2xl p-8 text-center">
        <h2 className="text-xl font-bold text-white mb-2">Ready to find your space?</h2>
        <p className="text-brand-100 text-sm mb-5">
          Browse hundreds of listings, or post your own in minutes.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link href="/search">
            <Button variant="secondary">Browse listings</Button>
          </Link>
          <Link href="/dashboard/landlord/listings/new">
            <Button className="bg-white text-brand-700 hover:bg-brand-50">List a space</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
