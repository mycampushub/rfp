"use client"

import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TrendingUp, DollarSign, Users, FileText, BarChart3, PieChart, Target, Award, CheckCircle, AlertTriangle, Download, ArrowUpRight, ArrowDownRight, Globe, Briefcase } from "lucide-react"
import { useState, useEffect } from "react"
import { toast } from "sonner"
import { LoadingCards } from "@/components/shared/loading-table"
import { EmptyState } from "@/components/shared/empty-state"

export default function MarketplaceAnalytics() {
  useEffect(() => { document.title = 'Marketplace Analytics | RFP Platform' }, [])
  const [timeRange, setTimeRange] = useState("30d")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedRegion, setSelectedRegion] = useState("all")
  const [loading, setLoading] = useState(true)
  const [analyticsData, setAnalyticsData] = useState<any>(null)

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const res = await fetch(`/api/analytics?type=full&range=${timeRange}`)
        if (!res.ok) throw new Error("Failed to fetch")
        const data = await res.json()
        setAnalyticsData(data)
      } catch {
        toast.error("Failed to load analytics data")
      } finally {
        setLoading(false)
      }
    }
    fetchAnalytics()
  }, [timeRange])

  // Derive data from API response
  const overviewStats = analyticsData ? {
    totalRFPs: analyticsData.rfpMetrics?.total ?? 0,
    activeRFPs: analyticsData.rfpMetrics?.published ?? 0,
    totalVendors: analyticsData.vendorMetrics?.total ?? 0,
    activeVendors: analyticsData.vendorMetrics?.active ?? 0,
    totalValue: `$${((analyticsData.financialMetrics?.totalBudget ?? 0) / 1000000).toFixed(1)}M`,
    avgBidsPerRFP: 0,
    successRate: analyticsData.vendorMetrics?.avgResponseRate ?? 0,
    avgResponseTime: `${analyticsData.vendorMetrics?.avgResponseRate ?? 0}%`,
    marketGrowth: 0,
    newVendorsThisMonth: 0,
    vendorRetention: analyticsData.vendorMetrics?.avgResponseRate ?? 0,
    avgProjectValue: `$${((analyticsData.financialMetrics?.avgAwardValue ?? 0) / 1000).toFixed(0)}K`,
    completionRate: analyticsData.rfpMetrics?.awarded > 0
      ? Math.round((analyticsData.rfpMetrics.awarded / Math.max(analyticsData.rfpMetrics.total, 1)) * 100)
      : 0,
  } : null

  const performanceMetrics = analyticsData ? [
    { 
      metric: "Total RFPs", 
      value: analyticsData.rfpMetrics?.total ?? 0, 
      target: 0, 
      status: "good", 
      trend: "up", 
      change: 0,
      description: "Total RFPs in the system"
    },
    { 
      metric: "Published RFPs", 
      value: analyticsData.rfpMetrics?.published ?? 0, 
      target: 0, 
      status: "good", 
      trend: "up",
      change: 0,
      description: "RFPs currently published"
    },
    { 
      metric: "Awarded RFPs", 
      value: analyticsData.rfpMetrics?.awarded ?? 0, 
      target: 0, 
      status: "good", 
      trend: "up",
      change: 0,
      description: "RFPs that have been awarded"
    },
    { 
      metric: "Avg Cycle Time", 
      value: `${analyticsData.rfpMetrics?.avgCycleTime ?? 0} days`, 
      target: "30 days", 
      status: "good", 
      trend: "stable",
      change: 0,
      description: "Average days from creation to award"
    },
    { 
      metric: "Active Vendors", 
      value: analyticsData.vendorMetrics?.active ?? 0, 
      target: 0, 
      status: "good", 
      trend: "up",
      change: 0,
      description: "Currently active vendors"
    },
    { 
      metric: "Response Rate", 
      value: `${analyticsData.vendorMetrics?.avgResponseRate ?? 0}%`, 
      target: "80%", 
      status: "good", 
      trend: "up",
      change: 0,
      description: "Average vendor response rate"
    }
  ] : []

  const revenueAnalytics = analyticsData?.monthlyData?.map((m: any) => ({
    month: m.month,
    revenue: m.budget,
    bids: m.rfps,
    wins: m.awards,
    avgValue: m.rfps > 0 ? Math.round(m.budget / m.rfps) : 0,
  })) ?? []

  const categoryPerformance = analyticsData?.categoryData?.map((c: any) => ({
    name: c.category,
    bids: c.count,
    wins: 0,
    winRate: 0,
    avgValue: c.value,
    revenue: c.value,
    growth: 0,
    topSkill: "",
    satisfaction: 0,
  })) ?? []

  const competitorAnalysis = analyticsData?.vendorMetrics?.topPerformers?.map((v: any) => ({
    name: v.name,
    marketShare: 0,
    bids: 0,
    wins: 0,
    winRate: v.winRate,
    avgValue: 0,
    strengths: [],
    weaknesses: [],
  })) ?? []

  const marketTrends: any[] = []
  const clientInsights: any[] = []

  const getGrowthColor = (growth: number) => {
    return growth >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
  }

  const getGrowthIcon = (growth: number) => {
    return growth >= 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      "excellent": "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
      "good": "bg-sky-500/15 text-sky-700 dark:text-sky-400",
      "below": "bg-amber-500/15 text-amber-700 dark:text-amber-400",
      "poor": "bg-red-500/15 text-red-700 dark:text-red-400"
    }
    return colors[status] || "bg-muted text-muted-foreground"
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "excellent":
        return <Award className="h-4 w-4" />
      case "good":
        return <CheckCircle className="h-4 w-4" />
      case "below":
        return <AlertTriangle className="h-4 w-4" />
      default:
        return <AlertTriangle className="h-4 w-4" />
    }
  }

  if (loading) {
    return (
      <MainLayout title="Vendor Analytics Dashboard">
        <div className="space-y-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold">Vendor Analytics Dashboard</h1>
              <p className="text-muted-foreground mt-1">Loading...</p>
            </div>
          </div>
          <LoadingCards count={4} />
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-lg border p-6"><div className="h-48 bg-muted rounded animate-pulse" /></div>
            <div className="rounded-lg border p-6"><div className="h-48 bg-muted rounded animate-pulse" /></div>
          </div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout title="Vendor Analytics Dashboard">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">Vendor Analytics Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Comprehensive insights into your vendor performance and market opportunities
            </p>
          </div>
          <div className="flex space-x-2">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="1y">Last year</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={async () => {
              try {
                const res = await fetch(`/api/analytics?type=full&range=${timeRange}`)
                if (!res.ok) throw new Error()
                const data = await res.json()
                const rows: string[][] = []
                rows.push(['Metric', 'Value'])
                if (data.rfpMetrics) {
                  rows.push(['Total RFPs', String(data.rfpMetrics.total ?? 0)])
                  rows.push(['Published RFPs', String(data.rfpMetrics.published ?? 0)])
                  rows.push(['Awarded RFPs', String(data.rfpMetrics.awarded ?? 0)])
                  rows.push(['Avg Cycle Time (days)', String(data.rfpMetrics.avgCycleTime ?? 0)])
                }
                if (data.vendorMetrics) {
                  rows.push(['Total Vendors', String(data.vendorMetrics.total ?? 0)])
                  rows.push(['Active Vendors', String(data.vendorMetrics.active ?? 0)])
                  rows.push(['Avg Response Rate', String(data.vendorMetrics.avgResponseRate ?? 0) + '%'])
                }
                if (data.financialMetrics) {
                  rows.push(['Total Budget', String(data.financialMetrics.totalBudget ?? 0)])
                  rows.push(['Avg Award Value', String(data.financialMetrics.avgAwardValue ?? 0)])
                }
                if (data.monthlyData) {
                  rows.push([])
                  rows.push(['Month', 'RFPs', 'Budget', 'Awards'])
                  data.monthlyData.forEach((m: any) => {
                    rows.push([m.month, String(m.rfps ?? 0), String(m.budget ?? 0), String(m.awards ?? 0)])
                  })
                }
                const csvContent = rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n')
                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
                const url = URL.createObjectURL(blob)
                const link = document.createElement('a')
                link.href = url
                link.download = 'marketplace-analytics.csv'
                link.click()
                URL.revokeObjectURL(url)
                toast.success('Report exported successfully')
              } catch {
                toast.error('Failed to export report')
              }
            }}>
              <Download className="mr-2 h-4 w-4" />
              Export Report
            </Button>
          </div>
        </div>

        {/* Overview Stats */}
 {overviewStats && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold">{overviewStats.totalRFPs}</div>
                    <div className="text-sm text-muted-foreground">Total RFPs</div>
                    <div className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center">
                      <ArrowUpRight className="h-3 w-3 mr-1" />
                      {overviewStats.activeRFPs} active
                    </div>
                  </div>
                  <FileText className="h-8 w-8 text-sky-600 dark:text-sky-400" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold">{overviewStats.successRate}%</div>
                    <div className="text-sm text-muted-foreground">Response Rate</div>
                    <div className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center">
                      <ArrowUpRight className="h-3 w-3 mr-1" />
                      Vendor engagement
                    </div>
                  </div>
                  <Target className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold">{overviewStats.totalValue}</div>
                    <div className="text-sm text-muted-foreground">Total Budget</div>
                    <div className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center">
                      <ArrowUpRight className="h-3 w-3 mr-1" />
                      Across all RFPs
                    </div>
                  </div>
                  <DollarSign className="h-8 w-8 text-violet-600 dark:text-violet-400" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold">{overviewStats.avgProjectValue}</div>
                    <div className="text-sm text-muted-foreground">Avg Award Value</div>
                    <div className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center">
                      <ArrowUpRight className="h-3 w-3 mr-1" />
                      Per project
                    </div>
                  </div>
                  <TrendingUp className="h-8 w-8 text-orange-600 dark:text-orange-400" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Content Tabs */}
        <Tabs defaultValue="performance" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="revenue">Revenue</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="competitors">Competitors</TabsTrigger>
            <TabsTrigger value="trends">Market Trends</TabsTrigger>
            <TabsTrigger value="clients">Client Insights</TabsTrigger>
          </TabsList>

          <TabsContent value="performance" className="space-y-6">
            {/* Key Performance Metrics */}
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart3 className="mr-2 h-5 w-5" />
                    Performance Metrics
                  </CardTitle>
                  <CardDescription>
                    Your vendor performance against targets
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {performanceMetrics.map((metric, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="flex-1">
                            <div className="font-medium">{metric.metric}</div>
                            <div className="text-xs text-muted-foreground">{metric.description}</div>
                          </div>
                          <Badge className={getStatusColor(metric.status)}>
                            {getStatusIcon(metric.status)}
                            <span className="ml-1 capitalize">{metric.status}</span>
                          </Badge>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{metric.value}</div>
                          <div className="text-xs text-muted-foreground">Target: {metric.target}</div>
                          {metric.change !== 0 && (
                            <div className={`text-xs flex items-center justify-end ${getGrowthColor(metric.change > 0 ? metric.change : -metric.change)}`}>
                              {getGrowthIcon(metric.change > 0 ? metric.change : -metric.change)}
                              {Math.abs(metric.change)}%
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Market Position */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Globe className="mr-2 h-5 w-5" />
                    Market Position
                  </CardTitle>
                  <CardDescription>
                    Your position in the marketplace
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {overviewStats ? (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Total Vendors</span>
                        <span className="font-medium">{overviewStats.totalVendors}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Active Vendors</span>
                        <span className="font-medium text-emerald-600 dark:text-emerald-400">{overviewStats.activeVendors}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Vendor Response Rate</span>
                        <span className="font-medium text-emerald-600 dark:text-emerald-400">{overviewStats.vendorRetention}%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Completion Rate</span>
                        <span className="font-medium text-emerald-600 dark:text-emerald-400">{overviewStats.completionRate}%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Avg Cycle Time</span>
                        <span className="font-medium">{analyticsData?.rfpMetrics?.avgCycleTime ?? 0} days</span>
                      </div>
                    </>
                  ) : (
                    <EmptyState icon={BarChart3} title="No marketplace analytics" description="Marketplace analytics will populate as vendors and RFPs are added." />
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="revenue" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <DollarSign className="mr-2 h-5 w-5" />
                  Revenue Analytics
                </CardTitle>
                <CardDescription>
                  Monthly revenue and bidding performance
                </CardDescription>
              </CardHeader>
              <CardContent>
                {revenueAnalytics.length > 0 ? (
                  <div className="space-y-4">
                    {revenueAnalytics.map((month, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className="font-medium">{month.month}</div>
                          <div className="flex items-center space-x-6 text-sm">
                            <span className="flex items-center">
                              <Target className="mr-1 h-3 w-3" />
                              {month.bids} RFPs
                            </span>
                            <span className="flex items-center">
                              <Award className="mr-1 h-3 w-3" />
                              {month.wins} awards
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-6 text-right">
                          <div>
                            <div className="font-medium">${month.revenue.toLocaleString()}</div>
                            <div className="text-xs text-muted-foreground">Budget</div>
                          </div>
                          <div>
                            <div className="font-medium">${month.avgValue.toLocaleString()}</div>
                            <div className="text-xs text-muted-foreground">Avg Value</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">No revenue data available</h3>
                    <p className="text-muted-foreground">Revenue data will appear as RFPs are created and awarded.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="categories" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <PieChart className="mr-2 h-5 w-5" />
                  Category Performance
                </CardTitle>
                <CardDescription>
                  Performance breakdown by service category
                </CardDescription>
              </CardHeader>
              <CardContent>
                {categoryPerformance.length > 0 ? (
                  <div className="space-y-4">
                    {categoryPerformance.map((category, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className="flex-1">
                            <div className="font-medium">{category.name}</div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-6 text-sm">
                          <div className="text-center">
                            <div className="font-medium">{category.bids}</div>
                            <div className="text-xs text-muted-foreground">RFPs</div>
                          </div>
                          <div className="text-center">
                            <div className="font-medium">${category.avgValue.toLocaleString()}</div>
                            <div className="text-xs text-muted-foreground">Total Value</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <PieChart className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">No category data available</h3>
                    <p className="text-muted-foreground">Category data will appear as RFPs with categories are created.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="competitors" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="mr-2 h-5 w-5" />
                  Top Performing Vendors
                </CardTitle>
                <CardDescription>
                  Vendor performance rankings
                </CardDescription>
              </CardHeader>
              <CardContent>
                {competitorAnalysis.length > 0 ? (
                  <div className="space-y-4">
                    {competitorAnalysis.map((vendor, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className="flex-1">
                            <div className="font-medium">{vendor.name}</div>
                          </div>
                          <div className="text-center">
                            <div className="font-medium">{vendor.winRate}%</div>
                            <div className="text-xs text-muted-foreground">Win Rate</div>
                          </div>
                          <div className="text-center">
                            <div className="font-medium">{vendor.avgValue > 0 ? (vendor.avgValue / 1000).toFixed(1) + 'K' : 'N/A'}</div>
                            <div className="text-xs text-muted-foreground">Avg Score</div>
                          </div>
                          </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">No vendor ranking data available</h3>
                    <p className="text-muted-foreground">Vendor performance data will appear as submissions are evaluated.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="trends" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="mr-2 h-5 w-5" />
                  Market Trends
                </CardTitle>
                <CardDescription>
                  Emerging trends and opportunities in the market
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <TrendingUp className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No trend data available</h3>
                  <p className="text-muted-foreground">Market trend analysis requires more data to generate insights.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="clients" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Briefcase className="mr-2 h-5 w-5" />
                  Client Insights
                </CardTitle>
                <CardDescription>
                  Industry-specific client behavior and preferences
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Briefcase className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No client insight data available</h3>
                  <p className="text-muted-foreground">Client insights require more historical data to generate patterns.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  )
}