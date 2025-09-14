import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import { z } from "zod"
import { v4 as uuidv4 } from "uuid"

const createWebhookSchema = z.object({
  url: z.string().url(),
  events: z.array(z.string()).optional(),
  secret: z.string().optional(),
})

const updateWebhookSchema = z.object({
  url: z.string().url().optional(),
  events: z.array(z.string()).optional(),
  secret: z.string().optional(),
  status: z.enum(["active", "inactive"]).optional(),
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")

    const tenantContext = getTenantContext()
    
    const whereClause: any = {
      tenantId: tenantContext.tenantId,
    }
    
    if (status) {
      whereClause.status = status
    }

    const webhooks = await db.webhookEndpoint.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(webhooks)
  } catch (error) {
    console.error("Error fetching webhooks:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createWebhookSchema.parse(body)

    const tenantContext = getTenantContext()

    // Generate secret if not provided
    const secret = validatedData.secret || uuidv4()

    const webhook = await db.webhookEndpoint.create({
      data: {
        ...validatedData,
        secret,
        tenantId: tenantContext.tenantId,
      },
    })

    return NextResponse.json(webhook, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation Error", details: error.errors }, { status: 400 })
    }
    console.error("Error creating webhook:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const webhookId = searchParams.get("id")

    if (!webhookId) {
      return NextResponse.json({ error: "Webhook ID is required" }, { status: 400 })
    }

    const body = await request.json()
    const validatedData = updateWebhookSchema.parse(body)

    const tenantContext = getTenantContext()

    // Verify webhook belongs to tenant
    const existingWebhook = await db.webhookEndpoint.findFirst({
      where: {
        id: webhookId,
        tenantId: tenantContext.tenantId,
      },
    })

    if (!existingWebhook) {
      return NextResponse.json({ error: "Webhook not found" }, { status: 404 })
    }

    const webhook = await db.webhookEndpoint.update({
      where: { id: webhookId },
      data: validatedData,
    })

    return NextResponse.json(webhook)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation Error", details: error.errors }, { status: 400 })
    }
    console.error("Error updating webhook:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}