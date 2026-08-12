import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { getTenantContext, AuthError, PermissionError } from "@/lib/tenant-context"
import { z } from "zod"

const createMessageSchema = z.object({
  content: z.string().min(1),
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

    const thread = await db.messageThread.findFirst({
      where: { id, tenantId: ctx.tenantId },
    })
    if (!thread) return NextResponse.json({ error: "Thread not found" }, { status: 404 })

    const messages = await db.message.findMany({
      where: { threadId: id },
      include: { sender: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: "asc" },
      take: 200,
    })
    return NextResponse.json(messages)
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: 401 })
    if (error instanceof PermissionError) return NextResponse.json({ error: error.message }, { status: 403 })
    console.error("Error fetching messages:", error)
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const ctx = getTenantContext(session)
    const { id } = await params

    const body = await request.json()
    const data = createMessageSchema.parse(body)

    const thread = await db.messageThread.findFirst({
      where: { id, tenantId: ctx.tenantId },
    })
    if (!thread) return NextResponse.json({ error: "Thread not found" }, { status: 404 })

    const message = await db.message.create({
      data: {
        threadId: id,
        senderId: ctx.userId,
        content: data.content,
      },
      include: { sender: { select: { id: true, name: true, email: true } } },
    })

    await db.messageThread.update({
      where: { id },
      data: { lastMessageAt: new Date() },
    })

    return NextResponse.json(message, { status: 201 })
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: 401 })
    if (error instanceof PermissionError) return NextResponse.json({ error: error.message }, { status: 403 })
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Validation failed", details: error.issues }, { status: 400 })
    console.error("Error creating message:", error)
    return NextResponse.json({ error: "Failed to create message" }, { status: 500 })
  }
}
