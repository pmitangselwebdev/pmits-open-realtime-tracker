import { SENTRY_DSN } from "@/lib/sentry"

export function register() {
  if (process.env.NEXT_RUNTIME === "nodejs" && SENTRY_DSN) {
    const Sentry = require("@sentry/nextjs")
    Sentry.init({
      dsn: SENTRY_DSN,
      tracesSampleRate: 0.1,
      environment: process.env.NODE_ENV,
    })
  }
}
