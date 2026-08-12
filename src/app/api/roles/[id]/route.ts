import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { getTenantContext, AuthError, PermissionError } from "@/lib/tenant-context"
import { z } from "zod"

const updateRoleSchema = z.object({
  name: z.string().min(1).optional(),
  permissions: z.array(z.string()).optional(),
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

    const role = await db.role.findFirst({
      where: { id, tenantId: ctx.tenantId },
    })
    if (!role) return NextResponse.json({ error: "Role not found" }, { status: 404 })
    return NextResponse.json(role)
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: 401 })
    if (error instanceof PermissionError) return NextResponse.json({ error: error.message }, { status: 403 })
    console.error("Error fetching role:", error)
    return NextResponse.json({ error: "Failed to fetch role" }, { status: 500 })
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
    const data = updateRoleSchema.parse(body)

    const existing = await db.role.findFirst({ where: { id, tenantId: ctx.tenantId } })
    if (!existing) return NextResponse.json({ error: "Role not found" }, { status: 404 })

    if (data.name) {
      const dup = await db.role.findFirst({ where: { tenantId: ctx.tenantId, name: data.name, id: { not: id } } })
      if (dup) return NextResponse.json({ error: "Role with this name already exists" }, { status: 400 })
    }

    const role = await db.role.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.permissions && { permissions: data.permissions as unknown as object[] }),
      },
    })
    return NextResponse.json(role)
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: 401 })
    if (error instanceof PermissionError) return NextResponse.json({ error: error.message }, { status: 403 })
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Validation failed", details: error.issues }, { status: 400 })
    console.error("Error updating role:", error)
    return NextResponse.json({ error: "Failed to update role" }, { status: 500 })
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

    const existing = await db.role.findFirst({ where: { id, tenantId: ctx.tenantId } })
    if (!existing) return NextResponse.json({ error: "Role not found" }, { status: 404 })

    await db.role.delete({ where: { id } })
    return NextResponse.json({ message: "Role deleted" })
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: 401 })
    if (error instanceof PermissionError) return NextResponse.json({ error: error.message }, { status: 403 })
    console.error("Error deleting role:", error)
    return NextResponse.json({ error: "Failed to delete role" }, { status: 500 })
  }
}