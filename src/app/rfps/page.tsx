import { MainLayout } from "@/components/layout/main-layout"
import { getTenantContextAsync } from "@/lib/tenant-context"
import { db } from "@/lib/db"
import { RFPsContent } from "./rfps-content"

export const dynamic = "force-dynamic"

export default async function RFPsPage() {
  let tenantId: string
  try {
    const ctx = await getTenantContextAsync()
    tenantId = ctx.tenantId
  } catch {
    return null
  }

  const rfps = await db.rFP.findMany({
    where: { tenantId },
    select: {
      id: true,
      title: true,
      status: true,
      category: true,
      budget: true,
      publishAt: true,
      closeAt: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  })

  // Fetch submission counts per RFP
  const submissionCounts = rfps.length > 0
    ? await db.submission.groupBy({
        by: ["rfpId"],
        where: { rfpId: { in: rfps.map(r => r.id) } },
        _count: { id: true },
      })
    : []

  const countMap = Object.fromEntries(
    submissionCounts.map(s => [s.rfpId, s._count.id])
  )

  const rfpsData = rfps.map(r => ({
    id: r.id,
    title: r.title,
    status: r.status,
    category: r.category,
    budget: r.budget,
    publishAt: r.publishAt?.toISOString() ?? null,
    closeAt: r.closeAt?.toISOString() ?? null,
    createdAt: r.createdAt.toISOString(),
    responseCount: countMap[r.id] ?? 0,
  }))

  return (
    <MainLayout title="RFPs">
      <RFPsContent rfps={rfpsData} />
    </MainLayout>
  )
}