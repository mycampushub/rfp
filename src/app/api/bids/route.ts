import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { getTenantContext, AuthError, PermissionError } from "@/lib/tenant-context"
import { requirePermission } from "@/lib/rbac"
import { z } from "zod"

const createBidSchema = z.object({
  publicRfpId: z.string().min(1),
  vendorProfileId: z.string().optional(),
  amount: z.number().positive().optional(),
  currency: z.string().default("USD"),
  duration: z.string().optional(),
  proposal: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const ctx = getTenantContext(session)

    const { searchParams } = new URL(request.url)
    const publicRfpId = searchParams.get("publicRfpId")
    const vendorProfileId = searchParams.get("vendorProfileId")
    const status = searchParams.get("status")

    const where: Record<string, unknown> = { publicRfp: { tenantId: ctx.tenantId } }
    if (publicRfpId) where.publicRfpId = publicRfpId
    if (vendorProfileId) where.vendorProfileId = vendorProfileId
    if (status) where.status = status

    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
    const skip = (page - 1) * limit

    const [bids, total] = await Promise.all([
      db.bid.findMany({
        where,
        include: {
          publicRfp: { select: { id: true, tenantId: true } },
          vendorProfile: { select: { id: true, businessName: true } },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip,
      }),
      db.bid.count({ where }),
    ])

    return NextResponse.json({
      data: bids,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    })
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: 401 })
    if (error instanceof PermissionError) return NextResponse.json({ error: error.message }, { status: 403 })
    console.error("Error fetching bids:", error)
    return NextResponse.json({ error: "Failed to fetch bids" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { ctx } = await requirePermission('bid:create')

    const body = await request.json()
    const data = createBidSchema.parse(body)

    const publicRfp = await db.publicRFP.findFirst({
      where: { id: data.publicRfpId, tenantId: ctx.tenantId },
    })
    if (!publicRfp) return NextResponse.json({ error: "Public RFP not found" }, { status: 404 })

    // Resolve vendorProfileId: use provided value or auto-detect from user
    let resolvedVendorProfileId = data.vendorProfileId

    if (!resolvedVendorProfileId) {
      // Fallback: find the user's own vendor profile automatically
      const autoProfile = await db.vendorProfile.findFirst({
        where: { userId: ctx.userId },
      })
      if (!autoProfile) {
        return NextResponse.json({ error: "No vendor profile found for your account" }, { status: 404 })
      }
      resolvedVendorProfileId = autoProfile.id
    } else {
      // Verify the vendor profile belongs to a user in the same tenant
      const vendorProfile = await db.vendorProfile.findFirst({
        where: { id: resolvedVendorProfileId, user: { tenantId: ctx.tenantId } },
      })
      if (!vendorProfile) {
        return NextResponse.json({ error: "Vendor profile not found or not in your tenant" }, { status: 403 })
      }
    }

    const bid = await db.bid.create({
      data: {
        publicRfpId: data.publicRfpId,
        vendorProfileId: resolvedVendorProfileId,
        amount: data.amount,
        currency: data.currency,
        duration: data.duration,
        proposal: data.proposal,
      },
      include: {
        publicRfp: { select: { id: true } },
        vendorProfile: { select: { id: true, businessName: true } },
      },
    })
    return NextResponse.json(bid, { status: 201 })
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: 401 })
    if (error instanceof PermissionError) return NextResponse.json({ error: error.message }, { status: 403 })
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Validation failed", details: error.issues }, { status: 400 })
    console.error("Error creating bid:", error)
    return NextResponse.json({ error: "Failed to create bid" }, { status: 500 })
  }
}
