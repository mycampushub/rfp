import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import { z } from "zod"

const updateWorkflowSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  stages: z.array(z.object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    required: z.boolean(),
    order: z.number(),
    approverRole: z.string(),
    slaHours: z.number(),
    autoApprove: z.boolean().optional(),
    conditions: z.array(z.any()).optional(),
  })).optional(),
  isActive: z.boolean().optional(),
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

    const workflow = await db.approvalWorkflow.findFirst({
      where: {
        id: params.id,
        tenantId: tenantContext.tenantId,
      },
      include: {
        processes: {
          include: {
            rfp: {
              select: {
                id: true,
                title: true,
                status: true,
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
            },
          },
        },
      },
    })

    if (!workflow) {
      return NextResponse.json({ error: "Workflow not found" }, { status: 404 })
    }

    return NextResponse.json(workflow)
  } catch (error) {
    console.error("Error fetching workflow:", error)
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
    const validatedData = updateWorkflowSchema.parse(body)

    const tenantContext = getTenantContext()

    // Verify workflow belongs to tenant
    const existingWorkflow = await db.approvalWorkflow.findFirst({
      where: {
        id: params.id,
        tenantId: tenantContext.tenantId,
      },
    })

    if (!existingWorkflow) {
      return NextResponse.json({ error: "Workflow not found" }, { status: 404 })
    }

    const workflow = await db.approvalWorkflow.update({
      where: { id: params.id },
      data: validatedData,
    })

    return NextResponse.json(workflow)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation Error", details: error.errors }, { status: 400 })
    }
    console.error("Error updating workflow:", error)
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

    // Verify workflow belongs to tenant
    const existingWorkflow = await db.approvalWorkflow.findFirst({
      where: {
        id: params.id,
        tenantId: tenantContext.tenantId,
      },
    })

    if (!existingWorkflow) {
      return NextResponse.json({ error: "Workflow not found" }, { status: 404 })
    }

    // Check if workflow is being used by any active processes
    const activeProcesses = await db.approvalProcess.count({
      where: {
        workflowId: params.id,
        status: "in_progress",
      },
    })

    if (activeProcesses > 0) {
      return NextResponse.json({ 
        error: "Cannot delete workflow with active processes",
        activeProcesses 
      }, { status: 400 })
    }

    await db.approvalWorkflow.update({
      where: { id: params.id },
      data: { isActive: false },
    })

    return NextResponse.json({ message: "Workflow deactivated successfully" })
  } catch (error) {
    console.error("Error deleting workflow:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}