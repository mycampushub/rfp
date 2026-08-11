import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { getTenantContext, AuthError, PermissionError } from "@/lib/tenant-context"
import { requirePermission } from "@/lib/rbac"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const submissionId = searchParams.get("submissionId")
    const criterionId = searchParams.get("criterionId")
    const limit = Math.min(parseInt(searchParams.get('limit') || '10') || 10, 100)
    const offset = Math.max(0, parseInt(searchParams.get('offset') || '0') || 0)

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

    const consensusScores = await db.consensusScore.findMany({
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
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    })

    return NextResponse.json(consensusScores)
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: 401 })
    if (error instanceof PermissionError) return NextResponse.json({ error: error.message }, { status: 403 })
    console.error("Error fetching consensus scores:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const action = searchParams.get("action")

    if (action === "recalculate") {
      const submissionId = searchParams.get("submissionId")
      
      if (!submissionId) {
        return NextResponse.json({ error: "Submission ID is required" }, { status: 400 })
      }

      const tenantContext = getTenantContext(session)
      await requirePermission("evaluation:manage")

      // Verify submission belongs to tenant
      const submission = await db.submission.findFirst({
        where: {
          id: submissionId,
          rfp: {
            tenantId: tenantContext.tenantId,
          },
        },
      })

      if (!submission) {
        return NextResponse.json({ error: "Submission not found" }, { status: 404 })
      }

      // Get all criteria for this submission's RFP
      const criteria = await db.rubricCriterion.findMany({
        where: {
          OR: [
            { rfpId: submission.rfpId },
            { section: { rfpId: submission.rfpId } },
          ],
        },
      })

      // Recalculate consensus for each criterion
      const results: Array<{ criterionId: string; criterionLabel: string; consensusScore: number | null; consensusNotes: string | null }> = []
      for (const criterion of criteria) {
        const { calculateConsensus } = await import("../scores/route")
        await calculateConsensus(null, submissionId, criterion.id)
        
        const consensus = await db.consensusScore.findFirst({
          where: {
            submissionId,
            criterionId: criterion.id,
          },
        })
        
        results.push({
          criterionId: criterion.id,
          criterionLabel: criterion.label,
          consensusScore: consensus?.scoreValue || null,
          consensusNotes: consensus?.notes || null,
        })
      }

      return NextResponse.json({ 
        message: "Consensus scores recalculated successfully",
        results 
      })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: 401 })
    if (error instanceof PermissionError) return NextResponse.json({ error: error.message }, { status: 403 })
    console.error("Error in consensus operation:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}