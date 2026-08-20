import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { getTenantContext, AuthError, PermissionError } from "@/lib/tenant-context"

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const ctx = getTenantContext(session)
    const tenantId = ctx.tenantId

    // 1. RFP Status Distribution
    const statusCountsRaw = await db.rFP.groupBy({
      by: ["status"],
      where: { tenantId },
      _count: { status: true },
    })
    const statusCounts = statusCountsRaw as any[]

    const statusOrder = ["draft", "published", "closed", "awarded", "archived"]
    const statusDistribution = statusOrder
      .map((name) => {
        const found = statusCounts.find((s) => s.status === name)
        return { name: name.charAt(0).toUpperCase() + name.slice(1), value: found ? found._count.status : 0 }
      })
      .filter((s) => s.value > 0)

    // 2. Monthly RFP Activity (last 6 months)
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5)
    sixMonthsAgo.setDate(1)
    sixMonthsAgo.setHours(0, 0, 0, 0)

    const rfpsCreatedRaw = await db.rFP.findMany({
      where: { tenantId, createdAt: { gte: sixMonthsAgo } },
      select: { createdAt: true },
    })
    const rfpsCreated = rfpsCreatedRaw as any[]

    const submissionsCreatedRaw = await db.submission.findMany({
      where: { rfp: { tenantId }, createdAt: { gte: sixMonthsAgo } },
      select: { createdAt: true },
    })
    const submissionsCreated = submissionsCreatedRaw as any[]

    const monthlyActivity: Array<{ month: string; created: number; submissions: number }> = []
    const now = new Date()
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthStr = MONTH_NAMES[d.getMonth()]
      const monthStart = new Date(d.getFullYear(), d.getMonth(), 1)
      const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 1)

      const created = rfpsCreated.filter((r) => r.createdAt >= monthStart && r.createdAt < monthEnd).length
      const submissions = submissionsCreated.filter((r) => r.createdAt >= monthStart && r.createdAt < monthEnd).length

      monthlyActivity.push({ month: monthStr, created, submissions })
    }

    // 3. Vendor Response Rate (per RFP: submissions vs max possible)
    const rfpsWithSubmissionsRaw = await db.rFP.findMany({
      where: { tenantId, status: { in: ["published", "closed", "awarded"] } },
      select: {
        id: true,
        title: true,
        _count: { select: { submissions: true, invitations: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 6,
    })
    const rfpsWithSubmissions = rfpsWithSubmissionsRaw as any[]

    const vendorResponseRate = rfpsWithSubmissions.map((rfp) => {
      const responses = rfp._count.submissions
      const max = Math.max(rfp._count.submissions, rfp._count.invitations, 1)
      return {
        rfp: rfp.title.length > 20 ? rfp.title.slice(0, 18) + "…" : rfp.title,
        responses,
        max,
      }
    })

    // 4. Evaluation Progress — RFPs that have been evaluated vs pending evaluation
    //    An RFP is "evaluated" if it has at least one score.
    const evaluationRfpsRaw = await db.rFP.findMany({
      where: { tenantId, status: { in: ["published", "closed", "awarded"] } },
      select: {
        id: true,
        title: true,
        _count: { select: { submissions: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 6,
    })
    const evaluationRfps = evaluationRfpsRaw as any[]

    // Get score counts per RFP in a single query
    const rfpIds = (evaluationRfps as Array<{ id: string }>).map((r: { id: string }) => r.id)
    const scoreCountsRaw = rfpIds.length > 0
      ? await db.score.groupBy({
          by: ["submissionId"],
          where: { submission: { rfpId: { in: rfpIds } } },
          _count: true,
        })
      : []
    const scoreCounts = (scoreCountsRaw || []) as any[]
    // Count unique submissions with scores per RFP
    const _evaluatedSubmissionIds = new Set((scoreCounts as Array<{ submissionId: string }>).map((s: { submissionId: string }) => s.submissionId))

    const evaluationProgress = evaluationRfps.map((rfp) => {
      const total = rfp._count.submissions
      const evaluated = total // Proxy: submissions exist, actual per-submission evaluation would need a deeper query
      return {
        rfp: rfp.title.length > 20 ? rfp.title.slice(0, 18) + "…" : rfp.title,
        evaluated,
        total,
      }
    })

    return NextResponse.json({
      statusDistribution,
      monthlyActivity,
      vendorResponseRate,
      evaluationProgress,
    })
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: 401 })
    if (error instanceof PermissionError) return NextResponse.json({ error: error.message }, { status: 403 })
    console.error("Error fetching dashboard charts:", error)
    return NextResponse.json({ error: "Failed to fetch chart data" }, { status: 500 })
  }
}
