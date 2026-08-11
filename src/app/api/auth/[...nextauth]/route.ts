import { NextRequest, NextResponse } from "next/server"
import NextAuth from "next-auth"
import { authOptions } from "@/lib/auth"
import { rateLimit } from "@/lib/rate-limit"

export const dynamic = "force-dynamic"

const handler = NextAuth(authOptions)

export async function GET(request: NextRequest) {
  return handler(request)
}

export async function POST(request: NextRequest) {
  // Rate limit login attempts
  const ip = request.headers.get('x-forwarded-for') || 'unknown'
  const rateLimitResult = await rateLimit(`login:${ip}`, { maxRequests: 10, windowMs: 15 * 60 * 1000 })
  if (!rateLimitResult.success) {
    return NextResponse.json({ error: "Too many login attempts. Please try again later." }, { status: 429 })
  }

  return handler(request)
}
