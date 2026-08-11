import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { getTenantContext, AuthError, PermissionError } from "@/lib/tenant-context"
import { requirePermission } from "@/lib/rbac"
import { z } from "zod"

export const dynamic = "force-dynamic"

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
    const limit = Math.min(Number(searchParams.get('limit')) || 20, 100)
    const offset = Number(searchParams.get('offset')) || 0
    const rfpId = searchParams.get("rfpId")
    const vendorId = searchParams.get("vendorId")
    const status = searchParams.get("status")

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
        skip: offset,
        take: limit,
        orderBy: { submittedAt: "desc" }
      }),
      db.submission.count({ where })
    ])

    return NextResponse.json({
      data: submissions,
      pagination: { limit, offset, total }
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
    await requirePermission("submission:create")

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

    const vendor = await db.vendor.findUnique({ where: { id: validatedData.vendorId } })
    if (!vendor) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 })
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
    if (error instanceof PermissionError) return NextResponse.json({ error: error.message }, { status: 403 })
    console.error("Error creating submission:", error)
    return NextResponse.json({ error: "Failed to create submission" }, { status: 500 })
  }
}
