import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { getTenantContext, AuthError } from "@/lib/tenant-context"
import { z } from "zod"

const createRFPSchema = z.object({
  title: z.string().min(1),
  category: z.string().optional(),
  budget: z.coerce.number().positive().optional(),
  confidentiality: z.enum(["internal", "confidential", "restricted"]).default("internal"),
  description: z.string().optional(),
  timeline: z.object({
    qnaStart: z.string().optional(),
    qnaEnd: z.string().optional(),
    submissionDeadline: z.string().optional(),
    evaluationStart: z.string().optional(),
    awardTarget: z.string().optional(),
  }).optional(),
})

// GET /api/rfps - List RFPs
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const ctx = getTenantContext(session)

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const category = searchParams.get("category")
    const search = searchParams.get("search")

    const where: Record<string, unknown> = { tenantId: ctx.tenantId }

    if (status) (where as Record<string, unknown>).status = status
    if (category) (where as Record<string, unknown>).category = category
    if (search) {
      (where as Record<string, unknown>).OR = [
        { title: { contains: search } },
        { description: { contains: search } },
      ]
    }

    const rfps = await db.rFP.findMany({
      where,
      include: {
        timeline: true,
        _count: {
          select: { submissions: true, invitations: true },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(rfps)
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: 401 })
    console.error("Error fetching RFPs:", error)
    return NextResponse.json({ error: "Failed to fetch RFPs" }, { status: 500 })
  }
}

// POST /api/rfps - Create RFP
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const ctx = getTenantContext(session)

    const body = await request.json()
    const validatedData = createRFPSchema.parse(body)

    const rfp = await db.rFP.create({
      data: {
        tenantId: ctx.tenantId,
        title: validatedData.title,
        category: validatedData.category,
        budget: validatedData.budget ?? null,
        confidentiality: validatedData.confidentiality,
        description: validatedData.description,
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
      include: { timeline: true },
    })

    return NextResponse.json(rfp, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.issues }, { status: 400 })
    }
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: 401 })
    console.error("Error creating RFP:", error)
    return NextResponse.json({ error: "Failed to create RFP" }, { status: 500 })
  }
}
