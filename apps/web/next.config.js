/** @type {import('next').NextConfig} */
const nextConfig = {
  output: process.env.VERCEL ? undefined : process.env.NODE_ENV === "production" ? "standalone" : undefined,
  transpilePackages: ["shared"],
  serverComponentsExternalPackages: ["@prisma/client", "bcrypt"],
}

const sentryDsn = process.env.NEXT_PUBLIC_SENTRY_DSN

if (sentryDsn) {
  const { withSentryConfig } = require("@sentry/nextjs")
  module.exports = withSentryConfig(nextConfig, {
    org: process.env.SENTRY_ORG,
    project: process.env.SENTRY_PROJECT,
    silent: true,
    widenClientFileUpload: true,
    hideSourceMaps: true,
    disableLogger: true,
    tunnelRoute: "/monitoring",
  })
} else {
  module.exports = nextConfig
}
