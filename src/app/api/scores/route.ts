import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { getTenantContext, AuthError, PermissionError } from "@/lib/tenant-context"
import { z } from "zod"

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

    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit

    const [scores, total] = await Promise.all([
      db.score.findMany({
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
        take: limit,
        skip,
      }),
      db.score.count({ where: whereClause }),
    ])

    return NextResponse.json({
      data: scores,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    })
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

    const score = await db.$transaction(async (tx) => {
      // Verify submission belongs to tenant
      const submission = await tx.submission.findFirst({
        where: {
          id: validatedData.submissionId,
          rfp: {
            tenantId: tenantContext.tenantId,
          },
        },
      })

      if (!submission) {
        throw new Error('SUBMISSION_NOT_FOUND')
      }

      // Verify criterion belongs to tenant
      const criterion = await tx.rubricCriterion.findFirst({
        where: {
          id: validatedData.criterionId,
          OR: [
            { rfp: { tenantId: tenantContext.tenantId } },
            { section: { rfp: { tenantId: tenantContext.tenantId } } },
          ],
        },
      })

      if (!criterion) {
        throw new Error('CRITERION_NOT_FOUND')
      }

      // Verify evaluator belongs to tenant
      const evaluator = await tx.user.findFirst({
        where: {
          id: tenantContext.userId,
          tenantId: tenantContext.tenantId,
          isActive: true,
        },
      })

      if (!evaluator) {
        throw new Error('EVALUATOR_NOT_FOUND')
      }

      // Validate score is within range
      if (validatedData.scoreValue < criterion.scaleMin || validatedData.scoreValue > criterion.scaleMax) {
        throw new Error('SCORE_OUT_OF_RANGE')
      }

      // Check if score already exists for this evaluator and criterion
      const existingScore = await tx.score.findFirst({
        where: {
          submissionId: validatedData.submissionId,
          criterionId: validatedData.criterionId,
          evaluatorId: tenantContext.userId,
        },
      })

      let result
      if (existingScore) {
        result = await tx.score.update({
          where: { id: existingScore.id },
          data: {
            scoreValue: validatedData.scoreValue,
            notes: validatedData.notes,
          },
        })
      } else {
        result = await tx.score.create({
          data: {
            ...validatedData,
            evaluatorId: tenantContext.userId,
          },
        })
      }

      // Calculate consensus within the same transaction
      await calculateConsensus(tx, validatedData.submissionId, validatedData.criterionId)

      return result
    })

    // Fetch full score with includes after commit
    const fullScore = await db.score.findUniqueOrThrow({
      where: { id: score.id },
      include: {
        submission: {
          include: {
            vendor: { select: { id: true, name: true } },
            rfp: { select: { id: true, title: true, status: true } },
          },
        },
        criterion: {
          select: { id: true, label: true, weight: true, scaleMin: true, scaleMax: true, guidance: true },
        },
        evaluator: {
          select: { id: true, name: true, email: true },
        },
      },
    })

    return NextResponse.json(fullScore, { status: 201 })
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: 401 })
    if (error instanceof PermissionError) return NextResponse.json({ error: error.message }, { status: 403 })
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation Error", details: error.issues }, { status: 400 })
    }
    if (error instanceof Error) {
      switch (error.message) {
        case 'SUBMISSION_NOT_FOUND':
          return NextResponse.json({ error: "Submission not found" }, { status: 404 })
        case 'CRITERION_NOT_FOUND':
          return NextResponse.json({ error: "Criterion not found" }, { status: 404 })
        case 'EVALUATOR_NOT_FOUND':
          return NextResponse.json({ error: "Evaluator not found" }, { status: 404 })
        case 'SCORE_OUT_OF_RANGE':
          return NextResponse.json({ error: "Score out of range" }, { status: 400 })
      }
    }
    console.error("Error creating/updating score:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

type TransactionClient = typeof db

async function calculateConsensus(
  tx: TransactionClient,
  submissionId: string,
  criterionId: string,
) {
  // Get all scores for this submission and criterion
  const scores = await tx.score.findMany({
    where: {
      submissionId,
      criterionId,
    },
    include: {
      evaluator: true,
    },
    take: 500,
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

  let consensusScore = averageScore
  let consensusNotes = `Consensus score based on ${scores.length} evaluators. Average: ${averageScore.toFixed(2)}`

  if (maxScore - minScore > consensusThreshold) {
    consensusNotes += `. Note: Scores vary from ${minScore} to ${maxScore}. Further review recommended.`
  }

  // Update or create consensus score
  const existingConsensus = await tx.consensusScore.findFirst({
    where: {
      submissionId,
      criterionId,
    },
  })

  if (existingConsensus) {
    await tx.consensusScore.update({
      where: { id: existingConsensus.id },
      data: {
        scoreValue: consensusScore,
        notes: consensusNotes,
      },
    })
  } else {
    await tx.consensusScore.create({
      data: {
        submissionId,
        criterionId,
        scoreValue: consensusScore,
        notes: consensusNotes,
      },
    })
  }
}