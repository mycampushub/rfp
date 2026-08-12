import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { getTenantContext, AuthError, PermissionError } from "@/lib/tenant-context"

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const ctx = getTenantContext(session)
    const { id } = await params

    const body = await request.json()
    const action = body.action as string | undefined

    const connection = await db.vendorConnection.findFirst({
      where: { id, tenantId: ctx.tenantId },
    })
    if (!connection) return NextResponse.json({ error: "Connection not found" }, { status: 404 })

    const newStatus = action === "block" ? "blocked" : "accepted"

    const updated = await db.vendorConnection.update({
      where: { id },
      data: { status: newStatus, respondedAt: new Date() },
    })
    return NextResponse.json(updated)
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: 401 })
    if (error instanceof PermissionError) return NextResponse.json({ error: error.message }, { status: 403 })
    console.error("Error updating vendor connection:", error)
    return NextResponse.json({ error: "Failed to update vendor connection" }, { status: 500 })
  }
}
