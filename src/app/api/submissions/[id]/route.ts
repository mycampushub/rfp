import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { getTenantContext, AuthError, PermissionError } from "@/lib/tenant-context"
import { z } from "zod"
import { createHash } from "crypto"

const updateSubmissionSchema = z.object({
  status: z.enum(["draft", "submitted", "reviewed", "awarded", "rejected"]).optional(),
  checksum: z.string().optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const tenantContext = getTenantContext(session)

    const submission = await db.submission.findFirst({
      where: {
        id: id,
        rfp: {
          tenantId: tenantContext.tenantId,
        },
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
                constraints: true,
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
                scaleMin: true,
                scaleMax: true,
                guidance: true,
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
                scaleMin: true,
                scaleMax: true,
                guidance: true,
              },
            },
          },
        },
        electronicSignatures: {
          select: {
            id: true,
            signerName: true,
            signerEmail: true,
            signerTitle: true,
            status: true,
            termsAccepted: true,
            createdAt: true,
          },
        },
      },
    })

    if (!submission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 })
    }

    // Calculate total scores
    const totalScore = submission.consensus.reduce((sum, consensus) => {
      return sum + (consensus.scoreValue * (consensus.criterion.weight || 1))
    }, 0)

    const maxPossibleScore = submission.consensus.reduce((sum, consensus) => {
      return sum + ((consensus.criterion.scaleMax || 5) * (consensus.criterion.weight || 1))
    }, 0)

    const averageScore = submission.scores.length > 0
      ? submission.scores.reduce((sum, score) => sum + score.scoreValue, 0) / submission.scores.length
      : 0

    const submissionWithScores = {
      ...submission,
      totalScore,
      maxPossibleScore,
      averageScore,
      scorePercentage: maxPossibleScore > 0 ? (totalScore / maxPossibleScore) * 100 : 0,
    }

    return NextResponse.json(submissionWithScores)
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: 401 })
    if (error instanceof PermissionError) return NextResponse.json({ error: error.message }, { status: 403 })
    console.error("Error fetching submission:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const { id } = await params

    const body = await request.json()
    const validatedData = updateSubmissionSchema.parse(body)

    const tenantContext = getTenantContext(session)

    // Verify submission belongs to tenant
    const existingSubmission = await db.submission.findFirst({
      where: {
        id: id,
        rfp: {
          tenantId: tenantContext.tenantId,
        },
      },
    })

    if (!existingSubmission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 })
    }

    const updateData: Record<string, unknown> = { ...validatedData }

    // If submitting, set submittedAt and calculate checksum
    if (validatedData.status === "submitted") {
      updateData.submittedAt = new Date()
      
      // Calculate checksum based on answers
      const answers = await db.answer.findMany({
        where: { submissionId: id },
        orderBy: { createdAt: "asc" },
        take: 200,
      })

      const answerData = answers.map(a => ({
        questionId: a.questionId,
        valueText: a.valueText,
        valueNumber: a.valueNumber,
        valueOption: a.valueOption,
        fileRef: a.fileRef,
      })).sort((a, b) => a.questionId.localeCompare(b.questionId))

      const checksum = createHash("sha256")
        .update(JSON.stringify(answerData))
        .digest("hex")
      
      updateData.checksum = checksum
    }

    const submission = await db.submission.update({
      where: { id: id },
      data: updateData,
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

    return NextResponse.json(submission)
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: 401 })
    if (error instanceof PermissionError) return NextResponse.json({ error: error.message }, { status: 403 })
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation Error", details: error.issues }, { status: 400 })
    }
    console.error("Error updating submission:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const tenantContext = getTenantContext(session)

    // Verify submission belongs to tenant
    const existingSubmission = await db.submission.findFirst({
      where: {
        id: id,
        rfp: {
          tenantId: tenantContext.tenantId,
        },
      },
    })

    if (!existingSubmission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 })
    }

    // Only allow deletion of draft submissions
    if (existingSubmission.status !== "draft") {
      return NextResponse.json({ error: "Can only delete draft submissions" }, { status: 400 })
    }

    await db.submission.delete({
      where: { id: id },
    })

    return NextResponse.json({ message: "Submission deleted successfully" })
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: 401 })
    if (error instanceof PermissionError) return NextResponse.json({ error: error.message }, { status: 403 })
    console.error("Error deleting submission:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}