import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { getTenantContext, AuthError, PermissionError } from "@/lib/tenant-context"
import { z } from "zod"

const createSectionSchema = z.object({
  rfpId: z.string(),
  order: z.number(),
  title: z.string(),
  description: z.string().optional(),
  isRequired: z.boolean().default(false),
})

const _updateSectionSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  isRequired: z.boolean().optional(),
  order: z.number().optional(),
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
    
    const whereClause: Record<string, unknown> = { rfp: { tenantId: tenantContext.tenantId } }
    if (rfpId) {
      whereClause.rfpId = rfpId
    }

    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
    const skip = (page - 1) * limit

    const [sections, total] = await Promise.all([
      db.section.findMany({
        where: whereClause,
        include: {
          questions: {
            orderBy: { order: "asc" },
          },
          rubricCriteria: true,
        },
        orderBy: { order: "asc" },
        take: limit,
        skip,
      }),
      db.section.count({ where: whereClause }),
    ])

    return NextResponse.json({
      data: sections,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    })
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: 401 })
    if (error instanceof PermissionError) return NextResponse.json({ error: error.message }, { status: 403 })
    console.error("Error fetching sections:", error)
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
    const validatedData = createSectionSchema.parse(body)

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

    const section = await db.section.create({
      data: {
        ...validatedData,
      },
      include: {
        questions: {
          orderBy: { order: "asc" },
        },
        rubricCriteria: true,
      },
    })

    return NextResponse.json(section, { status: 201 })
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: 401 })
    if (error instanceof PermissionError) return NextResponse.json({ error: error.message }, { status: 403 })
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation Error", details: error.issues }, { status: 400 })
    }
    console.error("Error creating section:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}