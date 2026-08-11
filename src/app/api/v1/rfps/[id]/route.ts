/**
 * Versioned RFPs API (v1) — Single RFP
 *
 * This is the versioned API under /api/v1/rfps/[id].
 * The base routes at /api/rfps/[id] are considered legacy and will be deprecated.
 *
 * Key differences from the base /api/rfps/[id] routes:
 *   - GET returns a richer response including teams, sections with rubric criteria,
 *     submissions with scores, Q&A threads, addenda, and approvals.
 *   - Uses PATCH (not PUT) for partial updates, with explicit timeline handling.
 *   - DELETE cascades and logs activity to the audit trail.
 *
 * Consumers should migrate to these v1 endpoints for new integrations.
 */
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getTenantContext, AuthError, PermissionError } from "@/lib/tenant-context"
import { db } from "@/lib/db"
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
  params: Promise<{ id: string }>
}

// GET /api/v1/rfps/[id] - Get single RFP
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const ctx = getTenantContext(session)
    const { id } = await params

    const rfp = await db.rFP.findFirst({
      where: { id: id, tenantId: ctx.tenantId },
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
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: 401 })
    if (error instanceof PermissionError) return NextResponse.json({ error: error.message }, { status: 403 })
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
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const ctx = getTenantContext(session)
    const { id } = await params

    const body = await request.json()
    const validatedData = updateRFPSchema.parse(body)

    // Check if RFP exists and user has access
    const existingRFP = await db.rFP.findFirst({
      where: { id: id, tenantId: ctx.tenantId },
      include: { timeline: true }
    })

    if (!existingRFP) {
      return NextResponse.json(
        { error: "RFP not found" },
        { status: 404 }
      )
    }

    // Update RFP
    const updateData: Record<string, unknown> = {
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
          where: { rfpId: id },
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
            rfpId: id,
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
      where: { id: id, tenantId: ctx.tenantId },
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
        targetId: id,
        metadata: {
          changes: validatedData
        }
      }
    })

    return NextResponse.json(updatedRFP)
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: 401 })
    if (error instanceof PermissionError) return NextResponse.json({ error: error.message }, { status: 403 })
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
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
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const ctx = getTenantContext(session)
    const { id } = await params

    // Check if RFP exists
    const existingRFP = await db.rFP.findFirst({
      where: { id: id, tenantId: ctx.tenantId }
    })

    if (!existingRFP) {
      return NextResponse.json(
        { error: "RFP not found" },
        { status: 404 }
      )
    }

    // Delete RFP (Prisma will handle cascading deletes)
    await db.rFP.delete({
      where: { id: id, tenantId: ctx.tenantId }
    })

    // Log activity
    await db.activityLog.create({
      data: {
        tenantId: session.user.tenantId,
        actor: session.user.id,
        action: "DELETE_RFP",
        targetType: "RFP",
        targetId: id,
        metadata: {
          rfpTitle: existingRFP.title
        }
      }
    })

    return NextResponse.json({ message: "RFP deleted successfully" })
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: 401 })
    if (error instanceof PermissionError) return NextResponse.json({ error: error.message }, { status: 403 })
    console.error("Error deleting RFP:", error)
    return NextResponse.json(
      { error: "Failed to delete RFP" },
      { status: 500 }
    )
  }
}