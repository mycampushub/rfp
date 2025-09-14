import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { requireAuth, requirePermission } from "@/lib/auth-utils"
import { db } from "@/lib/db"
import { PERMISSIONS } from "@/types/auth"
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

const updateAnswersSchema = z.object({
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
    await requireAuth()
    await requirePermission(PERMISSIONS.VIEW_RFP)

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
    const rfpId = searchParams.get("rfpId")
    const vendorId = searchParams.get("vendorId")
    const status = searchParams.get("status")

    const skip = (page - 1) * limit

    const where: any = {}
    
    if (rfpId) where.rfpId = rfpId
    if (vendorId) where.vendorId = vendorId
    if (status) where.status = status

    const [submissions, total] = await Promise.all([
      db.submission.findMany({
        where,
        include: {
          rfp: {
            select: {
              id: true,
              title: true,
              status: true,
            }
          },
          vendor: {
            select: {
              id: true,
              name: true,
            }
          },
          answers: {
            include: {
              question: {
                select: {
                  id: true,
                  prompt: true,
                  type: true,
                }
              }
            }
          },
          scores: {
            include: {
              evaluator: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                }
              },
              criterion: {
                select: {
                  id: true,
                  label: true,
                  weight: true,
                }
              }
            }
          },
          _count: {
            select: {
              answers: true,
              scores: true,
            }
          }
        },
        skip,
        take: limit,
        orderBy: { submittedAt: "desc" }
      }),
      db.submission.count({ where })
    ])

    return NextResponse.json({
      data: submissions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error("Error fetching submissions:", error)
    return NextResponse.json(
      { error: "Failed to fetch submissions" },
      { status: 500 }
    )
  }
}

// POST /api/v1/submissions - Create submission
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth()
    await requirePermission(PERMISSIONS.VIEW_RFP) // Vendors can view RFPs to submit

    const body = await request.json()
    const validatedData = createSubmissionSchema.parse(body)

    // Check if RFP exists and is published
    const rfp = await db.rFP.findUnique({
      where: { id: validatedData.rfpId },
      include: { timeline: true }
    })

    if (!rfp || rfp.status !== "published") {
      return NextResponse.json(
        { error: "RFP is not available for submission" },
        { status: 400 }
      )
    }

    // Check if deadline has passed
    if (rfp.timeline?.submissionDeadline && new Date() > new Date(rfp.timeline.submissionDeadline)) {
      return NextResponse.json(
        { error: "Submission deadline has passed" },
        { status: 400 }
      )
    }

    // Check if vendor exists
    const vendor = await db.vendor.findUnique({
      where: { id: validatedData.vendorId }
    })

    if (!vendor) {
      return NextResponse.json(
        { error: "Vendor not found" },
        { status: 404 }
      )
    }

    // Create submission
    const submission = await db.submission.create({
      data: {
        rfpId: validatedData.rfpId,
        vendorId: validatedData.vendorId,
        status: "draft",
      },
      include: {
        rfp: {
          select: {
            id: true,
            title: true,
          }
        },
        vendor: {
          select: {
            id: true,
            name: true,
          }
        }
      }
    })

    // Add answers
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

    // Log activity
    await db.activityLog.create({
      data: {
        tenantId: session.user.tenantId,
        actor: session.user.id,
        action: "CREATE_SUBMISSION",
        targetType: "Submission",
        targetId: submission.id,
        metadata: {
          rfpId: validatedData.rfpId,
          vendorId: validatedData.vendorId,
        }
      }
    })

    return NextResponse.json(submission, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Error creating submission:", error)
    return NextResponse.json(
      { error: "Failed to create submission" },
      { status: 500 }
    )
  }
}