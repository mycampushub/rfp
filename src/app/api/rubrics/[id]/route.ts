import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { getTenantContext, AuthError, PermissionError } from "@/lib/tenant-context"
import { requirePermission } from "@/lib/rbac"
import { z } from "zod"

export const dynamic = "force-dynamic"

const updateRubricSchema = z.object({
  label: z.string().optional(),
  weight: z.number().optional(),
  scaleMin: z.number().optional(),
  scaleMax: z.number().optional(),
  guidance: z.string().optional(),
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

    const tenantContext = getTenantContext(session)

    const rubric = await db.rubricCriterion.findFirst({
      where: {
        id: params.id,
        OR: [
          { rfp: { tenantId: tenantContext.tenantId } },
          { section: { rfp: { tenantId: tenantContext.tenantId } } },
        ],
      },
      include: {
        rfp: {
          select: {
            id: true,
            title: true,
          },
        },
        section: {
          select: {
            id: true,
            title: true,
          },
        },
        scores: {
          include: {
            evaluator: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            submission: {
              select: {
                id: true,
                vendor: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    })

    if (!rubric) {
      return NextResponse.json({ error: "Rubric criterion not found" }, { status: 404 })
    }

    return NextResponse.json(rubric)
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: 401 })
    if (error instanceof PermissionError) return NextResponse.json({ error: error.message }, { status: 403 })
    console.error("Error fetching rubric:", error)
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
    const validatedData = updateRubricSchema.parse(body)

    const tenantContext = getTenantContext(session)
    await requirePermission("rfp:edit")

    // Verify rubric belongs to tenant
    const existingRubric = await db.rubricCriterion.findFirst({
      where: {
        id: params.id,
        OR: [
          { rfp: { tenantId: tenantContext.tenantId } },
          { section: { rfp: { tenantId: tenantContext.tenantId } } },
        ],
      },
    })

    if (!existingRubric) {
      return NextResponse.json({ error: "Rubric criterion not found" }, { status: 404 })
    }

    const rubric = await db.rubricCriterion.update({
      where: { id: params.id },
      data: validatedData,
      include: {
        rfp: {
          select: {
            id: true,
            title: true,
          },
        },
        section: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    })

    return NextResponse.json(rubric)
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: 401 })
    if (error instanceof PermissionError) return NextResponse.json({ error: error.message }, { status: 403 })
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation Error", details: error.issues }, { status: 400 })
    }
    console.error("Error updating rubric:", error)
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

    const tenantContext = getTenantContext(session)
    await requirePermission("rfp:edit")

    // Verify rubric belongs to tenant
    const existingRubric = await db.rubricCriterion.findFirst({
      where: {
        id: params.id,
        OR: [
          { rfp: { tenantId: tenantContext.tenantId } },
          { section: { rfp: { tenantId: tenantContext.tenantId } } },
        ],
      },
    })

    if (!existingRubric) {
      return NextResponse.json({ error: "Rubric criterion not found" }, { status: 404 })
    }

    await db.rubricCriterion.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: "Rubric criterion deleted successfully" })
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: 401 })
    if (error instanceof PermissionError) return NextResponse.json({ error: error.message }, { status: 403 })
    console.error("Error deleting rubric:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}