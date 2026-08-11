import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { getTenantContext, AuthError, PermissionError } from "@/lib/tenant-context"
import { z } from "zod"

const updateTenantSchema = z.object({
  name: z.string().optional(),
  region: z.string().optional(),
  settings: z.record(z.unknown()).optional(),
  branding: z.record(z.unknown()).optional(),
  marketplaceSettings: z.record(z.unknown()).optional(),
  billingInfo: z.record(z.unknown()).optional(),
})

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const ctx = getTenantContext(session)

    const tenant = await db.tenant.findUnique({
      where: { id: ctx.tenantId },
      select: {
        id: true, name: true, region: true, plan: true, settings: true,
        branding: true, marketplaceSettings: true, subscriptionTier: true,
        subscriptionStatus: true, subscriptionEndsAt: true, billingInfo: true,
        createdAt: true, updatedAt: true,
        _count: { select: { users: true, vendors: true, rfps: true } },
      },
    })

    if (!tenant) return NextResponse.json({ error: "Tenant not found" }, { status: 404 })
    return NextResponse.json(tenant)
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: 401 })
    if (error instanceof PermissionError) return NextResponse.json({ error: error.message }, { status: 403 })
    console.error("Error fetching tenant:", error)
    return NextResponse.json({ error: "Failed to fetch tenant" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const ctx = getTenantContext(session)

    const body = await request.json()
    const data = updateTenantSchema.parse(body)

    const tenant = await db.tenant.update({
      where: { id: ctx.tenantId },
      data,
      select: {
        id: true, name: true, region: true, plan: true, settings: true,
        branding: true, subscriptionTier: true, subscriptionStatus: true,
      },
    })
    return NextResponse.json(tenant)
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: 401 })
    if (error instanceof PermissionError) return NextResponse.json({ error: error.message }, { status: 403 })
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Validation failed", details: error.issues }, { status: 400 })
    console.error("Error updating tenant:", error)
    return NextResponse.json({ error: "Failed to update tenant" }, { status: 500 })
  }
}
