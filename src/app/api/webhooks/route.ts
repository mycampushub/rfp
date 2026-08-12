import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { getTenantContext, AuthError, PermissionError } from "@/lib/tenant-context"
import { requirePermission } from "@/lib/rbac"
import { z } from "zod"
import { v4 as uuidv4 } from "uuid"

const createWebhookSchema = z.object({
  url: z.string().url(),
  events: z.array(z.string()).optional(),
  secret: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")

    const tenantContext = getTenantContext(session)
    
    const whereClause: Record<string, unknown> = {
      tenantId: tenantContext.tenantId,
    }
    
    if (status) {
      whereClause.status = status
    }

    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
    const skip = (page - 1) * limit

    const [webhooks, total] = await Promise.all([
      db.webhookEndpoint.findMany({
        where: whereClause,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip,
      }),
      db.webhookEndpoint.count({ where: whereClause }),
    ])

    // Omit secrets from list response
    const safeWebhooks = webhooks.map(({ secret: _s, ...w }) => w)

    return NextResponse.json({
      data: safeWebhooks,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    })
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: 401 })
    if (error instanceof PermissionError) return NextResponse.json({ error: error.message }, { status: 403 })
    console.error("Error fetching webhooks:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { ctx: tenantContext } = await requirePermission('admin:webhooks')

    const body = await request.json()
    const validatedData = createWebhookSchema.parse(body)

    // Generate secret if not provided
    const secret = validatedData.secret || uuidv4()

    const webhook = await db.webhookEndpoint.create({
      data: {
        ...validatedData,
        secret,
        tenantId: tenantContext.tenantId,
      },
    })

    // Omit secret from response
    const { secret: _secret, ...webhookData } = webhook

    return NextResponse.json(webhookData, { status: 201 })
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: 401 })
    if (error instanceof PermissionError) return NextResponse.json({ error: error.message }, { status: 403 })
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation Error", details: error.issues }, { status: 400 })
    }
    console.error("Error creating webhook:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
