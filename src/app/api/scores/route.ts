import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { getTenantContext, AuthError, PermissionError } from "@/lib/tenant-context"
import { requirePermission } from "@/lib/rbac"
import { z } from "zod"
import { PrismaClient } from "@prisma/client"

export const dynamic = "force-dynamic"

type TransactionClient = Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>

const createScoreSchema = z.object({
  submissionId: z.string(),
  criterionId: z.string(),
  scoreValue: z.number(),
  notes: z.string().optional(),
})

const updateScoreSchema = z.object({
  scoreValue: z.number().optional(),
  notes: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const submissionId = searchParams.get("submissionId")
    const criterionId = searchParams.get("criterionId")
    const evaluatorId = searchParams.get("evaluatorId")

    const tenantContext = getTenantContext(session)
    
    const whereClause: Record<string, unknown> = {
      submission: {
        rfp: {
          tenantId: tenantContext.tenantId,
        },
      },
    }
    
    if (submissionId) {
      whereClause.submissionId = submissionId
    }
    if (criterionId) {
      whereClause.criterionId = criterionId
    }
    if (evaluatorId) {
      whereClause.evaluatorId = evaluatorId
    }

    const scores = await db.score.findMany({
      where: whereClause,
      include: {
        submission: {
          include: {
            vendor: {
              select: {
                id: true,
                name: true,
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
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(scores)
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: 401 })
    if (error instanceof PermissionError) return NextResponse.json({ error: error.message }, { status: 403 })
    console.error("Error fetching scores:", error)
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
    const validatedData = createScoreSchema.parse(body)

    const tenantContext = getTenantContext(session)
    await requirePermission("evaluation:manage")

    // Verify submission belongs to tenant
    const submission = await db.submission.findFirst({
      where: {
        id: validatedData.submissionId,
        rfp: {
          tenantId: tenantContext.tenantId,
        },
      },
    })

    if (!submission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 })
    }

    // Verify criterion belongs to tenant
    const criterion = await db.rubricCriterion.findFirst({
      where: {
        id: validatedData.criterionId,
        OR: [
          { rfp: { tenantId: tenantContext.tenantId } },
          { section: { rfp: { tenantId: tenantContext.tenantId } } },
        ],
      },
    })

    if (!criterion) {
      return NextResponse.json({ error: "Criterion not found" }, { status: 404 })
    }

    // Verify evaluator belongs to tenant
    const evaluator = await db.user.findFirst({
      where: {
        id: tenantContext.userId,
        tenantId: tenantContext.tenantId,
        isActive: true,
      },
    })

    if (!evaluator) {
      return NextResponse.json({ error: "Evaluator not found" }, { status: 404 })
    }

    // Validate score is within range
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

    // Check if score already exists for this evaluator and criterion
    const existingScore = await db.score.findFirst({
      where: {
        submissionId: validatedData.submissionId,
        criterionId: validatedData.criterionId,
        evaluatorId: tenantContext.userId,
      },
    })

    const scoreInclude = {
      submission: {
        include: {
          vendor: {
            select: {
              id: true,
              name: true,
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
    } as const

    const score = await db.$transaction(async (tx) => {
      let result
      if (existingScore) {
        // Update existing score
        result = await tx.score.update({
          where: { id: existingScore.id },
          data: {
            scoreValue: validatedData.scoreValue,
            notes: validatedData.notes,
          },
          include: scoreInclude,
        })
      } else {
        // Create new score
        result = await tx.score.create({
          data: {
            ...validatedData,
            evaluatorId: tenantContext.userId,
          },
          include: scoreInclude,
        })
      }

      // Check if all evaluators have scored this submission for all criteria
      // and calculate consensus if needed
      await calculateConsensus(tx, validatedData.submissionId, validatedData.criterionId)

      return result
    })

    return NextResponse.json(score, { status: 201 })
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: 401 })
    if (error instanceof PermissionError) return NextResponse.json({ error: error.message }, { status: 403 })
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation Error", details: error.issues }, { status: 400 })
    }
    console.error("Error creating/updating score:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function calculateConsensus(tx: TransactionClient | null, submissionId: string, criterionId: string) {
  const client = tx ?? db
  // Get all scores for this submission and criterion
  const scores = await client.score.findMany({
    where: {
      submissionId,
      criterionId,
    },
    include: {
      evaluator: true,
    },
  })

  if (scores.length < 2) {
    return // Need at least 2 evaluators for consensus
  }

  // Calculate average score
  const averageScore = scores.reduce((sum, score) => sum + score.scoreValue, 0) / scores.length

  // Check if scores are within consensus threshold (e.g., within 1 point)
  const maxScore = Math.max(...scores.map(s => s.scoreValue))
  const minScore = Math.min(...scores.map(s => s.scoreValue))
  const consensusThreshold = 1.0

  const consensusScore = averageScore
  let consensusNotes = `Consensus score based on ${scores.length} evaluators. Average: ${averageScore.toFixed(2)}`

  if (maxScore - minScore > consensusThreshold) {
    consensusNotes += `. Note: Scores vary from ${minScore} to ${maxScore}. Further review recommended.`
  }

  // Update or create consensus score
  const existingConsensus = await client.consensusScore.findFirst({
    where: {
      submissionId,
      criterionId,
    },
  })

  if (existingConsensus) {
    await client.consensusScore.update({
      where: { id: existingConsensus.id },
      data: {
        scoreValue: consensusScore,
        notes: consensusNotes,
      },
    })
  } else {
    await client.consensusScore.create({
      data: {
        submissionId,
        criterionId,
        scoreValue: consensusScore,
        notes: consensusNotes,
      },
    })
  }
}