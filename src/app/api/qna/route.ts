import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import { z } from "zod"

const createQnASchema = z.object({
  rfpId: z.string(),
  vendorId: z.string().optional(),
  questionText: z.string(),
  isPublic: z.boolean().default(true),
})

const updateQnASchema = z.object({
  answerText: z.string().optional(),
  isPublic: z.boolean().optional(),
  status: z.enum(["pending", "answered", "published"]).optional(),
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const rfpId = searchParams.get("rfpId")
    const vendorId = searchParams.get("vendorId")
    const status = searchParams.get("status")
    const isPublic = searchParams.get("public")

    const tenantContext = getTenantContext()
    
    const whereClause: any = {
      rfp: {
        tenantId: tenantContext.tenantId,
      },
    }
    
    if (rfpId) {
      whereClause.rfpId = rfpId
    }
    if (vendorId) {
      whereClause.vendorId = vendorId
    }
    if (status) {
      whereClause.status = status
    }
    if (isPublic !== null) {
      whereClause.isPublic = isPublic === "true"
    }

    const qnaItems = await db.qnA.findMany({
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
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(qnaItems)
  } catch (error) {
    console.error("Error fetching Q&A items:", error)
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
    const validatedData = createQnASchema.parse(body)

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

    const qna = await db.qnA.create({
      data: validatedData,
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
            email: true,
          },
        },
      },
    })

    // TODO: Send notification for new question
    // This would integrate with a notification system

    return NextResponse.json(qna, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation Error", details: error.errors }, { status: 400 })
    }
    console.error("Error creating Q&A item:", error)
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
    const qnaId = searchParams.get("id")

    if (!qnaId) {
      return NextResponse.json({ error: "Q&A ID is required" }, { status: 400 })
    }

    const body = await request.json()
    const validatedData = updateQnASchema.parse(body)

    const tenantContext = getTenantContext()

    // Verify Q&A belongs to tenant
    const existingQnA = await db.qnA.findFirst({
      where: {
        id: qnaId,
        rfp: {
          tenantId: tenantContext.tenantId,
        },
      },
    })

    if (!existingQnA) {
      return NextResponse.json({ error: "Q&A item not found" }, { status: 404 })
    }

    const qna = await db.qnA.update({
      where: { id: qnaId },
      data: validatedData,
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
            email: true,
          },
        },
      },
    })

    // TODO: Send notification for answer
    // This would integrate with a notification system

    return NextResponse.json(qna)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation Error", details: error.errors }, { status: 400 })
    }
    console.error("Error updating Q&A item:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}