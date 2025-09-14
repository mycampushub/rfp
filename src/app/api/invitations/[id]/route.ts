import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import { z } from "zod"

const updateInvitationSchema = z.object({
  status: z.enum(["pending", "accepted", "declined", "expired"]).optional(),
  expiresAt: z.date().optional(),
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

    const invitation = await db.invitation.findFirst({
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
        vendor: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    if (!invitation) {
      return NextResponse.json({ error: "Invitation not found" }, { status: 404 })
    }

    return NextResponse.json(invitation)
  } catch (error) {
    console.error("Error fetching invitation:", error)
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
    const validatedData = updateInvitationSchema.parse(body)

    const tenantContext = getTenantContext()

    // Verify invitation belongs to tenant
    const existingInvitation = await db.invitation.findFirst({
      where: {
        id: params.id,
        rfp: {
          tenantId: tenantContext.tenantId,
        },
      },
    })

    if (!existingInvitation) {
      return NextResponse.json({ error: "Invitation not found" }, { status: 404 })
    }

    const invitation = await db.invitation.update({
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
        vendor: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json(invitation)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation Error", details: error.errors }, { status: 400 })
    }
    console.error("Error updating invitation:", error)
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

    // Verify invitation belongs to tenant
    const existingInvitation = await db.invitation.findFirst({
      where: {
        id: params.id,
        rfp: {
          tenantId: tenantContext.tenantId,
        },
      },
    })

    if (!existingInvitation) {
      return NextResponse.json({ error: "Invitation not found" }, { status: 404 })
    }

    await db.invitation.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: "Invitation deleted successfully" })
  } catch (error) {
    console.error("Error deleting invitation:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}