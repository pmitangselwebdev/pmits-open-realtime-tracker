"use client"

import { useEffect } from "react"
import { SENTRY_DSN } from "@/lib/sentry"

export function SentryProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (typeof window !== "undefined" && SENTRY_DSN) {
      const Sentry = require("@sentry/nextjs")
      Sentry.init({
        dsn: SENTRY_DSN,
        tracesSampleRate: 0.1,
        environment: process.env.NODE_ENV,
        integrations: [Sentry.browserTracingIntegration()],
      })
    }
  }, [])

  return <>{children}</>
}
