import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { getTenantContext, AuthError, PermissionError } from "@/lib/tenant-context"
import { z } from "zod"
import { dispatchWebhooks } from "@/lib/webhook-dispatcher"
import type { TransactionClient } from "@/lib/consensus-calculator"

const createSubmissionSchema = z.object({
  rfpId: z.string(),
  vendorId: z.string(),
})

const _updateSubmissionSchema = z.object({
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
    const rfpId = searchParams.get("rfpId")
    const vendorId = searchParams.get("vendorId")
    const status = searchParams.get("status")

    const tenantContext = getTenantContext(session)
    
    const whereClause: Record<string, unknown> = {
      rfp: {
        tenantId: tenantContext.tenantId,
      },
    }
    
    if (rfpId) {
      whereClause.rfpId = rfpId
    }
    if (vendorId) {
      whereClause.vendorId = vendorId
    }
    if (status) {
      whereClause.status = status
    }

    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
    const skip = (page - 1) * limit

    const [submissionsRaw, total] = await Promise.all([
      db.submission.findMany({
        where: whereClause,
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
              budget: true,
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
        orderBy: [
          { version: "desc" },
          { createdAt: "desc" },
        ],
        take: limit,
        skip,
      }),
      db.submission.count({ where: whereClause }),
    ])

    const submissions = submissionsRaw as any[] // eslint-disable-line @typescript-eslint/no-explicit-any

    // Calculate total scores for each submission
    const submissionsWithScores = await Promise.all(
      submissions.map(async (submission) => {
        const totalScore = submission.consensus.reduce((sum: number, consensus: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
          return sum + (consensus.scoreValue * (consensus.criterion.weight || 1))
        }, 0)

        const maxPossibleScore = submission.consensus.reduce((sum: number, consensus: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
          return sum + ((consensus.criterion.scaleMax || 5) * (consensus.criterion.weight || 1))
        }, 0)

        const averageScore = submission.scores.length > 0
          ? submission.scores.reduce((sum: number, score: any) => sum + score.scoreValue, 0) / submission.scores.length // eslint-disable-line @typescript-eslint/no-explicit-any
          : 0

        return {
          ...submission,
          totalScore,
          maxPossibleScore,
          averageScore,
          scorePercentage: maxPossibleScore > 0 ? (totalScore / maxPossibleScore) * 100 : 0,
        }
      })
    )

    return NextResponse.json({
      data: submissionsWithScores,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
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

    const submission = await db.$transaction(async (tx: TransactionClient) => {
      // Verify RFP belongs to tenant
      const rfp = await tx.rFP.findFirst({
        where: {
          id: validatedData.rfpId,
          tenantId: tenantContext.tenantId,
        },
      })

      if (!rfp) {
        throw new Error('RFP_NOT_FOUND')
      }

      // Verify vendor belongs to tenant
      const vendor = await tx.vendor.findFirst({
        where: {
          id: validatedData.vendorId,
          tenantId: tenantContext.tenantId,
        },
      })

      if (!vendor) {
        throw new Error('VENDOR_NOT_FOUND')
      }

      // Check if submission already exists for this RFP and vendor
      const existingSubmission = await tx.submission.findFirst({
        where: {
          rfpId: validatedData.rfpId,
          vendorId: validatedData.vendorId,
          status: { not: "draft" },
        },
      })

      if (existingSubmission) {
        throw new Error('SUBMISSION_EXISTS')
      }

      // Get the latest version number
      const latestSubmission = await tx.submission.findFirst({
        where: {
          rfpId: validatedData.rfpId,
          vendorId: validatedData.vendorId,
        },
        orderBy: { version: "desc" },
      })

      const version = latestSubmission ? latestSubmission.version + 1 : 1

      return tx.submission.create({
        data: {
          ...validatedData,
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
    })

    // Dispatch webhook for submission creation
    dispatchWebhooks('submission.created', {
      submissionId: submission.id,
      rfpId: submission.rfpId,
      rfpTitle: submission.rfp.title,
      vendorId: submission.vendorId,
      vendorName: submission.vendor.name,
      version: submission.version,
    }, tenantContext.tenantId)

    return NextResponse.json(submission, { status: 201 })
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: 401 })
    if (error instanceof PermissionError) return NextResponse.json({ error: error.message }, { status: 403 })
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation Error", details: error.issues }, { status: 400 })
    }
    if (error instanceof Error) {
      switch (error.message) {
        case 'RFP_NOT_FOUND':
          return NextResponse.json({ error: "RFP not found" }, { status: 404 })
        case 'VENDOR_NOT_FOUND':
          return NextResponse.json({ error: "Vendor not found" }, { status: 404 })
        case 'SUBMISSION_EXISTS':
          return NextResponse.json({ error: "Submission already exists for this RFP and vendor" }, { status: 400 })
      }
    }
    console.error("Error creating submission:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}