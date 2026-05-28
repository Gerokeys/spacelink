import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = process.env.EMAIL_FROM ?? "SpaceLink <noreply@spacelink.co.ke>"
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"

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
  await resend.emails.send({
    from: FROM,
    to: landlordEmail,
    subject: `New inquiry for "${listingTitle}" — SpaceLink`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a1a2e;">New Inquiry Received</h2>
        <p>Hello ${landlordName},</p>
        <p>You have a new inquiry for your listing: <strong>${listingTitle}</strong></p>

        <div style="background: #f5f5f5; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <p><strong>From:</strong> ${tenantName}</p>
          <p><strong>Email:</strong> ${tenantEmail}</p>
          <p><strong>Phone:</strong> ${tenantPhone}</p>
          ${moveInDate ? `<p><strong>Preferred move-in:</strong> ${moveInDate}</p>` : ""}
          <p><strong>Message:</strong></p>
          <p style="white-space: pre-wrap;">${message}</p>
        </div>

        <a href="${APP_URL}/dashboard/landlord/inquiries"
           style="display: inline-block; background: #6366f1; color: white; padding: 12px 24px;
                  border-radius: 6px; text-decoration: none; margin-top: 8px;">
          View in Dashboard
        </a>

        <p style="color: #999; font-size: 12px; margin-top: 24px;">
          SpaceLink · Nairobi, Kenya · <a href="${APP_URL}">spacelink.co.ke</a>
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
  await resend.emails.send({
    from: FROM,
    to: tenantEmail,
    subject: `Your inquiry was sent — SpaceLink`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a1a2e;">Inquiry Sent!</h2>
        <p>Hi ${tenantName},</p>
        <p>Your inquiry for <strong>${listingTitle}</strong> has been sent to the landlord.
           They'll get back to you soon.</p>

        <a href="${APP_URL}/listings/${listingId}"
           style="display: inline-block; background: #6366f1; color: white; padding: 12px 24px;
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
  await resend.emails.send({
    from: FROM,
    to: ownerEmail,
    subject: `Your listing is live — SpaceLink`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a1a2e;">🎉 Your listing is live!</h2>
        <p>Hi ${ownerName},</p>
        <p><strong>${listingTitle}</strong> has been approved and is now live on SpaceLink.</p>

        <a href="${APP_URL}/listings/${listingId}"
           style="display: inline-block; background: #6366f1; color: white; padding: 12px 24px;
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
