import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { getTenantContext, AuthError, PermissionError } from "@/lib/tenant-context"
import { z } from "zod"

const saveRfpSchema = z.object({
  rfpId: z.string().min(1),
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const ctx = getTenantContext(session)

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
    const skip = (page - 1) * limit

    const where = {
      userId: ctx.userId,
      type: "saved_rfp",
      isDismissed: false,
    }

    const [savedNotifications, total] = await Promise.all([
      db.notification.findMany({
        where,
        select: { data: true },
        take: limit,
        skip,
      }),
      db.notification.count({ where }),
    ])

    const savedRfpIds = savedNotifications
      .map((n) => (n.data as Record<string, string>)?.rfpId)
      .filter(Boolean)

    return NextResponse.json({
      data: savedRfpIds,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    })
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: 401 })
    if (error instanceof PermissionError) return NextResponse.json({ error: error.message }, { status: 403 })
    console.error("Error fetching saved RFPs:", error)
    return NextResponse.json({ error: "Failed to fetch saved RFPs" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const ctx = getTenantContext(session)

    const body = await request.json()
    const { rfpId } = saveRfpSchema.parse(body)

    // Validate RFP exists and belongs to tenant
    const rfp = await db.rFP.findFirst({
      where: { id: rfpId, tenantId: ctx.tenantId },
      select: { id: true },
    })
    if (!rfp) {
      return NextResponse.json({ error: "RFP not found" }, { status: 404 })
    }

    // Check if already saved
    const existing = await db.notification.findFirst({
      where: {
        userId: ctx.userId,
        type: "saved_rfp",
        isDismissed: false,
        data: { path: ["rfpId"], equals: rfpId } as any,
      },
    })

    if (existing) {
      return NextResponse.json({ error: "RFP already saved" }, { status: 409 })
    }

    // Persist as a notification record
    await db.notification.create({
      data: {
        userId: ctx.userId,
        type: "saved_rfp",
        title: "RFP Saved",
        message: `You saved an RFP`,
        data: { rfpId, savedAt: new Date().toISOString() },
      },
    })

    return NextResponse.json({ message: "RFP saved" }, { status: 201 })
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: 401 })
    if (error instanceof PermissionError) return NextResponse.json({ error: error.message }, { status: 403 })
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Validation failed", details: error.issues }, { status: 400 })
    console.error("Error saving RFP:", error)
    return NextResponse.json({ error: "Failed to save RFP" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const ctx = getTenantContext(session)

    const { searchParams } = new URL(request.url)
    const rfpId = searchParams.get("rfpId")

    if (!rfpId) {
      return NextResponse.json({ error: "rfpId query param is required" }, { status: 400 })
    }

    // Find and delete (dismiss) the saved RFP notification
    const saved = await db.notification.findFirst({
      where: {
        userId: ctx.userId,
        type: "saved_rfp",
        isDismissed: false,
        data: { path: ["rfpId"], equals: rfpId } as any,
      },
    })

    if (!saved) {
      return NextResponse.json({ error: "Saved RFP not found" }, { status: 404 })
    }

    await db.notification.update({
      where: { id: saved.id },
      data: { isDismissed: true },
    })

    return NextResponse.json({ message: "RFP unsaved" })
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: 401 })
    if (error instanceof PermissionError) return NextResponse.json({ error: error.message }, { status: 403 })
    console.error("Error unsaving RFP:", error)
    return NextResponse.json({ error: "Failed to unsave RFP" }, { status: 500 })
  }
}
