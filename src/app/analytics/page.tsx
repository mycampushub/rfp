"use client"

import { useState, useEffect } from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart
} from "recharts"
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Clock, 
  Users, 
  FileText,
  Target,
  Award,
  Calendar,
  Percent,
  AlertTriangle
} from "lucide-react"

interface AnalyticsData {
  rfpMetrics: {
    total: number
    published: number
    inEvaluation: number
    awarded: number
    avgCycleTime: number
  }
  vendorMetrics: {
    total: number
    active: number
    avgResponseRate: number
    topPerformers: Array<{
      name: string
      winRate: number
      avgScore: number
    }>
  }
  financialMetrics: {
    totalBudget: number
    totalAwarded: number
    savings: number
    avgAwardValue: number
  }
  timelineMetrics: {
    avgCreationToPublish: number
    avgPublishToAward: number
    avgEvaluationTime: number
  }
  monthlyData: Array<{
    month: string
    rfps: number
    awards: number
    budget: number
  }>
  categoryData: Array<{
    category: string
    count: number
    value: number
  }>
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        const response = await fetch('/api/analytics?type=full')
        if (response.ok) {
          const data = await response.json()
          setData(data)
        }
      } catch (error) {
        console.error('Error fetching analytics data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchAnalyticsData()
  }, [])

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

  if (loading) {
    return (
      <MainLayout title="Analytics & Reporting">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading analytics...</div>
        </div>
      </MainLayout>
    )
  }

  if (!data) {
    return (
      <MainLayout title="Analytics & Reporting">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">No analytics data available</div>
        </div>
      </MainLayout>
    )
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

        {/* Key Metrics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total RFPs</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.rfpMetrics.total}</div>
              <p className="text-xs text-muted-foreground">
                {data.rfpMetrics.published} published
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Award Rate</CardTitle>
              <Percent className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.round((data.rfpMetrics.awarded / data.rfpMetrics.total) * 100)}%
              </div>
              <p className="text-xs text-muted-foreground">
                {data.rfpMetrics.awarded} awarded
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Savings</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${(data.financialMetrics.savings / 1000000).toFixed(1)}M
              </div>
              <p className="text-xs text-muted-foreground">
                vs original budget
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Cycle Time</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.rfpMetrics.avgCycleTime} days</div>
              <p className="text-xs text-muted-foreground">
                from creation to award
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 1 */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Monthly Trends */}
          <Card>
            <CardHeader>
              <CardTitle>Monthly Trends</CardTitle>
              <CardDescription>RFPs and awards over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data.monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="rfps" stroke="#8884d8" strokeWidth={2} name="RFPs" />
                  <Line type="monotone" dataKey="awards" stroke="#82ca9d" strokeWidth={2} name="Awards" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Category Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>RFPs by Category</CardTitle>
              <CardDescription>Distribution across procurement categories</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={data.categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ category, count }) => `${category}: ${count}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {data.categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 2 */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Budget vs Awarded */}
          <Card>
            <CardHeader>
              <CardTitle>Budget vs Awarded</CardTitle>
              <CardDescription>Monthly budget allocation and actual awards</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`$${Number(value).toLocaleString()}`, "Amount"]} />
                  <Bar dataKey="budget" fill="#8884d8" name="Budget" />
                  <Bar dataKey="awards" fill="#82ca9d" name="Awarded" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Timeline Metrics */}
          <Card>
            <CardHeader>
              <CardTitle>Process Timelines</CardTitle>
              <CardDescription>Average time for each process stage</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <FileText className="h-4 w-4 text-blue-600" />
                    <span className="text-sm">Creation to Publish</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">{data.timelineMetrics.avgCreationToPublish} days</span>
                    {data.timelineMetrics.avgCreationToPublish > 10 && (
                      <AlertTriangle className="h-4 w-4 text-orange-500" />
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Target className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Evaluation Time</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">{data.timelineMetrics.avgEvaluationTime} days</span>
                    {data.timelineMetrics.avgEvaluationTime < 15 && (
                      <TrendingUp className="h-4 w-4 text-green-500" />
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Award className="h-4 w-4 text-purple-600" />
                    <span className="text-sm">Publish to Award</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">{data.timelineMetrics.avgPublishToAward} days</span>
                    {data.timelineMetrics.avgPublishToAward < 30 && (
                      <TrendingUp className="h-4 w-4 text-green-500" />
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Vendor Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Top Performing Vendors</CardTitle>
            <CardDescription>Vendor success rates and average scores</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.vendorMetrics.topPerformers.map((vendor, index) => (
                <div key={vendor.name} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold text-blue-800">{index + 1}</span>
                    </div>
                    <div>
                      <div className="font-medium">{vendor.name}</div>
                      <div className="text-sm text-muted-foreground">
                        Win Rate: {vendor.winRate}%
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{vendor.avgScore}/5.0</div>
                    <div className="text-sm text-muted-foreground">Avg Score</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Financial Summary */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Total Budget</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                ${(data.financialMetrics.totalBudget / 1000000).toFixed(1)}M
              </div>
              <p className="text-sm text-muted-foreground">
                Across all RFPs
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Total Awarded</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                ${(data.financialMetrics.totalAwarded / 1000000).toFixed(1)}M
              </div>
              <p className="text-sm text-muted-foreground">
                Final contract values
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Savings Achieved</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                ${(data.financialMetrics.savings / 1000000).toFixed(1)}M
              </div>
              <p className="text-sm text-muted-foreground">
                {Math.round((data.financialMetrics.savings / data.financialMetrics.totalBudget) * 100)}% savings rate
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  )
}