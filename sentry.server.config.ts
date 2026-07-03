import * as Sentry from "@sentry/nextjs"

// No-op when SENTRY_DSN is unset (e.g. local dev)
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 0.1,
})
