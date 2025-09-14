"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
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
  TrendingUp, 
  TrendingDown, 
  Award, 
  Clock, 
  DollarSign,
  FileText,
  Star,
  Target,
  AlertTriangle,
  CheckCircle,
  Calendar,
  BarChart3,
  PieChart
} from "lucide-react"

interface PerformanceMetric {
  id: string
  name: string
  value: number
  target: number
  unit: string
  trend: "up" | "down" | "stable"
  change: number
}

interface Project {
  id: string
  name: string
  status: "completed" | "in_progress" | "on_hold" | "cancelled"
  startDate: string
  endDate?: string
  budget: number
  actualCost?: number
  score: number
  feedback: string
}

interface ComplianceItem {
  id: string
  type: "certification" | "audit" | "training" | "document"
  name: string
  status: "compliant" | "non_compliant" | "pending" | "expired"
  expiryDate?: string
  lastUpdated: string
}

interface VendorPerformanceProps {
  vendorId: string
}

export function VendorPerformance({ vendorId }: VendorPerformanceProps) {
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [compliance, setCompliance] = useState<ComplianceItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Mock data - in real app, this would come from API
    const mockMetrics: PerformanceMetric[] = [
      {
        id: "1",
        name: "On-Time Delivery",
        value: 92,
        target: 90,
        unit: "%",
        trend: "up",
        change: 5
      },
      {
        id: "2",
        name: "Budget Adherence",
        value: 88,
        target: 95,
        unit: "%",
        trend: "down",
        change: -3
      },
      {
        id: "3",
        name: "Quality Score",
        value: 94,
        target: 90,
        unit: "%",
        trend: "up",
        change: 2
      },
      {
        id: "4",
        name: "Response Time",
        value: 24,
        target: 48,
        unit: "hours",
        trend: "up",
        change: -12
      },
      {
        id: "5",
        name: "Customer Satisfaction",
        value: 4.6,
        target: 4.5,
        unit: "/5",
        trend: "stable",
        change: 0
      }
    ]

    const mockProjects: Project[] = [
      {
        id: "1",
        name: "IT Infrastructure Upgrade",
        status: "completed",
        startDate: "2024-01-15",
        endDate: "2024-03-30",
        budget: 250000,
        actualCost: 245000,
        score: 92,
        feedback: "Excellent work, delivered ahead of schedule"
      },
      {
        id: "2",
        name: "Security Assessment",
        status: "completed",
        startDate: "2024-02-01",
        endDate: "2024-02-28",
        budget: 50000,
        actualCost: 52000,
        score: 88,
        feedback: "Good quality, slight budget overrun"
      },
      {
        id: "3",
        name: "Cloud Migration",
        status: "in_progress",
        startDate: "2024-03-01",
        budget: 180000,
        score: 0,
        feedback: "In progress, on track"
      }
    ]

    const mockCompliance: ComplianceItem[] = [
      {
        id: "1",
        type: "certification",
        name: "ISO 27001",
        status: "compliant",
        expiryDate: "2025-12-31",
        lastUpdated: "2024-01-15"
      },
      {
        id: "2",
        type: "audit",
        name: "SOC 2 Type II",
        status: "compliant",
        expiryDate: "2024-12-31",
        lastUpdated: "2024-01-20"
      },
      {
        id: "3",
        type: "training",
        name: "Security Awareness Training",
        status: "pending",
        lastUpdated: "2024-01-10"
      },
      {
        id: "4",
        type: "document",
        name: "Business Continuity Plan",
        status: "non_compliant",
        lastUpdated: "2024-01-05"
      }
    ]

    setTimeout(() => {
      setMetrics(mockMetrics)
      setProjects(mockProjects)
      setCompliance(mockCompliance)
      setLoading(false)
    }, 1000)
  }, [vendorId])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
      case "compliant":
        return "bg-green-100 text-green-800"
      case "in_progress":
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "on_hold":
        return "bg-orange-100 text-orange-800"
      case "cancelled":
      case "non_compliant":
      case "expired":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
      case "compliant":
        return <CheckCircle className="h-4 w-4" />
      case "in_progress":
      case "pending":
        return <Clock className="h-4 w-4" />
      case "on_hold":
        return <AlertTriangle className="h-4 w-4" />
      case "cancelled":
      case "non_compliant":
      case "expired":
        return <AlertTriangle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up":
        return <TrendingUp className="h-4 w-4 text-green-600" />
      case "down":
        return <TrendingDown className="h-4 w-4 text-red-600" />
      default:
        return <Target className="h-4 w-4 text-gray-600" />
    }
  }

  const calculateOverallScore = () => {
    if (projects.length === 0) return 0
    const completedProjects = projects.filter(p => p.status === "completed")
    if (completedProjects.length === 0) return 0
    const totalScore = completedProjects.reduce((sum, p) => sum + p.score, 0)
    return Math.round(totalScore / completedProjects.length)
  }

  const calculateBudgetVariance = () => {
    const completedProjects = projects.filter(p => p.status === "completed" && p.actualCost)
    if (completedProjects.length === 0) return 0
    
    const totalBudget = completedProjects.reduce((sum, p) => sum + p.budget, 0)
    const totalActual = completedProjects.reduce((sum, p) => sum + (p.actualCost || 0), 0)
    
    return Math.round(((totalActual - totalBudget) / totalBudget) * 100)
  }

  const overallScore = calculateOverallScore()
  const budgetVariance = calculateBudgetVariance()

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-32 bg-gray-100 rounded-lg animate-pulse"></div>
        <div className="h-64 bg-gray-100 rounded-lg animate-pulse"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Overall Performance Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Score</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${
              overallScore >= 90 ? 'text-green-600' :
              overallScore >= 80 ? 'text-blue-600' :
              overallScore >= 70 ? 'text-yellow-600' :
              'text-red-600'
            }`}>
              {overallScore}%
            </div>
            <p className="text-xs text-muted-foreground">
              {overallScore >= 90 ? 'Excellent' :
               overallScore >= 80 ? 'Very Good' :
               overallScore >= 70 ? 'Good' : 'Needs Improvement'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Budget Variance</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${
              budgetVariance <= 5 ? 'text-green-600' :
              budgetVariance <= 10 ? 'text-yellow-600' :
              'text-red-600'
            }`}>
              {budgetVariance > 0 ? '+' : ''}{budgetVariance}%
            </div>
            <p className="text-xs text-muted-foreground">
              From budget baseline
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {projects.filter(p => p.status === "in_progress").length}
            </div>
            <p className="text-xs text-muted-foreground">
              Currently in progress
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compliance Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {Math.round((compliance.filter(c => c.status === "compliant").length / compliance.length) * 100)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Compliance items met
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="mr-2 h-5 w-5" />
            Key Performance Indicators
          </CardTitle>
          <CardDescription>
            Track vendor performance against targets
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {metrics.map((metric) => (
              <div key={metric.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">{metric.name}</span>
                    {getTrendIcon(metric.trend)}
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-muted-foreground">
                      Target: {metric.target}{metric.unit}
                    </span>
                    <Badge variant={metric.value >= metric.target ? "default" : "secondary"}>
                      {metric.value >= metric.target ? "Above Target" : "Below Target"}
                    </Badge>
                  </div>
                </div>
                <div className="space-y-1">
                  <Progress 
                    value={(metric.value / metric.target) * 100} 
                    className="h-2"
                  />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Current: {metric.value}{metric.unit}</span>
                    <span className={metric.trend === "up" ? "text-green-600" : metric.trend === "down" ? "text-red-600" : "text-gray-600"}>
                      {metric.change > 0 ? '+' : ''}{metric.change}{metric.unit}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Detailed Tabs */}
      <Tabs defaultValue="projects" className="space-y-4">
        <TabsList>
          <TabsTrigger value="projects">Project History</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="projects">
          <Card>
            <CardHeader>
              <CardTitle>Project History</CardTitle>
              <CardDescription>
                Historical performance on completed and ongoing projects
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Project</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Budget vs Actual</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Feedback</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projects.map((project) => {
                    const duration = project.endDate 
                      ? Math.ceil((new Date(project.endDate).getTime() - new Date(project.startDate).getTime()) / (1000 * 60 * 60 * 24))
                      : null
                    
                    const budgetVariance = project.actualCost 
                      ? Math.round(((project.actualCost - project.budget) / project.budget) * 100)
                      : null

                    return (
                      <TableRow key={project.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{project.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {new Date(project.startDate).toLocaleDateString()}
                              {project.endDate && ` - ${new Date(project.endDate).toLocaleDateString()}`}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(project.status)}>
                            <div className="flex items-center space-x-1">
                              {getStatusIcon(project.status)}
                              <span>{project.status.replace("_", " ")}</span>
                            </div>
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {duration ? `${duration} days` : "-"}
                        </TableCell>
                        <TableCell>
                          {budgetVariance !== null ? (
                            <div className="flex items-center space-x-2">
                              <span className={budgetVariance <= 5 ? 'text-green-600' : 'text-red-600'}>
                                {budgetVariance > 0 ? '+' : ''}{budgetVariance}%
                              </span>
                              <span className="text-sm text-muted-foreground">
                                (${project.budget?.toLocaleString()} vs ${project.actualCost?.toLocaleString()})
                              </span>
                            </div>
                          ) : "-"}
                        </TableCell>
                        <TableCell>
                          {project.score > 0 ? (
                            <div className="flex items-center space-x-2">
                              <div className={`font-bold ${
                                project.score >= 90 ? 'text-green-600' :
                                project.score >= 80 ? 'text-blue-600' :
                                project.score >= 70 ? 'text-yellow-600' :
                                'text-red-600'
                              }`}>
                                {project.score}%
                              </div>
                              <Star className="h-4 w-4 text-yellow-500 fill-current" />
                            </div>
                          ) : "-"}
                        </TableCell>
                        <TableCell className="max-w-xs">
                          <p className="text-sm truncate">{project.feedback}</p>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compliance">
          <Card>
            <CardHeader>
              <CardTitle>Compliance Status</CardTitle>
              <CardDescription>
                Track certifications, audits, and compliance requirements
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Expiry Date</TableHead>
                    <TableHead>Last Updated</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {compliance.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {item.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(item.status)}>
                          <div className="flex items-center space-x-1">
                            {getStatusIcon(item.status)}
                            <span>{item.status.replace("_", " ")}</span>
                          </div>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {item.expiryDate ? (
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4" />
                            <span>{new Date(item.expiryDate).toLocaleDateString()}</span>
                          </div>
                        ) : "-"}
                      </TableCell>
                      <TableCell>
                        {new Date(item.lastUpdated).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <PieChart className="mr-2 h-5 w-5" />
                  Project Status Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(
                    projects.reduce((acc, project) => {
                      acc[project.status] = (acc[project.status] || 0) + 1
                      return acc
                    }, {} as Record<string, number>)
                  ).map(([status, count]) => (
                    <div key={status} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(status)}
                        <span className="capitalize">{status.replace("_", " ")}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${(count / projects.length) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm text-muted-foreground">{count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="mr-2 h-5 w-5" />
                  Performance Trends
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">Quality Trend</div>
                      <div className="text-sm text-muted-foreground">Last 6 months</div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      <span className="text-green-600 font-medium">+8%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">Delivery Performance</div>
                      <div className="text-sm text-muted-foreground">Last 6 months</div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      <span className="text-green-600 font-medium">+5%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">Cost Efficiency</div>
                      <div className="text-sm text-muted-foreground">Last 6 months</div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <TrendingDown className="h-4 w-4 text-red-600" />
                      <span className="text-red-600 font-medium">-3%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}