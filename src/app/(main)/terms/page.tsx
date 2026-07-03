import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The terms that govern your use of SpaceLink.",
}

export default function TermsPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Terms of Service</h1>
      <p className="text-sm text-gray-400 mb-10">Last updated: July 2026</p>

      <div className="space-y-8 text-gray-600 text-sm leading-relaxed [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-gray-900 [&_h2]:mb-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1">
        <section>
          <h2>1. Acceptance</h2>
          <p>
            By using SpaceLink you agree to these terms. If you do not agree, please do not use
            the platform.
          </p>
        </section>

        <section>
          <h2>2. What SpaceLink is</h2>
          <p>
            SpaceLink is a listing platform that connects tenants and landlords. We are not a
            party to any tenancy agreement, we do not own or manage the listed properties, and we
            do not handle rent or deposits. Any agreement you enter is between you and the other
            party directly.
          </p>
        </section>

        <section>
          <h2>3. Listings</h2>
          <ul>
            <li>Landlords must only post properties they are authorised to let, with accurate details and genuine photos.</li>
            <li>All listings are reviewed before publication, and we may reject or remove any listing at our discretion.</li>
            <li>Posting fraudulent or misleading listings will result in removal and account suspension.</li>
          </ul>
        </section>

        <section>
          <h2>4. Your conduct</h2>
          <ul>
            <li>Do not use the platform to spam, harass, or defraud other users.</li>
            <li>Do not attempt to circumvent platform security or scrape data.</li>
            <li>You are responsible for activity that happens under your account.</li>
          </ul>
        </section>

        <section>
          <h2>5. Safety</h2>
          <p>
            Always view a property in person and verify ownership before paying any money. Never
            send a deposit to someone you have not met or for a property you have not seen.
            SpaceLink is not liable for losses arising from dealings between users.
          </p>
        </section>

        <section>
          <h2>6. Liability</h2>
          <p>
            The platform is provided &quot;as is&quot;. To the maximum extent permitted by law,
            SpaceLink is not liable for indirect or consequential losses arising from your use of
            the platform.
          </p>
        </section>

        <section>
          <h2>7. Changes and termination</h2>
          <p>
            We may update these terms or discontinue the service. We may suspend accounts that
            breach these terms. Continued use after changes means you accept the updated terms.
          </p>
        </section>

        <section>
          <h2>8. Contact</h2>
          <p>
            Questions about these terms? Email{" "}
            <a href="mailto:hello@spacelink.co.ke" className="text-brand-600 hover:underline">hello@spacelink.co.ke</a>.
          </p>
        </section>
      </div>
    </div>
  )
}
