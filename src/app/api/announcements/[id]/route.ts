import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { getTenantContext, AuthError, PermissionError } from "@/lib/tenant-context"
import { z } from "zod"

const updateAnnouncementSchema = z.object({
  title: z.string().min(1).optional(),
  message: z.string().min(1).optional(),
  isRead: z.boolean().optional(),
  isDismissed: z.boolean().optional(),
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

    const announcement = await db.notification.findFirst({
      where: { id, userId: ctx.userId, type: "announcement" },
    })

    if (!announcement) {
      return NextResponse.json({ error: "Announcement not found" }, { status: 404 })
    }

    return NextResponse.json(announcement)
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: 401 })
    if (error instanceof PermissionError) return NextResponse.json({ error: error.message }, { status: 403 })
    console.error("Error fetching announcement:", error)
    return NextResponse.json({ error: "Failed to fetch announcement" }, { status: 500 })
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

    const existing = await db.notification.findFirst({
      where: { id, userId: ctx.userId, type: "announcement" },
    })
    if (!existing) {
      return NextResponse.json({ error: "Announcement not found" }, { status: 404 })
    }

    const body = await request.json()
    const data = updateAnnouncementSchema.parse(body)

    const updateData: Record<string, unknown> = {}
    if (data.title !== undefined) updateData.title = data.title
    if (data.message !== undefined) updateData.message = data.message
    if (data.isRead !== undefined) updateData.isRead = data.isRead
    if (data.isDismissed !== undefined) updateData.isDismissed = data.isDismissed

    const announcement = await db.notification.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json(announcement)
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: 401 })
    if (error instanceof PermissionError) return NextResponse.json({ error: error.message }, { status: 403 })
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Validation failed", details: error.issues }, { status: 400 })
    console.error("Error updating announcement:", error)
    return NextResponse.json({ error: "Failed to update announcement" }, { status: 500 })
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

    // Find the user's announcement copy to get the shared announcementId
    const existing = await db.notification.findFirst({
      where: { id, userId: ctx.userId, type: "announcement" },
    })
    if (!existing) {
      return NextResponse.json({ error: "Announcement not found" }, { status: 404 })
    }

    // If this announcement has a shared announcementId in its data,
    // delete all tenant copies (admin-level broadcast delete)
    const announcementData = existing.data as Record<string, unknown> | null
    if (announcementData?.announcementId) {
      // Find all copies of this broadcast announcement
      const allCopies = await db.notification.findMany({
        where: {
          type: "announcement",
        },
        take: 500,
      })
      const matchingIds = allCopies
        .filter((n) => {
          const d = n.data as Record<string, unknown> | null
          return d?.announcementId === announcementData.announcementId
        })
        .map((n) => n.id)

      if (matchingIds.length > 0) {
        await db.notification.deleteMany({ where: { id: { in: matchingIds } } })
      }
    } else {
      // Single copy, just delete it
      await db.notification.delete({ where: { id } })
    }

    return NextResponse.json({ message: "Announcement deleted successfully" })
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: 401 })
    if (error instanceof PermissionError) return NextResponse.json({ error: error.message }, { status: 403 })
    console.error("Error deleting announcement:", error)
    return NextResponse.json({ error: "Failed to delete announcement" }, { status: 500 })
  }
}
