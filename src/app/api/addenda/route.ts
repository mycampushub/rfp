import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { getTenantContext, AuthError, PermissionError } from "@/lib/tenant-context"
import { z } from "zod"
import NotificationService from "@/lib/notification-service"

const createAddendumSchema = z.object({
  rfpId: z.string(),
  title: z.string(),
  note: z.string().optional(),
  attachments: z.array(z.string()).optional(),
  requiresAck: z.boolean().default(true),
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const rfpId = searchParams.get("rfpId")

    const tenantContext = getTenantContext(session)
    
    const whereClause: Record<string, unknown> = {
      rfp: {
        tenantId: tenantContext.tenantId,
      },
    }
    
    if (rfpId) {
      whereClause.rfpId = rfpId
    }

    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit

    const [addenda, total] = await Promise.all([
      db.addendum.findMany({
        where: whereClause,
        include: {
          rfp: {
            select: {
              id: true,
              title: true,
              status: true,
            },
          },
          acknowledgments: {
            include: {
              vendor: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip,
      }),
      db.addendum.count({ where: whereClause }),
    ])

    return NextResponse.json({
      data: addenda,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    })
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: 401 })
    if (error instanceof PermissionError) return NextResponse.json({ error: error.message }, { status: 403 })
    console.error("Error fetching addenda:", error)
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
    const validatedData = createAddendumSchema.parse(body)

    const tenantContext = getTenantContext(session)

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

    const addendum = await db.addendum.create({
      data: {
        ...validatedData,
        attachments: validatedData.attachments || [],
      },
      include: {
        rfp: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
        acknowledgments: {
          include: {
            vendor: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    })

    // Send notification to invited vendors
    const invitations = await db.invitation.findMany({
      where: { rfpId: validatedData.rfpId },
      select: { vendorId: true },
      take: 500,
    })
    for (const inv of invitations) {
      await NotificationService.send({
        userId: inv.vendorId,
        type: "addendum_created",
        title: "New Addendum",
        message: `A new addendum has been added to RFP: ${addendum.title}`,
      })
    }

    return NextResponse.json(addendum, { status: 201 })
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: 401 })
    if (error instanceof PermissionError) return NextResponse.json({ error: error.message }, { status: 403 })
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation Error", details: error.issues }, { status: 400 })
    }
    console.error("Error creating addendum:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}