import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { getTenantContext, AuthError, PermissionError } from "@/lib/tenant-context"
import { z } from "zod"

const createThreadSchema = z.object({
  participantIds: z.array(z.string()).min(1),
  subject: z.string().optional(),
})

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const ctx = getTenantContext(session)

    const threads = await db.messageThread.findMany({
      where: { tenantId: ctx.tenantId },
      include: {
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          include: { sender: { select: { id: true, name: true, email: true } } },
        },
      },
      orderBy: [{ lastMessageAt: "desc" }, { createdAt: "desc" }],
    })

    // Filter to only threads where the current user is a participant
    const filtered = threads.filter((t) => {
      const pIds = Array.isArray(t.participantIds) ? t.participantIds : []
      return pIds.includes(ctx.userId)
    })

    return NextResponse.json(filtered)
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: 401 })
    if (error instanceof PermissionError) return NextResponse.json({ error: error.message }, { status: 403 })
    console.error("Error fetching message threads:", error)
    return NextResponse.json({ error: "Failed to fetch message threads" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const ctx = getTenantContext(session)

    const body = await request.json()
    const data = createThreadSchema.parse(body)

    if (!data.participantIds.includes(ctx.userId)) {
      data.participantIds.push(ctx.userId)
    }

    const thread = await db.messageThread.create({
      data: {
        tenantId: ctx.tenantId,
        participantIds: data.participantIds as unknown as object[],
        subject: data.subject,
        lastMessageAt: new Date(),
      },
    })
    return NextResponse.json(thread, { status: 201 })
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: 401 })
    if (error instanceof PermissionError) return NextResponse.json({ error: error.message }, { status: 403 })
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Validation failed", details: error.issues }, { status: 400 })
    console.error("Error creating message thread:", error)
    return NextResponse.json({ error: "Failed to create message thread" }, { status: 500 })
  }
}
