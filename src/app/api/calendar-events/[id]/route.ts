import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { getTenantContext, AuthError, PermissionError } from "@/lib/tenant-context"
import { z } from "zod"

const eventTypeEnum = z.enum(['meeting', 'deadline', 'review', 'event', 'holiday'])
const eventStatusEnum = z.enum(['scheduled', 'completed', 'cancelled'])

const updateEventSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  type: eventTypeEnum.optional(),
  location: z.string().optional(),
  meetingUrl: z.string().optional(),
})

const updateStatusSchema = z.object({
  status: eventStatusEnum,
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

    const event = await db.calendarEvent.findFirst({
      where: { id, tenantId: ctx.tenantId },
      include: {
        rfp: { select: { id: true, title: true } },
        user: { select: { id: true, name: true, email: true } },
      },
    })

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    return NextResponse.json(event)
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: 401 })
    if (error instanceof PermissionError) return NextResponse.json({ error: error.message }, { status: 403 })
    console.error("Error fetching calendar event:", error)
    return NextResponse.json({ error: "Failed to fetch calendar event" }, { status: 500 })
  }
}

// PUT — Partial update of content fields (title, description, dates, type, location, meetingUrl).
//         Does NOT accept status changes; use PATCH for status transitions.
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const ctx = getTenantContext(session)
    const { id } = await params

    const existing = await db.calendarEvent.findFirst({
      where: { id, tenantId: ctx.tenantId },
    })
    if (!existing) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    const body = await request.json()
    const data = updateEventSchema.parse(body)

    const updateData: Record<string, unknown> = {}
    if (data.title !== undefined) updateData.title = data.title
    if (data.description !== undefined) updateData.description = data.description
    if (data.startDate !== undefined) updateData.startDate = new Date(data.startDate)
    if (data.endDate !== undefined) updateData.endDate = data.endDate ? new Date(data.endDate) : null
    if (data.type !== undefined) updateData.type = data.type
    if (data.location !== undefined) updateData.location = data.location
    if (data.meetingUrl !== undefined) updateData.meetingUrl = data.meetingUrl

    const event = await db.calendarEvent.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json(event)
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: 401 })
    if (error instanceof PermissionError) return NextResponse.json({ error: error.message }, { status: 403 })
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Validation failed", details: error.issues }, { status: 400 })
    console.error("Error updating calendar event:", error)
    return NextResponse.json({ error: "Failed to update calendar event" }, { status: 500 })
  }
}

// PATCH — Status-only transition (scheduled → completed / cancelled).
//          Content fields are handled by PUT above.
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const ctx = getTenantContext(session)
    const { id } = await params

    const existing = await db.calendarEvent.findFirst({
      where: { id, tenantId: ctx.tenantId },
    })
    if (!existing) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    const body = await request.json()
    const { status } = updateStatusSchema.parse(body)

    const event = await db.calendarEvent.update({
      where: { id },
      data: { status },
    })

    return NextResponse.json(event)
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: 401 })
    if (error instanceof PermissionError) return NextResponse.json({ error: error.message }, { status: 403 })
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Validation failed", details: error.issues }, { status: 400 })
    console.error("Error updating event status:", error)
    return NextResponse.json({ error: "Failed to update event status" }, { status: 500 })
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

    const existing = await db.calendarEvent.findFirst({
      where: { id, tenantId: ctx.tenantId },
    })
    if (!existing) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    await db.calendarEvent.delete({ where: { id } })

    return NextResponse.json({ message: "Event deleted successfully" })
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: 401 })
    if (error instanceof PermissionError) return NextResponse.json({ error: error.message }, { status: 403 })
    console.error("Error deleting calendar event:", error)
    return NextResponse.json({ error: "Failed to delete calendar event" }, { status: 500 })
  }
}
