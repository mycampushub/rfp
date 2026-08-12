import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { getTenantContext, AuthError } from "@/lib/tenant-context"
import { buildCsv, csvResponse, jsonDataResponse } from "@/lib/csv-builder"

// GET /api/export/evaluations/[rfpId]?format=csv|json
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ rfpId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const ctx = getTenantContext(session)

    const { rfpId } = await params

    // Verify the RFP belongs to the tenant
    const rfp = await db.rFP.findUnique({
      where: { id: rfpId },
      select: { tenantId: true },
    })
    if (!rfp || rfp.tenantId !== ctx.tenantId) {
      return NextResponse.json({ error: "RFP not found" }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const format = searchParams.get("format") ?? "csv"

    // Fetch all scores for this RFP with vendor, evaluator, and criterion info
    const scores = await db.score.findMany({
      where: {
        submission: { rfpId },
      },
      include: {
        submission: {
          select: {
            vendor: { select: { name: true } },
          },
        },
        evaluator: {
          select: { name: true },
        },
        criterion: {
          select: { label: true, weight: true },
        },
      },
      orderBy: [
        { submission: { vendor: { name: "asc" } } },
        { criterion: { label: "asc" } },
      ],
    })

    const headers = [
      "Vendor Name",
      "Evaluator Name",
      "Criterion",
      "Score",
      "Weight",
      "Weighted Score",
    ]

    const rows = scores.map((s) => [
      s.submission.vendor.name,
      s.evaluator.name ?? "",
      s.criterion.label,
      s.scoreValue,
      s.criterion.weight,
      // Weighted score = score * weight
      Math.round(s.scoreValue * s.criterion.weight * 100) / 100,
    ])

    if (format === "json") {
      return jsonDataResponse(
        scores.map((s) => ({
          vendorName: s.submission.vendor.name,
          evaluatorName: s.evaluator.name ?? "",
          criterion: s.criterion.label,
          score: s.scoreValue,
          weight: s.criterion.weight,
          weightedScore:
            Math.round(s.scoreValue * s.criterion.weight * 100) / 100,
        }))
      )
    }

    return csvResponse(
      buildCsv(headers, rows),
      `evaluation-${rfpId}-export.csv`
    )
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    console.error("Error exporting evaluations:", error)
    return NextResponse.json(
      { error: "Failed to export evaluations" },
      { status: 500 }
    )
  }
}
