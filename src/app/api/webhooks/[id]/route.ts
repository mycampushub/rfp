import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import { z } from "zod"

const updateWebhookSchema = z.object({
  url: z.string().url().optional(),
  events: z.array(z.string()).optional(),
  secret: z.string().optional(),
  status: z.enum(["active", "inactive"]).optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const tenantContext = getTenantContext()

    const webhook = await db.webhookEndpoint.findFirst({
      where: {
        id: params.id,
        tenantId: tenantContext.tenantId,
      },
    })

    if (!webhook) {
      return NextResponse.json({ error: "Webhook not found" }, { status: 404 })
    }

    return NextResponse.json(webhook)
  } catch (error) {
    console.error("Error fetching webhook:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = updateWebhookSchema.parse(body)

    const tenantContext = getTenantContext()

    // Verify webhook belongs to tenant
    const existingWebhook = await db.webhookEndpoint.findFirst({
      where: {
        id: params.id,
        tenantId: tenantContext.tenantId,
      },
    })

    if (!existingWebhook) {
      return NextResponse.json({ error: "Webhook not found" }, { status: 404 })
    }

    const webhook = await db.webhookEndpoint.update({
      where: { id: params.id },
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const tenantContext = getTenantContext()

    // Verify webhook belongs to tenant
    const existingWebhook = await db.webhookEndpoint.findFirst({
      where: {
        id: params.id,
        tenantId: tenantContext.tenantId,
      },
    })

    if (!existingWebhook) {
      return NextResponse.json({ error: "Webhook not found" }, { status: 404 })
    }

    await db.webhookEndpoint.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: "Webhook deleted successfully" })
  } catch (error) {
    console.error("Error deleting webhook:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}