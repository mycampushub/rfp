import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { getTenantContext, AuthError, PermissionError } from "@/lib/tenant-context"
import { z } from "zod"

const updateBidSchema = z.object({
  amount: z.number().positive().optional(),
  currency: z.string().optional(),
  duration: z.string().optional(),
  proposal: z.string().optional(),
  status: z.enum(["draft", "submitted", "reviewed", "accepted", "rejected", "withdrawn"]).optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const ctx = getTenantContext(session)
    const { id } = await params

    const bid = await db.bid.findFirst({
      where: { id },
      include: {
        publicRfp: { select: { id: true, tenantId: true } },
        vendorProfile: { select: { id: true, businessName: true } },
        messages: {
          include: { sender: { select: { id: true, name: true } } },
          orderBy: { createdAt: "asc" },
        },
      },
    })
    if (!bid) return NextResponse.json({ error: "Bid not found" }, { status: 404 })
    if (bid.publicRfp.tenantId !== ctx.tenantId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    return NextResponse.json(bid)
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: 401 })
    if (error instanceof PermissionError) return NextResponse.json({ error: error.message }, { status: 403 })
    console.error("Error fetching bid:", error)
    return NextResponse.json({ error: "Failed to fetch bid" }, { status: 500 })
  }
}

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
    const data = updateBidSchema.parse(body)

    const bid = await db.bid.findFirst({
      where: { id },
      include: { publicRfp: { select: { tenantId: true } } },
    })
    if (!bid || bid.publicRfp.tenantId !== ctx.tenantId) {
      return NextResponse.json({ error: "Bid not found" }, { status: 404 })
    }

    const updated = await db.bid.update({
      where: { id },
      data: {
        ...(data.amount !== undefined && { amount: data.amount }),
        ...(data.currency && { currency: data.currency }),
        ...(data.duration !== undefined && { duration: data.duration }),
        ...(data.proposal !== undefined && { proposal: data.proposal }),
        ...(data.status && { status: data.status }),
      },
    })
    return NextResponse.json(updated)
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: 401 })
    if (error instanceof PermissionError) return NextResponse.json({ error: error.message }, { status: 403 })
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Validation failed", details: error.issues }, { status: 400 })
    console.error("Error updating bid:", error)
    return NextResponse.json({ error: "Failed to update bid" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const ctx = getTenantContext(session)
    const { id } = await params

    const bid = await db.bid.findFirst({
      where: { id },
      include: { publicRfp: { select: { tenantId: true } } },
    })
    if (!bid || bid.publicRfp.tenantId !== ctx.tenantId) {
      return NextResponse.json({ error: "Bid not found" }, { status: 404 })
    }

    await db.bid.delete({ where: { id } })
    return NextResponse.json({ message: "Bid deleted" })
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: 401 })
    if (error instanceof PermissionError) return NextResponse.json({ error: error.message }, { status: 403 })
    console.error("Error deleting bid:", error)
    return NextResponse.json({ error: "Failed to delete bid" }, { status: 500 })
  }
}
