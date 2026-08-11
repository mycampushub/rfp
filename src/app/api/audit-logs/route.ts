import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { getTenantContext, AuthError, PermissionError } from "@/lib/tenant-context"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const ctx = getTenantContext(session)

    const { searchParams } = new URL(request.url)
    const targetType = searchParams.get("targetType")
    const action = searchParams.get("action")
    const limit = parseInt(searchParams.get("limit") || "50")
    const offset = parseInt(searchParams.get("offset") || "0")

    const where: Record<string, unknown> = { tenantId: ctx.tenantId }
    if (targetType) where.targetType = targetType
    if (action) where.action = action

    const logs = await db.activityLog.findMany({
      where,
      orderBy: { timestamp: "desc" },
      take: Math.min(limit, 200),
      skip: offset,
    })
    return NextResponse.json(logs)
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: 401 })
    if (error instanceof PermissionError) return NextResponse.json({ error: error.message }, { status: 403 })
    console.error("Error fetching audit logs:", error)
    return NextResponse.json({ error: "Failed to fetch audit logs" }, { status: 500 })
  }
}
