// https://docs.sentry.io/platforms/javascript/guides/nextjs/

export const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN || ""

export function initSentry() {
  if (!SENTRY_DSN) return false
  return true
}
