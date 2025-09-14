import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { requireAuth, requirePermission } from "@/lib/auth-utils"
import { db } from "@/lib/db"
import { PERMISSIONS } from "@/types/auth"
import { z } from "zod"

const updateAnswersSchema = z.object({
  answers: z.array(z.object({
    questionId: z.string(),
    valueText: z.string().optional(),
    valueNumber: z.number().optional(),
    valueOption: z.string().optional(),
    fileRef: z.string().optional(),
  })),
})

interface RouteParams {
  params: {
    id: string
  }
}

// GET /api/v1/submissions/[id] - Get single submission
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    await requireAuth()
    await requirePermission(PERMISSIONS.VIEW_RFP)

    const submission = await db.submission.findUnique({
      where: { id: params.id },
      include: {
        rfp: {
          select: {
            id: true,
            title: true,
            status: true,
            description: true,
            budget: true,
            confidentiality: true,
            timeline: true,
          }
        },
        vendor: {
          select: {
            id: true,
            name: true,
            contactInfo: true,
            categories: true,
            certifications: true,
          }
        },
        answers: {
          include: {
            question: {
              include: {
                section: {
                  select: {
                    id: true,
                    title: true,
                    order: true,
                  }
                }
              }
            }
          },
          orderBy: {
            question: {
              order: "asc"
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
                scaleMin: true,
                scaleMax: true,
                guidance: true,
              }
            }
          }
        }
      }
    })

    if (!submission) {
      return NextResponse.json(
        { error: "Submission not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(submission)
  } catch (error) {
    console.error("Error fetching submission:", error)
    return NextResponse.json(
      { error: "Failed to fetch submission" },
      { status: 500 }
    )
  }
}

// PATCH /api/v1/submissions/[id] - Update submission answers
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await requireAuth()
    await requirePermission(PERMISSIONS.VIEW_RFP)

    const body = await request.json()
    const validatedData = updateAnswersSchema.parse(body)

    // Check if submission exists and is in draft status
    const existingSubmission = await db.submission.findUnique({
      where: { id: params.id },
      include: {
        rfp: {
          include: { timeline: true }
        }
      }
    })

    if (!existingSubmission) {
      return NextResponse.json(
        { error: "Submission not found" },
        { status: 404 }
      )
    }

    if (existingSubmission.status !== "draft") {
      return NextResponse.json(
        { error: "Cannot update submitted submission" },
        { status: 400 }
      )
    }

    // Check if deadline has passed
    if (existingSubmission.rfp.timeline?.submissionDeadline && 
        new Date() > new Date(existingSubmission.rfp.timeline.submissionDeadline)) {
      return NextResponse.json(
        { error: "Submission deadline has passed" },
        { status: 400 }
      )
    }

    // Update answers - delete existing and create new ones
    await db.answer.deleteMany({
      where: { submissionId: params.id }
    })

    if (validatedData.answers.length > 0) {
      await db.answer.createMany({
        data: validatedData.answers.map(answer => ({
          submissionId: params.id,
          questionId: answer.questionId,
          valueText: answer.valueText,
          valueNumber: answer.valueNumber,
          valueOption: answer.valueOption,
          fileRef: answer.fileRef,
        }))
      })
    }

    const updatedSubmission = await db.submission.findUnique({
      where: { id: params.id },
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
        },
        answers: {
          include: {
            question: true
          }
        }
      }
    })

    // Log activity
    await db.activityLog.create({
      data: {
        tenantId: session.user.tenantId,
        actor: session.user.id,
        action: "UPDATE_SUBMISSION",
        targetType: "Submission",
        targetId: params.id,
        metadata: {
          answersCount: validatedData.answers.length
        }
      }
    })

    return NextResponse.json(updatedSubmission)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Error updating submission:", error)
    return NextResponse.json(
      { error: "Failed to update submission" },
      { status: 500 }
    )
  }
}

// POST /api/v1/submissions/[id]/submit - Submit submission
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await requireAuth()
    await requirePermission(PERMISSIONS.VIEW_RFP)

    // Check if submission exists and is in draft status
    const existingSubmission = await db.submission.findUnique({
      where: { id: params.id },
      include: {
        rfp: {
          include: { 
            timeline: true,
            sections: {
              include: {
                questions: true
              }
            }
          }
        }
      }
    })

    if (!existingSubmission) {
      return NextResponse.json(
        { error: "Submission not found" },
        { status: 404 }
      )
    }

    if (existingSubmission.status !== "draft") {
      return NextResponse.json(
        { error: "Submission already submitted" },
        { status: 400 }
      )
    }

    // Check if deadline has passed
    if (existingSubmission.rfp.timeline?.submissionDeadline && 
        new Date() > new Date(existingSubmission.rfp.timeline.submissionDeadline)) {
      return NextResponse.json(
        { error: "Submission deadline has passed" },
        { status: 400 }
      )
    }

    // Check if all required questions are answered
    const allQuestions = existingSubmission.rfp.sections.flatMap(section => section.questions)
    const requiredQuestions = allQuestions.filter(q => q.required)
    
    const answeredQuestions = await db.answer.findMany({
      where: { submissionId: params.id },
      include: { question: true }
    })

    const answeredQuestionIds = answeredQuestions.map(a => a.questionId)
    const unansweredRequired = requiredQuestions.filter(q => !answeredQuestionIds.includes(q.id))

    if (unansweredRequired.length > 0) {
      return NextResponse.json(
        { 
          error: "Required questions not answered",
          unanswered: unansweredRequired.map(q => ({ id: q.id, prompt: q.prompt }))
        },
        { status: 400 }
      )
    }

    // Submit the submission
    const updatedSubmission = await db.submission.update({
      where: { id: params.id },
      data: {
        status: "submitted",
        submittedAt: new Date(),
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

    // Log activity
    await db.activityLog.create({
      data: {
        tenantId: session.user.tenantId,
        actor: session.user.id,
        action: "SUBMIT_SUBMISSION",
        targetType: "Submission",
        targetId: params.id,
        metadata: {
          rfpId: existingSubmission.rfpId,
          vendorId: existingSubmission.vendorId,
        }
      }
    })

    return NextResponse.json(updatedSubmission)
  } catch (error) {
    console.error("Error submitting submission:", error)
    return NextResponse.json(
      { error: "Failed to submit submission" },
      { status: 500 }
    )
  }
}