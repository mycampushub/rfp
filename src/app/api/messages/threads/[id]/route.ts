import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { getTenantContext, AuthError, PermissionError } from "@/lib/tenant-context"
import { z } from "zod"

const patchSchema = z.object({
  isArchived: z.boolean().optional(),
  isMuted: z.boolean().optional(),
  isRead: z.boolean().optional(),
  subject: z.string().optional(),
})

interface UserThreadSettings {
  isMuted?: boolean
  isArchived?: boolean
}

function getUserSettings(threadSettings: unknown, userId: string): UserThreadSettings {
  const settings = (threadSettings as Record<string, UserThreadSettings>) || {}
  return settings[userId] || {}
}

function setUserSettings(
  threadSettings: unknown,
  userId: string,
  updates: Partial<UserThreadSettings>
): Record<string, UserThreadSettings> {
  const settings = (threadSettings as Record<string, UserThreadSettings>) || {}
  return {
    ...settings,
    [userId]: {
      ...(settings[userId] || {}),
      ...updates,
    },
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const ctx = getTenantContext(session)
    const { id } = await params

    const thread = await db.messageThread.findFirst({
      where: { id, tenantId: ctx.tenantId },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
          include: { sender: { select: { id: true, name: true, email: true } } },
        },
      },
    })

    if (!thread) return NextResponse.json({ error: "Thread not found" }, { status: 404 })
    return NextResponse.json(thread)
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: 401 })
    if (error instanceof PermissionError) return NextResponse.json({ error: error.message }, { status: 403 })
    console.error("Error fetching thread:", error)
    return NextResponse.json({ error: "Failed to fetch thread" }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const ctx = getTenantContext(session)
    const { id } = await params

    const body = await request.json()
    const data = patchSchema.parse(body)

    const thread = await db.messageThread.findFirst({
      where: { id, tenantId: ctx.tenantId },
    })
    if (!thread) return NextResponse.json({ error: "Thread not found" }, { status: 404 })

    const updateData: Record<string, unknown> = {}

    // Store isMuted/isArchived in the per-user settings JSON field
    if (data.isArchived !== undefined || data.isMuted !== undefined) {
      const userSettings: Partial<UserThreadSettings> = {}
      if (data.isArchived !== undefined) userSettings.isArchived = data.isArchived
      if (data.isMuted !== undefined) userSettings.isMuted = data.isMuted
      updateData.settings = setUserSettings(thread.settings, ctx.userId, userSettings)
    }

    if (data.subject !== undefined) updateData.subject = data.subject

    const updated = await db.messageThread.update({
      where: { id },
      data: updateData,
    })

    // If marking as unread, mark the last message from others as unread
    if (data.isRead === false) {
      await db.message.updateMany({
        where: { threadId: id, senderId: { not: ctx.userId } },
        data: { isRead: false },
      })
    }

    // If marking as read, mark all messages from others as read
    if (data.isRead === true) {
      await db.message.updateMany({
        where: { threadId: id, senderId: { not: ctx.userId } },
        data: { isRead: true },
      })
    }

    return NextResponse.json(updated)
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: 401 })
    if (error instanceof PermissionError) return NextResponse.json({ error: error.message }, { status: 403 })
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Validation failed", details: error.issues }, { status: 400 })
    console.error("Error updating thread:", error)
    return NextResponse.json({ error: "Failed to update thread" }, { status: 500 })
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

    const thread = await db.messageThread.findFirst({
      where: { id, tenantId: ctx.tenantId },
    })
    if (!thread) return NextResponse.json({ error: "Thread not found" }, { status: 404 })

    await db.messageThread.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: 401 })
    if (error instanceof PermissionError) return NextResponse.json({ error: error.message }, { status: 403 })
    console.error("Error deleting thread:", error)
    return NextResponse.json({ error: "Failed to delete thread" }, { status: 500 })
  }
}
