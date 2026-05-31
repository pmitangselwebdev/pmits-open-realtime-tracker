export function corsHeaders(origin?: string | null) {
  const allowedOrigins = [
    process.env.NEXT_PUBLIC_APP_URL,
    ...(process.env.CORS_ORIGINS?.split(",") ?? []),
  ].filter(Boolean) as string[]

  const origin_header = origin && allowedOrigins.includes(origin) ? origin : allowedOrigins[0] ?? "*"

  return {
    "Access-Control-Allow-Origin": origin_header,
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
  }
}

export function handleCORS(origin?: string | null) {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(origin),
  })
}
