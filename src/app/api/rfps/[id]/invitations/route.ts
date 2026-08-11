import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { getTenantContext, AuthError } from "@/lib/tenant-context"
import { z } from "zod"
import { v4 as uuidv4 } from "uuid"

const invitationSchema = z.object({
  vendorId: z.string().optional(),
  email: z.string().email(),
  status: z.string().default("pending"),
  expiresAt: z.string().optional(),
})

const syncInvitationsSchema = z.object({
  invitations: z.array(invitationSchema),
})

// PUT /api/rfps/[id]/invitations - Replace all invitations for an RFP
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const { id } = await params
    const ctx = getTenantContext(session)

    const rfp = await db.rFP.findFirst({
      where: { id: id, tenantId: ctx.tenantId },
    })
    if (!rfp) {
      return NextResponse.json({ error: "RFP not found" }, { status: 404 })
    }

    const body = await request.json()
    const { invitations } = syncInvitationsSchema.parse(body)

    // Delete all existing invitations
    await db.invitation.deleteMany({
      where: { rfpId: id },
    })

    // Create new invitations
    for (const inv of invitations) {
      // Try to find vendor by email if vendorId is not provided
      let vendorId = inv.vendorId
      if (!vendorId) {
        const vendor = await db.vendor.findFirst({
          where: { email: inv.email, tenantId: ctx.tenantId },
        })
        if (vendor) {
          vendorId = vendor.id
        }
      }

      await db.invitation.create({
        data: {
          rfpId: id,
          vendorId: vendorId || null,
          email: inv.email,
          token: uuidv4(),
          status: inv.status || "pending",
          expiresAt: inv.expiresAt ? new Date(inv.expiresAt) : null,
        },
      })
    }

    const updatedInvitations = await db.invitation.findMany({
      where: { rfpId: id },
      include: { vendor: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      take: 200,
    })

    return NextResponse.json(updatedInvitations)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.issues }, { status: 400 })
    }
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: 401 })
    console.error("Error syncing invitations:", error)
    return NextResponse.json({ error: "Failed to update invitations" }, { status: 500 })
  }
}
