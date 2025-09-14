import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import { z } from "zod"

const updateSectionSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  isRequired: z.boolean().optional(),
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

    const section = await db.section.findFirst({
      where: {
        id: params.id,
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
    console.error("Error fetching section:", error)
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
    const validatedData = updateSectionSchema.parse(body)

    const tenantContext = getTenantContext()

    // Verify section belongs to tenant
    const existingSection = await db.section.findFirst({
      where: {
        id: params.id,
        rfp: {
          tenantId: tenantContext.tenantId,
        },
      },
    })

    if (!existingSection) {
      return NextResponse.json({ error: "Section not found" }, { status: 404 })
    }

    const section = await db.section.update({
      where: { id: params.id },
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
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation Error", details: error.errors }, { status: 400 })
    }
    console.error("Error updating section:", error)
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

    // Verify section belongs to tenant
    const existingSection = await db.section.findFirst({
      where: {
        id: params.id,
        rfp: {
          tenantId: tenantContext.tenantId,
        },
      },
    })

    if (!existingSection) {
      return NextResponse.json({ error: "Section not found" }, { status: 404 })
    }

    await db.section.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: "Section deleted successfully" })
  } catch (error) {
    console.error("Error deleting section:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}