import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { getTenantContext, AuthError, PermissionError } from "@/lib/tenant-context"

/**
 * GET /api/evaluations
 *
 * DERIVED / VIRTUAL ENDPOINT — There is no `Evaluation` model in the database.
 * Evaluation data is computed at query time by joining RFP, Submission, and Score records.
 *
 * An "evaluation" in this API represents an RFP that has entered the evaluation phase.
 * For each such RFP, we aggregate:
 *   - Submission count and unique vendor count
 *   - Average score across all individual scores
 *   - Status derived from the RFP's lifecycle stage:
 *       "evaluation" → "in_progress"
 *       "closed"     → "completed"
 *       other        → "pending"
 *   - The evaluation deadline from the RFP's timeline
 *
 * Because evaluations are virtual, there are no POST/PUT/DELETE handlers here.
 * Score management is handled by the /api/scores endpoints.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const ctx = getTenantContext(session)

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit

    const whereClause = { tenantId: ctx.tenantId, status: { in: ["published", "evaluation", "closed"] } }

    const [total, rfpsWithSubmissions] = await Promise.all([
      db.rFP.count({
        where: {
          ...whereClause,
          submissions: { some: { status: { not: "draft" } } },
        },
      }),
      db.rFP.findMany({
        where: whereClause,
        include: {
          _count: { select: { submissions: true } },
          submissions: {
            where: { status: { not: "draft" } },
            include: {
              vendor: { select: { id: true, name: true } },
              scores: { select: { id: true, scoreValue: true, evaluatorId: true } },
            },
          },
          timeline: true,
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip,
      }),
    ])

    const evaluations = rfpsWithSubmissions
      .filter((rfp) => rfp._count.submissions > 0)
      .map((rfp) => {
        const totalScores = rfp.submissions.flatMap((s) => s.scores)
        const avgScore = totalScores.length > 0
          ? totalScores.reduce((sum, s) => sum + (s.scoreValue || 0), 0) / totalScores.length
          : 0

        return {
          id: rfp.id,
          rfpId: rfp.id,
          rfpTitle: rfp.title,
          status: rfp.status === "evaluation" ? "in_progress" : rfp.status === "closed" ? "completed" : "pending",
          submissionCount: rfp._count.submissions,
          vendorCount: new Set(rfp.submissions.map((s) => s.vendorId)).size,
          averageScore: Math.round(avgScore * 100) / 100,
          deadline: rfp.timeline?.awardTarget || null,
          createdAt: rfp.createdAt,
        }
      })

    return NextResponse.json({
      data: evaluations,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    })
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: 401 })
    if (error instanceof PermissionError) return NextResponse.json({ error: error.message }, { status: 403 })
    console.error("Error fetching evaluations:", error)
    return NextResponse.json({ error: "Failed to fetch evaluations" }, { status: 500 })
  }
}
