import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { getTenantContext, AuthError, PermissionError } from "@/lib/tenant-context"
import { requirePermission } from "@/lib/rbac"
import { z } from "zod"
import { dispatchWebhooks, type WebhookEvent } from "@/lib/webhook-dispatcher"

const updateRFPSchema = z.object({
  title: z.string().max(200).min(1).optional(),
  category: z.string().max(100).optional(),
  budget: z.number().optional(),
  confidentiality: z.enum(["internal", "confidential", "restricted"]).optional(),
  description: z.string().max(5000).optional(),
  status: z.enum(["draft", "published", "closed", "awarded", "archived"]).optional(),
  isPublic: z.boolean().optional(),
  publishAt: z.string().optional(),
  closeAt: z.string().optional(),
  settings: z.record(z.string(), z.unknown()).optional(),
  timeline: z.object({
    qnaStart: z.string().optional(),
    qnaEnd: z.string().optional(),
    submissionDeadline: z.string().optional(),
    evaluationStart: z.string().optional(),
    awardTarget: z.string().optional(),
  }).optional(),
})

// GET /api/rfps/[id] - Get single RFP
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const { id } = await params
    const ctx = getTenantContext(session)

    const rfp = await db.rFP.findFirst({
      where: { id: id, tenantId: ctx.tenantId },
      include: {
        timeline: true,
        sections: { include: { questions: true }, orderBy: { order: "asc" } },
        teams: { include: { user: { select: { id: true, name: true, email: true } } } },
        invitations: { include: { vendor: true } },
        submissions: { include: { vendor: true, answers: { include: { question: true } } } },
        qna: { include: { vendor: true }, orderBy: { createdAt: "desc" } },
        addenda: { orderBy: { createdAt: "desc" } },
        approvals: { include: { approver: { select: { id: true, name: true, email: true } } } },
      },
    })

    if (!rfp) {
      return NextResponse.json({ error: "RFP not found" }, { status: 404 })
    }
    return NextResponse.json(rfp)
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: 401 })
    console.error("Error fetching RFP:", error)
    return NextResponse.json({ error: "Failed to fetch RFP" }, { status: 500 })
  }
}

// PATCH /api/rfps/[id] - Update RFP
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const { id } = await params
    const ctx = getTenantContext(session)
    await requirePermission('rfp:edit')

    const body = await request.json()
    const validatedData = updateRFPSchema.parse(body)

    const existing = await db.rFP.findFirst({
      where: { id: id, tenantId: ctx.tenantId },
    })
    if (!existing) {
      return NextResponse.json({ error: "RFP not found" }, { status: 404 })
    }

    // Handle timeline upsert separately
    const { timeline: timelineData, ...rfpFields } = validatedData

    const rfp = await db.rFP.update({
      where: { id: id },
      data: rfpFields as any,
      include: { timeline: true },
    })

    if (timelineData) {
      const timelinePayload = {
        qnaStart: timelineData.qnaStart ? new Date(timelineData.qnaStart) : null,
        qnaEnd: timelineData.qnaEnd ? new Date(timelineData.qnaEnd) : null,
        submissionDeadline: timelineData.submissionDeadline ? new Date(timelineData.submissionDeadline) : null,
        evaluationStart: timelineData.evaluationStart ? new Date(timelineData.evaluationStart) : null,
        awardTarget: timelineData.awardTarget ? new Date(timelineData.awardTarget) : null,
      }
      if (rfp.timeline) {
        await db.rFP_Timeline.update({
          where: { rfpId: id },
          data: timelinePayload,
        })
      } else {
        await db.rFP_Timeline.create({
          data: { rfpId: id, ...timelinePayload },
        })
      }
    }

    // Dispatch webhook on status change
    if (validatedData.status && validatedData.status !== existing.status) {
      const allowedStatusEvents: Record<string, WebhookEvent> = {
        published: 'rfp.published',
        closed: 'rfp.closed',
        awarded: 'rfp.awarded',
        archived: 'rfp.archived',
      }
      const webhookEvent = allowedStatusEvents[validatedData.status]
      if (webhookEvent) {
        dispatchWebhooks(webhookEvent, {
          rfpId: id,
          title: rfp.title,
          oldStatus: existing.status,
          newStatus: validatedData.status,
          updatedBy: session.user?.email || 'unknown',
        }, ctx.tenantId)
      }
    }

    const updatedRfp = await db.rFP.findFirst({
      where: { id: id },
      include: { timeline: true },
    })
    return NextResponse.json(updatedRfp)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.issues }, { status: 400 })
    }
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: 401 })
    if (error instanceof PermissionError) return NextResponse.json({ error: error.message }, { status: 403 })
    console.error("Error updating RFP:", error)
    return NextResponse.json({ error: "Failed to update RFP" }, { status: 500 })
  }
}

// DELETE /api/rfps/[id] - Delete RFP
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const { id } = await params
    const ctx = getTenantContext(session)
    await requirePermission('rfp:delete')

    const existing = await db.rFP.findFirst({
      where: { id: id, tenantId: ctx.tenantId },
    })
    if (!existing) {
      return NextResponse.json({ error: "RFP not found" }, { status: 404 })
    }

    await db.rFP.delete({ where: { id: id } })
    return NextResponse.json({ message: "RFP deleted successfully" })
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: 401 })
    if (error instanceof PermissionError) return NextResponse.json({ error: error.message }, { status: 403 })
    console.error("Error deleting RFP:", error)
    return NextResponse.json({ error: "Failed to delete RFP" }, { status: 500 })
  }
}
