import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { getTenantContext, AuthError, PermissionError } from "@/lib/tenant-context"
import { z } from "zod"

const putBodySchema = z.object({
  ids: z.array(z.string()).optional(),
  markAllRead: z.boolean().optional(),
})

const deleteBodySchema = z.object({
  ids: z.array(z.string()).optional(),
  clearAll: z.boolean().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const ctx = getTenantContext(session)

    const { searchParams } = new URL(request.url)
    const unreadOnly = searchParams.get("unreadOnly") === "true"

    const where: Record<string, unknown> = { userId: ctx.userId }
    if (unreadOnly) (where as Record<string, unknown>).isRead = false

    const notifications = await db.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 50,
    })
    return NextResponse.json(notifications)
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: 401 })
    if (error instanceof PermissionError) return NextResponse.json({ error: error.message }, { status: 403 })
    console.error("Error fetching notifications:", error)
    return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const ctx = getTenantContext(session)

    const rawBody = await request.json()
    const parsed = putBodySchema.safeParse(rawBody)
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request body", details: parsed.error.flatten() }, { status: 400 })
    }
    const { ids, markAllRead } = parsed.data

    if (markAllRead) {
      await db.notification.updateMany({
        where: { userId: ctx.userId, isRead: false },
        data: { isRead: true },
      })
      return NextResponse.json({ message: "All notifications marked as read" })
    }

    if (ids && ids.length > 0) {
      await db.notification.updateMany({
        where: { id: { in: ids }, userId: ctx.userId },
        data: { isRead: true },
      })
      return NextResponse.json({ message: `${ids.length} notifications marked as read` })
    }

    return NextResponse.json({ error: "Provide ids or markAllRead" }, { status: 400 })
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: 401 })
    if (error instanceof PermissionError) return NextResponse.json({ error: error.message }, { status: 403 })
    console.error("Error updating notifications:", error)
    return NextResponse.json({ error: "Failed to update notifications" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const ctx = getTenantContext(session)

    const rawBody = await request.json()
    const parsed = deleteBodySchema.safeParse(rawBody)
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request body", details: parsed.error.flatten() }, { status: 400 })
    }
    const { ids, clearAll } = parsed.data

    if (clearAll) {
      const result = await db.notification.deleteMany({
        where: { userId: ctx.userId },
      })
      return NextResponse.json({ message: `Deleted ${result.count} notifications` })
    }

    if (ids && ids.length > 0) {
      const result = await db.notification.deleteMany({
        where: { id: { in: ids }, userId: ctx.userId },
      })
      return NextResponse.json({ message: `Deleted ${result.count} notifications` })
    }

    return NextResponse.json({ error: "Provide ids or clearAll" }, { status: 400 })
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: 401 })
    if (error instanceof PermissionError) return NextResponse.json({ error: error.message }, { status: 403 })
    console.error("Error deleting notifications:", error)
    return NextResponse.json({ error: "Failed to delete notifications" }, { status: 500 })
  }
}
