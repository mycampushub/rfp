"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { MainLayout } from "@/components/layout/main-layout"
import { EmptyState } from "@/components/shared/empty-state"
import { LoadingTable } from "@/components/shared/loading-table"
import { getStatusColor, getScoreColor, getScoreStars } from "@/lib/status-utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Users, Clock, CheckCircle, TrendingUp, Target, Award, ClipboardCheck, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"
import { formatDate } from "@/lib/utils"

interface Evaluation {
  id: string
  rfpTitle: string
  vendorName: string
  status: "pending" | "in_progress" | "completed" | "finalized"
  averageScore: number
  maxScore: number
  evaluatorCount: number
  requiredEvaluators: number
  deadline: string
  submissions: Array<{
    id: string
    vendor: string
    score: number
    status: string
  }>
}

export default function EvaluationPage() {
  useEffect(() => { document.title = 'Evaluation Dashboard | RFP Platform' }, [])
  const router = useRouter()
  const [evaluations, setEvaluations] = useState<Evaluation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchEvaluations = async () => {
      try {
        const res = await fetch('/api/evaluations')
        if (!res.ok) throw new Error('Failed to fetch evaluations')
        const data = await res.json()
        const mapped: Evaluation[] = (Array.isArray(data) ? data : []).map((e: any) => ({
          id: e.id,
          rfpTitle: e.rfpTitle || 'Untitled RFP',
          vendorName: `${e.vendorCount || 0} vendor${(e.vendorCount || 0) !== 1 ? 's' : ''}`,
          status: e.status || 'pending',
          averageScore: e.averageScore || 0,
          maxScore: 5,
          evaluatorCount: e.submissionCount || 0,
          requiredEvaluators: Math.max(e.submissionCount || 0, 1),
          deadline: e.deadline || e.createdAt || '',
          submissions: [],
        }))
        setEvaluations(mapped)
      } catch (err) {
        console.error(err)
        toast.error('Failed to load evaluations')
      } finally {
        setLoading(false)
      }
    }
    fetchEvaluations()
  }, [])

  if (loading) {
    return (
      <MainLayout title="Evaluation Dashboard">
        <LoadingTable rows={5} columns={7} />
      </MainLayout>
    )
  }

  return (
    <MainLayout title="Evaluation Dashboard">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">Evaluation Dashboard</h1>
          <p className="text-muted-foreground">
            Track and manage RFP evaluations and scoring
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Evaluations</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {evaluations.filter(e => e.status === "in_progress").length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Evaluations</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {evaluations.filter(e => e.status === "pending").length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed Evaluations</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {evaluations.filter(e => e.status === "completed").length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Evaluators</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {evaluations.reduce((sum, e) => sum + e.evaluatorCount, 0)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Active Evaluations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="mr-2 h-4 w-4" />
              Active Evaluations
            </CardTitle>
            <CardDescription>
              Evaluations currently in progress
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {evaluations.filter(e => e.status === "in_progress").map((evaluation) => (
                <div key={evaluation.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-semibold">{evaluation.rfpTitle}</h3>
                      <p className="text-sm text-muted-foreground">{evaluation.vendorName}</p>
                    </div>
                    <Badge className={getStatusColor(evaluation.status)}>
                      {evaluation.status.replace("_", " ")}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <div className="text-sm font-medium">Average Score</div>
                      <div className={`text-2xl font-bold ${getScoreColor((evaluation.averageScore / evaluation.maxScore) * 100)}`}>
                        {evaluation.averageScore.toFixed(1)}/{evaluation.maxScore}
                      </div>
                      <div className="flex mt-1">
                        {getScoreStars((evaluation.averageScore / evaluation.maxScore) * 100)}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium">Evaluator Progress</div>
                      <div className="mt-1">
                        <Progress 
                          value={evaluation.requiredEvaluators > 0 ? (evaluation.evaluatorCount / evaluation.requiredEvaluators) * 100 : 0} 
                          className="w-full"
                        />
                        <div className="text-sm text-muted-foreground mt-1">
                          {evaluation.evaluatorCount}/{evaluation.requiredEvaluators} evaluators
                        </div>
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium">Deadline</div>
                      <div className="text-sm text-muted-foreground">
                        {evaluation.deadline ? formatDate(evaluation.deadline) : 'N/A'}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end">
                    <Button size="sm" onClick={() => router.push('/evaluation/' + evaluation.id)}>Continue Evaluation</Button>
                  </div>
                </div>
              ))}
              
              {evaluations.filter(e => e.status === "in_progress").length === 0 && (
                <EmptyState icon={ClipboardCheck} title="No active evaluations" description="Evaluations will appear here once RFPs move to the evaluation phase." />
              )}
            </div>
          </CardContent>
        </Card>

        {/* All Evaluations Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Evaluations</CardTitle>
            <CardDescription>
              Complete overview of all RFP evaluations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>RFP</TableHead>
                  <TableHead>Vendors</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Evaluators</TableHead>
                  <TableHead>Deadline</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {evaluations.map((evaluation) => (
                  <TableRow key={evaluation.id}>
                    <TableCell>
                      <div className="font-medium">{evaluation.rfpTitle}</div>
                    </TableCell>
                    <TableCell>{evaluation.vendorName}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(evaluation.status)}>
                        {evaluation.status.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <span className={`font-medium ${getScoreColor((evaluation.averageScore / evaluation.maxScore) * 100)}`}>
                          {evaluation.averageScore.toFixed(1)}
                        </span>
                        <div className="flex">
                          {getScoreStars((evaluation.averageScore / evaluation.maxScore) * 100)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {evaluation.evaluatorCount}/{evaluation.requiredEvaluators}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {evaluation.deadline ? formatDate(evaluation.deadline) : 'N/A'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" onClick={() => router.push('/evaluation/' + evaluation.id)}>
                        {evaluation.status === "pending" ? "Start" : "View"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {evaluations.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <p className="text-muted-foreground">No evaluations found.</p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            </div>
          </CardContent>
        </Card>

        {/* Top Performers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Award className="mr-2 h-4 w-4" />
              Top Performing Vendors
            </CardTitle>
            <CardDescription>
              Vendors with the highest average scores across all evaluations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {evaluations
                .filter(e => e.status === "completed")
                .sort((a, b) => b.averageScore - a.averageScore)
                .slice(0, 5)
                .map((evaluation, index) => (
                  <div key={evaluation.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-amber-500/15 dark:bg-amber-500/25 rounded-full flex items-center justify-center">
                        <span className="text-sm font-bold text-amber-700 dark:text-amber-300">#{index + 1}</span>
                      </div>
                      <div>
                        <div className="font-medium">{evaluation.vendorName}</div>
                        <div className="text-sm text-muted-foreground">{evaluation.rfpTitle}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-bold ${getScoreColor((evaluation.averageScore / evaluation.maxScore) * 100)}`}>
                        {evaluation.averageScore.toFixed(1)}/{evaluation.maxScore}
                      </div>
                      <div className="flex justify-end">
                        {getScoreStars((evaluation.averageScore / evaluation.maxScore) * 100)}
                      </div>
                    </div>
                  </div>
                ))}
              {evaluations.filter(e => e.status === "completed").length === 0 && (
                <EmptyState icon={CheckCircle2} title="No completed evaluations" description="Completed evaluations will appear here." />
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}