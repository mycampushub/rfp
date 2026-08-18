import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { getTenantContext, AuthError } from "@/lib/tenant-context"

interface RouteContext {
  params: Promise<{ id: string }>
}

// GET /api/templates/[id] — Get a single template
export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const ctx = getTenantContext(session)
    const { id } = await context.params

    const template = await db.rFPTemplate.findUnique({
      where: { id },
      include: {
        _count: {
          select: { rfps: true },
        },
        createdByUser: {
          select: { name: true, email: true },
        },
      },
    })

    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 })
    }

    // Only allow access to own templates or public templates
    if (template.tenantId !== ctx.tenantId && !template.isPublic) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 })
    }

    // Increment usage count
    await db.rFPTemplate.update({
      where: { id },
      data: { usageCount: { increment: 1 } },
    })

    return NextResponse.json(template)
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: 401 })
    console.error("Error fetching template:", error)
    return NextResponse.json({ error: "Failed to fetch template" }, { status: 500 })
  }
}

// DELETE /api/templates/[id] — Delete a template (only owner or admin)
export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const ctx = getTenantContext(session)
    const { id } = await context.params

    const template = await db.rFPTemplate.findUnique({
      where: { id },
    })

    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 })
    }

    // Only the creator or tenant admin can delete
    if (template.createdBy !== ctx.userId) {
      // Check if user is an admin
      const user = await db.user.findUnique({
        where: { id: ctx.userId },
        select: { roleIds: true },
      })
      const roleIds = (user?.roleIds || []) as string[]
      if (roleIds.length === 0) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }
      const roles = (await db.role.findMany({
        where: { id: { in: roleIds }, tenantId: ctx.tenantId },
        select: { permissions: true },
      })) as any[] // eslint-disable-line @typescript-eslint/no-explicit-any
      const allPerms = roles.flatMap((r) => (r.permissions as string[]) || [])
      const isAdmin = allPerms.some(
        (p) => p === "admin:all" || p === "template:delete" || p === "rfp:manage"
      )
      if (!isAdmin) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }
    }

    await db.rFPTemplate.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: 401 })
    console.error("Error deleting template:", error)
    return NextResponse.json({ error: "Failed to delete template" }, { status: 500 })
  }
}
