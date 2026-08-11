import { MainLayout } from "@/components/layout/main-layout"
import { getTenantContextAsync } from "@/lib/tenant-context"
import { db } from "@/lib/db"
import { ApprovalsContent, type ApprovalData, type AwardData } from "./approvals-content"

export const dynamic = "force-dynamic"

export default async function ApprovalsPage() {
  let tenantId: string
  try {
    const ctx = await getTenantContextAsync()
    tenantId = ctx.tenantId
  } catch {
    return null
  }

  // Fetch all approval requests for the tenant
  const approvalRequests = await db.approvalRequest.findMany({
    where: {
      process: {
        rfp: { tenantId },
      },
    },
    select: {
      id: true,
      processId: true,
      stageName: true,
      approverRole: true,
      status: true,
      decidedAt: true,
      createdAt: true,
      process: {
        select: {
          rfpId: true,
          requestedBy: true,
          rfp: {
            select: {
              title: true,
              budget: true,
            },
          },
        },
      },
      approver: {
        select: {
          email: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  })

  // Fetch the user who requested each process
  const requesterIds = approvalRequests.map(a => a.process.requestedBy)
  const requesters = requesterIds.length > 0
    ? await db.user.findMany({
        where: { id: { in: requesterIds } },
        select: { id: true, email: true },
      })
    : []
  const requesterMap = Object.fromEntries(requesters.map(u => [u.id, u.email]))

  const approvals: ApprovalData[] = approvalRequests.map(a => ({
    id: a.id,
    rfpId: a.process.rfpId,
    rfpTitle: a.process.rfp.title,
    stageName: a.stageName,
    status: a.status,
    requestedByEmail: requesterMap[a.process.requestedBy] ?? "Unknown",
    approverEmail: a.approver?.email ?? null,
    requestedAt: a.createdAt.toISOString(),
    decidedAt: a.decidedAt?.toISOString() ?? null,
    budget: a.process.rfp.budget,
    priority: "medium", // No priority field in DB, default
  }))

  // Fetch awarded submissions as "awards"
  const awardedSubmissions = await db.submission.findMany({
    where: {
      rfp: { tenantId },
      status: "awarded",
    },
    select: {
      id: true,
      rfpId: true,
      vendorId: true,
      submittedAt: true,
      createdAt: true,
      rfp: {
        select: { title: true, budget: true },
      },
      vendor: {
        select: { name: true },
      },
    },
    orderBy: { submittedAt: "desc" },
    take: 50,
  })

  const awards: AwardData[] = awardedSubmissions.map(s => ({
    id: s.id,
    rfpId: s.rfpId,
    rfpTitle: s.rfp.title,
    vendorName: s.vendor.name,
    totalValue: s.rfp.budget ?? 0,
    status: "awarded",
    awardedAt: s.submittedAt?.toISOString() ?? s.createdAt.toISOString(),
  }))

  return (
    <MainLayout title="Approvals & Awards">
      <ApprovalsContent approvals={approvals} awards={awards} />
    </MainLayout>
  )
}