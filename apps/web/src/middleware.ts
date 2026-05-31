import { getToken } from "next-auth/jwt"
import { NextRequest, NextResponse } from "next/server"
import { corsHeaders, handleCORS } from "@/lib/cors"

export async function middleware(req: NextRequest) {
  if (req.method === "OPTIONS") {
    return handleCORS(req.headers.get("origin"))
  }

  const origin = req.headers.get("origin")
  const { pathname } = req.nextUrl

  if (pathname.startsWith("/api/")) {
    const response = NextResponse.next()
    if (origin) {
      const headers = corsHeaders(origin)
      Object.entries(headers).forEach(([key, value]) => {
        response.headers.set(key, value)
      })
    }
    return response
  }

  const token = await getToken({ req })

  const authPages = ["/login", "/register"]
  const isAuthPage = authPages.some((p) => pathname.startsWith(p))

  if (token && isAuthPage) {
    return NextResponse.redirect(new URL("/dashboard", req.url))
  }

  if (!token && pathname.startsWith("/dashboard")) {
    const loginUrl = new URL("/login", req.url)
    loginUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/dashboard/:path*", "/login", "/register", "/api/:path*"],
}
