import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import { z } from "zod"

const updateApprovalSchema = z.object({
  status: z.enum(["pending", "approved", "rejected"]),
  comments: z.string().optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const tenantContext = getTenantContext()

    const approval = await db.approval.findFirst({
      where: {
        id: params.id,
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
    console.error("Error fetching approval:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = updateApprovalSchema.parse(body)

    const tenantContext = getTenantContext()

    // Verify approval belongs to tenant
    const existingApproval = await db.approval.findFirst({
      where: {
        id: params.id,
        rfp: {
          tenantId: tenantContext.tenantId,
        },
      },
    })

    if (!existingApproval) {
      return NextResponse.json({ error: "Approval not found" }, { status: 404 })
    }

    const updateData: any = {
      ...validatedData,
    }

    if (validatedData.status !== "pending") {
      updateData.decidedAt = new Date()
    }

    const approval = await db.approval.update({
      where: { id: params.id },
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

    // TODO: Send notification for approval decision
    // This would integrate with a notification system

    return NextResponse.json(approval)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation Error", details: error.errors }, { status: 400 })
    }
    console.error("Error updating approval:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const tenantContext = getTenantContext()

    // Verify approval belongs to tenant
    const existingApproval = await db.approval.findFirst({
      where: {
        id: params.id,
        rfp: {
          tenantId: tenantContext.tenantId,
        },
      },
    })

    if (!existingApproval) {
      return NextResponse.json({ error: "Approval not found" }, { status: 404 })
    }

    await db.approval.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: "Approval deleted successfully" })
  } catch (error) {
    console.error("Error deleting approval:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}