import { MainLayout } from "@/components/layout/main-layout"
import { getTenantContextAsync } from "@/lib/tenant-context"
import { db } from "@/lib/db"
import { AnalyticsContent, type AnalyticsData } from "./analytics-content"
import { format, differenceInDays } from "date-fns"

export const dynamic = "force-dynamic"

export default async function AnalyticsPage() {
  let tenantId: string
  try {
    const ctx = await getTenantContextAsync()
    tenantId = ctx.tenantId
  } catch {
    return null
  }

  // --- RFP metrics ---
  const [totalRfps, publishedCount, evalCount, awardedCount, allRfps, allVendors] =
    await Promise.all([
      db.rFP.count({ where: { tenantId } }),
      db.rFP.count({ where: { tenantId, status: "published" } }),
      db.rFP.count({ where: { tenantId, status: "evaluation" } }),
      db.rFP.count({ where: { tenantId, status: "awarded" } }),
      db.rFP.findMany({
        where: { tenantId },
        select: {
          id: true, status: true, category: true, budget: true,
          createdAt: true, publishAt: true, closeAt: true, updatedAt: true,
        },
      }),
      db.vendor.findMany({
        where: { tenantId },
        select: { id: true, name: true, isActive: true },
      }),
    ])

  // --- Financial metrics ---
  const budgetResult = await db.rFP.aggregate({
    where: { tenantId },
    _sum: { budget: true },
  })
  const awardedBudgetResult = await db.rFP.aggregate({
    where: { tenantId, status: "awarded" },
    _sum: { budget: true },
  })
  const totalBudget = budgetResult._sum.budget ?? 0
  const totalAwarded = awardedBudgetResult._sum.budget ?? 0
  const savings = totalBudget - totalAwarded

  // --- Timeline metrics ---
  const publishedRfps = allRfps.filter(
    (r) => r.status === "published" && r.publishAt && r.createdAt
  )
  const awardedRfps = allRfps.filter(
    (r) => r.status === "awarded" && r.publishAt && r.createdAt
  )
  const evalRfps = allRfps.filter(
    (r) => r.status === "evaluation" && r.createdAt
  )

  const avgCreationToPublish =
    publishedRfps.length > 0
      ? Math.round(
          publishedRfps.reduce(
            (sum, r) => sum + differenceInDays(new Date(r.publishAt!), new Date(r.createdAt)),
            0
          ) / publishedRfps.length
        )
      : 0

  const avgPublishToAward =
    awardedRfps.length > 0
      ? Math.round(
          awardedRfps.reduce(
            (sum, r) => sum + differenceInDays(new Date(r.updatedAt), new Date(r.createdAt)),
            0
          ) / awardedRfps.length
        )
      : 0

  const avgEvaluationTime =
    evalRfps.length > 0
      ? Math.round(
          evalRfps.reduce(
            (sum, r) => sum + differenceInDays(new Date(r.updatedAt), new Date(r.createdAt)),
            0
          ) / evalRfps.length
        )
      : 0

  const avgCycleTime =
    awardedRfps.length > 0
      ? Math.round(
          awardedRfps.reduce(
            (sum, r) => sum + differenceInDays(new Date(r.updatedAt), new Date(r.createdAt)),
            0
          ) / awardedRfps.length
        )
      : 0

  // --- Monthly data ---
  const monthMap = new Map<string, { rfps: number; awards: number; budget: number }>()
  for (const rfp of allRfps) {
    const month = format(new Date(rfp.createdAt), "MMM yyyy")
    const entry = monthMap.get(month) ?? { rfps: 0, awards: 0, budget: 0 }
    entry.rfps++
    if (rfp.status === "awarded") entry.awards++
    entry.budget += rfp.budget ?? 0
    monthMap.set(month, entry)
  }
  // Sort by date (parse back to sort)
  const monthlyData = Array.from(monthMap.entries())
    .sort(([a], [b]) => {
      const dateA = new Date(a + " 1")
      const dateB = new Date(b + " 1")
      return dateA.getTime() - dateB.getTime()
    })
    .slice(-12) // Last 12 months
    .map(([month, data]) => ({ month, ...data }))

  // --- Category data ---
  const categoryMap = new Map<string, { count: number; value: number }>()
  for (const rfp of allRfps) {
    if (!rfp.category) continue
    const entry = categoryMap.get(rfp.category) ?? { count: 0, value: 0 }
    entry.count++
    entry.value += rfp.budget ?? 0
    categoryMap.set(rfp.category, entry)
  }
  const categoryData = Array.from(categoryMap.entries()).map(
    ([category, data]) => ({ category, ...data })
  )

  // --- Vendor metrics ---
  const activeVendors = allVendors.filter((v) => v.isActive).length
  const vendorIds = allVendors.map((v) => v.id)

  // Get submission counts per vendor
  const submissionCounts = vendorIds.length > 0
    ? await db.submission.groupBy({
        by: ["vendorId"],
        where: { vendorId: { in: vendorIds } },
        _count: { id: true },
      })
    : []

  // Get awarded submission counts per vendor
  const awardedSubmissions = vendorIds.length > 0
    ? await db.submission.groupBy({
        by: ["vendorId"],
        where: { vendorId: { in: vendorIds }, status: "awarded" },
        _count: { id: true },
      })
    : []

  // Get avg scores per vendor (for vendors that have scores)
  const scoreAggregates = await db.score.groupBy({
    by: ["submissionId"],
    _avg: { scoreValue: true },
  })

  // Map submission ID to vendor ID
  const submissionVendorMap: Record<string, string> = {}
  if (scoreAggregates.length > 0 && vendorIds.length > 0) {
    const submissions = await db.submission.findMany({
      where: { id: { in: scoreAggregates.map((s) => s.submissionId) } },
      select: { id: true, vendorId: true },
    })
    for (const sub of submissions) {
      submissionVendorMap[sub.id] = sub.vendorId
    }
  }

  // Compute avg score per vendor
  const vendorScores: Record<string, number[]> = {}
  for (const sa of scoreAggregates) {
    const vid = submissionVendorMap[sa.submissionId]
    if (vid && vendorIds.includes(vid)) {
      if (!vendorScores[vid]) vendorScores[vid] = []
      vendorScores[vid].push(sa._avg.scoreValue ?? 0)
    }
  }

  // Build top performers
  const subCountMap = Object.fromEntries(
    submissionCounts.map((s) => [s.vendorId, s._count.id])
  )
  const awardedCountMap = Object.fromEntries(
    awardedSubmissions.map((s) => [s.vendorId, s._count.id])
  )

  const topPerformers = allVendors
    .filter((v) => (subCountMap[v.id] ?? 0) > 0)
    .sort((a, b) => (subCountMap[b.id] ?? 0) - (subCountMap[a.id] ?? 0))
    .slice(0, 5)
    .map((v) => {
      const total = subCountMap[v.id] ?? 0
      const awarded = awardedCountMap[v.id] ?? 0
      const scores = vendorScores[v.id] ?? []
      const avgScore =
        scores.length > 0
          ? scores.reduce((a, b) => a + b, 0) / scores.length
          : 0
      return {
        name: v.name,
        winRate: total > 0 ? Math.round((awarded / total) * 100) : 0,
        avgScore: Math.round(avgScore * 10) / 10,
      }
    })

  const totalSubs = submissionCounts.reduce((sum, s) => sum + s._count.id, 0)
  const totalRfpsWithSubs = new Set(allRfps.filter((r) => r.status !== "draft").map((r) => r.id)).size
  const avgResponseRate =
    totalRfpsWithSubs > 0
      ? Math.round((totalSubs / totalRfpsWithSubs) * 100)
      : 0

  const data: AnalyticsData = {
    rfpMetrics: {
      total: totalRfps,
      published: publishedCount,
      inEvaluation: evalCount,
      awarded: awardedCount,
      avgCycleTime,
    },
    vendorMetrics: {
      total: allVendors.length,
      active: activeVendors,
      avgResponseRate,
      topPerformers,
    },
    financialMetrics: {
      totalBudget,
      totalAwarded,
      savings,
      avgAwardValue: awardedCount > 0 ? totalAwarded / awardedCount : 0,
    },
    timelineMetrics: {
      avgCreationToPublish,
      avgPublishToAward,
      avgEvaluationTime,
    },
    monthlyData,
    categoryData,
  }

  return (
    <MainLayout title="Analytics & Reporting">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">Analytics & Reporting</h1>
          <p className="text-muted-foreground">
            Comprehensive insights into your RFP performance and procurement metrics
          </p>
        </div>
        <AnalyticsContent data={data} />
      </div>
    </MainLayout>
  )
}
