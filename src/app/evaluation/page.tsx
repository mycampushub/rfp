"use client"

import { useState, useEffect } from "react"
import { MainLayout } from "@/components/layout/main-layout"
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
import { 
  Star,
  Users,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Target,
  Award
} from "lucide-react"

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
  const [evaluations, setEvaluations] = useState<Evaluation[]>([])
  const [loading, setLoading] = useState(true)

  // Mock data for demonstration
  const mockEvaluations: Evaluation[] = [
    {
      id: "1",
      rfpTitle: "IT Managed Services 2024",
      vendorName: "Tech Solutions Inc",
      status: "in_progress",
      averageScore: 3.8,
      maxScore: 5,
      evaluatorCount: 2,
      requiredEvaluators: 3,
      deadline: "2024-12-20",
      submissions: [
        { id: "1", vendor: "Tech Solutions Inc", score: 3.8, status: "in_progress" },
        { id: "2", vendor: "Global IT Services", score: 4.2, status: "in_progress" },
        { id: "3", vendor: "Digital Dynamics", score: 3.5, status: "pending" }
      ]
    },
    {
      id: "2",
      rfpTitle: "Marketing Campaign Services",
      vendorName: "Creative Agency Pro",
      status: "pending",
      averageScore: 0,
      maxScore: 5,
      evaluatorCount: 0,
      requiredEvaluators: 2,
      deadline: "2024-12-25",
      submissions: [
        { id: "1", vendor: "Creative Agency Pro", score: 0, status: "pending" },
        { id: "2", vendor: "Marketing Masters", score: 0, status: "pending" }
      ]
    },
    {
      id: "3",
      rfpTitle: "Office Equipment Procurement",
      vendorName: "Office Supplies Co",
      status: "completed",
      averageScore: 4.1,
      maxScore: 5,
      evaluatorCount: 3,
      requiredEvaluators: 3,
      deadline: "2024-12-10",
      submissions: [
        { id: "1", vendor: "Office Supplies Co", score: 4.1, status: "completed" },
        { id: "2", vendor: "Business Essentials", score: 3.9, status: "completed" },
        { id: "3", vendor: "Workplace Solutions", score: 4.3, status: "completed" }
      ]
    }
  ]

  useEffect(() => {
    setTimeout(() => {
      setEvaluations(mockEvaluations)
      setLoading(false)
    }, 1000)
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800"
      case "in_progress":
        return "bg-blue-100 text-blue-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "finalized":
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getScoreColor = (score: number, maxScore: number) => {
    const percentage = (score / maxScore) * 100
    if (percentage >= 80) return "text-green-600"
    if (percentage >= 60) return "text-yellow-600"
    return "text-red-600"
  }

  const getScoreStars = (score: number, maxScore: number) => {
    const stars = []
    const filledStars = Math.round((score / maxScore) * 5)
    
    for (let i = 1; i <= 5; i++) {
      if (i <= filledStars) {
        stars.push(<Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />)
      } else {
        stars.push(<Star key={i} className="h-4 w-4 text-gray-300" />)
      }
    }
    
    return stars
  }

  if (loading) {
    return (
      <MainLayout title="Evaluation Dashboard">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading evaluation data...</div>
        </div>
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
                      <div className={`text-2xl font-bold ${getScoreColor(evaluation.averageScore, evaluation.maxScore)}`}>
                        {evaluation.averageScore.toFixed(1)}/{evaluation.maxScore}
                      </div>
                      <div className="flex mt-1">
                        {getScoreStars(evaluation.averageScore, evaluation.maxScore)}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium">Evaluator Progress</div>
                      <div className="mt-1">
                        <Progress 
                          value={(evaluation.evaluatorCount / evaluation.requiredEvaluators) * 100} 
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
                        {new Date(evaluation.deadline).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end">
                    <Button size="sm">Continue Evaluation</Button>
                  </div>
                </div>
              ))}
              
              {evaluations.filter(e => e.status === "in_progress").length === 0 && (
                <div className="text-center py-8">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No active evaluations at the moment.</p>
                </div>
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>RFP</TableHead>
                  <TableHead>Vendor</TableHead>
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
                        <span className={`font-medium ${getScoreColor(evaluation.averageScore, evaluation.maxScore)}`}>
                          {evaluation.averageScore.toFixed(1)}
                        </span>
                        <div className="flex">
                          {getScoreStars(evaluation.averageScore, evaluation.maxScore)}
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
                        {new Date(evaluation.deadline).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm">
                        {evaluation.status === "pending" ? "Start" : "View"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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
                      <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-bold text-yellow-800">#{index + 1}</span>
                      </div>
                      <div>
                        <div className="font-medium">{evaluation.vendorName}</div>
                        <div className="text-sm text-muted-foreground">{evaluation.rfpTitle}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-bold ${getScoreColor(evaluation.averageScore, evaluation.maxScore)}`}>
                        {evaluation.averageScore.toFixed(1)}/{evaluation.maxScore}
                      </div>
                      <div className="flex justify-end">
                        {getScoreStars(evaluation.averageScore, evaluation.maxScore)}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}