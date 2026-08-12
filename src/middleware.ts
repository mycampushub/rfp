import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request })
  const { pathname } = request.nextUrl

  // Security headers on all responses
  const response = NextResponse.next()
  response.headers.set("X-Frame-Options", "DENY")
  response.headers.set("X-Content-Type-Options", "nosniff")
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")
  response.headers.set("X-XSS-Protection", "1; mode=block")
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
  // HSTS — only in production
  if (process.env.NODE_ENV === "production") {
    response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
  }

  // CSRF protection for mutating API requests (non-GET, non-HEAD, non-OPTIONS)
  if (pathname.startsWith("/api/") && !pathname.startsWith("/api/auth/")) {
    const method = request.method.toUpperCase()
    if (method !== "GET" && method !== "HEAD" && method !== "OPTIONS") {
      const origin = request.headers.get("origin")
      const host = request.headers.get("host")
      // Allow requests with no origin (server-to-server, same-origin fetch)
      // but block cross-origin requests with a mismatched origin
      if (origin) {
        const allowedOrigins = [
          `http://${host}`,
          `https://${host}`,
        ]
        if (!allowedOrigins.includes(origin)) {
          return NextResponse.json(
            { error: "Forbidden: cross-origin request blocked" },
            { status: 403 }
          )
        }
      }
    }

    // Rate limit API routes
    const { rateLimit } = await import("@/lib/rate-limiter")
    const identifier = token?.sub || request.headers.get('x-forwarded-for') || "anonymous"
    const rl = rateLimit(`api:${identifier}:${pathname}`, 100, 60_000) // 100 req/min
    if (!rl.success) {
      return NextResponse.json(
        { error: "Too many requests" },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)),
            "X-RateLimit-Remaining": "0",
          },
        }
      )
    }
    response.headers.set("X-RateLimit-Remaining", String(rl.remaining))
  }

  // Public routes that don't require authentication
  const publicRoutes = [
    "/", "/auth/signin", "/auth/signup", "/auth/error", "/api/health", "/submit",
    "/about", "/careers", "/blog", "/contact", "/help", "/api-docs", "/status", "/privacy", "/terms"
  ]
  const isPublicRoute = publicRoutes.some(route =>
    pathname === route || pathname.startsWith(route + "/")
  )

  // NextAuth API routes should always be accessible
  const isAuthRoute = pathname.startsWith("/api/auth/")

  // If accessing a public route or auth route, allow through
  if (isPublicRoute || isAuthRoute) {
    return response
  }

  // If no token and accessing protected route, redirect to signin
  if (!token) {
    const url = new URL("/auth/signin", request.url)
    url.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(url)
  }

  // RBAC: Admin routes require admin role
  const adminRoutes = ["/admin"]
  const isAdminRoute = adminRoutes.some(route => pathname.startsWith(route))
  if (isAdminRoute) {
    const roleNames = (token.roleNames as string[]) || []
    const isAdmin = roleNames.some((name: string) => /admin/i.test(name))
    if (!isAdmin) {
      return NextResponse.redirect(new URL("/dashboard", request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
}