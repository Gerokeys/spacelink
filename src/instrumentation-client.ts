import * as Sentry from "@sentry/nextjs"

// No-op when NEXT_PUBLIC_SENTRY_DSN is unset (e.g. local dev)
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
  replaysOnErrorSampleRate: 0,
  replaysSessionSampleRate: 0,
})

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart
