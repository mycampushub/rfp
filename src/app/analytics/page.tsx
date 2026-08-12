"use client"

import { useState, useEffect, useCallback } from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { EmptyState } from "@/components/shared/empty-state"
import { LoadingCards } from "@/components/shared/loading-table"
import { useCsvExport } from "@/hooks/use-csv-export"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
  Cell
} from "recharts"
import { TrendingUp, DollarSign, Clock, FileText, Target, Award, Percent, AlertTriangle, BarChart3, Download, Loader2, CalendarDays } from "lucide-react"

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
    budgetRemaining: number
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

type DateRange = 'all' | '7d' | '30d' | '90d' | 'custom'

const DATE_RANGE_OPTIONS: { value: DateRange; label: string }[] = [
  { value: 'all', label: 'All Time' },
  { value: '7d', label: '7 Days' },
  { value: '30d', label: '30 Days' },
  { value: '90d', label: '90 Days' },
]

function getDateFromRange(range: DateRange, customFrom?: string): Date | null {
  if (range === 'all') return null
  if (range === 'custom' && customFrom) return new Date(customFrom)
  const now = new Date()
  const days = range === '7d' ? 7 : range === '30d' ? 30 : 90
  const from = new Date(now)
  from.setDate(from.getDate() - days)
  from.setHours(0, 0, 0, 0)
  return from
}

function filterMonthlyData(data: AnalyticsData['monthlyData'], range: DateRange, customFrom?: string, customTo?: string): AnalyticsData['monthlyData'] {
  const from = range === 'custom' && customFrom ? new Date(customFrom) : getDateFromRange(range)
  const to = range === 'custom' && customTo ? new Date(customTo + 'T23:59:59') : new Date()
  if (!from) return data
  return data.filter(item => {
    const monthDate = new Date(item.month + '-01')
    return monthDate >= from && monthDate <= to
  })
}

export default function AnalyticsPage() {
  useEffect(() => { document.title = 'Analytics | RFP Platform' }, [])
  const { exportCsv, exporting } = useCsvExport()
  const [rawData, setRawData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState<DateRange>('all')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')

  const retryFetch = useCallback(async () => {
    setFetchError(null)
    setLoading(true)
    try {
      const response = await fetch('/api/analytics?type=full')
      if (!response.ok) throw new Error('Failed to fetch analytics')
      const data = await response.json()
      setRawData(data)
    } catch (error) {
      console.error('Error fetching analytics data:', error)
      setFetchError('Failed to load analytics data. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    retryFetch()
  }, [retryFetch])

  const filteredMonthlyData = rawData
    ? filterMonthlyData(rawData.monthlyData, dateRange, customFrom, customTo)
    : []

  const data = rawData
    ? {
        ...rawData,
        monthlyData: filteredMonthlyData,
      }
    : null

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

  const handleDateRangeChange = (range: DateRange) => {
    setDateRange(range)
    if (range !== 'custom') {
      setCustomFrom('')
      setCustomTo('')
    }
  }

  if (loading) {
    return (
      <MainLayout title="Analytics & Reporting">
        <LoadingCards count={4} />
      </MainLayout>
    )
  }

  if (!rawData) {
    return (
      <MainLayout title="Analytics & Reporting">
        {fetchError ? (
          <div className="flex flex-col items-center justify-center py-16 space-y-4">
            <AlertTriangle className="h-12 w-12 text-destructive" />
            <h2 className="text-lg font-semibold">Error Loading Analytics</h2>
            <p className="text-muted-foreground">{fetchError}</p>
            <Button onClick={retryFetch} variant="outline">Try Again</Button>
          </div>
        ) : (
          <EmptyState icon={BarChart3} title="No analytics data" description="Analytics will populate as you create and manage RFPs." />
        )}
      </MainLayout>
    )
  }

  if (!data) return null

  return (
    <MainLayout title="Analytics & Reporting">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">Analytics & Reporting</h1>
            <p className="text-muted-foreground">
              Comprehensive insights into your RFP performance and procurement metrics
            </p>
          </div>
          <Button
            variant="outline"
            disabled={exporting}
            onClick={() => {
              const date = new Date().toISOString().slice(0, 10)
              exportCsv('/api/export/analytics?format=csv', `analytics-report-${date}.csv`)
            }}
          >
            {exporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
            Export Report
          </Button>
        </div>

        {/* Date Range Filter */}
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground mr-1">Period:</span>
            {DATE_RANGE_OPTIONS.map(opt => (
              <Button
                key={opt.value}
                variant={dateRange === opt.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleDateRangeChange(opt.value)}
              >
                {opt.label}
              </Button>
            ))}
            <Button
              variant={dateRange === 'custom' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleDateRangeChange('custom')}
            >
              Custom
            </Button>
          </div>
          {dateRange === 'custom' && (
            <div className="flex flex-wrap items-center gap-2">
              <label className="text-sm text-muted-foreground">From:</label>
              <input
                type="date"
                value={customFrom}
                onChange={e => setCustomFrom(e.target.value)}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
              <label className="text-sm text-muted-foreground">To:</label>
              <input
                type="date"
                value={customTo}
                onChange={e => setCustomTo(e.target.value)}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
              {customFrom && customTo && (
                <span className="text-xs text-muted-foreground">
                  Showing {filteredMonthlyData.length} month{filteredMonthlyData.length !== 1 ? 's' : ''} of data
                </span>
              )}
            </div>
          )}
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
                {Math.round((data.rfpMetrics.awarded / (data.rfpMetrics.total || 1)) * 100)}%
              </div>
              <p className="text-xs text-muted-foreground">
                {data.rfpMetrics.awarded} awarded
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Budget Remaining</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${(data.financialMetrics.budgetRemaining / 1000000).toFixed(1)}M
              </div>
              <p className="text-xs text-muted-foreground">
                unallocated from total budget
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
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fill: 'currentColor', fontSize: 12 }} />
                  <YAxis tick={{ fill: 'currentColor', fontSize: 12 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="rfps" stroke="hsl(var(--primary))" strokeWidth={2} name="RFPs" />
                  <Line type="monotone" dataKey="awards" stroke="hsl(var(--chart-2, #10b981))" strokeWidth={2} name="Awards" />
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
                    fill="hsl(var(--primary))"
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
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fill: 'currentColor', fontSize: 12 }} />
                  <YAxis tick={{ fill: 'currentColor', fontSize: 12 }} />
                  <Tooltip formatter={(value) => [`$${Number(value).toLocaleString()}`, "Amount"]} />
                  <Bar dataKey="budget" fill="hsl(var(--primary))" name="Budget" />
                  <Bar dataKey="awards" fill="hsl(var(--chart-2, #10b981))" name="Awarded" />
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
                    <FileText className="h-4 w-4 text-sky-600 dark:text-sky-400" />
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
                    <Target className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-sm">Evaluation Time</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">{data.timelineMetrics.avgEvaluationTime} days</span>
                    {data.timelineMetrics.avgEvaluationTime < 15 && (
                      <TrendingUp className="h-4 w-4 text-emerald-500" />
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Award className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                    <span className="text-sm">Publish to Award</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">{data.timelineMetrics.avgPublishToAward} days</span>
                    {data.timelineMetrics.avgPublishToAward < 30 && (
                      <TrendingUp className="h-4 w-4 text-emerald-500" />
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
                    <div className="w-8 h-8 bg-sky-500/15 dark:bg-sky-500/25 rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold text-sky-700 dark:text-sky-300">{index + 1}</span>
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
              <CardTitle className="text-lg">Budget Remaining</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                ${(data.financialMetrics.budgetRemaining / 1000000).toFixed(1)}M
              </div>
              <p className="text-sm text-muted-foreground">
                {Math.round((data.financialMetrics.budgetRemaining / (data.financialMetrics.totalBudget || 1)) * 100)}% of total budget unallocated
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  )
}