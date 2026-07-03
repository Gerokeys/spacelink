import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How SpaceLink collects, uses, and protects your personal data.",
}

export default function PrivacyPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
      <p className="text-sm text-gray-400 mb-10">Last updated: July 2026</p>

      <div className="space-y-8 text-gray-600 text-sm leading-relaxed [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-gray-900 [&_h2]:mb-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1">
        <section>
          <h2>1. Who we are</h2>
          <p>
            SpaceLink (&quot;we&quot;, &quot;us&quot;) operates a property listing platform connecting
            tenants and landlords in Kenya. We are committed to protecting your personal data in
            accordance with the Kenya Data Protection Act, 2019.
          </p>
        </section>

        <section>
          <h2>2. Data we collect</h2>
          <ul>
            <li><strong>Account data</strong> — your name, email address, and profile photo when you sign in with Google.</li>
            <li><strong>Profile data</strong> — phone number, company, bio, and city if you choose to add them.</li>
            <li><strong>Listing data</strong> — property details, photos, and map locations you provide as a landlord.</li>
            <li><strong>Inquiry data</strong> — your name, email, phone number, and message when you contact a landlord.</li>
            <li><strong>Usage data</strong> — pages visited and listings viewed, used to improve the service.</li>
          </ul>
        </section>

        <section>
          <h2>3. How we use your data</h2>
          <ul>
            <li>To operate the platform — showing listings, delivering inquiries to landlords, and managing your account.</li>
            <li>To send transactional emails, such as inquiry confirmations and listing approval notices.</li>
            <li>To keep the platform safe — reviewing listings and preventing abuse.</li>
          </ul>
          <p className="mt-2">We do not sell your personal data to third parties.</p>
        </section>

        <section>
          <h2>4. Sharing</h2>
          <p>
            When you send an inquiry, your name, email, phone number, and message are shared with
            the landlord of that listing so they can respond to you. We use trusted service
            providers (hosting, database, email, and map services) to run the platform; they
            process data only on our instructions.
          </p>
        </section>

        <section>
          <h2>5. Data retention</h2>
          <p>
            We keep your data while your account is active. You may request deletion of your
            account and associated data at any time by contacting us.
          </p>
        </section>

        <section>
          <h2>6. Your rights</h2>
          <p>
            Under the Kenya Data Protection Act, you have the right to access, correct, or delete
            your personal data, and to object to or restrict its processing. To exercise these
            rights, email <a href="mailto:hello@spacelink.co.ke" className="text-brand-600 hover:underline">hello@spacelink.co.ke</a>.
          </p>
        </section>

        <section>
          <h2>7. Changes</h2>
          <p>
            We may update this policy from time to time. Material changes will be announced on
            this page with an updated date.
          </p>
        </section>
      </div>
    </div>
  )
}
