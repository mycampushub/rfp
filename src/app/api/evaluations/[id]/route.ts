import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { getTenantContext, AuthError, PermissionError } from "@/lib/tenant-context"

/**
 * GET /api/evaluations/[id]
 *
 * DERIVED / VIRTUAL ENDPOINT — There is no `Evaluation` model in the database.
 * This endpoint returns a detailed evaluation view for a single RFP, computed by
 * joining the RFP with its Submissions, Scores, Rubrics, Evaluators, and Sections.
 *
 * The `id` parameter is the RFP ID. The response includes:
 *   - RFP metadata (title, description, status)
 *   - Derived evaluation status (in_progress / completed / pending)
 *   - All non-draft submissions with per-submission scores and percentages
 *   - RFP sections and their questions (useful for evaluation rubric context)
 *   - Aggregated averageScore across all submissions
 *
 * Because evaluations are virtual, there are no POST/PUT/DELETE handlers here.
 * Score management is handled by the /api/scores endpoints.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const ctx = getTenantContext(session)
    const { id } = await params

    const rfp = await db.rFP.findFirst({
      where: { id, tenantId: ctx.tenantId },
      include: {
        timeline: true,
        submissions: {
          where: { status: { not: "draft" } },
          include: {
            vendor: { select: { id: true, name: true, contactInfo: true, categories: true, certifications: true } },
            scores: {
              include: {
                evaluator: { select: { id: true, name: true } },
                criterion: { select: { id: true, label: true, weight: true } },
              },
            },
          },
        },
        sections: {
          include: { questions: true },
          orderBy: { order: "asc" },
        },
      },
    })

    if (!rfp) return NextResponse.json({ error: "Evaluation not found" }, { status: 404 })

    // Build evaluation detail
    const submissionsWithScores = rfp.submissions.map((sub) => {
      const totalScore = sub.scores.reduce((sum, s) => sum + (s.scoreValue || 0), 0)
      const maxPossible = sub.scores.reduce((sum, _s) => sum + 100, 0)
      return {
        id: sub.id,
        vendorId: sub.vendorId,
        vendorName: sub.vendor?.name || "Unknown",
        status: sub.status,
        submittedAt: sub.createdAt,
        totalScore,
        maxPossible,
        percentage: maxPossible > 0 ? Math.round((totalScore / maxPossible) * 100) : 0,
        scores: sub.scores.map((s) => ({
          id: s.id,
          evaluatorName: s.evaluator?.name || "Unknown",
          rubricName: s.criterion?.label || "General",
          scoreValue: s.scoreValue,
          comments: s.notes,
        })),
      }
    })

    const evaluation = {
      id: rfp.id,
      rfpId: rfp.id,
      rfpTitle: rfp.title,
      description: rfp.description,
      status: rfp.status === "evaluation" ? "in_progress" : rfp.status === "closed" ? "completed" : "pending",
      deadline: rfp.timeline?.awardTarget || null,
      sections: rfp.sections,
      submissions: submissionsWithScores,
      totalSubmissions: submissionsWithScores.length,
      averageScore: submissionsWithScores.length > 0
        ? Math.round(submissionsWithScores.reduce((sum, s) => sum + s.percentage, 0) / submissionsWithScores.length * 100) / 100
        : 0,
    }

    return NextResponse.json(evaluation)
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: 401 })
    if (error instanceof PermissionError) return NextResponse.json({ error: error.message }, { status: 403 })
    console.error("Error fetching evaluation:", error)
    return NextResponse.json({ error: "Failed to fetch evaluation" }, { status: 500 })
  }
}
