/**
 * Versioned Submissions API (v1)
 *
 * This is the versioned API under /api/v1/submissions.
 * The base routes at /api/submissions are considered legacy and will be deprecated in a future release.
 *
 * Key differences from the base /api/submissions routes:
 *   - GET returns paginated results (page/limit query params) wrapped in { data, pagination }
 *     instead of a flat array.
 *   - POST accepts an `answers` array and creates both the submission and its answers
 *     in a single request (the base route only creates the submission record).
 *   - POST validates that the RFP is published and that the submission deadline has
 *     not passed before allowing creation.
 *   - All mutations log activity to the audit trail.
 *
 * Consumers should migrate to these v1 endpoints for new integrations.
 */
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { getTenantContext, AuthError, PermissionError } from "@/lib/tenant-context"
import { z } from "zod"

const createSubmissionSchema = z.object({
  rfpId: z.string(),
  vendorId: z.string(),
  answers: z.array(z.object({
    questionId: z.string(),
    valueText: z.string().optional(),
    valueNumber: z.number().optional(),
    valueOption: z.string().optional(),
    fileRef: z.string().optional(),
  })),
})

// GET /api/v1/submissions - List submissions
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const ctx = getTenantContext(session)

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
    const rfpId = searchParams.get("rfpId")
    const vendorId = searchParams.get("vendorId")
    const status = searchParams.get("status")

    const skip = (page - 1) * limit
    const where: Record<string, unknown> = { rfp: { tenantId: ctx.tenantId } }

    if (rfpId) (where as Record<string, unknown>).rfpId = rfpId
    if (vendorId) (where as Record<string, unknown>).vendorId = vendorId
    if (status) (where as Record<string, unknown>).status = status

    const [submissions, total] = await Promise.all([
      db.submission.findMany({
        where,
        include: {
          rfp: { select: { id: true, title: true, status: true } },
          vendor: { select: { id: true, name: true } },
          answers: { include: { question: { select: { id: true, prompt: true, type: true } } } },
          scores: {
            include: {
              evaluator: { select: { id: true, name: true, email: true } },
              criterion: { select: { id: true, label: true, weight: true } }
            }
          },
          _count: { select: { answers: true, scores: true } }
        },
        skip, take: limit,
        orderBy: { submittedAt: "desc" }
      }),
      db.submission.count({ where })
    ])

    return NextResponse.json({
      data: submissions,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    })
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: 401 })
    if (error instanceof PermissionError) return NextResponse.json({ error: error.message }, { status: 403 })
    console.error("Error fetching submissions:", error)
    return NextResponse.json({ error: "Failed to fetch submissions" }, { status: 500 })
  }
}

// POST /api/v1/submissions - Create submission
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const ctx = getTenantContext(session)

    const body = await request.json()
    const validatedData = createSubmissionSchema.parse(body)

    const rfp = await db.rFP.findFirst({
      where: { id: validatedData.rfpId, tenantId: ctx.tenantId },
      include: { timeline: true }
    })

    if (!rfp || rfp.status !== "published") {
      return NextResponse.json({ error: "RFP is not available for submission" }, { status: 400 })
    }

    if (rfp.timeline?.submissionDeadline && new Date() > new Date(rfp.timeline.submissionDeadline)) {
      return NextResponse.json({ error: "Submission deadline has passed" }, { status: 400 })
    }

    const vendor = await db.vendor.findFirst({ where: { id: validatedData.vendorId, tenantId: ctx.tenantId } })
    if (!vendor) {
      return NextResponse.json({ error: "Vendor not found or not in your tenant" }, { status: 403 })
    }

    const submission = await db.submission.create({
      data: {
        rfpId: validatedData.rfpId,
        vendorId: validatedData.vendorId,
        status: "draft",
      },
      include: {
        rfp: { select: { id: true, title: true } },
        vendor: { select: { id: true, name: true } }
      }
    })

    if (validatedData.answers.length > 0) {
      await db.answer.createMany({
        data: validatedData.answers.map(answer => ({
          submissionId: submission.id,
          questionId: answer.questionId,
          valueText: answer.valueText,
          valueNumber: answer.valueNumber,
          valueOption: answer.valueOption,
          fileRef: answer.fileRef,
        }))
      })
    }

    await db.activityLog.create({
      data: {
        tenantId: ctx.tenantId,
        actor: ctx.userId,
        action: "CREATE_SUBMISSION",
        targetType: "Submission",
        targetId: submission.id,
        metadata: { rfpId: validatedData.rfpId, vendorId: validatedData.vendorId }
      }
    })

    return NextResponse.json(submission, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.issues }, { status: 400 })
    }
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: 401 })
    console.error("Error creating submission:", error)
    return NextResponse.json({ error: "Failed to create submission" }, { status: 500 })
  }
}