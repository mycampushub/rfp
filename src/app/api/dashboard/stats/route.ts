import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { getTenantContext, AuthError, PermissionError } from "@/lib/tenant-context"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const ctx = getTenantContext(session)

    const [activeRfps, pendingEvaluations, vendorResponses, approvalsPending, totalVendors] = await Promise.all([
      db.rFP.count({ where: { tenantId: ctx.tenantId, status: { in: ["published", "draft"] } } }),
      db.submission.count({ where: { rfp: { tenantId: ctx.tenantId }, status: "submitted" } }),
      db.submission.count({ where: { rfp: { tenantId: ctx.tenantId }, status: { not: "draft" } } }),
      db.approval.count({ where: { rfp: { tenantId: ctx.tenantId }, status: "pending" } }),
      db.vendor.count({ where: { tenantId: ctx.tenantId, isActive: true } }),
    ])

    return NextResponse.json({
      activeRfps,
      pendingEvaluations,
      vendorResponses,
      approvalsPending,
      totalVendors,
    })
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: 401 })
    if (error instanceof PermissionError) return NextResponse.json({ error: error.message }, { status: 403 })
    console.error("Error fetching dashboard stats:", error)
    return NextResponse.json({ error: "Failed to fetch dashboard stats" }, { status: 500 })
  }
}
