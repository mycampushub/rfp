import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { AuthError, PermissionError } from "@/lib/tenant-context"
import { requireSystemAdmin } from "@/lib/auth-utils"
import { z } from "zod"

const updateTenantSchema = z.object({
  name: z.string().min(1).optional(),
  region: z.string().optional(),
  plan: z.string().optional(),
  settings: z.any().optional(),
  branding: z.any().optional(),
  subscriptionStatus: z.string().optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const { id } = await params

    await requireSystemAdmin()

    const tenant = await db.tenant.findUnique({
      where: { id },
      include: {
        _count: { select: { users: true, rfps: true, vendors: true } },
      },
    })

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 })
    }

    return NextResponse.json(tenant)
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: 401 })
    if (error instanceof PermissionError) return NextResponse.json({ error: error.message }, { status: 403 })
    console.error("Error fetching tenant:", error)
    return NextResponse.json({ error: "Failed to fetch tenant" }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const { id } = await params

    await requireSystemAdmin()

    const existing = await db.tenant.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 })
    }

    const body = await request.json()
    const data = updateTenantSchema.parse(body)

    const tenant = await db.tenant.update({
      where: { id },
      data,
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const { id } = await params

    await requireSystemAdmin()

    const existing = await db.tenant.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 })
    }

    // Soft-delete: set subscriptionStatus to "suspended".
    // Note: The Tenant model does not have an isActive field (unlike User).
    // Suspending the subscription effectively disables the tenant.
    await db.tenant.update({
      where: { id },
      data: { subscriptionStatus: "suspended" },
    })

    return NextResponse.json({ message: "Tenant suspended successfully" })
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: 401 })
    if (error instanceof PermissionError) return NextResponse.json({ error: error.message }, { status: 403 })
    console.error("Error suspending tenant:", error)
    return NextResponse.json({ error: "Failed to suspend tenant" }, { status: 500 })
  }
}
