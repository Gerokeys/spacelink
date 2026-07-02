import { Resend } from "resend"

const FROM = process.env.EMAIL_FROM ?? "SpaceLink <noreply@spacelink.co.ke>"
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"

// Lazy-initialize so a missing key doesn't crash the build
function getResend() {
  const key = process.env.RESEND_API_KEY
  if (!key || key === "re_xxxx") return null
  return new Resend(key)
}

// User-supplied values must be escaped before interpolation into email HTML
function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

export async function sendInquiryNotification({
  landlordEmail,
  landlordName,
  tenantName,
  tenantEmail,
  tenantPhone,
  listingTitle,
  listingId,
  message,
  moveInDate,
}: {
  landlordEmail: string
  landlordName: string
  tenantName: string
  tenantEmail: string
  tenantPhone: string
  listingTitle: string
  listingId: string
  message: string
  moveInDate?: string
}) {
  const resend = getResend()
  if (!resend) return

  await resend.emails.send({
    from: FROM,
    to: landlordEmail,
    subject: `New inquiry for "${listingTitle}" — SpaceLink`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a1a2e;">New Inquiry Received</h2>
        <p>Hello ${esc(landlordName)},</p>
        <p>You have a new inquiry for your listing: <strong>${esc(listingTitle)}</strong></p>
        <div style="background: #f5f5f5; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <p><strong>From:</strong> ${esc(tenantName)}</p>
          <p><strong>Email:</strong> ${esc(tenantEmail)}</p>
          <p><strong>Phone:</strong> ${esc(tenantPhone)}</p>
          ${moveInDate ? `<p><strong>Preferred move-in:</strong> ${esc(moveInDate)}</p>` : ""}
          <p><strong>Message:</strong></p>
          <p style="white-space: pre-wrap;">${esc(message)}</p>
        </div>
        <a href="${APP_URL}/dashboard/landlord/inquiries"
           style="display: inline-block; background: #4f46e5; color: white; padding: 12px 24px;
                  border-radius: 6px; text-decoration: none; margin-top: 8px;">
          View in Dashboard
        </a>
        <p style="color: #999; font-size: 12px; margin-top: 24px;">
          SpaceLink · Nairobi, Kenya
        </p>
      </div>
    `,
  })
}

export async function sendInquiryConfirmation({
  tenantEmail,
  tenantName,
  listingTitle,
  listingId,
}: {
  tenantEmail: string
  tenantName: string
  listingTitle: string
  listingId: string
}) {
  const resend = getResend()
  if (!resend) return

  await resend.emails.send({
    from: FROM,
    to: tenantEmail,
    subject: `Your inquiry was sent — SpaceLink`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a1a2e;">Inquiry Sent!</h2>
        <p>Hi ${esc(tenantName)},</p>
        <p>Your inquiry for <strong>${esc(listingTitle)}</strong> has been sent to the landlord.
           They'll get back to you soon.</p>
        <a href="${APP_URL}/listings/${listingId}"
           style="display: inline-block; background: #4f46e5; color: white; padding: 12px 24px;
                  border-radius: 6px; text-decoration: none; margin-top: 8px;">
          View Listing
        </a>
        <p style="color: #999; font-size: 12px; margin-top: 24px;">
          SpaceLink · <a href="${APP_URL}">spacelink.co.ke</a>
        </p>
      </div>
    `,
  })
}

export async function sendListingApproved({
  ownerEmail,
  ownerName,
  listingTitle,
  listingId,
}: {
  ownerEmail: string
  ownerName: string
  listingTitle: string
  listingId: string
}) {
  const resend = getResend()
  if (!resend) return

  await resend.emails.send({
    from: FROM,
    to: ownerEmail,
    subject: `Your listing is live — SpaceLink`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a1a2e;">Your listing is live!</h2>
        <p>Hi ${esc(ownerName)},</p>
        <p><strong>${esc(listingTitle)}</strong> has been approved and is now live on SpaceLink.</p>
        <a href="${APP_URL}/listings/${listingId}"
           style="display: inline-block; background: #4f46e5; color: white; padding: 12px 24px;
                  border-radius: 6px; text-decoration: none; margin-top: 8px;">
          View Your Listing
        </a>
        <p style="color: #999; font-size: 12px; margin-top: 24px;">
          SpaceLink · <a href="${APP_URL}">spacelink.co.ke</a>
        </p>
      </div>
    `,
  })
}
