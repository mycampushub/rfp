import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { requireAuth, requirePermission } from "@/lib/auth-utils"
import { PERMISSIONS } from "@/types/auth"
import { db } from "@/lib/db"
import { z } from "zod"

const createRFPSchema = z.object({
  title: z.string().min(1),
  category: z.string().optional(),
  budget: z.string().optional(),
  confidentiality: z.enum(["internal", "confidential", "restricted"]).default("internal"),
  description: z.string().optional(),
  timeline: z.object({
    qnaStart: z.string().optional(),
    qnaEnd: z.string().optional(),
    submissionDeadline: z.string().optional(),
    evaluationStart: z.string().optional(),
    awardTarget: z.string().optional(),
  }).optional(),
})

// GET /api/rfps - List RFPs
export async function GET(request: NextRequest) {
  try {
    await requireAuth()
    
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const category = searchParams.get("category")
    const search = searchParams.get("search")

    const where: any = {
      // Add tenant filtering based on current user
      // tenantId: (await getCurrentUser()).tenantId
    }

    if (status) {
      where.status = status
    }

    if (category) {
      where.category = category
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ]
    }

    const rfps = await db.rFP.findMany({
      where,
      include: {
        timeline: true,
        _count: {
          select: {
            submissions: true,
            invitations: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(rfps)
  } catch (error) {
    console.error("Error fetching RFPs:", error)
    return NextResponse.json(
      { error: "Failed to fetch RFPs" },
      { status: 500 }
    )
  }
}

// POST /api/rfps - Create RFP
export async function POST(request: NextRequest) {
  try {
    await requirePermission(PERMISSIONS.CREATE_RFP)
    
    const body = await request.json()
    const validatedData = createRFPSchema.parse(body)

    // TODO: Get tenant ID from current user
    const tenantId = "default-tenant-id" // This should come from the authenticated user

    const rfp = await db.rFP.create({
      data: {
        tenantId,
        title: validatedData.title,
        category: validatedData.category,
        budget: validatedData.budget ? parseFloat(validatedData.budget.replace(/[^0-9.-]+/g, "")) : null,
        confidentiality: validatedData.confidentiality,
        description: validatedData.description,
        timeline: validatedData.timeline ? {
          create: {
            qnaStart: validatedData.timeline.qnaStart ? new Date(validatedData.timeline.qnaStart) : null,
            qnaEnd: validatedData.timeline.qnaEnd ? new Date(validatedData.timeline.qnaEnd) : null,
            submissionDeadline: validatedData.timeline.submissionDeadline ? new Date(validatedData.timeline.submissionDeadline) : null,
            evaluationStart: validatedData.timeline.evaluationStart ? new Date(validatedData.timeline.evaluationStart) : null,
            awardTarget: validatedData.timeline.awardTarget ? new Date(validatedData.timeline.awardTarget) : null,
          }
        } : undefined,
      },
      include: {
        timeline: true,
      },
    })

    return NextResponse.json(rfp, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Error creating RFP:", error)
    return NextResponse.json(
      { error: "Failed to create RFP" },
      { status: 500 }
    )
  }
}