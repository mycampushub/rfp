"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { MainLayout } from "@/components/layout/main-layout"
import { EmptyState } from "@/components/shared/empty-state"
import { LoadingCards, LoadingTable } from "@/components/shared/loading-table"
import { getStatusColor, getScoreColor } from "@/lib/status-utils"
import { formatDate } from "@/lib/utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Users,
  CheckCircle,
  Target,
  ClipboardCheck,
  UserCheck,
  AlertCircle,
  ArrowRight,
} from "lucide-react"
import { toast } from "sonner"

type TabValue = "mine" | "all" | "completed"

interface EvaluationItem {
  id: string
  rfpId: string
  rfpTitle: string
  status: "pending" | "in_progress" | "completed"
  rfpStatus: string
  submissionCount: number
  vendorCount: number
  averageScore: number
  deadline: string | null
  submissionDeadline: string | null
  createdAt: string
  totalEvaluators: number
  evaluatorsCompleted: number
  isEvaluator: boolean
  hasUserScored: boolean
  evaluators: Array<{
    id: string
    name: string
    hasScored: boolean
  }>
}

export default function EvaluationPage() {
  useEffect(() => { document.title = 'Evaluation Dashboard | RFP Platform' }, [])
  const router = useRouter()
  const { status: authStatus } = useSession()
  const [evaluations, setEvaluations] = useState<EvaluationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabValue>("all")

  const fetchEvaluations = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/evaluations')
      if (!res.ok) throw new Error(`Failed to fetch evaluations (${res.status})`)
      const json = await res.json()
      const data: EvaluationItem[] = Array.isArray(json.data) ? json.data : []
      setEvaluations(data)
    } catch (err) {
      console.error(err)
      toast.error('Failed to load evaluations')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (authStatus !== "loading") {
      fetchEvaluations()
    }
  }, [fetchEvaluations, authStatus])

  const filteredEvaluations = useMemo(() => {
    switch (activeTab) {
      case "mine":
        return evaluations.filter((e) => e.isEvaluator && !e.hasUserScored)
      case "completed":
        return evaluations.filter((e) => e.status === "completed")
      case "all":
      default:
        return evaluations
    }
  }, [evaluations, activeTab])

  const stats = useMemo(() => ({
    active: evaluations.filter((e) => e.status === "in_progress").length,
    pending: evaluations.filter((e) => e.status === "pending").length,
    completed: evaluations.filter((e) => e.status === "completed").length,
    needsMyEval: evaluations.filter((e) => e.isEvaluator && !e.hasUserScored).length,
    totalSubmissions: evaluations.reduce((s, e) => s + e.submissionCount, 0),
  }), [evaluations])

  // Loading state
  if (loading || authStatus === "loading") {
    return (
      <MainLayout title="Evaluation Dashboard">
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <Skeleton className="h-8 w-64 mb-2" />
              <Skeleton className="h-4 w-48" />
            </div>
          </div>
          <LoadingCards count={4} />
          <div className="rounded-lg border p-1">
            <div className="flex gap-1">
              <Skeleton className="h-10 w-40" />
              <Skeleton className="h-10 w-40" />
              <Skeleton className="h-10 w-40" />
            </div>
          </div>
          <LoadingTable rows={5} columns={6} />
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout title="Evaluation Dashboard">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">Evaluation Dashboard</h1>
            <p className="text-muted-foreground">
              Track and manage RFP evaluations and scoring
            </p>
          </div>
          {stats.needsMyEval > 0 && (
            <Button onClick={() => setActiveTab("mine")}>
              <UserCheck className="mr-2 h-4 w-4" />
              {stats.needsMyEval} Pending for You
            </Button>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Evaluations</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.active}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending for You</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.needsMyEval}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completed}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Submissions</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalSubmissions}</div>
            </CardContent>
          </Card>
        </div>

        {/* Tab Filters */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabValue)}>
          <TabsList className="flex flex-wrap gap-2">
            <TabsTrigger value="mine" className="gap-1.5">
              <UserCheck className="h-3.5 w-3.5 hidden sm:block" />
              Needs My Evaluation
              {stats.needsMyEval > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 min-w-5 px-1.5 text-xs">
                  {stats.needsMyEval}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="all" className="gap-1.5">
              <ClipboardCheck className="h-3.5 w-3.5 hidden sm:block" />
              All Evaluations
              {evaluations.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 min-w-5 px-1.5 text-xs">
                  {evaluations.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="completed" className="gap-1.5">
              <CheckCircle className="h-3.5 w-3.5 hidden sm:block" />
              Completed
            </TabsTrigger>
          </TabsList>

          {/* Needs My Evaluation Tab */}
          <TabsContent value="mine" className="mt-6">
            {filteredEvaluations.length === 0 ? (
              <Card>
                <CardContent className="py-12">
                  <EmptyState
                    icon={UserCheck}
                    title="No evaluations need your input"
                    description="You're all caught up! Evaluations assigned to you will appear here when they need scoring."
                  />
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Evaluations Awaiting Your Scores</CardTitle>
                  <CardDescription>
                    {filteredEvaluations.length} RFP{filteredEvaluations.length !== 1 ? 's' : ''} need your evaluation
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <EvaluationTable
                    items={filteredEvaluations}
                    onRowClick={(id) => router.push(`/evaluation/${id}`)}
                    showUserIndicator
                  />
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* All Evaluations Tab */}
          <TabsContent value="all" className="mt-6">
            {filteredEvaluations.length === 0 ? (
              <Card>
                <CardContent className="py-12">
                  <EmptyState
                    icon={ClipboardCheck}
                    title="No evaluations found"
                    description="Evaluations will appear here once RFPs receive submissions and enter the evaluation phase."
                  />
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>All Evaluations</CardTitle>
                  <CardDescription>
                    {filteredEvaluations.length} RFP{filteredEvaluations.length !== 1 ? 's' : ''} with submissions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <EvaluationTable
                    items={filteredEvaluations}
                    onRowClick={(id) => router.push(`/evaluation/${id}`)}
                    showUserIndicator
                  />
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Completed Tab */}
          <TabsContent value="completed" className="mt-6">
            {filteredEvaluations.length === 0 ? (
              <Card>
                <CardContent className="py-12">
                  <EmptyState
                    icon={CheckCircle}
                    title="No completed evaluations"
                    description="Completed evaluations will appear here after RFPs are closed or awarded."
                  />
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Completed Evaluations</CardTitle>
                  <CardDescription>
                    {filteredEvaluations.length} RFP{filteredEvaluations.length !== 1 ? 's' : ''} with completed evaluation
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <EvaluationTable
                    items={filteredEvaluations}
                    onRowClick={(id) => router.push(`/evaluation/${id}`)}
                  />
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  )
}

/* ─────────────── Evaluation Table Sub-component ─────────────── */

function EvaluationTable({
  items,
  onRowClick,
  showUserIndicator = false,
}: {
  items: EvaluationItem[]
  onRowClick: (_id: string) => void
  showUserIndicator?: boolean
}) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            {showUserIndicator && <TableHead className="w-10" />}
            <TableHead>RFP Title</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Submissions</TableHead>
            <TableHead>Evaluator Progress</TableHead>
            <TableHead>Avg Score</TableHead>
            <TableHead>Deadline</TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow
              key={item.id}
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => onRowClick(item.id)}
            >
              {showUserIndicator && (
                <TableCell>
                  {item.isEvaluator && !item.hasUserScored ? (
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500" title="Needs your evaluation" />
                  ) : item.isEvaluator && item.hasUserScored ? (
                    <CheckCircle className="h-4 w-4 text-emerald-500" />
                  ) : null}
                </TableCell>
              )}
              <TableCell>
                <div className="font-medium">{item.rfpTitle}</div>
                <div className="text-xs text-muted-foreground">
                  {item.vendorCount} vendor{item.vendorCount !== 1 ? 's' : ''}
                </div>
              </TableCell>
              <TableCell>
                <Badge className={getStatusColor(item.status)}>
                  {item.status === 'in_progress' ? 'In Progress' : item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                </Badge>
              </TableCell>
              <TableCell className="text-sm">
                {item.submissionCount}
              </TableCell>
              <TableCell>
                <div className="flex flex-col gap-1 min-w-[100px]">
                  <Progress
                    value={item.totalEvaluators > 0 ? (item.evaluatorsCompleted / item.totalEvaluators) * 100 : 0}
                    className="w-full h-2"
                  />
                  <span className="text-xs text-muted-foreground">
                    {item.evaluatorsCompleted}/{item.totalEvaluators} evaluators
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <span className={`font-medium ${getScoreColor(item.averageScore)}`}>
                  {item.averageScore > 0 ? item.averageScore.toFixed(1) : '—'}
                </span>
              </TableCell>
              <TableCell className="text-sm">
                {item.deadline ? formatDate(item.deadline) : item.submissionDeadline ? formatDate(item.submissionDeadline) : '—'}
              </TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => { e.stopPropagation(); onRowClick(item.id) }}
                >
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
