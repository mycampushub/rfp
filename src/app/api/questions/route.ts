import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { getTenantContext, AuthError, PermissionError } from "@/lib/tenant-context"
import { z } from "zod"

const createQuestionSchema = z.object({
  sectionId: z.string(),
  type: z.enum(["text", "number", "multiple_choice", "checkbox", "file", "date"]),
  prompt: z.string(),
  required: z.boolean().default(false),
  constraints: z.record(z.string(), z.unknown()).optional(),
  order: z.number(),
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const sectionId = searchParams.get("sectionId")

    const tenantContext = getTenantContext(session)
    
    const whereClause: Record<string, unknown> = {}
    if (sectionId) {
      whereClause.sectionId = sectionId
      // Verify section belongs to tenant
      const section = await db.section.findFirst({
        where: {
          id: sectionId,
          rfp: {
            tenantId: tenantContext.tenantId,
          },
        },
      })
      if (!section) {
        return NextResponse.json({ error: "Section not found" }, { status: 404 })
      }
    } else {
      // If no sectionId, get all questions for tenant
      whereClause.section = {
        rfp: {
          tenantId: tenantContext.tenantId,
        },
      }
    }

    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
    const skip = (page - 1) * limit

    const [questions, total] = await Promise.all([
      db.question.findMany({
        where: whereClause,
        include: {
          section: {
            select: {
              id: true,
              title: true,
              rfp: {
                select: {
                  id: true,
                  title: true,
                },
              },
            },
          },
        },
        orderBy: { order: "asc" },
        take: limit,
        skip,
      }),
      db.question.count({ where: whereClause }),
    ])

    return NextResponse.json({
      data: questions,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    })
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: 401 })
    if (error instanceof PermissionError) return NextResponse.json({ error: error.message }, { status: 403 })
    console.error("Error fetching questions:", error)
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
    const validatedData = createQuestionSchema.parse(body)

    const tenantContext = getTenantContext(session)

    // Verify section belongs to tenant
    const section = await db.section.findFirst({
      where: {
        id: validatedData.sectionId,
        rfp: {
          tenantId: tenantContext.tenantId,
        },
      },
    })

    if (!section) {
      return NextResponse.json({ error: "Section not found" }, { status: 404 })
    }

    const question = await db.question.create({
      data: validatedData as any,
      include: {
        section: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    })

    return NextResponse.json(question, { status: 201 })
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: 401 })
    if (error instanceof PermissionError) return NextResponse.json({ error: error.message }, { status: 403 })
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation Error", details: error.issues }, { status: 400 })
    }
    console.error("Error creating question:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}