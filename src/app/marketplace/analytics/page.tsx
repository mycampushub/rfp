"use client"

import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  TrendingUp, 
  DollarSign, 
  Users, 
  FileText, 
  Star,
  Eye,
  Calendar,
  BarChart3,
  PieChart,
  Target,
  Award,
  Clock,
  CheckCircle,
  AlertTriangle,
  Download,
  Filter,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Globe,
  MapPin,
  Phone,
  Mail,
  Building,
  Briefcase,
  TrendingDown,
  Zap,
  Shield,
  ThumbsUp,
  MessageSquare
} from "lucide-react"
import { useState } from "react"

export default function MarketplaceAnalytics() {
  const [timeRange, setTimeRange] = useState("30d")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedRegion, setSelectedRegion] = useState("all")

  // Enhanced mock data for vendor analytics
  const overviewStats = {
    totalRFPs: 1247,
    activeRFPs: 156,
    totalVendors: 2847,
    activeVendors: 892,
    totalValue: "$12.5M",
    avgBidsPerRFP: 8.4,
    successRate: 94,
    avgResponseTime: "2.3 hours",
    marketGrowth: 12.5,
    newVendorsThisMonth: 145,
    vendorRetention: 87.3,
    avgProjectValue: "$45,000",
    completionRate: 96.2
  }

  const performanceMetrics = [
    { 
      metric: "Bid Success Rate", 
      value: 34, 
      target: 40, 
      status: "below", 
      trend: "up", 
      change: 2.3,
      description: "Percentage of bids that result in awards"
    },
    { 
      metric: "Average Response Time", 
      value: "2.3h", 
      target: "2h", 
      status: "below", 
      trend: "down",
      change: -0.5,
      description: "Average time to respond to RFP invitations"
    },
    { 
      metric: "Profile Completion", 
      value: 92, 
      target: 100, 
      status: "good", 
      trend: "up",
      change: 5.2,
      description: "Completeness of vendor profile information"
    },
    { 
      metric: "Client Satisfaction", 
      value: 4.7, 
      target: 4.5, 
      status: "excellent", 
      trend: "up",
      change: 0.3,
      description: "Average client rating across all projects"
    },
    { 
      metric: "Repeat Business", 
      value: 78, 
      target: 70, 
      status: "excellent", 
      trend: "up",
      change: 8.1,
      description: "Percentage of clients who return for additional projects"
    },
    { 
      metric: "On-Time Delivery", 
      value: 94, 
      target: 95, 
      status: "good", 
      trend: "stable",
      change: 0,
      description: "Percentage of projects delivered on or before deadline"
    }
  ]

  const revenueAnalytics = [
    { month: "Jul", revenue: 85000, bids: 67, wins: 23, avgValue: 3696 },
    { month: "Aug", revenue: 92000, bids: 72, wins: 26, avgValue: 3538 },
    { month: "Sep", revenue: 108000, bids: 85, wins: 31, avgValue: 3484 },
    { month: "Oct", revenue: 125000, bids: 94, wins: 36, avgValue: 3472 },
    { month: "Nov", revenue: 142000, bids: 103, wins: 42, avgValue: 3381 },
    { month: "Dec", revenue: 165000, bids: 118, wins: 48, avgValue: 3438 }
  ]

  const categoryPerformance = [
    { 
      name: "IT Services", 
      bids: 234, 
      wins: 78, 
      winRate: 33.3, 
      avgValue: 52000, 
      revenue: 4056000,
      growth: 15.2,
      topSkill: "Cloud Migration",
      satisfaction: 4.8
    },
    { 
      name: "Software Development", 
      bids: 189, 
      wins: 71, 
      winRate: 37.6, 
      avgValue: 48000, 
      revenue: 3408000,
      growth: 22.1,
      topSkill: "Web Development",
      satisfaction: 4.7
    },
    { 
      name: "Marketing", 
      bids: 156, 
      wins: 52, 
      winRate: 33.3, 
      avgValue: 35000, 
      revenue: 1820000,
      growth: 8.7,
      topSkill: "Digital Marketing",
      satisfaction: 4.6
    },
    { 
      name: "Consulting", 
      bids: 98, 
      wins: 34, 
      winRate: 34.7, 
      avgValue: 42000, 
      revenue: 1428000,
      growth: 12.3,
      topSkill: "Business Strategy",
      satisfaction: 4.9
    },
    { 
      name: "Design", 
      bids: 87, 
      wins: 28, 
      winRate: 32.2, 
      avgValue: 28000, 
      revenue: 784000,
      growth: 18.9,
      topSkill: "UI/UX Design",
      satisfaction: 4.7
    }
  ]

  const competitorAnalysis = [
    { 
      name: "TechSolutions Pro", 
      marketShare: 15.2, 
      bids: 267, 
      wins: 89, 
      winRate: 33.3, 
      avgValue: 55000,
      strengths: ["Cloud Services", "Enterprise Solutions"],
      weaknesses: ["Higher Pricing", "Limited Small Projects"]
    },
    { 
      name: "Marketing Masters", 
      marketShare: 12.8, 
      bids: 198, 
      wins: 78, 
      winRate: 39.4, 
      avgValue: 38000,
      strengths: ["Creative Strategy", "Brand Building"],
      weaknesses: ["Technical Skills", "Data Analytics"]
    },
    { 
      name: "BuildRight Construction", 
      marketShare: 10.5, 
      bids: 145, 
      wins: 56, 
      winRate: 38.6, 
      avgValue: 75000,
      strengths: ["Large Projects", "Commercial Construction"],
      weaknesses: ["Small Projects", "Residential Work"]
    },
    { 
      name: "Data Insights Consulting", 
      marketShare: 8.9, 
      bids: 124, 
      wins: 41, 
      winRate: 33.1, 
      avgValue: 45000,
      strengths: ["Data Analytics", "Business Intelligence"],
      weaknesses: ["Creative Services", "Marketing"]
    }
  ]

  const marketTrends = [
    {
      trend: "Increased Demand for AI/ML Services",
      impact: "High",
      growth: 45.2,
      description: "Growing need for artificial intelligence and machine learning expertise",
      opportunity: "High",
      timeframe: "Next 6-12 months"
    },
    {
      trend: "Remote Work Solutions",
      impact: "Medium",
      growth: 28.7,
      description: "Continued demand for remote collaboration and digital transformation",
      opportunity: "Medium",
      timeframe: "Ongoing"
    },
    {
      trend: "Sustainability Consulting",
      impact: "Medium",
      growth: 35.1,
      description: "Increasing focus on environmental and sustainability consulting",
      opportunity: "High",
      timeframe: "Next 12-18 months"
    },
    {
      trend: "Cybersecurity Services",
      impact: "High",
      growth: 52.3,
      description: "Rising demand for cybersecurity and data protection services",
      opportunity: "Very High",
      timeframe: "Immediate"
    }
  ]

  const clientInsights = [
    {
      industry: "Technology",
      avgProjectValue: 65000,
      projectCount: 45,
      satisfaction: 4.8,
      repeatRate: 82,
      topNeeds: ["Cloud Migration", "Software Development", "DevOps"]
    },
    {
      industry: "Healthcare",
      avgProjectValue: 85000,
      projectCount: 32,
      satisfaction: 4.6,
      repeatRate: 78,
      topNeeds: ["Data Security", "Compliance", "System Integration"]
    },
    {
      industry: "Finance",
      avgProjectValue: 95000,
      projectCount: 28,
      satisfaction: 4.9,
      repeatRate: 85,
      topNeeds: ["Security Audits", "Compliance", "Risk Management"]
    },
    {
      industry: "Retail",
      avgProjectValue: 42000,
      projectCount: 38,
      satisfaction: 4.5,
      repeatRate: 73,
      topNeeds: ["E-commerce", "Digital Marketing", "Mobile Apps"]
    }
  ]

  const getGrowthColor = (growth: number) => {
    return growth >= 0 ? "text-green-600" : "text-red-600"
  }

  const getGrowthIcon = (growth: number) => {
    return growth >= 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />
  }

  const getStatusColor = (status: string) => {
    const colors = {
      "excellent": "bg-green-100 text-green-800",
      "good": "bg-blue-100 text-blue-800",
      "below": "bg-yellow-100 text-yellow-800",
      "poor": "bg-red-100 text-red-800"
    }
    return colors[status as keyof typeof colors] || "bg-gray-100 text-gray-800"
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

  const getImpactColor = (impact: string) => {
    const colors = {
      "High": "bg-red-100 text-red-800",
      "Medium": "bg-yellow-100 text-yellow-800",
      "Low": "bg-green-100 text-green-800"
    }
    return colors[impact as keyof typeof colors] || "bg-gray-100 text-gray-800"
  }

  const getOpportunityColor = (opportunity: string) => {
    const colors = {
      "Very High": "bg-purple-100 text-purple-800",
      "High": "bg-blue-100 text-blue-800",
      "Medium": "bg-yellow-100 text-yellow-800",
      "Low": "bg-gray-100 text-gray-800"
    }
    return colors[opportunity as keyof typeof colors] || "bg-gray-100 text-gray-800"
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
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export Report
            </Button>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold">{overviewStats.totalRFPs}</div>
                  <div className="text-sm text-muted-foreground">Total RFPs</div>
                  <div className="text-xs text-green-600 flex items-center">
                    <ArrowUpRight className="h-3 w-3 mr-1" />
                    {overviewStats.activeRFPs} active
                  </div>
                </div>
                <FileText className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold">{overviewStats.successRate}%</div>
                  <div className="text-sm text-muted-foreground">Success Rate</div>
                  <div className="text-xs text-green-600 flex items-center">
                    <ArrowUpRight className="h-3 w-3 mr-1" />
                    +2.3% vs last period
                  </div>
                </div>
                <Target className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold">${(parseInt(overviewStats.totalValue.replace(/[$M]/g, '')) * 1000000).toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground">Total Revenue</div>
                  <div className="text-xs text-green-600 flex items-center">
                    <ArrowUpRight className="h-3 w-3 mr-1" />
                    +{overviewStats.marketGrowth}% growth
                  </div>
                </div>
                <DollarSign className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold">{overviewStats.avgProjectValue}</div>
                  <div className="text-sm text-muted-foreground">Avg Project Value</div>
                  <div className="text-xs text-green-600 flex items-center">
                    <ArrowUpRight className="h-3 w-3 mr-1" />
                    +5.2% increase
                  </div>
                </div>
                <TrendingUp className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

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
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Market Share</span>
                    <span className="font-medium">8.5%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Market Rank</span>
                    <span className="font-medium">#12</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Vendor Retention</span>
                    <span className="font-medium text-green-600">{overviewStats.vendorRetention}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">New Vendors (Monthly)</span>
                    <span className="font-medium">{overviewStats.newVendorsThisMonth}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Completion Rate</span>
                    <span className="font-medium text-green-600">{overviewStats.completionRate}%</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="revenue" className="space-y-6">
            {/* Revenue Analytics */}
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
                <div className="space-y-4">
                  {revenueAnalytics.map((month, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="font-medium">{month.month}</div>
                        <div className="flex items-center space-x-6 text-sm">
                          <span className="flex items-center">
                            <Target className="mr-1 h-3 w-3" />
                            {month.bids} bids
                          </span>
                          <span className="flex items-center">
                            <Award className="mr-1 h-3 w-3" />
                            {month.wins} wins
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-6 text-right">
                        <div>
                          <div className="font-medium">${month.revenue.toLocaleString()}</div>
                          <div className="text-xs text-muted-foreground">Revenue</div>
                        </div>
                        <div>
                          <div className="font-medium">${month.avgValue.toLocaleString()}</div>
                          <div className="text-xs text-muted-foreground">Avg Value</div>
                        </div>
                        <div>
                          <div className="font-medium">{((month.wins / month.bids) * 100).toFixed(1)}%</div>
                          <div className="text-xs text-muted-foreground">Win Rate</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="categories" className="space-y-6">
            {/* Category Performance */}
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
                <div className="space-y-4">
                  {categoryPerformance.map((category, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="flex-1">
                          <div className="font-medium">{category.name}</div>
                          <div className="text-xs text-muted-foreground">Top: {category.topSkill}</div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Star className="h-4 w-4 text-yellow-500" />
                          <span className="text-sm">{category.satisfaction}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-6 text-sm">
                        <div className="text-center">
                          <div className="font-medium">{category.bids}</div>
                          <div className="text-xs text-muted-foreground">Bids</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium">{category.wins}</div>
                          <div className="text-xs text-muted-foreground">Wins</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium">{category.winRate}%</div>
                          <div className="text-xs text-muted-foreground">Win Rate</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium">${category.avgValue.toLocaleString()}</div>
                          <div className="text-xs text-muted-foreground">Avg Value</div>
                        </div>
                        <div className={`text-center font-medium ${getGrowthColor(category.growth)}`}>
                          {getGrowthIcon(category.growth)}
                          {category.growth}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="competitors" className="space-y-6">
            {/* Competitor Analysis */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="mr-2 h-5 w-5" />
                  Competitor Analysis
                </CardTitle>
                <CardDescription>
                  Key competitors and their market position
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {competitorAnalysis.map((competitor, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="flex-1">
                          <div className="font-medium">{competitor.name}</div>
                          <div className="text-xs text-muted-foreground">
                            Market Share: {competitor.marketShare}%
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium">{competitor.winRate}%</div>
                          <div className="text-xs text-muted-foreground">Win Rate</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-6 text-sm">
                        <div className="text-center">
                          <div className="font-medium">{competitor.bids}</div>
                          <div className="text-xs text-muted-foreground">Bids</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium">{competitor.wins}</div>
                          <div className="text-xs text-muted-foreground">Wins</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium">${competitor.avgValue.toLocaleString()}</div>
                          <div className="text-xs text-muted-foreground">Avg Value</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="trends" className="space-y-6">
            {/* Market Trends */}
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
                <div className="space-y-4">
                  {marketTrends.map((trend, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="flex-1">
                          <div className="font-medium">{trend.trend}</div>
                          <div className="text-sm text-muted-foreground">{trend.description}</div>
                          <div className="text-xs text-muted-foreground">Timeframe: {trend.timeframe}</div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className={getImpactColor(trend.impact)}>
                            {trend.impact} Impact
                          </Badge>
                          <Badge className={getOpportunityColor(trend.opportunity)}>
                            {trend.opportunity} Opportunity
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`font-medium ${getGrowthColor(trend.growth)}`}>
                          {getGrowthIcon(trend.growth)}
                          {trend.growth}%
                        </div>
                        <div className="text-xs text-muted-foreground">Growth</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="clients" className="space-y-6">
            {/* Client Insights */}
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
                <div className="space-y-4">
                  {clientInsights.map((client, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="flex-1">
                          <div className="font-medium">{client.industry}</div>
                          <div className="text-sm text-muted-foreground">
                            Top Needs: {client.topNeeds.join(", ")}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Star className="h-4 w-4 text-yellow-500" />
                          <span className="text-sm">{client.satisfaction}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-6 text-sm">
                        <div className="text-center">
                          <div className="font-medium">${client.avgProjectValue.toLocaleString()}</div>
                          <div className="text-xs text-muted-foreground">Avg Value</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium">{client.projectCount}</div>
                          <div className="text-xs text-muted-foreground">Projects</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium">{client.repeatRate}%</div>
                          <div className="text-xs text-muted-foreground">Repeat Rate</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  )
}