import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { AuthError, PermissionError } from "@/lib/tenant-context"
import { requireSystemAdmin } from "@/lib/auth-utils"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    await requireSystemAdmin()

    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"))
    const limit = Math.min(200, Math.max(1, parseInt(searchParams.get("limit") || "50")))
    const skip = (page - 1) * limit
    const tenantId = searchParams.get("tenantId")
    const targetType = searchParams.get("targetType")
    const action = searchParams.get("action")

    const where: Record<string, unknown> = {}
    if (tenantId) where.tenantId = tenantId
    if (targetType) where.targetType = targetType
    if (action) where.action = action

    const [logs, total] = await Promise.all([
      db.activityLog.findMany({
        where,
        orderBy: { timestamp: "desc" },
        take: limit,
        skip,
      }),
      db.activityLog.count({ where }),
    ])

    return NextResponse.json({
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: 401 })
    if (error instanceof PermissionError) return NextResponse.json({ error: error.message }, { status: 403 })
    console.error("Error fetching admin audit logs:", error)
    return NextResponse.json({ error: "Failed to fetch audit logs" }, { status: 500 })
  }
}
