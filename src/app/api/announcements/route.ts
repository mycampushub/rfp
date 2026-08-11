import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { getTenantContext, AuthError, PermissionError } from "@/lib/tenant-context"
import { z } from "zod"

const createAnnouncementSchema = z.object({
  title: z.string().min(1),
  message: z.string().min(1),
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const ctx = getTenantContext(session)

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit

    const where = { userId: ctx.userId, type: "announcement" as const }

    const [announcements, total] = await Promise.all([
      db.notification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip,
      }),
      db.notification.count({ where }),
    ])

    return NextResponse.json({
      data: announcements,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    })
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: 401 })
    if (error instanceof PermissionError) return NextResponse.json({ error: error.message }, { status: 403 })
    console.error("Error fetching announcements:", error)
    return NextResponse.json({ error: "Failed to fetch announcements" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const ctx = getTenantContext(session)

    const body = await request.json()
    const data = createAnnouncementSchema.parse(body)

    // Fetch all users in the tenant to broadcast the announcement
    const tenantUsers = await db.user.findMany({
      where: { tenantId: ctx.tenantId, isActive: true },
      select: { id: true },
      take: 500,
    })

    if (tenantUsers.length === 0) {
      return NextResponse.json({ error: "No active users in tenant" }, { status: 400 })
    }

    // Generate a shared announcement ID so all copies are linked
    const announcementId = `ann-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`

    // Create a notification for every tenant user (tenant-wide broadcast)
    const notifications = tenantUsers.map((user) => ({
      userId: user.id,
      type: "announcement" as const,
      title: data.title,
      message: data.message,
      data: {
        announcementId,
        createdBy: ctx.userId,
      },
    }))

    await db.notification.createMany({ data: notifications })

    return NextResponse.json({
      announcementId,
      title: data.title,
      message: data.message,
      _broadcastCount: tenantUsers.length,
    }, { status: 201 })
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: 401 })
    if (error instanceof PermissionError) return NextResponse.json({ error: error.message }, { status: 403 })
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Validation failed", details: error.issues }, { status: 400 })
    console.error("Error creating announcement:", error)
    return NextResponse.json({ error: "Failed to create announcement" }, { status: 500 })
  }
}
