import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { getTenantContext, AuthError, PermissionError } from "@/lib/tenant-context"
import { z } from "zod"
import NotificationService from "@/lib/notification-service"

const updateQnASchema = z.object({
  answerText: z.string().optional(),
  isPublic: z.boolean().optional(),
  status: z.enum(["pending", "answered", "published"]).optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const tenantContext = getTenantContext(session)

    const qna = await db.qnA.findFirst({
      where: {
        id: id,
        rfp: {
          tenantId: tenantContext.tenantId,
        },
      },
      include: {
        rfp: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
        vendor: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    if (!qna) {
      return NextResponse.json({ error: "Q&A item not found" }, { status: 404 })
    }

    return NextResponse.json(qna)
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: 401 })
    if (error instanceof PermissionError) return NextResponse.json({ error: error.message }, { status: 403 })
    console.error("Error fetching Q&A item:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const { id } = await params

    const body = await request.json()
    const validatedData = updateQnASchema.parse(body)

    const tenantContext = getTenantContext(session)

    // Verify Q&A belongs to tenant
    const existingQnA = await db.qnA.findFirst({
      where: {
        id: id,
        rfp: {
          tenantId: tenantContext.tenantId,
        },
      },
    })

    if (!existingQnA) {
      return NextResponse.json({ error: "Q&A item not found" }, { status: 404 })
    }

    const qna = await db.qnA.update({
      where: { id: id },
      data: validatedData,
      include: {
        rfp: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
        vendor: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    // Send notification to the vendor who asked the question
    if (qna.vendorId) {
      await NotificationService.send({
        userId: qna.vendorId,
        type: "question_answered",
        title: "Question Answered",
        message: "Your question has been answered",
      })
    }

    return NextResponse.json(qna)
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: 401 })
    if (error instanceof PermissionError) return NextResponse.json({ error: error.message }, { status: 403 })
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation Error", details: error.issues }, { status: 400 })
    }
    console.error("Error updating Q&A item:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const tenantContext = getTenantContext(session)

    // Verify Q&A belongs to tenant
    const existingQnA = await db.qnA.findFirst({
      where: {
        id: id,
        rfp: {
          tenantId: tenantContext.tenantId,
        },
      },
    })

    if (!existingQnA) {
      return NextResponse.json({ error: "Q&A item not found" }, { status: 404 })
    }

    await db.qnA.delete({
      where: { id: id },
    })

    return NextResponse.json({ message: "Q&A item deleted successfully" })
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: 401 })
    if (error instanceof PermissionError) return NextResponse.json({ error: error.message }, { status: 403 })
    console.error("Error deleting Q&A item:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}