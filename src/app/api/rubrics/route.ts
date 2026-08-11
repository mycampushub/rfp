import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { getTenantContext, AuthError, PermissionError } from "@/lib/tenant-context"
import { requirePermission } from "@/lib/rbac"
import { z } from "zod"

export const dynamic = "force-dynamic"

const createRubricSchema = z.object({
  rfpId: z.string().optional(),
  sectionId: z.string().optional(),
  label: z.string(),
  weight: z.number().default(1.0),
  scaleMin: z.number().default(1),
  scaleMax: z.number().default(5),
  guidance: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const rfpId = searchParams.get("rfpId")
    const sectionId = searchParams.get("sectionId")
    const limit = Math.min(parseInt(searchParams.get('limit') || '10') || 10, 100)
    const offset = Math.max(0, parseInt(searchParams.get('offset') || '0') || 0)

    const tenantContext = getTenantContext(session)
    
    const whereClause: Record<string, unknown> = {}
    
    if (rfpId) {
      whereClause.rfpId = rfpId
      // Verify RFP belongs to tenant
      const rfp = await db.rFP.findFirst({
        where: {
          id: rfpId,
          tenantId: tenantContext.tenantId,
        },
      })
      if (!rfp) {
        return NextResponse.json({ error: "RFP not found" }, { status: 404 })
      }
    } else if (sectionId) {
      whereClause.sectionId = sectionId
      // Verify section belongs to tenant
      const section = await db.section.findFirst({
        where: {
          id: sectionId,
          rfp: {
            tenantId: tenantContext.tenantId,
          },
        },
      })
      if (!section) {
        return NextResponse.json({ error: "Section not found" }, { status: 404 })
      }
    } else {
      // Get all rubrics for tenant
      whereClause.OR = [
        { rfp: { tenantId: tenantContext.tenantId } },
        { section: { rfp: { tenantId: tenantContext.tenantId } } },
      ]
    }

    const rubrics = await db.rubricCriterion.findMany({
      where: whereClause,
      include: {
        rfp: {
          select: {
            id: true,
            title: true,
          },
        },
        section: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: { label: "asc" },
      take: limit,
      skip: offset,
    })

    return NextResponse.json(rubrics)
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: 401 })
    if (error instanceof PermissionError) return NextResponse.json({ error: error.message }, { status: 403 })
    console.error("Error fetching rubrics:", error)
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
    const validatedData = createRubricSchema.parse(body)

    const tenantContext = getTenantContext(session)
    await requirePermission("rfp:edit")

    // Verify either RFP or section belongs to tenant
    if (validatedData.rfpId) {
      const rfp = await db.rFP.findFirst({
        where: {
          id: validatedData.rfpId,
          tenantId: tenantContext.tenantId,
        },
      })
      if (!rfp) {
        return NextResponse.json({ error: "RFP not found" }, { status: 404 })
      }
    } else if (validatedData.sectionId) {
      const section = await db.section.findFirst({
        where: {
          id: validatedData.sectionId,
          rfp: {
            tenantId: tenantContext.tenantId,
          },
        },
      })
      if (!section) {
        return NextResponse.json({ error: "Section not found" }, { status: 404 })
      }
    } else {
      return NextResponse.json({ error: "Either rfpId or sectionId is required" }, { status: 400 })
    }

    const rubric = await db.rubricCriterion.create({
      data: validatedData,
      include: {
        rfp: {
          select: {
            id: true,
            title: true,
          },
        },
        section: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    })

    return NextResponse.json(rubric, { status: 201 })
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: 401 })
    if (error instanceof PermissionError) return NextResponse.json({ error: error.message }, { status: 403 })
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation Error", details: error.issues }, { status: 400 })
    }
    console.error("Error creating rubric:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}