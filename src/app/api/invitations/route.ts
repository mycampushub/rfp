import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { getTenantContext, AuthError, PermissionError } from "@/lib/tenant-context"
import { requirePermission } from "@/lib/rbac"
import { z } from "zod"
import { v4 as uuidv4 } from "uuid"

export const dynamic = "force-dynamic"

const createInvitationSchema = z.object({
  rfpId: z.string(),
  vendorId: z.string().optional(),
  email: z.string().email(),
  expiresAt: z.coerce.date().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const rfpId = searchParams.get("rfpId")
    const status = searchParams.get("status")
    const limit = Math.min(parseInt(searchParams.get('limit') || '10') || 10, 100)
    const offset = Math.max(0, parseInt(searchParams.get('offset') || '0') || 0)

    const tenantContext = getTenantContext(session)
    
    const whereClause: Record<string, unknown> = {
      rfp: {
        tenantId: tenantContext.tenantId,
      },
    }
    
    if (rfpId) {
      whereClause.rfpId = rfpId
    }
    if (status) {
      whereClause.status = status
    }

    const invitations = await db.invitation.findMany({
      where: whereClause,
      include: {
        rfp: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
        vendor: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    })

    return NextResponse.json(invitations)
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: 401 })
    if (error instanceof PermissionError) return NextResponse.json({ error: error.message }, { status: 403 })
    console.error("Error fetching invitations:", error)
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
    const validatedData = createInvitationSchema.parse(body)

    const tenantContext = getTenantContext(session)
    await requirePermission("rfp:edit")

    // Verify RFP belongs to tenant
    const rfp = await db.rFP.findFirst({
      where: {
        id: validatedData.rfpId,
        tenantId: tenantContext.tenantId,
      },
    })

    if (!rfp) {
      return NextResponse.json({ error: "RFP not found" }, { status: 404 })
    }

    // If vendorId is provided, verify it belongs to tenant
    if (validatedData.vendorId) {
      const vendor = await db.vendor.findFirst({
        where: {
          id: validatedData.vendorId,
          tenantId: tenantContext.tenantId,
        },
      })
      if (!vendor) {
        return NextResponse.json({ error: "Vendor not found" }, { status: 404 })
      }
    }

    // Generate unique token
    const token = uuidv4()

    const invitation = await db.invitation.create({
      data: {
        ...validatedData,
        token,
      },
      include: {
        rfp: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
        vendor: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    // TODO: Send invitation email
    // This would integrate with an email service

    return NextResponse.json(invitation, { status: 201 })
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: 401 })
    if (error instanceof PermissionError) return NextResponse.json({ error: error.message }, { status: 403 })
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation Error", details: error.issues }, { status: 400 })
    }
    console.error("Error creating invitation:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}