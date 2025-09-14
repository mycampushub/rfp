import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import { z } from "zod"

const createQuestionSchema = z.object({
  sectionId: z.string(),
  type: z.enum(["text", "number", "multiple_choice", "checkbox", "file", "date"]),
  prompt: z.string(),
  required: z.boolean().default(false),
  constraints: z.any().optional(),
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

    const tenantContext = getTenantContext()
    
    const whereClause: any = {}
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

    const questions = await db.question.findMany({
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
    })

    return NextResponse.json(questions)
  } catch (error) {
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

    const tenantContext = getTenantContext()

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
      data: {
        ...validatedData,
      },
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
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation Error", details: error.errors }, { status: 400 })
    }
    console.error("Error creating question:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}