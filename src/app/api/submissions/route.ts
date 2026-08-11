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
})

const updateSubmissionSchema = z.object({
  status: z.enum(["draft", "submitted", "reviewed", "awarded", "rejected"]).optional(),
  checksum: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = Math.min(Number(searchParams.get('limit')) || 20, 100)
    const offset = Number(searchParams.get('offset')) || 0
    const rfpId = searchParams.get("rfpId")
    const vendorId = searchParams.get("vendorId")
    const status = searchParams.get("status")

    const tenantContext = getTenantContext(session)
    await requirePermission("submission:view")

    const where: Record<string, unknown> = {
      rfp: {
        tenantId: tenantContext.tenantId,
      },
    }

    if (rfpId) {
      (where as Record<string, unknown>).rfpId = rfpId
    }
    if (vendorId) {
      (where as Record<string, unknown>).vendorId = vendorId
    }
    if (status) {
      (where as Record<string, unknown>).status = status
    }

    const [submissions, total] = await Promise.all([
      db.submission.findMany({
        where,
        include: {
          vendor: {
            select: {
              id: true,
              name: true,
            },
          },
          rfp: {
            select: {
              id: true,
              title: true,
              status: true,
              closeAt: true,
            },
          },
          answers: {
            include: {
              question: {
                select: {
                  id: true,
                  prompt: true,
                  type: true,
                  required: true,
                },
              },
            },
          },
          scores: {
            include: {
              criterion: {
                select: {
                  id: true,
                  label: true,
                  weight: true,
                },
              },
              evaluator: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
          consensus: {
            include: {
              criterion: {
                select: {
                  id: true,
                  label: true,
                  weight: true,
                  scaleMax: true,
                },
              },
            },
          },
        },
        take: limit,
        skip: offset,
        orderBy: [
          { version: "desc" },
          { createdAt: "desc" },
        ],
      }),
      db.submission.count({ where }),
    ])

    // Calculate total scores for each submission
    const submissionsWithScores = submissions.map((submission) => {
      const totalScore = submission.consensus.reduce((sum, consensus) => {
        return sum + (consensus.scoreValue * (consensus.criterion.weight || 1))
      }, 0)

      const maxPossibleScore = submission.consensus.reduce((sum, consensus) => {
        return sum + ((consensus.criterion.scaleMax || 5) * (consensus.criterion.weight || 1))
      }, 0)

      const averageScore = submission.scores.length > 0
        ? submission.scores.reduce((sum, score) => sum + score.scoreValue, 0) / submission.scores.length
        : 0

      return {
        ...submission,
        totalScore,
        maxPossibleScore,
        averageScore,
        scorePercentage: maxPossibleScore > 0 ? (totalScore / maxPossibleScore) * 100 : 0,
      }
    })

    return NextResponse.json({
      data: submissionsWithScores,
      pagination: { limit, offset, total },
    })
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: 401 })
    if (error instanceof PermissionError) return NextResponse.json({ error: error.message }, { status: 403 })
    console.error("Error fetching submissions:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createSubmissionSchema.parse(body)

    const tenantContext = getTenantContext(session)
    await requirePermission("submission:create")

    // Verify RFP belongs to tenant
    const rfp = await db.rFP.findFirst({
      where: {
        id: validatedData.rfpId,
        tenantId: tenantContext.tenantId,
      },
      include: { timeline: true },
    })

    if (!rfp) {
      return NextResponse.json({ error: "RFP not found" }, { status: 404 })
    }

    // Validate RFP status - must be published
    if (rfp.status !== "published") {
      return NextResponse.json(
        { error: `Cannot create a submission for an RFP with status "${rfp.status}". The RFP must be published.` },
        { status: 400 }
      )
    }

    // Validate submission deadline has not passed
    if (rfp.timeline?.submissionDeadline && new Date() > new Date(rfp.timeline.submissionDeadline)) {
      return NextResponse.json(
        { error: "The submission deadline for this RFP has passed. No new submissions can be created." },
        { status: 400 }
      )
    }

    // Verify vendor belongs to tenant
    const vendor = await db.vendor.findFirst({
      where: {
        id: validatedData.vendorId,
        tenantId: tenantContext.tenantId,
      },
    })

    if (!vendor) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 })
    }

    // Check if submission already exists for this RFP and vendor
    const existingSubmission = await db.submission.findFirst({
      where: {
        rfpId: validatedData.rfpId,
        vendorId: validatedData.vendorId,
        status: { not: "draft" },
      },
    })

    if (existingSubmission) {
      return NextResponse.json({ error: "Submission already exists for this RFP and vendor" }, { status: 400 })
    }

    // Get the latest version number
    const latestSubmission = await db.submission.findFirst({
      where: {
        rfpId: validatedData.rfpId,
        vendorId: validatedData.vendorId,
      },
      orderBy: { version: "desc" },
    })

    const version = latestSubmission ? latestSubmission.version + 1 : 1

    const submission = await db.submission.create({
      data: {
        rfpId: validatedData.rfpId,
        vendorId: validatedData.vendorId,
        version,
      },
      include: {
        vendor: {
          select: {
            id: true,
            name: true,
          },
        },
        rfp: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
      },
    })

    return NextResponse.json(submission, { status: 201 })
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: 401 })
    if (error instanceof PermissionError) return NextResponse.json({ error: error.message }, { status: 403 })
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation Error", details: error.issues }, { status: 400 })
    }
    console.error("Error creating submission:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
