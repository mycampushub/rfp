import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { requireAuth, requirePermission } from "@/lib/auth-utils"
import { db } from "@/lib/db"
import { PERMISSIONS } from "@/types/auth"
import { z } from "zod"

const updateRFPSchema = z.object({
  title: z.string().min(1).optional(),
  category: z.string().optional(),
  budget: z.number().optional(),
  confidentiality: z.enum(["internal", "confidential", "restricted"]).optional(),
  description: z.string().optional(),
  status: z.enum(["draft", "published", "closed", "awarded", "archived"]).optional(),
  timeline: z.object({
    qnaStart: z.string().optional(),
    qnaEnd: z.string().optional(),
    submissionDeadline: z.string().optional(),
    evaluationStart: z.string().optional(),
    awardTarget: z.string().optional(),
  }).optional(),
  settings: z.object({}).optional(),
})

interface RouteParams {
  params: {
    id: string
  }
}

// GET /api/v1/rfps/[id] - Get single RFP
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    await requireAuth()
    await requirePermission(PERMISSIONS.VIEW_RFP)

    const rfp = await db.rFP.findUnique({
      where: { id: params.id },
      include: {
        timeline: true,
        teams: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              }
            }
          }
        },
        sections: {
          include: {
            questions: true,
            rubricCriteria: true
          },
          orderBy: { order: "asc" }
        },
        invitations: {
          include: {
            vendor: true
          }
        },
        submissions: {
          include: {
            vendor: true,
            answers: {
              include: {
                question: true
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
                criterion: true
              }
            }
          }
        },
        qna: {
          include: {
            vendor: true
          },
          orderBy: { createdAt: "desc" }
        },
        addenda: true,
        approvals: {
          include: {
            approver: {
              select: {
                id: true,
                name: true,
                email: true,
              }
            }
          }
        }
      }
    })

    if (!rfp) {
      return NextResponse.json(
        { error: "RFP not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(rfp)
  } catch (error) {
    console.error("Error fetching RFP:", error)
    return NextResponse.json(
      { error: "Failed to fetch RFP" },
      { status: 500 }
    )
  }
}

// PATCH /api/v1/rfps/[id] - Update RFP
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await requireAuth()
    await requirePermission(PERMISSIONS.EDIT_RFP)

    const body = await request.json()
    const validatedData = updateRFPSchema.parse(body)

    // Check if RFP exists and user has access
    const existingRFP = await db.rFP.findUnique({
      where: { id: params.id },
      include: { timeline: true }
    })

    if (!existingRFP) {
      return NextResponse.json(
        { error: "RFP not found" },
        { status: 404 }
      )
    }

    // Update RFP
    const updateData: any = {
      ...(validatedData.title && { title: validatedData.title }),
      ...(validatedData.category && { category: validatedData.category }),
      ...(validatedData.budget !== undefined && { budget: validatedData.budget }),
      ...(validatedData.confidentiality && { confidentiality: validatedData.confidentiality }),
      ...(validatedData.description !== undefined && { description: validatedData.description }),
      ...(validatedData.status && { status: validatedData.status }),
      ...(validatedData.settings && { settings: validatedData.settings }),
    }

    // Handle timeline updates
    if (validatedData.timeline) {
      if (existingRFP.timeline) {
        // Update existing timeline
        await db.rFP_Timeline.update({
          where: { rfpId: params.id },
          data: {
            ...(validatedData.timeline.qnaStart && { qnaStart: new Date(validatedData.timeline.qnaStart) }),
            ...(validatedData.timeline.qnaEnd && { qnaEnd: new Date(validatedData.timeline.qnaEnd) }),
            ...(validatedData.timeline.submissionDeadline && { submissionDeadline: new Date(validatedData.timeline.submissionDeadline) }),
            ...(validatedData.timeline.evaluationStart && { evaluationStart: new Date(validatedData.timeline.evaluationStart) }),
            ...(validatedData.timeline.awardTarget && { awardTarget: new Date(validatedData.timeline.awardTarget) }),
          }
        })
      } else {
        // Create new timeline
        await db.rFP_Timeline.create({
          data: {
            rfpId: params.id,
            qnaStart: validatedData.timeline.qnaStart ? new Date(validatedData.timeline.qnaStart) : null,
            qnaEnd: validatedData.timeline.qnaEnd ? new Date(validatedData.timeline.qnaEnd) : null,
            submissionDeadline: validatedData.timeline.submissionDeadline ? new Date(validatedData.timeline.submissionDeadline) : null,
            evaluationStart: validatedData.timeline.evaluationStart ? new Date(validatedData.timeline.evaluationStart) : null,
            awardTarget: validatedData.timeline.awardTarget ? new Date(validatedData.timeline.awardTarget) : null,
          }
        })
      }
    }

    const updatedRFP = await db.rFP.update({
      where: { id: params.id },
      data: updateData,
      include: {
        timeline: true,
        _count: {
          select: {
            invitations: true,
            submissions: true,
            qna: true,
          }
        }
      }
    })

    // Log activity
    await db.activityLog.create({
      data: {
        tenantId: session.user.tenantId,
        actor: session.user.id,
        action: "UPDATE_RFP",
        targetType: "RFP",
        targetId: params.id,
        metadata: {
          changes: validatedData
        }
      }
    })

    return NextResponse.json(updatedRFP)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Error updating RFP:", error)
    return NextResponse.json(
      { error: "Failed to update RFP" },
      { status: 500 }
    )
  }
}

// DELETE /api/v1/rfps/[id] - Delete RFP
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await requireAuth()
    await requirePermission(PERMISSIONS.DELETE_RFP)

    // Check if RFP exists
    const existingRFP = await db.rFP.findUnique({
      where: { id: params.id }
    })

    if (!existingRFP) {
      return NextResponse.json(
        { error: "RFP not found" },
        { status: 404 }
      )
    }

    // Delete RFP (Prisma will handle cascading deletes)
    await db.rFP.delete({
      where: { id: params.id }
    })

    // Log activity
    await db.activityLog.create({
      data: {
        tenantId: session.user.tenantId,
        actor: session.user.id,
        action: "DELETE_RFP",
        targetType: "RFP",
        targetId: params.id,
        metadata: {
          rfpTitle: existingRFP.title
        }
      }
    })

    return NextResponse.json({ message: "RFP deleted successfully" })
  } catch (error) {
    console.error("Error deleting RFP:", error)
    return NextResponse.json(
      { error: "Failed to delete RFP" },
      { status: 500 }
    )
  }
}