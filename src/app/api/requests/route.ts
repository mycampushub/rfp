import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import { z } from "zod"

const updateRequestSchema = z.object({
  status: z.enum(["approved", "rejected"]),
  comments: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const processId = searchParams.get("processId")
    const status = searchParams.get("status")
    const approverId = searchParams.get("approverId")
    const overdue = searchParams.get("overdue")

    const tenantContext = getTenantContext()
    
    const whereClause: any = {
      process: {
        rfp: {
          tenantId: tenantContext.tenantId,
        },
      },
    }
    
    if (processId) {
      whereClause.processId = processId
    }
    if (status) {
      whereClause.status = status
    }
    if (approverId) {
      whereClause.approverId = approverId
    }
    if (overdue === "true") {
      whereClause.status = "pending"
      whereClause.dueAt = {
        lt: new Date(),
      }
    }

    const requests = await db.approvalRequest.findMany({
      where: whereClause,
      include: {
        process: {
          include: {
            rfp: {
              select: {
                id: true,
                title: true,
                status: true,
              },
            },
            workflow: {
              select: {
                id: true,
                name: true,
              },
            },
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
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(requests)
  } catch (error) {
    console.error("Error fetching requests:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const requestId = searchParams.get("id")

    if (!requestId) {
      return NextResponse.json({ error: "Request ID is required" }, { status: 400 })
    }

    const body = await request.json()
    const validatedData = updateRequestSchema.parse(body)

    const tenantContext = getTenantContext()

    // Verify request belongs to tenant and user is the approver
    const requestRecord = await db.approvalRequest.findFirst({
      where: {
        id: requestId,
        process: {
          rfp: {
            tenantId: tenantContext.tenantId,
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

    // Update request
    const updatedRequest = await db.approvalRequest.update({
      where: { id: requestId },
      data: {
        status: validatedData.status,
        approverId: tenantContext.userId,
        decidedAt: new Date(),
        comments: validatedData.comments,
      },
    })

    // Get the process and handle workflow progression
    const process = requestRecord.process
    const currentIndex = process.requests.findIndex(r => r.id === requestId)
    const nextRequest = process.requests[currentIndex + 1]

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

        // TODO: Send notification to next approver
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

    // TODO: Send notifications about the decision

    return NextResponse.json(updatedRequest)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation Error", details: error.errors }, { status: 400 })
    }
    console.error("Error updating request:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}