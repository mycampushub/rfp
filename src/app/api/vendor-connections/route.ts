import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { getTenantContext, AuthError, PermissionError } from "@/lib/tenant-context"
import { z } from "zod"

const createConnectionSchema = z.object({
  toVendorId: z.string().min(1),
  message: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const ctx = getTenantContext(session)

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit

    const where = { tenantId: ctx.tenantId }

    const [connections, total] = await Promise.all([
      db.vendorConnection.findMany({
        where,
        include: {
          fromVendor: { select: { id: true, name: true, description: true, rating: true, verified: true } },
          toVendor: { select: { id: true, name: true, description: true, rating: true, verified: true } },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip,
      }),
      db.vendorConnection.count({ where }),
    ])

    return NextResponse.json({
      data: connections,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    })
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: 401 })
    if (error instanceof PermissionError) return NextResponse.json({ error: error.message }, { status: 403 })
    console.error("Error fetching vendor connections:", error)
    return NextResponse.json({ error: "Failed to fetch vendor connections" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const ctx = getTenantContext(session)

    const body = await request.json()
    const data = createConnectionSchema.parse(body)

    const fromVendor = await db.vendor.findFirst({
      where: { tenantId: ctx.tenantId, isActive: true },
    })
    if (!fromVendor) return NextResponse.json({ error: "No vendor profile found for your organization" }, { status: 404 })

    const toVendor = await db.vendor.findFirst({ where: { id: data.toVendorId, tenantId: ctx.tenantId } })
    if (!toVendor) return NextResponse.json({ error: "Target vendor not found" }, { status: 404 })

    const existing = await db.vendorConnection.findFirst({
      where: {
        OR: [
          { fromVendorId: fromVendor.id, toVendorId: data.toVendorId },
          { fromVendorId: data.toVendorId, toVendorId: fromVendor.id },
        ],
      },
    })
    if (existing) return NextResponse.json({ error: "Connection already exists" }, { status: 400 })

    const connection = await db.vendorConnection.create({
      data: {
        tenantId: ctx.tenantId,
        fromVendorId: fromVendor.id,
        toVendorId: data.toVendorId,
        status: "pending",
        message: data.message,
      },
    })
    return NextResponse.json(connection, { status: 201 })
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: 401 })
    if (error instanceof PermissionError) return NextResponse.json({ error: error.message }, { status: 403 })
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Validation failed", details: error.issues }, { status: 400 })
    console.error("Error creating vendor connection:", error)
    return NextResponse.json({ error: "Failed to create vendor connection" }, { status: 500 })
  }
}