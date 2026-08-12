import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { getTenantContext, AuthError } from "@/lib/tenant-context"
import { z } from "zod"

const createTemplateSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(5000).optional(),
  category: z.string().max(100).optional(),
  isPublic: z.boolean().default(false),
  sections: z.array(
    z.object({
      title: z.string().min(1),
      description: z.string().optional(),
      questions: z.array(
        z.object({
          type: z.string(),
          prompt: z.string().min(1),
          required: z.boolean().default(false),
          order: z.number(),
        })
      ),
    })
  ).min(1),
  scoringCriteria: z.array(
    z.object({
      label: z.string().min(1),
      weight: z.number().min(0).max(100),
      scaleMin: z.number(),
      scaleMax: z.number(),
      guidance: z.string().optional(),
    })
  ).min(1),
  terms: z.string().max(10000).optional(),
})

// GET /api/templates — List templates (own + public)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const ctx = getTenantContext(session)

    const { searchParams } = new URL(request.url)
    const category = searchParams.get("category")

    const where: Record<string, unknown> = {
      OR: [
        { tenantId: ctx.tenantId },
        { isPublic: true },
      ],
    }

    if (category) {
      (where as Record<string, unknown>).category = category
    }

    const templates = await db.rFPTemplate.findMany({
      where,
      include: {
        _count: {
          select: { rfps: true },
        },
        createdByUser: {
          select: { name: true, email: true },
        },
      },
      orderBy: [{ isPublic: "desc" }, { usageCount: "desc" }, { createdAt: "desc" }],
    })

    return NextResponse.json(templates)
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: 401 })
    console.error("Error fetching templates:", error)
    return NextResponse.json({ error: "Failed to fetch templates" }, { status: 500 })
  }
}

// POST /api/templates — Create a template
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const ctx = getTenantContext(session)

    const body = await request.json()
    const validated = createTemplateSchema.parse(body)

    // Validate total scoring weight
    const totalWeight = validated.scoringCriteria.reduce((sum, c) => sum + c.weight, 0)
    if (totalWeight !== 100) {
      return NextResponse.json(
        { error: "Scoring criteria weights must total 100%" },
        { status: 400 }
      )
    }

    const template = await db.rFPTemplate.create({
      data: {
        tenantId: ctx.tenantId,
        name: validated.name,
        description: validated.description,
        category: validated.category,
        isPublic: validated.isPublic,
        sections: JSON.stringify(validated.sections),
        scoringCriteria: JSON.stringify(validated.scoringCriteria),
        terms: validated.terms || null,
        createdBy: ctx.userId,
      },
    })

    return NextResponse.json(template, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.issues }, { status: 400 })
    }
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: 401 })
    console.error("Error creating template:", error)
    return NextResponse.json({ error: "Failed to create template" }, { status: 500 })
  }
}
