import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import { z } from "zod"

const initiateProcessSchema = z.object({
  rfpId: z.string(),
  workflowId: z.string(),
  metadata: z.any().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const rfpId = searchParams.get("rfpId")
    const status = searchParams.get("status")

    const tenantContext = getTenantContext()
    
    const whereClause: any = {
      rfp: {
        tenantId: tenantContext.tenantId,
      },
    }
    
    if (rfpId) {
      whereClause.rfpId = rfpId
    }
    if (status) {
      whereClause.status = status
    }

    const processes = await db.approvalProcess.findMany({
      where: whereClause,
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
            description: true,
          },
        },
        requests: {
          include: {
            approver: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(processes)
  } catch (error) {
    console.error("Error fetching processes:", error)
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
    const validatedData = initiateProcessSchema.parse(body)

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

    // Verify workflow belongs to tenant
    const workflow = await db.approvalWorkflow.findFirst({
      where: {
        id: validatedData.workflowId,
        tenantId: tenantContext.tenantId,
        isActive: true,
      },
    })

    if (!workflow) {
      return NextResponse.json({ error: "Workflow not found or inactive" }, { status: 404 })
    }

    // Check if there's already an active process for this RFP
    const existingProcess = await db.approvalProcess.findFirst({
      where: {
        rfpId: validatedData.rfpId,
        status: "in_progress",
      },
    })

    if (existingProcess) {
      return NextResponse.json({ error: "Active approval process already exists for this RFP" }, { status: 400 })
    }

    // Create approval process
    const process = await db.approvalProcess.create({
      data: {
        rfpId: validatedData.rfpId,
        workflowId: validatedData.workflowId,
        requestedBy: tenantContext.userId,
        status: "in_progress",
        currentStage: 0,
        metadata: validatedData.metadata || {},
      },
    })

    // Create approval requests for each stage
    const workflowStages = workflow.stages as any[]
    const requests = await Promise.all(
      workflowStages.map((stage, index) =>
        db.approvalRequest.create({
          data: {
            processId: process.id,
            stageId: stage.id,
            stageName: stage.name,
            approverRole: stage.approverRole,
            slaHours: stage.slaHours,
            status: index === 0 ? "pending" : "waiting",
            dueAt: calculateDueDate(stage.slaHours),
          },
        })
      )
    )

    // TODO: Send notifications for first stage approvers
    // This would integrate with a notification system

    const fullProcess = await db.approvalProcess.findUnique({
      where: { id: process.id },
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
            description: true,
          },
        },
        requests: {
          include: {
            approver: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    })

    return NextResponse.json(fullProcess, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation Error", details: error.errors }, { status: 400 })
    }
    console.error("Error creating approval process:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

function calculateDueDate(slaHours: number): Date {
  const dueDate = new Date()
  dueDate.setHours(dueDate.getHours() + slaHours)
  return dueDate
}