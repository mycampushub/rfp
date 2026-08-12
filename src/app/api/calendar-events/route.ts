import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { getTenantContext, AuthError, PermissionError } from "@/lib/tenant-context"
import { requirePermission } from "@/lib/rbac"
import { z } from "zod"

const eventTypeEnum = z.enum(['meeting', 'deadline', 'review', 'event', 'holiday'])
const eventStatusEnum = z.enum(['scheduled', 'completed', 'cancelled'])

const createEventSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  startDate: z.string(),
  endDate: z.string().optional(),
  type: eventTypeEnum.default('meeting'),
  status: eventStatusEnum.default('scheduled'),
  rfpId: z.string().optional(),
  location: z.string().optional(),
  meetingUrl: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const ctx = getTenantContext(session)

    const { searchParams } = new URL(request.url)
    const rfpId = searchParams.get("rfpId")
    const type = searchParams.get("type")

    const where: Record<string, unknown> = { tenantId: ctx.tenantId }
    if (rfpId) (where as Record<string, unknown>).rfpId = rfpId
    if (type) (where as Record<string, unknown>).type = type

    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
    const skip = (page - 1) * limit

    const [events, total] = await Promise.all([
      db.calendarEvent.findMany({
        where,
        include: {
          rfp: { select: { id: true, title: true } },
          user: { select: { id: true, name: true, email: true } },
        },
        orderBy: { startDate: "asc" },
        take: limit,
        skip,
      }),
      db.calendarEvent.count({ where }),
    ])

    return NextResponse.json({
      data: events,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    })
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: 401 })
    if (error instanceof PermissionError) return NextResponse.json({ error: error.message }, { status: 403 })
    console.error("Error fetching calendar events:", error)
    return NextResponse.json({ error: "Failed to fetch calendar events" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { ctx } = await requirePermission('calendar:create')

    const body = await request.json()
    const data = createEventSchema.parse(body)

    const event = await db.calendarEvent.create({
      data: {
        tenantId: ctx.tenantId,
        userId: ctx.userId,
        title: data.title,
        description: data.description,
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : null,
        type: data.type,
        status: data.status,
        rfpId: data.rfpId,
        location: data.location,
        meetingUrl: data.meetingUrl,
      },
    })
    return NextResponse.json(event, { status: 201 })
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: 401 })
    if (error instanceof PermissionError) return NextResponse.json({ error: error.message }, { status: 403 })
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Validation failed", details: error.issues }, { status: 400 })
    console.error("Error creating calendar event:", error)
    return NextResponse.json({ error: "Failed to create calendar event" }, { status: 500 })
  }
}
