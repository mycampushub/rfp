import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { getTenantContext, AuthError } from "@/lib/tenant-context"
import { buildCsv, csvResponse, jsonDataResponse } from "@/lib/csv-builder"

// GET /api/export/rfps?status=published&format=csv|json
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const ctx = getTenantContext(session)

    const { searchParams } = new URL(request.url)
    const statusFilter = searchParams.get("status") ?? undefined
    const format = searchParams.get("format") ?? "csv"

    const where: Record<string, unknown> = { tenantId: ctx.tenantId }
    if (statusFilter) (where as Record<string, unknown>).status = statusFilter

    const rfpsRaw = await db.rFP.findMany({
      where,
      include: {
        timeline: { select: { submissionDeadline: true } },
        _count: { select: { submissions: true } },
      },
      orderBy: { createdAt: "desc" },
    })
    const rfps = rfpsRaw as any[]

    const headers = [
      "Title",
      "Status",
      "Budget",
      "Submission Deadline",
      "Created At",
      "Category",
      "Responses Count",
    ]

    const rows = rfps.map((rfp) => [
      rfp.title,
      rfp.status,
      rfp.budget ?? "",
      rfp.timeline?.submissionDeadline ?? "",
      rfp.createdAt.toISOString(),
      rfp.category ?? "",
      rfp._count.submissions,
    ])

    if (format === "json") {
      return jsonDataResponse(
        rfps.map((rfp) => ({
          title: rfp.title,
          status: rfp.status,
          budget: rfp.budget,
          submissionDeadline: rfp.timeline?.submissionDeadline ?? null,
          createdAt: rfp.createdAt.toISOString(),
          category: rfp.category,
          responsesCount: rfp._count.submissions,
        }))
      )
    }

    return csvResponse(buildCsv(headers, rows), "rfps-export.csv")
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    console.error("Error exporting RFPs:", error)
    return NextResponse.json({ error: "Failed to export RFPs" }, { status: 500 })
  }
}
