import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  FileText,
  Users,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Plus,
  Eye,
  Edit,
  AlertTriangle
} from "lucide-react"
import Link from "next/link"
import { getTenantContextAsync } from "@/lib/tenant-context"
import { db } from "@/lib/db"
import { format, differenceInDays } from "date-fns"

function getStatusColor(status: string) {
  switch (status) {
    case "published":
      return "bg-green-100 text-green-800"
    case "draft":
      return "bg-gray-100 text-gray-800"
    case "evaluation":
      return "bg-blue-100 text-blue-800"
    case "closed":
      return "bg-red-100 text-red-800"
    case "awarded":
      return "bg-purple-100 text-purple-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

function formatBudget(budget: number | null | undefined): string {
  if (budget == null) return "N/A"
  return `$${budget.toLocaleString()}`
}

export default async function Dashboard() {
  let tenantId: string
  try {
    const ctx = await getTenantContextAsync()
    tenantId = ctx.tenantId
  } catch {
    // Not authenticated, will be redirected by middleware
    return null
  }

  const [activeRfps, pendingEvals, totalResponses, pendingApprovals] = await Promise.all([
    db.rFP.count({ where: { tenantId, status: "published" } }),
    db.rFP.count({ where: { tenantId, status: "evaluation" } }),
    db.submission.count({ where: { rfp: { tenantId } } }),
    db.approvalRequest.count({ where: { process: { rfp: { tenantId } }, status: "pending" } }),
  ])

  const recentRFPs = await db.rFP.findMany({
    where: { tenantId },
    orderBy: { createdAt: "desc" },
    take: 5,
    select: { id: true, title: true, status: true, closeAt: true, budget: true },
  })

  const responseCounts = await db.submission.groupBy({
    by: ["rfpId"],
    where: { rfp: { tenantId } },
    _count: { id: true },
  })
  const responseMap = Object.fromEntries(responseCounts.map(r => [r.rfpId, r._count.id]))

  // Build alerts: RFPs closing within 3 days + pending approvals
  const now = new Date()
  const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)

  const closingSoonRfps = await db.rFP.findMany({
    where: {
      tenantId,
      status: "published",
      closeAt: { gte: now, lte: threeDaysFromNow },
    },
    select: { id: true, title: true, closeAt: true },
  })

  const pendingApprovalRfps = await db.approvalRequest.findMany({
    where: {
      process: { rfp: { tenantId } },
      status: "pending",
    },
    include: {
      process: {
        select: { rfp: { select: { id: true, title: true } } },
      },
    },
    take: 5,
  })

  const stats = [
    {
      title: "Active RFPs",
      value: String(activeRfps),
      description: "Currently published",
      icon: FileText,
    },
    {
      title: "Pending Evaluations",
      value: String(pendingEvals),
      description: pendingEvals > 0 ? "Requires attention" : "All caught up",
      icon: Clock,
    },
    {
      title: "Vendor Responses",
      value: String(totalResponses),
      description: "Total submissions received",
      icon: Users,
    },
    {
      title: "Approvals Pending",
      value: String(pendingApprovals),
      description: pendingApprovals > 0 ? "High priority" : "No pending approvals",
      icon: CheckCircle,
    },
  ]

  const hasAlerts = closingSoonRfps.length > 0 || pendingApprovalRfps.length > 0

  return (
    <MainLayout title="Dashboard">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome back! Here&apos;s what&apos;s happening with your RFPs.
            </p>
          </div>
          <Button asChild>
            <Link href="/rfps/create">
              <Plus className="mr-2 h-4 w-4" />
              Create New RFP
            </Link>
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent RFPs */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Recent RFPs</CardTitle>
              <CardDescription>
                Your latest Request for Proposal activities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentRFPs.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No RFPs yet. Create your first one!</p>
                ) : (
                  recentRFPs.map((rfp) => (
                    <div key={rfp.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium">{rfp.title}</h4>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge className={getStatusColor(rfp.status)}>
                            {rfp.status}
                          </Badge>
                          {rfp.closeAt && (
                            <span className="text-sm text-muted-foreground">
                              Due: {format(new Date(rfp.closeAt), "MMM d, yyyy")}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-4 mt-2 text-sm text-muted-foreground">
                          <span>{responseMap[rfp.id] ?? 0} responses</span>
                          <span>{formatBudget(rfp.budget)}</span>
                        </div>
                      </div>
                      <div className="flex space-x-1">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/rfps/${rfp.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/rfps/${rfp.id}/edit`}>
                            <Edit className="h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Common tasks and shortcuts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button className="w-full justify-start" asChild>
                <Link href="/rfps">
                  <FileText className="mr-2 h-4 w-4" />
                  View All RFPs
                </Link>
              </Button>
              <Button className="w-full justify-start" asChild>
                <Link href="/vendors">
                  <Users className="mr-2 h-4 w-4" />
                  Manage Vendors
                </Link>
              </Button>
              <Button className="w-full justify-start" asChild>
                <Link href="/evaluation">
                  <TrendingUp className="mr-2 h-4 w-4" />
                  Evaluation Dashboard
                </Link>
              </Button>
              <Button className="w-full justify-start" asChild>
                <Link href="/approvals">
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Pending Approvals
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Alerts/Notifications */}
        {hasAlerts && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertCircle className="mr-2 h-4 w-4" />
                Important Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {closingSoonRfps.map((rfp) => {
                  const daysLeft = differenceInDays(new Date(rfp.closeAt!), now)
                  return (
                    <div key={rfp.id} className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm font-medium text-yellow-800">
                        {rfp.title} — {daysLeft} {daysLeft === 1 ? "day" : "days"} until deadline
                      </p>
                      <p className="text-sm text-yellow-600">
                        {responseMap[rfp.id] ?? 0} vendor {responseMap[rfp.id] === 1 ? "response" : "responses"} received
                      </p>
                    </div>
                  )
                })}
                {pendingApprovalRfps.map((req) => {
                  const rfpTitle = req.process.rfp?.title ?? "Unknown RFP"
                  return (
                    <div key={req.id} className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm font-medium text-blue-800">
                        {rfpTitle} — Approval required
                      </p>
                      <p className="text-sm text-blue-600">
                        Awaiting approval review
                      </p>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  )
}