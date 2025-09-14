import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import { z } from "zod"

const updateQuestionSchema = z.object({
  type: z.enum(["text", "number", "multiple_choice", "checkbox", "file", "date"]).optional(),
  prompt: z.string().optional(),
  required: z.boolean().optional(),
  constraints: z.any().optional(),
  order: z.number().optional(),
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

    const question = await db.question.findFirst({
      where: {
        id: params.id,
        section: {
          rfp: {
            tenantId: tenantContext.tenantId,
          },
        },
      },
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
    })

    if (!question) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 })
    }

    return NextResponse.json(question)
  } catch (error) {
    console.error("Error fetching question:", error)
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
    const validatedData = updateQuestionSchema.parse(body)

    const tenantContext = getTenantContext()

    // Verify question belongs to tenant
    const existingQuestion = await db.question.findFirst({
      where: {
        id: params.id,
        section: {
          rfp: {
            tenantId: tenantContext.tenantId,
          },
        },
      },
    })

    if (!existingQuestion) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 })
    }

    const question = await db.question.update({
      where: { id: params.id },
      data: validatedData,
      include: {
        section: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    })

    return NextResponse.json(question)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation Error", details: error.errors }, { status: 400 })
    }
    console.error("Error updating question:", error)
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

    // Verify question belongs to tenant
    const existingQuestion = await db.question.findFirst({
      where: {
        id: params.id,
        section: {
          rfp: {
            tenantId: tenantContext.tenantId,
          },
        },
      },
    })

    if (!existingQuestion) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 })
    }

    await db.question.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: "Question deleted successfully" })
  } catch (error) {
    console.error("Error deleting question:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}