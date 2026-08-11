import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { getTenantContext, AuthError, PermissionError } from "@/lib/tenant-context"
import { requirePermission } from "@/lib/rbac"
import { z } from "zod"
import NotificationService from "@/lib/notification-service"

const updateApprovalSchema = z.object({
  status: z.enum(["pending", "approved", "rejected"]),
  comments: z.string().optional(),
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

    const approval = await db.approval.findFirst({
      where: {
        id: id,
        rfp: {
          tenantId: tenantContext.tenantId,
        },
      },
      include: {
        rfp: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
        approver: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    if (!approval) {
      return NextResponse.json({ error: "Approval not found" }, { status: 404 })
    }

    return NextResponse.json(approval)
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: 401 })
    if (error instanceof PermissionError) return NextResponse.json({ error: error.message }, { status: 403 })
    console.error("Error fetching approval:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { ctx } = await requirePermission('approval:edit')

    const body = await request.json()
    const validatedData = updateApprovalSchema.parse(body)

    // Verify approval belongs to tenant
    const existingApproval = await db.approval.findFirst({
      where: {
        id: id,
        rfp: {
          tenantId: ctx.tenantId,
        },
      },
    })

    if (!existingApproval) {
      return NextResponse.json({ error: "Approval not found" }, { status: 404 })
    }

    // Verify the acting user is the assigned approver for approve/reject actions
    if (validatedData.status !== "pending" && existingApproval.approverId !== ctx.userId) {
      return NextResponse.json(
        { error: "Only the assigned approver can process this approval" },
        { status: 403 }
      )
    }

    const updateData: Record<string, unknown> = {
      ...validatedData,
    }

    if (validatedData.status !== "pending") {
      updateData.decidedAt = new Date()
    }

    const approval = await db.approval.update({
      where: { id: id },
      data: updateData,
      include: {
        rfp: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
        approver: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    // Send notification about approval decision to RFP owner
    await NotificationService.send({
      userId: ctx.userId,
      type: `approval_${approval.status}`,
      title: `Approval ${approval.status}`,
      message: `An approval has been ${approval.status}`,
    })

    return NextResponse.json(approval)
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: 401 })
    if (error instanceof PermissionError) return NextResponse.json({ error: error.message }, { status: 403 })
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation Error", details: error.issues }, { status: 400 })
    }
    console.error("Error updating approval:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function DELETE(
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

    // Verify approval belongs to tenant
    const existingApproval = await db.approval.findFirst({
      where: {
        id: id,
        rfp: {
          tenantId: tenantContext.tenantId,
        },
      },
    })

    if (!existingApproval) {
      return NextResponse.json({ error: "Approval not found" }, { status: 404 })
    }

    await db.approval.delete({
      where: { id: id },
    })

    return NextResponse.json({ message: "Approval deleted successfully" })
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: 401 })
    if (error instanceof PermissionError) return NextResponse.json({ error: error.message }, { status: 403 })
    console.error("Error deleting approval:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}