import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { getTenantContext, AuthError } from "@/lib/tenant-context"
import { buildCsv, csvResponse, jsonDataResponse } from "@/lib/csv-builder"

// GET /api/export/analytics?format=csv|json
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const ctx = getTenantContext(session)

    const { searchParams } = new URL(request.url)
    const format = searchParams.get("format") ?? "csv"

    // 1. RFP counts by status
    const rfpStatusGroups = await db.rFP.groupBy({
      by: ["status"],
      where: { tenantId: ctx.tenantId },
      _count: { id: true },
    })

    const statusRows = rfpStatusGroups.map((g) => [
      "RFPs by Status",
      g.status,
      g._count.id,
      "",
      "",
    ])

    // 2. Vendor response rates per RFP
    const rfpsWithCounts = await db.rFP.findMany({
      where: { tenantId: ctx.tenantId },
      select: {
        id: true,
        title: true,
        status: true,
        responseCount: true,
        _count: { select: { submissions: true, invitations: true } },
      },
    })

    const vendorResponseRows = rfpsWithCounts.map((rfp) => {
      const invited = rfp._count.invitations
      const submitted = rfp._count.submissions
      const rate = invited > 0 ? Math.round((submitted / invited) * 100) / 100 : 0
      return [
        "Vendor Response Rate",
        rfp.title,
        rfp.status,
        `Invited: ${invited}, Submitted: ${submitted}`,
        `${rate}%`,
      ]
    })

    // 3. Average evaluation scores per RFP
    const avgScores = await db.score.findMany({
      where: {
        submission: { rfp: { tenantId: ctx.tenantId } },
      },
      select: {
        scoreValue: true,
        submission: {
          select: { rfpId: true },
        },
      },
    })

    // Group by rfpId and compute average
    const rfpScoreMap = new Map<string, number[]>()
    for (const s of avgScores) {
      const rfpId = s.submission.rfpId
      if (!rfpScoreMap.has(rfpId)) rfpScoreMap.set(rfpId, [])
      rfpScoreMap.get(rfpId)!.push(s.scoreValue)
    }

    const rfpTitles = new Map(
      rfpsWithCounts.map((r) => [r.id, r.title])
    )

    const scoreRows = Array.from(rfpScoreMap.entries()).map(([rfpId, scores]) => {
      const avg =
        scores.length > 0
          ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100) /
            100
          : 0
      return [
        "Average Evaluation Score",
        rfpTitles.get(rfpId) ?? rfpId,
        "",
        `${scores.length} scores`,
        String(avg),
      ]
    })

    const headers = ["Metric", "Name", "Status", "Details", "Value"]
    const allRows = [
      // Section separator for RFP status
      ["--- RFP Counts by Status ---", "", "", "", ""],
      ...statusRows,
      ["", "", "", "", ""],
      ["--- Vendor Response Rates ---", "", "", "", ""],
      ...vendorResponseRows,
      ["", "", "", "", ""],
      ["--- Average Evaluation Scores ---", "", "", "", ""],
      ...scoreRows,
    ]

    if (format === "json") {
      return jsonDataResponse({
        rfpCountsByStatus: rfpStatusGroups.map((g) => ({
          status: g.status,
          count: g._count.id,
        })),
        vendorResponseRates: rfpsWithCounts.map((rfp) => {
          const invited = rfp._count.invitations
          const submitted = rfp._count.submissions
          return {
            rfpTitle: rfp.title,
            status: rfp.status,
            invited,
            submitted,
            responseRate:
              invited > 0
                ? Math.round((submitted / invited) * 100) / 100
                : 0,
          }
        }),
        averageScores: Array.from(rfpScoreMap.entries()).map(
          ([rfpId, scores]) => ({
            rfpTitle: rfpTitles.get(rfpId) ?? rfpId,
            scoreCount: scores.length,
            averageScore:
              scores.length > 0
                ? Math.round(
                    (scores.reduce((a, b) => a + b, 0) / scores.length) * 100
                  ) / 100
                : 0,
          })
        ),
      })
    }

    return csvResponse(buildCsv(headers, allRows), "analytics-export.csv")
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    console.error("Error exporting analytics:", error)
    return NextResponse.json(
      { error: "Failed to export analytics" },
      { status: 500 }
    )
  }
}
