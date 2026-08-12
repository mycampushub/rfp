import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { getTenantContext, AuthError, PermissionError } from "@/lib/tenant-context"
import { z } from "zod"

const updateSectionSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  isRequired: z.boolean().optional(),
  order: z.number().optional(),
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

    const section = await db.section.findFirst({
      where: {
        id: id,
        rfp: {
          tenantId: tenantContext.tenantId,
        },
      },
      include: {
        questions: {
          orderBy: { order: "asc" },
        },
        rubricCriteria: true,
        rfp: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
      },
    })

    if (!section) {
      return NextResponse.json({ error: "Section not found" }, { status: 404 })
    }

    return NextResponse.json(section)
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: 401 })
    if (error instanceof PermissionError) return NextResponse.json({ error: error.message }, { status: 403 })
    console.error("Error fetching section:", error)
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
    const validatedData = updateSectionSchema.parse(body)

    const tenantContext = getTenantContext(session)

    // Verify section belongs to tenant
    const existingSection = await db.section.findFirst({
      where: {
        id: id,
        rfp: {
          tenantId: tenantContext.tenantId,
        },
      },
    })

    if (!existingSection) {
      return NextResponse.json({ error: "Section not found" }, { status: 404 })
    }

    const section = await db.section.update({
      where: { id: id },
      data: validatedData,
      include: {
        questions: {
          orderBy: { order: "asc" },
        },
        rubricCriteria: true,
      },
    })

    return NextResponse.json(section)
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: 401 })
    if (error instanceof PermissionError) return NextResponse.json({ error: error.message }, { status: 403 })
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation Error", details: error.issues }, { status: 400 })
    }
    console.error("Error updating section:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })      
          const { id } = await params
    }

    const tenantContext = getTenantContext(session)

    // Verify section belongs to tenant
    const existingSection = await db.section.findFirst({
      where: {
        id: id,
        rfp: {
          tenantId: tenantContext.tenantId,
        },
      },
    })

    if (!existingSection) {
      return NextResponse.json({ error: "Section not found" }, { status: 404 })
    }

    await db.section.delete({
      where: { id: id },
    })

    return NextResponse.json({ message: "Section deleted successfully" })
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: 401 })
    if (error instanceof PermissionError) return NextResponse.json({ error: error.message }, { status: 403 })
    console.error("Error deleting section:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}