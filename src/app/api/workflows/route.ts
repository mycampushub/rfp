import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { getTenantContext, AuthError, PermissionError } from "@/lib/tenant-context"
import { z } from "zod"
import { v4 as uuidv4 } from "uuid"
import { Prisma } from "@prisma/client"

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
    conditions: z.any().optional(),
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
    conditions: z.any().optional(),
  })).optional(),
  isActive: z.boolean().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const tenantContext = getTenantContext(session)

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
    const skip = (page - 1) * limit

    const where = {
      tenantId: tenantContext.tenantId,
      isActive: true,
    }

    const [workflows, total] = await Promise.all([
      db.approvalWorkflow.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip,
      }),
      db.approvalWorkflow.count({ where }),
    ])

    return NextResponse.json({
      data: workflows,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    })
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