import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { getTenantContext, AuthError, PermissionError } from "@/lib/tenant-context"
import { z } from "zod"
import NotificationService from "@/lib/notification-service"

const updateAddendumSchema = z.object({
  title: z.string().optional(),
  note: z.string().optional(),
  attachments: z.array(z.string()).optional(),
  requiresAck: z.boolean().optional(),
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

    const addendum = await db.addendum.findFirst({
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
        acknowledgments: {
          include: {
            vendor: {
              select: {
                id: true,
                name: true,
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
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: 401 })
    if (error instanceof PermissionError) return NextResponse.json({ error: error.message }, { status: 403 })
    console.error("Error fetching addendum:", error)
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
    const validatedData = updateAddendumSchema.parse(body)

    const tenantContext = getTenantContext(session)

    // Verify addendum belongs to tenant
    const existingAddendum = await db.addendum.findFirst({
      where: {
        id: id,
        rfp: {
          tenantId: tenantContext.tenantId,
        },
      },
    })

    if (!existingAddendum) {
      return NextResponse.json({ error: "Addendum not found" }, { status: 404 })
    }

    const addendum = await db.addendum.update({
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
        acknowledgments: {
          include: {
            vendor: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    })

    // Send notification for addendum update
    await NotificationService.send({
      userId: tenantContext.userId,
      type: "addendum_updated",
      title: "Addendum Updated",
      message: "Addendum has been updated for the RFP",
    })

    return NextResponse.json(addendum)
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: 401 })
    if (error instanceof PermissionError) return NextResponse.json({ error: error.message }, { status: 403 })
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation Error", details: error.issues }, { status: 400 })
    }
    console.error("Error updating addendum:", error)
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
    }

    const { id } = await params
    const tenantContext = getTenantContext(session)

    // Verify addendum belongs to tenant
    const existingAddendum = await db.addendum.findFirst({
      where: {
        id: id,
        rfp: {
          tenantId: tenantContext.tenantId,
        },
      },
    })

    if (!existingAddendum) {
      return NextResponse.json({ error: "Addendum not found" }, { status: 404 })
    }

    await db.addendum.delete({
      where: { id: id },
    })

    return NextResponse.json({ message: "Addendum deleted successfully" })
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: 401 })
    if (error instanceof PermissionError) return NextResponse.json({ error: error.message }, { status: 403 })
    console.error("Error deleting addendum:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}