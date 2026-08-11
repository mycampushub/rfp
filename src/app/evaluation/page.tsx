import { MainLayout } from "@/components/layout/main-layout"
import { getTenantContextAsync } from "@/lib/tenant-context"
import { db } from "@/lib/db"
import { EvaluationContent, type EvaluationData, type EvaluationSubmission } from "./evaluation-content"

export const dynamic = "force-dynamic"

export default async function EvaluationPage() {
  let tenantId: string
  try {
    const ctx = await getTenantContextAsync()
    tenantId = ctx.tenantId
  } catch {
    return null
  }

  // Fetch RFPs that have submissions (these are the ones being/need evaluation)
  const rfps = await db.rFP.findMany({
    where: {
      tenantId,
      submissions: { some: {} },
    },
    select: {
      id: true,
      title: true,
      status: true,
      closeAt: true,
      rubricCriteria: { select: { id: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  })

  if (rfps.length === 0) {
    return (
      <MainLayout title="Evaluation Dashboard">
        <EvaluationContent evaluations={[]} />
      </MainLayout>
    )
  }

  const rfpIds = rfps.map(r => r.id)

  // Fetch submissions with scores and vendor names for these RFPs
  const submissions = await db.submission.findMany({
    where: { rfpId: { in: rfpIds } },
    select: {
      id: true,
      rfpId: true,
      vendorId: true,
      status: true,
      vendor: { select: { name: true } },
      scores: {
        select: {
          scoreValue: true,
          evaluatorId: true,
        },
      },
    },
  })

  // Fetch evaluator counts per RFP (users assigned as evaluator in RFP_Team)
  const rfpTeams = await db.rFP_Team.findMany({
    where: { rfpId: { in: rfpIds }, role: "evaluator" },
    select: { rfpId: true, userId: true },
  })

  const evaluatorCountByRfp: Record<string, Set<string>> = {}
  for (const t of rfpTeams) {
    if (!evaluatorCountByRfp[t.rfpId]) evaluatorCountByRfp[t.rfpId] = new Set()
    evaluatorCountByRfp[t.rfpId].add(t.userId)
  }

  // Also count unique evaluators who actually scored
  for (const sub of submissions) {
    for (const score of sub.scores) {
      if (!evaluatorCountByRfp[sub.rfpId]) evaluatorCountByRfp[sub.rfpId] = new Set()
      evaluatorCountByRfp[sub.rfpId].add(score.evaluatorId)
    }
  }

  // Build evaluations - one per RFP
  const evaluations: EvaluationData[] = []

  for (const rfp of rfps) {
    const rfpSubs = submissions.filter(s => s.rfpId === rfp.id)
    const allScores = rfpSubs.flatMap(s => s.scores.map(sc => sc.scoreValue))
    const avgScore = allScores.length > 0
      ? allScores.reduce((a, b) => a + b, 0) / allScores.length
      : 0

    const criteriaCount = rfp.rubricCriteria.length
    const maxScore = criteriaCount > 0 ? criteriaCount * 5 : 5 // Assume max 5 per criterion

    const evaluatorSet = evaluatorCountByRfp[rfp.id]
    const evaluatorCount = evaluatorSet ? evaluatorSet.size : 0
    const requiredEvaluators = evaluatorCount > 0 ? evaluatorCount : 3 // default 3

    // Determine status based on RFP status and scoring
    let status: string
    if (rfp.status === "awarded" || rfp.status === "closed") {
      status = "finalized"
    } else if (allScores.length > 0) {
      status = "in_progress"
    } else {
      status = "pending"
    }

    const subData: EvaluationSubmission[] = rfpSubs.map(s => {
      const subScores = s.scores.map(sc => sc.scoreValue)
      const subAvg = subScores.length > 0
        ? subScores.reduce((a, b) => a + b, 0) / subScores.length
        : 0
      return {
        id: s.id,
        vendor: s.vendor.name,
        score: subAvg,
        status: s.status,
      }
    })

    evaluations.push({
      id: rfp.id,
      rfpTitle: rfp.title,
      vendorName: subData.length > 0 ? `${subData.length} vendor(s)` : "No vendors",
      status,
      averageScore: avgScore,
      maxScore,
      evaluatorCount,
      requiredEvaluators,
      deadline: rfp.closeAt?.toISOString() ?? null,
      submissions: subData,
    })
  }

  return (
    <MainLayout title="Evaluation Dashboard">
      <EvaluationContent evaluations={evaluations} />
    </MainLayout>
  )
}