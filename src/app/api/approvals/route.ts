import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import { z } from "zod"

const createApprovalSchema = z.object({
  rfpId: z.string(),
  stage: z.enum(["draft", "legal_review", "budget", "publish", "evaluation_complete", "award", "contract"]),
  approverId: z.string(),
})

const updateApprovalSchema = z.object({
  status: z.enum(["pending", "approved", "rejected"]),
  comments: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const rfpId = searchParams.get("rfpId")
    const stage = searchParams.get("stage")
    const status = searchParams.get("status")
    const approverId = searchParams.get("approverId")

    const tenantContext = getTenantContext()
    
    const whereClause: any = {
      rfp: {
        tenantId: tenantContext.tenantId,
      },
    }
    
    if (rfpId) {
      whereClause.rfpId = rfpId
    }
    if (stage) {
      whereClause.stage = stage
    }
    if (status) {
      whereClause.status = status
    }
    if (approverId) {
      whereClause.approverId = approverId
    }

    const approvals = await db.approval.findMany({
      where: whereClause,
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
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(approvals)
  } catch (error) {
    console.error("Error fetching approvals:", error)
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
    const validatedData = createApprovalSchema.parse(body)

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

    // Verify approver belongs to tenant
    const approver = await db.user.findFirst({
      where: {
        id: validatedData.approverId,
        tenantId: tenantContext.tenantId,
      },
    })

    if (!approver) {
      return NextResponse.json({ error: "Approver not found" }, { status: 404 })
    }

    // Check if approval already exists for this RFP and stage
    const existingApproval = await db.approval.findFirst({
      where: {
        rfpId: validatedData.rfpId,
        stage: validatedData.stage,
      },
    })

    if (existingApproval) {
      return NextResponse.json({ error: "Approval already exists for this stage" }, { status: 400 })
    }

    const approval = await db.approval.create({
      data: validatedData,
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

    // TODO: Send notification for new approval request
    // This would integrate with a notification system

    return NextResponse.json(approval, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation Error", details: error.errors }, { status: 400 })
    }
    console.error("Error creating approval:", error)
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
    const approvalId = searchParams.get("id")

    if (!approvalId) {
      return NextResponse.json({ error: "Approval ID is required" }, { status: 400 })
    }

    const body = await request.json()
    const validatedData = updateApprovalSchema.parse(body)

    const tenantContext = getTenantContext()

    // Verify approval belongs to tenant
    const existingApproval = await db.approval.findFirst({
      where: {
        id: approvalId,
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
      where: { id: approvalId },
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