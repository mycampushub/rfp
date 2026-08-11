import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { getTenantContext, AuthError, PermissionError } from "@/lib/tenant-context"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const ctx = getTenantContext(session)
    const { id } = await params

    // Find the addendum scoped to tenant via RFP
    const addendum = await db.addendum.findFirst({
      where: {
        id,
        rfp: { tenantId: ctx.tenantId },
      },
      include: {
        rfp: { select: { id: true, title: true } },
        acknowledgments: { select: { vendorId: true } },
      },
    })

    if (!addendum) {
      return NextResponse.json({ error: "Addendum not found" }, { status: 404 })
    }

    // Find all invited vendors for the RFP
    const invitations = await db.invitation.findMany({
      where: { rfpId: addendum.rfpId },
      select: { vendorId: true },
      take: 200,
    })

    const invitedVendorIds = invitations
      .map((inv) => inv.vendorId)
      .filter((vId): vId is string => vId !== null)

    const acknowledgedVendorIds = new Set(
      addendum.acknowledgments.map((ack) => ack.vendorId)
    )

    // Find vendors that haven't acknowledged
    const unacknowledgedVendorIds = invitedVendorIds.filter(
      (vId) => !acknowledgedVendorIds.has(vId)
    )

    if (unacknowledgedVendorIds.length === 0) {
      return NextResponse.json({ message: "All vendors have acknowledged", count: 0 })
    }

    // Get all users in the tenant to send reminder notifications
    const tenantUsers = await db.user.findMany({
      where: { tenantId: ctx.tenantId, isActive: true },
      select: { id: true },
      take: 500,
    })

    let reminderCount = 0
    const notificationPromises = tenantUsers.map((user) =>
      db.notification.create({
        data: {
          userId: user.id,
          type: "addendum_reminder",
          title: `Reminder: ${addendum.title}`,
          message: `${unacknowledgedVendorIds.length} vendor(s) have not yet acknowledged this addendum for "${addendum.rfp.title}"`,
          data: {
            addendumId: addendum.id,
            rfpId: addendum.rfpId,
            unacknowledgedVendorIds,
          },
        },
      }).then(() => {
        reminderCount++
      })
    )

    await Promise.all(notificationPromises)

    return NextResponse.json({
      message: `Reminders sent to ${reminderCount} users`,
      count: reminderCount,
      unacknowledgedVendorCount: unacknowledgedVendorIds.length,
    })
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: 401 })
    if (error instanceof PermissionError) return NextResponse.json({ error: error.message }, { status: 403 })
    console.error("Error sending addendum reminder:", error)
    return NextResponse.json({ error: "Failed to send reminder" }, { status: 500 })
  }
}
