import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { getTenantContext, AuthError, PermissionError } from "@/lib/tenant-context"
import { requirePermission } from "@/lib/rbac"
import { z } from "zod"
import type { Prisma } from "@prisma/client"
import { v4 as uuidv4 } from "uuid"

export const dynamic = "force-dynamic"

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
    conditions: z.array(z.record(z.string(), z.unknown())).optional(),
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
    conditions: z.array(z.record(z.string(), z.unknown())).optional(),
  })).optional(),
  isActive: z.boolean().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '10') || 10, 100)
    const offset = Math.max(0, parseInt(searchParams.get('offset') || '0') || 0)

    const tenantContext = getTenantContext(session)

    const workflows = await db.approvalWorkflow.findMany({
      where: {
        tenantId: tenantContext.tenantId,
        isActive: true,
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    })

    return NextResponse.json(workflows)
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: 401 })
    if (error instanceof PermissionError) return NextResponse.json({ error: error.message }, { status: 403 })
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

    const tenantContext = getTenantContext(session)
    await requirePermission("approval:manage")

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
        stages: stagesWithIds as unknown as Prisma.InputJsonValue,
        isActive: true,
      },
    })

    return NextResponse.json(workflow, { status: 201 })
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: 401 })
    if (error instanceof PermissionError) return NextResponse.json({ error: error.message }, { status: 403 })
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation Error", details: error.issues }, { status: 400 })
    }
    console.error("Error creating workflow:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}