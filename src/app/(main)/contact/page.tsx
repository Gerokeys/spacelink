import { Mail, MapPin, MessageSquare } from "lucide-react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Get in touch with the SpaceLink team.",
}

export default function ContactPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-2xl min-h-[60vh]">
      <h1 className="text-3xl font-bold text-gray-900 mb-3">Contact us</h1>
      <p className="text-gray-600 mb-10">
        Questions, feedback, or a problem with a listing? We&apos;d love to hear from you.
      </p>

      <div className="space-y-4">
        <a
          href="mailto:hello@spacelink.co.ke"
          className="flex items-start gap-4 bg-white border border-gray-200 rounded-xl p-5 hover:border-brand-300 transition-colors"
        >
          <div className="w-10 h-10 rounded-lg bg-brand-50 flex items-center justify-center shrink-0">
            <Mail className="w-5 h-5 text-brand-600" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">Email</h2>
            <p className="text-sm text-gray-500 mt-0.5">hello@spacelink.co.ke</p>
            <p className="text-xs text-gray-400 mt-1">We usually respond within one business day.</p>
          </div>
        </a>

        <div className="flex items-start gap-4 bg-white border border-gray-200 rounded-xl p-5">
          <div className="w-10 h-10 rounded-lg bg-brand-50 flex items-center justify-center shrink-0">
            <MessageSquare className="w-5 h-5 text-brand-600" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">About a listing</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Use the inquiry form on the listing page — your message goes directly to the landlord.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-4 bg-white border border-gray-200 rounded-xl p-5">
          <div className="w-10 h-10 rounded-lg bg-brand-50 flex items-center justify-center shrink-0">
            <MapPin className="w-5 h-5 text-brand-600" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">Office</h2>
            <p className="text-sm text-gray-500 mt-0.5">Nairobi, Kenya</p>
          </div>
        </div>
      </div>
    </div>
  )
}
