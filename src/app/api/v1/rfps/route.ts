import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { PERMISSIONS } from "@/types/auth"
import { getTenantContext, AuthError, PermissionError } from "@/lib/tenant-context"
import { requirePermission } from "@/lib/rbac"
import { z } from "zod"

export const dynamic = "force-dynamic"

const createRFPSchema = z.object({
  title: z.string().min(1, "Title is required"),
  category: z.string().optional(),
  budget: z.number().optional(),
  confidentiality: z.enum(["internal", "confidential", "restricted"]).default("internal"),
  description: z.string().optional(),
  timeline: z.object({
    qnaStart: z.string().optional(),
    qnaEnd: z.string().optional(),
    submissionDeadline: z.string().optional(),
    evaluationStart: z.string().optional(),
    awardTarget: z.string().optional(),
  }).optional(),
  settings: z.object({}).optional(),
})

// GET /api/v1/rfps - List RFPs
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const ctx = getTenantContext(session)

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = Math.min(parseInt(searchParams.get("limit") || "10"), 100)
    const status = searchParams.get("status")
    const category = searchParams.get("category")
    const search = searchParams.get("search")

    const skip = (page - 1) * limit
    const where: Record<string, unknown> = { tenantId: ctx.tenantId }

    if (status) (where as Record<string, unknown>).status = status
    if (category) (where as Record<string, unknown>).category = category
    if (search) {
      (where as Record<string, unknown>).title = { contains: search }
    }

    const [rfps, total] = await Promise.all([
      db.rFP.findMany({
        where,
        include: {
          timeline: true,
          _count: { select: { invitations: true, submissions: true, qna: true } }
        },
        skip, take: limit,
        orderBy: { createdAt: "desc" }
      }),
      db.rFP.count({ where })
    ])

    return NextResponse.json({
      data: rfps,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    })
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: 401 })
    if (error instanceof PermissionError) return NextResponse.json({ error: error.message }, { status: 403 })
    console.error("Error fetching RFPs:", error)
    return NextResponse.json({ error: "Failed to fetch RFPs" }, { status: 500 })
  }
}

// POST /api/v1/rfps - Create RFP
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const ctx = getTenantContext(session)
    await requirePermission("rfp:create")

    const body = await request.json()
    const validatedData = createRFPSchema.parse(body)

    const rfp = await db.rFP.create({
      data: {
        tenantId: ctx.tenantId,
        title: validatedData.title,
        category: validatedData.category,
        budget: validatedData.budget,
        confidentiality: validatedData.confidentiality,
        settings: validatedData.settings,
        timeline: validatedData.timeline ? {
          create: {
            qnaStart: validatedData.timeline.qnaStart ? new Date(validatedData.timeline.qnaStart) : null,
            qnaEnd: validatedData.timeline.qnaEnd ? new Date(validatedData.timeline.qnaEnd) : null,
            submissionDeadline: validatedData.timeline.submissionDeadline ? new Date(validatedData.timeline.submissionDeadline) : null,
            evaluationStart: validatedData.timeline.evaluationStart ? new Date(validatedData.timeline.evaluationStart) : null,
            awardTarget: validatedData.timeline.awardTarget ? new Date(validatedData.timeline.awardTarget) : null,
          }
        } : undefined,
      },
      include: {
        timeline: true,
        _count: { select: { invitations: true, submissions: true, qna: true } }
      }
    })

    await db.activityLog.create({
      data: {
        tenantId: ctx.tenantId,
        actor: ctx.userId,
        action: "CREATE_RFP",
        targetType: "RFP",
        targetId: rfp.id,
        metadata: { rfpTitle: rfp.title }
      }
    })

    return NextResponse.json(rfp, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.issues }, { status: 400 })
    }
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: 401 })
    if (error instanceof PermissionError) return NextResponse.json({ error: error.message }, { status: 403 })
    console.error("Error creating RFP:", error)
    return NextResponse.json({ error: "Failed to create RFP" }, { status: 500 })
  }
}