"use client"

import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
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
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { useState, useEffect } from "react"
import { toast } from "sonner"
import { EmptyState } from "@/components/shared/empty-state"
import { getStatusColor } from "@/lib/status-utils"
import { formatDate } from "@/lib/utils"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  Legend,
} from "recharts"

const PIE_COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#8b5cf6", "#6b7280"]

interface ChartData {
  statusDistribution: Array<{ name: string; value: number }>
  monthlyActivity: Array<{ month: string; created: number; submissions: number }>
  vendorResponseRate: Array<{ rfp: string; responses: number; max: number }>
  evaluationProgress: Array<{ rfp: string; evaluated: number; total: number }>
}

function ChartSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-4 w-40" />
      <Skeleton className="h-[200px] w-full rounded-lg" />
    </div>
  )
}

export default function Dashboard() {
  useEffect(() => { document.title = 'Dashboard | RFP Platform' }, [])
  const router = useRouter()
  const { data: session, status: authStatus } = useSession()
  const [loading, setLoading] = useState(true)
  const [chartsLoading, setChartsLoading] = useState(true)
  const [stats, setStats] = useState<Array<{
    title: string
    value: string
    description: string
    icon: typeof FileText
    trend: string
  }>>([])
  const [recentRFPs, setRecentRFPs] = useState<Array<{
    id: string
    title: string
    status: string
    deadline: string
    responses: number
    budget: string
  }>>([])
  const [chartData, setChartData] = useState<ChartData | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        const [statsRes, rfpsRes] = await Promise.all([
          fetch("/api/dashboard/stats"),
          fetch("/api/rfps"),
        ])

        if (!statsRes.ok) throw new Error("Failed to fetch stats")
        if (!rfpsRes.ok) throw new Error("Failed to fetch RFPs")

        const statsData = await statsRes.json()
        const rfpsData = await rfpsRes.json()

        setStats([
          {
            title: "Active RFPs",
            value: String(statsData.activeRfps ?? 0),
            description: "Currently active",
            icon: FileText,
            trend: Number(statsData.activeRfps ?? 0) > 0 ? "up" : "neutral"
          },
          {
            title: "Pending Evaluations",
            value: String(statsData.pendingEvaluations ?? 0),
            description: "Requires attention",
            icon: Clock,
            trend: Number(statsData.pendingEvaluations ?? 0) > 0 ? "up" : "neutral"
          },
          {
            title: "Vendor Responses",
            value: String(statsData.vendorResponses ?? 0),
            description: "Total submissions",
            icon: Users,
            trend: Number(statsData.vendorResponses ?? 0) > 0 ? "up" : "neutral"
          },
          {
            title: "Approvals Pending",
            value: String(statsData.approvalsPending ?? 0),
            description: "Needs your review",
            icon: CheckCircle,
            trend: Number(statsData.approvalsPending ?? 0) > 0 ? "up" : "neutral"
          },
          {
            title: "Total Vendors",
            value: String(statsData.totalVendors ?? 0),
            description: "Active vendors",
            icon: Users,
            trend: Number(statsData.totalVendors ?? 0) > 0 ? "up" : "neutral"
          }
        ])

        setRecentRFPs((rfpsData ?? []).slice(0, 5).map((rfp: Record<string, unknown>) => ({
          id: rfp.id as string,
          title: rfp.title as string,
          status: rfp.status as string,
          deadline: (rfp.timeline as Record<string, unknown>)?.submissionDeadline
            ? formatDate((rfp.timeline as Record<string, unknown>).submissionDeadline as string)
            : "TBD",
          responses: ((rfp._count as Record<string, unknown>)?.submissions as number) ?? 0,
          budget: rfp.budget ? `$${Number(rfp.budget).toLocaleString()}` : "TBD",
        })))
      } catch (error) {
        console.error("Error fetching dashboard data:", error)
        toast.error("Failed to load dashboard data")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  useEffect(() => {
    async function fetchCharts() {
      try {
        const res = await fetch("/api/dashboard/charts")
        if (!res.ok) throw new Error("Failed to fetch charts")
        const data = await res.json()
        setChartData(data)
      } catch (error) {
        console.error("Error fetching chart data:", error)
      } finally {
        setChartsLoading(false)
      }
    }
    fetchCharts()
  }, [])

  return (
    <MainLayout title="Dashboard">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">
              {authStatus === "loading" ? (
                <span className="inline-block w-48 h-4 bg-muted animate-pulse rounded" />
              ) : (
                <>Welcome back, {session?.user?.name || session?.user?.email?.split('@')[0] || 'there'}! Here's what's happening with your RFPs.</>
              )}
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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          {loading
            ? Array.from({ length: 5 }).map((_, i) => (
                <Card key={i}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-4" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-8 w-12 mb-2" />
                    <Skeleton className="h-3 w-32" />
                  </CardContent>
                </Card>
              ))
            : stats.map((stat) => (
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

        {/* Charts Section */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* 1. RFP Status Distribution (Donut) */}
          <Card>
            <CardHeader>
              <CardTitle>RFP Status Distribution</CardTitle>
              <CardDescription>Breakdown of RFPs by current status</CardDescription>
            </CardHeader>
            <CardContent>
              {chartsLoading ? (
                <ChartSkeleton />
              ) : chartData && chartData.statusDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={chartData.statusDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={85}
                      paddingAngle={3}
                      dataKey="value"
                      nameKey="name"
                      label={({ name, percent }) =>
                        `${name} ${(percent * 100).toFixed(0)}%`
                      }
                      labelLine={false}
                    >
                      {chartData.statusDistribution.map((_entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[200px] text-muted-foreground text-sm">
                  No RFP data available
                </div>
              )}
            </CardContent>
          </Card>

          {/* 2. Monthly RFP Activity (Area Chart) */}
          <Card>
            <CardHeader>
              <CardTitle>Monthly RFP Activity</CardTitle>
              <CardDescription>RFPs created and submissions received (last 6 months)</CardDescription>
            </CardHeader>
            <CardContent>
              {chartsLoading ? (
                <ChartSkeleton />
              ) : chartData && chartData.monthlyActivity.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={chartData.monthlyActivity}>
                    <defs>
                      <linearGradient id="colorCreated" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorSubmissions" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="month" className="text-xs" tick={{ fill: "currentColor" }} />
                    <YAxis className="text-xs" tick={{ fill: "currentColor" }} allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="created"
                      stroke="#10b981"
                      fill="url(#colorCreated)"
                      strokeWidth={2}
                      name="RFPs Created"
                    />
                    <Area
                      type="monotone"
                      dataKey="submissions"
                      stroke="#3b82f6"
                      fill="url(#colorSubmissions)"
                      strokeWidth={2}
                      name="Submissions"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[200px] text-muted-foreground text-sm">
                  No activity data available
                </div>
              )}
            </CardContent>
          </Card>

          {/* 3. Vendor Response Rate (Bar Chart) */}
          <Card>
            <CardHeader>
              <CardTitle>Vendor Response Rate</CardTitle>
              <CardDescription>Submissions received vs RFPs published</CardDescription>
            </CardHeader>
            <CardContent>
              {chartsLoading ? (
                <ChartSkeleton />
              ) : chartData && chartData.vendorResponseRate.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={chartData.vendorResponseRate} layout="vertical" margin={{ left: 0, right: 16 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
                    <XAxis type="number" tick={{ fill: "currentColor" }} allowDecimals={false} />
                    <YAxis
                      type="category"
                      dataKey="rfp"
                      width={120}
                      tick={{ fill: "currentColor", fontSize: 11 }}
                    />
                    <Tooltip />
                    <Bar dataKey="responses" fill="#10b981" radius={[0, 4, 4, 0]} name="Responses" />
                    <Bar dataKey="max" fill="hsl(var(--muted-foreground))" radius={[0, 4, 4, 0]} name="Published" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[200px] text-muted-foreground text-sm">
                  No response data available
                </div>
              )}
            </CardContent>
          </Card>

          {/* 4. Evaluation Progress (Horizontal Bar Chart) */}
          <Card>
            <CardHeader>
              <CardTitle>Evaluation Progress</CardTitle>
              <CardDescription>Submissions evaluated vs pending evaluation</CardDescription>
            </CardHeader>
            <CardContent>
              {chartsLoading ? (
                <ChartSkeleton />
              ) : chartData && chartData.evaluationProgress.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={chartData.evaluationProgress} layout="vertical" margin={{ left: 0, right: 16 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
                    <XAxis type="number" tick={{ fill: "currentColor" }} allowDecimals={false} />
                    <YAxis
                      type="category"
                      dataKey="rfp"
                      width={120}
                      tick={{ fill: "currentColor", fontSize: 11 }}
                    />
                    <Tooltip />
                    <Bar dataKey="evaluated" fill="#8b5cf6" radius={[0, 4, 4, 0]} name="Evaluated" />
                    <Bar dataKey="total" fill="#f59e0b" radius={[0, 4, 4, 0]} name="Total Submissions" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[200px] text-muted-foreground text-sm">
                  No evaluation data available
                </div>
              )}
            </CardContent>
          </Card>
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
              {loading ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="p-3 border rounded-lg space-y-2">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-64" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                  ))}
                </div>
              ) : recentRFPs.length > 0 ? (
                <div className="space-y-4">
                  {recentRFPs.map((rfp) => (
                    <div key={rfp.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate">{rfp.title}</h4>
                        <div className="flex items-center flex-wrap gap-x-2 gap-y-1 mt-1">
                          <Badge className={getStatusColor(rfp.status)}>
                            {rfp.status}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            Due: {rfp.deadline}
                          </span>
                        </div>
                        <div className="flex items-center space-x-4 mt-2 text-sm text-muted-foreground">
                          <span>{rfp.responses} responses</span>
                          <span>{rfp.budget}</span>
                        </div>
                      </div>
                      <div className="flex space-x-1 ml-2">
                        <Button variant="ghost" size="sm" onClick={() => router.push('/rfps/' + rfp.id)} aria-label="View RFP">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => router.push('/rfps/' + rfp.id + '/edit')} aria-label="Edit RFP">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={FileText}
                  title="No RFPs yet"
                  description="Create your first RFP to get started"
                  action={{ label: "Create RFP", onClick: () => router.push('/rfps/create') }}
                />
              )}
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
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertCircle className="mr-2 h-4 w-4" />
              Important Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-16 w-full rounded-lg" />
                <Skeleton className="h-16 w-full rounded-lg" />
              </div>
            ) : recentRFPs.length === 0 ? (
              <div className="text-center py-6">
                <CheckCircle className="h-10 w-10 text-emerald-400 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No alerts — everything looks good!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentRFPs
                  .filter(rfp => rfp.status === "published")
                  .slice(0, 2)
                  .map((rfp) => (
                    <div key={rfp.id} className="p-3 bg-amber-500/10 dark:bg-amber-500/20 border border-amber-500/30 dark:border-amber-500/40 rounded-lg">
                      <p className="text-sm font-medium text-amber-700 dark:text-amber-300">
                        {rfp.title} — Due: {rfp.deadline}
                      </p>
                      <p className="text-sm text-amber-600 dark:text-amber-400">
                        {rfp.responses} vendor response{rfp.responses !== 1 ? "s" : ""} received
                      </p>
                    </div>
                  ))}
                {recentRFPs.filter(rfp => rfp.status === "published").length === 0 && (
                  <div className="text-center py-6">
                    <CheckCircle className="h-10 w-10 text-emerald-400 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">No alerts — everything looks good!</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}
