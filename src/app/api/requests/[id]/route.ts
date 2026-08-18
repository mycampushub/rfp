import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { AuthError, PermissionError } from "@/lib/tenant-context"
import { requirePermission } from "@/lib/rbac"
import { z } from "zod"
import NotificationService from "@/lib/notification-service"

const updateRequestSchema = z.object({
  status: z.enum(["approved", "rejected"]),
  comments: z.string().optional(),
})

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
const { id } = await params
  try {
    const { ctx } = await requirePermission('approval:edit')

    const body = await request.json()
    const validatedData = updateRequestSchema.parse(body)

    // Verify request belongs to tenant
    const requestRecord = await db.approvalRequest.findFirst({
      where: {
        id: id,
        process: {
          rfp: {
            tenantId: ctx.tenantId,
          },
        },
      },
      include: {
        process: {
          include: {
            requests: {
              orderBy: { createdAt: "asc" },
            },
          },
        },
      },
    })

    if (!requestRecord) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 })
    }

    if (requestRecord.status !== "pending") {
      return NextResponse.json({ error: "Request is not pending approval" }, { status: 400 })
    }

    // Verify the acting user is the assigned approver for the current stage
    if (requestRecord.approverId !== ctx.userId) {
      return NextResponse.json(
        { error: "Only the assigned approver can process this approval" },
        { status: 403 }
      )
    }

    // Update request
    const updatedRequest = await db.approvalRequest.update({
      where: { id: id },
      data: {
        status: validatedData.status,
        approverId: ctx.userId,
        decidedAt: new Date(),
        comments: validatedData.comments,
      },
    })

    // Get the process and handle workflow progression
    const process = requestRecord.process
    const requests = process.requests as Array<{ id: string; status: string; approverId: string | null }>
    const currentIndex = requests.findIndex((r: { id: string }) => r.id === id)
    const nextRequest = requests[currentIndex + 1]

    if (validatedData.status === "approved") {
      if (nextRequest) {
        // Move to next stage
        await db.approvalRequest.update({
          where: { id: nextRequest.id },
          data: {
            status: "pending",
          },
        })

        await db.approvalProcess.update({
          where: { id: process.id },
          data: {
            currentStage: currentIndex + 1,
          },
        })

        // Notify next approver
        const nextApproverId = nextRequest.approverId
        if (nextApproverId) {
          await NotificationService.send({
            userId: nextApproverId,
            type: "approval_request_pending",
            title: "Pending Approval",
            message: "You have a new approval request",
          })
        }
      } else {
        // All stages completed
        await db.approvalProcess.update({
          where: { id: process.id },
          data: {
            status: "completed",
            completedAt: new Date(),
          },
        })

        // Update RFP status
        await db.rFP.update({
          where: { id: process.rfpId },
          data: {
            status: "approved",
          },
        })
      }
    } else if (validatedData.status === "rejected") {
      // Mark process as rejected
      await db.approvalProcess.update({
        where: { id: process.id },
        data: {
          status: "rejected",
          completedAt: new Date(),
        },
      })

      // Update RFP status
      await db.rFP.update({
        where: { id: process.rfpId },
        data: {
          status: "rejected",
        },
      })
    }

    // Notify about final decision
    await NotificationService.send({
      userId: ctx.userId,
      type: "approval_process_completed",
      title: "Approval Completed",
      message: "An approval process has been completed",
    })

    return NextResponse.json(updatedRequest)
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: 401 })
    if (error instanceof PermissionError) return NextResponse.json({ error: error.message }, { status: 403 })
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation Error", details: error.issues }, { status: 400 })
    }
    console.error("Error updating request:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
