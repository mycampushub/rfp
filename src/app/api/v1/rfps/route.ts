import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { requireAuth, requirePermission } from "@/lib/auth-utils"
import { db } from "@/lib/db"
import { PERMISSIONS } from "@/types/auth"
import { z } from "zod"

const createRFPSchema = z.object({
  title: z.string().min(1, "Title is required"),
  category: z.string().optional(),
  budget: z.number().optional(),
  confidentiality: z.enum(["internal", "confidential", "restricted"]).default("internal"),
  description: z.string().optional(),
  timeline: z.object({
    qnaStart: z.string().optional(),
    qnaEnd: z.string().optional(),
    submissionDeadline: z.string().optional(),
    evaluationStart: z.string().optional(),
    awardTarget: z.string().optional(),
  }).optional(),
  settings: z.object({}).optional(),
})

const updateRFPSchema = z.object({
  title: z.string().min(1).optional(),
  category: z.string().optional(),
  budget: z.number().optional(),
  confidentiality: z.enum(["internal", "confidential", "restricted"]).optional(),
  description: z.string().optional(),
  status: z.enum(["draft", "published", "closed", "awarded", "archived"]).optional(),
  timeline: z.object({
    qnaStart: z.string().optional(),
    qnaEnd: z.string().optional(),
    submissionDeadline: z.string().optional(),
    evaluationStart: z.string().optional(),
    awardTarget: z.string().optional(),
  }).optional(),
  settings: z.object({}).optional(),
})

// GET /api/v1/rfps - List RFPs
export async function GET(request: NextRequest) {
  try {
    await requireAuth()
    await requirePermission(PERMISSIONS.VIEW_RFP)

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
    const status = searchParams.get("status")
    const category = searchParams.get("category")
    const search = searchParams.get("search")

    const skip = (page - 1) * limit

    const where: any = {}
    
    if (status) where.status = status
    if (category) where.category = category
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ]
    }

    const [rfps, total] = await Promise.all([
      db.rFP.findMany({
        where,
        include: {
          timeline: true,
          _count: {
            select: {
              invitations: true,
              submissions: true,
              qna: true,
            }
          }
        },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" }
      }),
      db.rFP.count({ where })
    ])

    return NextResponse.json({
      data: rfps,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error("Error fetching RFPs:", error)
    return NextResponse.json(
      { error: "Failed to fetch RFPs" },
      { status: 500 }
    )
  }
}

// POST /api/v1/rfps - Create RFP
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth()
    await requirePermission(PERMISSIONS.CREATE_RFP)

    const body = await request.json()
    const validatedData = createRFPSchema.parse(body)

    // Get tenant ID from session
    const tenantId = session.user.tenantId

    // Create RFP
    const rfp = await db.rFP.create({
      data: {
        tenantId,
        title: validatedData.title,
        category: validatedData.category,
        budget: validatedData.budget,
        confidentiality: validatedData.confidentiality,
        description: validatedData.description,
        settings: validatedData.settings,
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
        _count: {
          select: {
            invitations: true,
            submissions: true,
            qna: true,
          }
        }
      }
    })

    // Log activity
    await db.activityLog.create({
      data: {
        tenantId,
        actor: session.user.id,
        action: "CREATE_RFP",
        targetType: "RFP",
        targetId: rfp.id,
        metadata: {
          rfpTitle: rfp.title
        }
      }
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