import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { getTenantContext, AuthError, PermissionError } from "@/lib/tenant-context"
import { requirePermission } from "@/lib/rbac"
import { z } from "zod"

const updateUserSchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional(),
  roleIds: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
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

    const user = await db.user.findFirst({
      where: { id, tenantId: ctx.tenantId },
      select: {
        id: true,
        tenantId: true,
        email: true,
        name: true,
        roleIds: true,
        mfaEnabled: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        tenant: { select: { id: true, name: true } },
      },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Fetch role details for the user
    const roleIds = (user.roleIds as string[]) || []
    const roles = roleIds.length > 0
      ? await db.role.findMany({
          where: { id: { in: roleIds } },
          select: { id: true, name: true, permissions: true },
          take: 500,
        })
      : []

    return NextResponse.json({ ...user, roles })
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: 401 })
    if (error instanceof PermissionError) return NextResponse.json({ error: error.message }, { status: 403 })
    console.error("Error fetching user:", error)
    return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { ctx } = await requirePermission('admin:users')
    const { id } = await params

    const existing = await db.user.findFirst({
      where: { id, tenantId: ctx.tenantId },
    })
    if (!existing) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const body = await request.json()
    const data = updateUserSchema.parse(body)

    // Prevent users from modifying their own roleIds or isActive
    if (id === ctx.userId && (data.roleIds !== undefined || data.isActive !== undefined)) {
      return NextResponse.json({ error: "Cannot modify your own roles or active status" }, { status: 403 })
    }

    const updateData: Record<string, unknown> = {}
    if (data.name !== undefined) updateData.name = data.name
    if (data.email !== undefined) updateData.email = data.email
    if (data.roleIds !== undefined) updateData.roleIds = data.roleIds as unknown as never[]
    if (data.isActive !== undefined) updateData.isActive = data.isActive

    const user = await db.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        tenantId: true,
        email: true,
        name: true,
        roleIds: true,
        mfaEnabled: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return NextResponse.json(user)
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: 401 })
    if (error instanceof PermissionError) return NextResponse.json({ error: error.message }, { status: 403 })
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Validation failed", details: error.issues }, { status: 400 })
    console.error("Error updating user:", error)
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { ctx } = await requirePermission('admin:users')
    const { id } = await params

    const existing = await db.user.findFirst({
      where: { id, tenantId: ctx.tenantId },
    })
    if (!existing) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    await db.user.update({
      where: { id },
      data: { isActive: false },
    })

    return NextResponse.json({ message: "User deactivated successfully" })
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: 401 })
    if (error instanceof PermissionError) return NextResponse.json({ error: error.message }, { status: 403 })
    console.error("Error deactivating user:", error)
    return NextResponse.json({ error: "Failed to deactivate user" }, { status: 500 })
  }
}
