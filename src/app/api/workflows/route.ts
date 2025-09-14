import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import { z } from "zod"
import { v4 as uuidv4 } from "uuid"

const createWorkflowSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  stages: z.array(z.object({
    name: z.string(),
    description: z.string(),
    required: z.boolean(),
    order: z.number(),
    approverRole: z.string(),
    slaHours: z.number(),
    autoApprove: z.boolean().optional(),
    conditions: z.array(z.any()).optional(),
  })),
})

const updateWorkflowSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  stages: z.array(z.object({
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

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const tenantContext = getTenantContext()

    const workflows = await db.approvalWorkflow.findMany({
      where: {
        tenantId: tenantContext.tenantId,
        isActive: true,
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(workflows)
  } catch (error) {
    console.error("Error fetching workflows:", error)
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
    const validatedData = createWorkflowSchema.parse(body)

    const tenantContext = getTenantContext()

    // Add IDs to stages
    const stagesWithIds = validatedData.stages.map(stage => ({
      ...stage,
      id: uuidv4(),
    }))

    const workflow = await db.approvalWorkflow.create({
      data: {
        tenantId: tenantContext.tenantId,
        name: validatedData.name,
        description: validatedData.description,
        stages: stagesWithIds,
        isActive: true,
      },
    })

    return NextResponse.json(workflow, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation Error", details: error.errors }, { status: 400 })
    }
    console.error("Error creating workflow:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}