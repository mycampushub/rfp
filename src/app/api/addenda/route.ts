import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import { z } from "zod"

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

    const tenantContext = getTenantContext()
    
    const whereClause: any = {
      rfp: {
        tenantId: tenantContext.tenantId,
      },
    }
    
    if (rfpId) {
      whereClause.rfpId = rfpId
    }

    const addenda = await db.addendum.findMany({
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
                email: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(addenda)
  } catch (error) {
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

    const tenantContext = getTenantContext()

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
                email: true,
              },
            },
          },
        },
      },
    })

    // TODO: Send notification for new addendum
    // This would integrate with a notification system

    return NextResponse.json(addendum, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation Error", details: error.errors }, { status: 400 })
    }
    console.error("Error creating addendum:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}