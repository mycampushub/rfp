import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { getTenantContext, AuthError, PermissionError } from "@/lib/tenant-context"
import { z } from "zod"

const preferenceSchema = z.object({
  type: z.string(),
  inApp: z.boolean().optional(),
  email: z.boolean().optional(),
  push: z.boolean().optional(),
})

const updatePreferencesSchema = z.array(preferenceSchema)

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const ctx = getTenantContext(session)

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
    const skip = (page - 1) * limit

    const where = { userId: ctx.userId }

    const [prefs, total] = await Promise.all([
      db.notificationPreference.findMany({
        where,
        take: limit,
        skip,
      }),
      db.notificationPreference.count({ where }),
    ])

    return NextResponse.json({
      data: prefs,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    })
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: 401 })
    if (error instanceof PermissionError) return NextResponse.json({ error: error.message }, { status: 403 })
    console.error("Error fetching notification preferences:", error)
    return NextResponse.json({ error: "Failed to fetch notification preferences" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const ctx = getTenantContext(session)

    const body = await request.json()
    const preferences = updatePreferencesSchema.parse(body)

    await Promise.all(
      preferences.map((item) =>
        db.notificationPreference.upsert({
          where: { userId_type: { userId: ctx.userId, type: item.type } },
          update: {
            ...(item.inApp !== undefined && { inApp: item.inApp }),
            ...(item.email !== undefined && { email: item.email }),
            ...(item.push !== undefined && { push: item.push }),
          },
          create: {
            userId: ctx.userId,
            type: item.type,
            inApp: item.inApp ?? true,
            email: item.email ?? true,
            push: item.push ?? false,
          },
        })
      )
    )

    return NextResponse.json({ message: "Preferences updated" })
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: 401 })
    if (error instanceof PermissionError) return NextResponse.json({ error: error.message }, { status: 403 })
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Validation failed", details: error.issues }, { status: 400 })
    console.error("Error updating notification preferences:", error)
    return NextResponse.json({ error: "Failed to update notification preferences" }, { status: 500 })
  }
}
