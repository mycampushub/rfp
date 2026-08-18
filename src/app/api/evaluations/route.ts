import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { getTenantContext, AuthError, PermissionError } from "@/lib/tenant-context"

/**
 * GET /api/evaluations
 *
 * DERIVED / VIRTUAL ENDPOINT — There is no `Evaluation` model in the database.
 * Evaluation data is computed at query time by joining RFP, Submission, Score, and RFP_Team records.
 *
 * Returns a list of RFPs that have entered or passed the evaluation phase,
 * enriched with:
 *   - Submission & vendor counts
 *   - Average score across all scores
 *   - Evaluator team info (assigned evaluators, who has scored)
 *   - Whether the current user is assigned as an evaluator
 *   - Whether the current user has completed their scoring
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const ctx = getTenantContext(session)

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
    const skip = (page - 1) * limit

    const whereClause = { tenantId: ctx.tenantId, status: { in: ["published", "evaluation", "closed", "awarded"] } }

    const [total, rfpsRaw] = await Promise.all([
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
          teams: {
            where: { role: "evaluator" },
            include: {
              user: { select: { id: true, name: true, email: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip,
      }),
    ])
    // Cast to any[] — Prisma types not inferred in next build worker
    const rfpsWithData = rfpsRaw as any[] // eslint-disable-line @typescript-eslint/no-explicit-any

    const evaluations = rfpsWithData
      .filter((rfp: any) => rfp._count.submissions > 0) // eslint-disable-line @typescript-eslint/no-explicit-any
      .map((rfp: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
        const allScores = rfp.submissions.flatMap((s: any) => s.scores) // eslint-disable-line @typescript-eslint/no-explicit-any
        const avgScore = allScores.length > 0
          ? allScores.reduce((sum: number, s: any) => sum + (s.scoreValue || 0), 0) / allScores.length // eslint-disable-line @typescript-eslint/no-explicit-any
          : 0

        // Evaluator progress: unique evaluator IDs who have scored vs total assigned evaluators
        const evaluatorIdsWhoScored = new Set(allScores.map((s: any) => s.evaluatorId)) // eslint-disable-line @typescript-eslint/no-explicit-any
        const totalEvaluators = rfp.teams.length
        const evaluatorsCompleted = rfp.teams.filter((t: any) => evaluatorIdsWhoScored.has(t.userId)).length // eslint-disable-line @typescript-eslint/no-explicit-any

        // Check if current user is an evaluator on this RFP
        const currentUserId = ctx.userId
        const isEvaluator = rfp.teams.some((t: any) => t.userId === currentUserId) // eslint-disable-line @typescript-eslint/no-explicit-any
        const hasUserScored = isEvaluator && evaluatorIdsWhoScored.has(currentUserId)

        // Derive evaluation status
        const evaluationStatus = rfp.status === "evaluation"
          ? "in_progress"
          : rfp.status === "closed" || rfp.status === "awarded"
            ? "completed"
            : "pending"

        return {
          id: rfp.id,
          rfpId: rfp.id,
          rfpTitle: rfp.title,
          status: evaluationStatus,
          rfpStatus: rfp.status,
          submissionCount: rfp._count.submissions,
          vendorCount: new Set(rfp.submissions.map((s: any) => s.vendorId)).size, // eslint-disable-line @typescript-eslint/no-explicit-any
          averageScore: Math.round(avgScore * 100) / 100,
          deadline: rfp.timeline?.awardTarget || null,
          submissionDeadline: rfp.timeline?.submissionDeadline || null,
          createdAt: rfp.createdAt,
          // Evaluator info
          totalEvaluators,
          evaluatorsCompleted,
          isEvaluator,
          hasUserScored,
          evaluators: rfp.teams.map((t: any) => ({ // eslint-disable-line @typescript-eslint/no-explicit-any
            id: t.userId,
            name: t.user?.name || "Unknown",
            hasScored: evaluatorIdsWhoScored.has(t.userId),
          })),
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
