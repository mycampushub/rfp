import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request })
  const { pathname } = request.nextUrl

  // Public routes that don't require authentication
  const publicRoutes = ["/", "/auth/signin", "/auth/signup", "/api/health", "/submit"]
  const isPublicRoute = publicRoutes.some(route => 
    pathname === route || pathname.startsWith(route + "/")
  )

  // NextAuth API routes should always be accessible
  const isAuthRoute = pathname.startsWith("/api/auth/")

  // If accessing a public route or auth route, allow through
  if (isPublicRoute || isAuthRoute) {
    return NextResponse.next()
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
    const roleIds: string[] = Array.isArray(token.roleIds) ? token.roleIds as string[] : []
    const hasAdminRole = roleIds.some((id: string) => 
      id === 'admin' || id === 'system_admin' || id.startsWith('admin_')
    )
    if (!hasAdminRole) {
      return NextResponse.redirect(new URL("/dashboard", request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
}