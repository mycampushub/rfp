import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import { z } from "zod"

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
    const rfpId = searchParams.get("rfpId")
    const vendorId = searchParams.get("vendorId")
    const status = searchParams.get("status")

    const tenantContext = getTenantContext()
    
    const whereClause: any = {
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

    const submissions = await db.submission.findMany({
      where: whereClause,
      include: {
        vendor: {
          select: {
            id: true,
            name: true,
            email: true,
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
              },
            },
          },
        },
      },
      orderBy: [
        { version: "desc" },
        { createdAt: "desc" },
      ],
    })

    // Calculate total scores for each submission
    const submissionsWithScores = await Promise.all(
      submissions.map(async (submission) => {
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
    )

    return NextResponse.json(submissionsWithScores)
  } catch (error) {
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

    const tenantContext = getTenantContext()

    // Verify RFP belongs to tenant
    const rfp = await db.rFP.findFirst({
      where: {
        id: validatedData.rfpId,
        tenantId: tenantContext.tenantId,
      },
    })

    if (!rfp) {
      return NextResponse.json({ error: "RFP not found" }, { status: 404 })
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
        ...validatedData,
        version,
      },
      include: {
        vendor: {
          select: {
            id: true,
            name: true,
            email: true,
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
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation Error", details: error.errors }, { status: 400 })
    }
    console.error("Error creating submission:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}