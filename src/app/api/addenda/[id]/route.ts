import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import { z } from "zod"

const updateAddendumSchema = z.object({
  title: z.string().optional(),
  note: z.string().optional(),
  attachments: z.array(z.string()).optional(),
  requiresAck: z.boolean().optional(),
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

    const addendum = await db.addendum.findFirst({
      where: {
        id: params.id,
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
        acknowledgments: {
          include: {
            vendor: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    })

    if (!addendum) {
      return NextResponse.json({ error: "Addendum not found" }, { status: 404 })
    }

    return NextResponse.json(addendum)
  } catch (error) {
    console.error("Error fetching addendum:", error)
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
    const validatedData = updateAddendumSchema.parse(body)

    const tenantContext = getTenantContext()

    // Verify addendum belongs to tenant
    const existingAddendum = await db.addendum.findFirst({
      where: {
        id: params.id,
        rfp: {
          tenantId: tenantContext.tenantId,
        },
      },
    })

    if (!existingAddendum) {
      return NextResponse.json({ error: "Addendum not found" }, { status: 404 })
    }

    const addendum = await db.addendum.update({
      where: { id: params.id },
      data: validatedData,
      include: {
        rfp: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
        acknowledgments: {
          include: {
            vendor: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    })

    // TODO: Send notification for addendum update
    // This would integrate with a notification system

    return NextResponse.json(addendum)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation Error", details: error.errors }, { status: 400 })
    }
    console.error("Error updating addendum:", error)
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

    // Verify addendum belongs to tenant
    const existingAddendum = await db.addendum.findFirst({
      where: {
        id: params.id,
        rfp: {
          tenantId: tenantContext.tenantId,
        },
      },
    })

    if (!existingAddendum) {
      return NextResponse.json({ error: "Addendum not found" }, { status: 404 })
    }

    await db.addendum.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: "Addendum deleted successfully" })
  } catch (error) {
    console.error("Error deleting addendum:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}