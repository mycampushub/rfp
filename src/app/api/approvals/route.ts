import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { getTenantContext, AuthError, PermissionError } from "@/lib/tenant-context"
import { requirePermission } from "@/lib/rbac"
import { z } from "zod"
import NotificationService from "@/lib/notification-service"

const createApprovalSchema = z.object({
  rfpId: z.string(),
  stage: z.enum(["draft", "legal_review", "budget", "publish", "evaluation_complete", "award", "contract"]),
  approverId: z.string(),
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

    const tenantContext = getTenantContext(session)
    
    const whereClause: Record<string, unknown> = {
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

    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
    const skip = (page - 1) * limit

    const [approvals, total] = await Promise.all([
      db.approval.findMany({
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
        take: limit,
        skip,
      }),
      db.approval.count({ where: whereClause }),
    ])

    return NextResponse.json({
      data: approvals,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    })
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: 401 })
    if (error instanceof PermissionError) return NextResponse.json({ error: error.message }, { status: 403 })
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

    const tenantContext = getTenantContext(session)
    await requirePermission('approval:create')

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

    // Send notification to the approver
    await NotificationService.send({
      userId: approval.approverId,
      type: "approval_requested",
      title: "Approval Requested",
      message: `New approval request for RFP stage ${approval.stage}`,
    })

    return NextResponse.json(approval, { status: 201 })
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: 401 })
    if (error instanceof PermissionError) return NextResponse.json({ error: error.message }, { status: 403 })
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation Error", details: error.issues }, { status: 400 })
    }
    console.error("Error creating approval:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
