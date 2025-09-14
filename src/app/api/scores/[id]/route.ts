import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import { z } from "zod"

const updateScoreSchema = z.object({
  scoreValue: z.number(),
  notes: z.string().optional(),
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

    const score = await db.score.findFirst({
      where: {
        id: params.id,
        submission: {
          rfp: {
            tenantId: tenantContext.tenantId,
          },
        },
      },
      include: {
        submission: {
          include: {
            vendor: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            rfp: {
              select: {
                id: true,
                title: true,
                status: true,
              },
            },
          },
        },
        criterion: {
          select: {
            id: true,
            label: true,
            weight: true,
            scaleMin: true,
            scaleMax: true,
            guidance: true,
          },
        },
        evaluator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    if (!score) {
      return NextResponse.json({ error: "Score not found" }, { status: 404 })
    }

    return NextResponse.json(score)
  } catch (error) {
    console.error("Error fetching score:", error)
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
    const validatedData = updateScoreSchema.parse(body)

    const tenantContext = getTenantContext()

    // Verify score belongs to tenant and user is the evaluator
    const existingScore = await db.score.findFirst({
      where: {
        id: params.id,
        submission: {
          rfp: {
            tenantId: tenantContext.tenantId,
          },
        },
        evaluatorId: tenantContext.userId,
      },
    })

    if (!existingScore) {
      return NextResponse.json({ error: "Score not found or access denied" }, { status: 404 })
    }

    // Verify score is within range
    const criterion = await db.rubricCriterion.findUnique({
      where: { id: existingScore.criterionId },
    })

    if (!criterion) {
      return NextResponse.json({ error: "Criterion not found" }, { status: 404 })
    }

    if (validatedData.scoreValue < criterion.scaleMin || validatedData.scoreValue > criterion.scaleMax) {
      return NextResponse.json({ 
        error: "Score out of range", 
        details: { 
          min: criterion.scaleMin, 
          max: criterion.scaleMax,
          provided: validatedData.scoreValue 
        } 
      }, { status: 400 })
    }

    const score = await db.score.update({
      where: { id: params.id },
      data: validatedData,
      include: {
        submission: {
          include: {
            vendor: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            rfp: {
              select: {
                id: true,
                title: true,
                status: true,
              },
            },
          },
        },
        criterion: {
          select: {
            id: true,
            label: true,
            weight: true,
            scaleMin: true,
            scaleMax: true,
            guidance: true,
          },
        },
        evaluator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    // Recalculate consensus
    const { calculateConsensus } = await import("../route")
    await calculateConsensus(existingScore.submissionId, existingScore.criterionId)

    return NextResponse.json(score)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation Error", details: error.errors }, { status: 400 })
    }
    console.error("Error updating score:", error)
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

    // Verify score belongs to tenant and user is the evaluator
    const existingScore = await db.score.findFirst({
      where: {
        id: params.id,
        submission: {
          rfp: {
            tenantId: tenantContext.tenantId,
          },
        },
        evaluatorId: tenantContext.userId,
      },
    })

    if (!existingScore) {
      return NextResponse.json({ error: "Score not found or access denied" }, { status: 404 })
    }

    await db.score.delete({
      where: { id: params.id },
    })

    // Recalculate consensus
    const { calculateConsensus } = await import("../route")
    await calculateConsensus(existingScore.submissionId, existingScore.criterionId)

    return NextResponse.json({ message: "Score deleted successfully" })
  } catch (error) {
    console.error("Error deleting score:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}