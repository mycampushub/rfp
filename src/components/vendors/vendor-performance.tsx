"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
import { TrendingUp, TrendingDown, Clock, DollarSign, FileText, Star, Target, AlertTriangle, CheckCircle, Calendar, BarChart3, PieChart } from "lucide-react"
import { formatDate } from "@/lib/utils"

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
    async function fetchData() {
      try {
        const [vendorRes, submissionsRes] = await Promise.all([
          fetch(`/api/vendors/${vendorId}`),
          fetch(`/api/submissions?vendorId=${vendorId}`),
        ])

        if (!vendorRes.ok) throw new Error('Failed to fetch vendor')
        if (!submissionsRes.ok) throw new Error('Failed to fetch submissions')

        const vendor = await vendorRes.json()
        const submissions = await submissionsRes.json() as Array<{
          id: string
          rfp: { id: string; title: string; status: string; closeAt: string | null; budget: number | null }
          status: string
          createdAt: string
          submittedAt: string | null
          scorePercentage: number
        }>

        // Derive metrics from vendor data
        const vendorRating = vendor.rating || 0
        const awardedCount = submissions.filter(s => s.status === 'awarded').length
        const derivedMetrics: PerformanceMetric[] = [
          { id: "1", name: "Vendor Rating", value: vendorRating * 20, target: 80, unit: "%", trend: vendorRating >= 4 ? "up" : "stable", change: 0 },
          { id: "2", name: "Response Count", value: vendor._count?.submissions || 0, target: 5, unit: "", trend: "stable", change: 0 },
          { id: "3", name: "Invitations Received", value: vendor._count?.invitations || 0, target: 10, unit: "", trend: "stable", change: 0 },
          { id: "4", name: "Win Rate", value: awardedCount, target: Math.max(vendor._count?.submissions || 1, 1), unit: "", trend: awardedCount > 0 ? "up" : "stable", change: 0 },
        ]

        // Map submissions to Project interface
        const projectMap: Record<string, string> = {
          awarded: 'completed',
          submitted: 'in_progress',
          reviewed: 'in_progress',
          rejected: 'cancelled',
          draft: 'on_hold',
        }

        const projects: Project[] = submissions.map(sub => ({
          id: sub.id,
          name: sub.rfp.title || 'Untitled RFP',
          status: (projectMap[sub.status] || 'on_hold') as Project['status'],
          startDate: sub.createdAt,
          endDate: sub.rfp.closeAt ?? undefined,
          budget: sub.rfp.budget ?? 0,
          score: Math.round(sub.scorePercentage || 0),
          feedback: sub.status === 'awarded' ? 'Contract awarded' : sub.status === 'rejected' ? 'Not selected' : '',
        }))

        // Derive compliance from vendor certifications
        const certs = (vendor.certifications || []) as string[]
        const compliance: ComplianceItem[] = certs.map((cert, idx) => ({
          id: `cert-${idx}`,
          type: "certification" as const,
          name: cert,
          status: "compliant" as const,
          lastUpdated: vendor.updatedAt || new Date().toISOString(),
        }))

        setMetrics(derivedMetrics)
        setProjects(projects)
        setCompliance(compliance)
      } catch (err) { console.error("Failed to fetch vendor performance data:", err); setMetrics([])
        setProjects([])
        setCompliance([]) } finally {
        setLoading(false)
      }
    }
    if (vendorId) fetchData()
    else { setLoading(false) }
  }, [vendorId])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
      case "compliant":
        return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
      case "in_progress":
      case "pending":
        return "bg-amber-500/15 text-amber-700 dark:text-amber-400"
      case "on_hold":
        return "bg-orange-500/15 text-orange-700 dark:text-orange-400"
      case "cancelled":
      case "non_compliant":
      case "expired":
        return "bg-red-500/15 text-red-700 dark:text-red-400"
      default:
        return "bg-muted text-muted-foreground"
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
        return <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
      case "down":
        return <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
      default:
        return <Target className="h-4 w-4 text-muted-foreground" />
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
        <div className="h-32 bg-muted rounded-lg animate-pulse"></div>
        <div className="h-64 bg-muted rounded-lg animate-pulse"></div>
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
              overallScore >= 90 ? 'text-emerald-600 dark:text-emerald-400' :
              overallScore >= 80 ? 'text-sky-600 dark:text-sky-400' :
              overallScore >= 70 ? 'text-amber-600 dark:text-amber-400' :
              'text-red-600 dark:text-red-400'
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
              budgetVariance <= 5 ? 'text-emerald-600 dark:text-emerald-400' :
              budgetVariance <= 10 ? 'text-amber-600 dark:text-amber-400' :
              'text-red-600 dark:text-red-400'
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
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
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
                    <span className={metric.trend === "up" ? "text-emerald-600 dark:text-emerald-400" : metric.trend === "down" ? "text-red-600 dark:text-red-400" : "text-muted-foreground"}>
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
                              {formatDate(project.startDate)}
                              {project.endDate && ` - ${formatDate(project.endDate)}`}
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
                              <span className={budgetVariance <= 5 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}>
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
                                project.score >= 90 ? 'text-emerald-600 dark:text-emerald-400' :
                                project.score >= 80 ? 'text-sky-600 dark:text-sky-400' :
                                project.score >= 70 ? 'text-amber-600 dark:text-amber-400' :
                                'text-red-600 dark:text-red-400'
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
                            <span>{formatDate(item.expiryDate)}</span>
                          </div>
                        ) : "-"}
                      </TableCell>
                      <TableCell>
                        {formatDate(item.lastUpdated)}
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
                        <div className="w-20 bg-muted-foreground/20 rounded-full h-2">
                          <div 
                            className="bg-sky-500 h-2 rounded-full"
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
                      <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-emerald-600 dark:text-emerald-400 font-medium">+8%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">Delivery Performance</div>
                      <div className="text-sm text-muted-foreground">Last 6 months</div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-emerald-600 dark:text-emerald-400 font-medium">+5%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">Cost Efficiency</div>
                      <div className="text-sm text-muted-foreground">Last 6 months</div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
                      <span className="text-red-600 dark:text-red-400 font-medium">-3%</span>
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