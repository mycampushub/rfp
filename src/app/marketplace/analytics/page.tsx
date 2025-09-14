"use client"

import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
  AlertTriangle
} from "lucide-react"

export default function MarketplaceAnalytics() {
  // Mock data for marketplace analytics
  const overviewStats = {
    totalRFPs: 1247,
    activeRFPs: 156,
    totalVendors: 2847,
    activeVendors: 892,
    totalValue: "$12.5M",
    avgBidsPerRFP: 8.4,
    successRate: 94,
    avgResponseTime: "2.3 hours"
  }

  const topCategories = [
    { name: "IT Services", count: 342, value: "$4.2M", growth: 12 },
    { name: "Marketing", count: 198, value: "$2.1M", growth: 8 },
    { name: "Construction", count: 156, value: "$3.8M", growth: 15 },
    { name: "Consulting", count: 134, value: "$1.8M", growth: 6 },
    { name: "Software Development", count: 217, value: "$3.2M", growth: 18 }
  ]

  const monthlyTrends = [
    { month: "Jul", rfps: 89, vendors: 45, value: "$0.8M" },
    { month: "Aug", rfps: 94, vendors: 52, value: "$0.9M" },
    { month: "Sep", rfps: 108, vendors: 61, value: "$1.1M" },
    { month: "Oct", rfps: 125, vendors: 78, value: "$1.4M" },
    { month: "Nov", rfps: 142, vendors: 89, value: "$1.6M" },
    { month: "Dec", rfps: 156, vendors: 92, value: "$1.8M" }
  ]

  const topVendors = [
    { name: "TechSolutions Pro", bids: 67, wins: 23, winRate: 34, rating: 4.9 },
    { name: "Marketing Masters", bids: 45, wins: 18, winRate: 40, rating: 4.8 },
    { name: "BuildRight Construction", bids: 38, wins: 15, winRate: 39, rating: 4.7 },
    { name: "Data Insights Consulting", bids: 29, wins: 9, winRate: 31, rating: 4.6 },
    { name: "Creative Studio Pro", bids: 34, wins: 12, winRate: 35, rating: 4.8 }
  ]

  const performanceMetrics = [
    { metric: "Bid Success Rate", value: 34, target: 40, status: "below" },
    { metric: "Average Response Time", value: "2.3h", target: "2h", status: "below" },
    { metric: "Profile Completion", value: 92, target: 100, status: "good" },
    { metric: "Client Satisfaction", value: 4.7, target: 4.5, status: "excellent" },
    { metric: "Repeat Business", value: 78, target: 70, status: "excellent" }
  ]

  const getGrowthColor = (growth: number) => {
    return growth >= 0 ? "text-green-600" : "text-red-600"
  }

  const getGrowthIcon = (growth: number) => {
    return growth >= 0 ? "↑" : "↓"
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

  return (
    <MainLayout title="Marketplace Analytics">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Marketplace Analytics</h1>
          <p className="text-muted-foreground mt-1">
            Comprehensive insights into marketplace performance and trends
          </p>
        </div>

        {/* Overview Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <FileText className="h-8 w-8 text-blue-600" />
                <div>
                  <div className="text-2xl font-bold">{overviewStats.totalRFPs}</div>
                  <div className="text-sm text-muted-foreground">Total RFPs</div>
                  <div className="text-xs text-green-600">{overviewStats.activeRFPs} active</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <Users className="h-8 w-8 text-green-600" />
                <div>
                  <div className="text-2xl font-bold">{overviewStats.totalVendors}</div>
                  <div className="text-sm text-muted-foreground">Total Vendors</div>
                  <div className="text-xs text-green-600">{overviewStats.activeVendors} active</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <DollarSign className="h-8 w-8 text-purple-600" />
                <div>
                  <div className="text-2xl font-bold">{overviewStats.totalValue}</div>
                  <div className="text-sm text-muted-foreground">Total Value</div>
                  <div className="text-xs text-muted-foreground">Active RFPs</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <TrendingUp className="h-8 w-8 text-orange-600" />
                <div>
                  <div className="text-2xl font-bold">{overviewStats.successRate}%</div>
                  <div className="text-sm text-muted-foreground">Success Rate</div>
                  <div className="text-xs text-muted-foreground">{overviewStats.avgBidsPerRFP} avg bids</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="vendors">Vendors</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Monthly Trends */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="mr-2 h-5 w-5" />
                  Monthly Trends
                </CardTitle>
                <CardDescription>
                  Marketplace activity over the last 6 months
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {monthlyTrends.map((trend, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="font-medium">{trend.month}</div>
                        <div className="flex items-center space-x-6 text-sm">
                          <span className="flex items-center">
                            <FileText className="mr-1 h-3 w-3" />
                            {trend.rfps} RFPs
                          </span>
                          <span className="flex items-center">
                            <Users className="mr-1 h-3 w-3" />
                            {trend.vendors} Vendors
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{trend.value}</div>
                        <div className="text-xs text-muted-foreground">Total Value</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Key Metrics */}
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Target className="mr-2 h-5 w-5" />
                    Marketplace Health
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Average Bids per RFP</span>
                    <span className="font-medium">{overviewStats.avgBidsPerRFP}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Average Response Time</span>
                    <span className="font-medium">{overviewStats.avgResponseTime}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Vendor Retention Rate</span>
                    <span className="font-medium text-green-600">87%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">RFP Fill Rate</span>
                    <span className="font-medium text-green-600">92%</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Clock className="mr-2 h-5 w-5" />
                    Activity Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">RFPs Posted This Week</span>
                    <span className="font-medium">23</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">New Vendor Registrations</span>
                    <span className="font-medium">45</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Bids Submitted Today</span>
                    <span className="font-medium">67</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Active Projects</span>
                    <span className="font-medium">234</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="categories" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <PieChart className="mr-2 h-5 w-5" />
                  Top Categories by Volume
                </CardTitle>
                <CardDescription>
                  Most active categories in the marketplace
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topCategories.map((category, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="font-medium">{category.name}</div>
                        <Badge variant="outline">{category.count} RFPs</Badge>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <div className="font-medium">{category.value}</div>
                          <div className="text-xs text-muted-foreground">Total Value</div>
                        </div>
                        <div className={`text-sm font-medium ${getGrowthColor(category.growth)}`}>
                          {getGrowthIcon(category.growth)} {category.growth}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="vendors" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Star className="mr-2 h-5 w-5" />
                  Top Performing Vendors
                </CardTitle>
                <CardDescription>
                  Vendors with highest success rates and activity
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topVendors.map((vendor, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="font-medium">{vendor.name}</div>
                        <div className="flex items-center space-x-1">
                          <Star className="h-4 w-4 text-yellow-500" />
                          <span className="text-sm">{vendor.rating}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-6 text-sm">
                        <div className="text-center">
                          <div className="font-medium">{vendor.bids}</div>
                          <div className="text-xs text-muted-foreground">Bids</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium">{vendor.wins}</div>
                          <div className="text-xs text-muted-foreground">Wins</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium">{vendor.winRate}%</div>
                          <div className="text-xs text-muted-foreground">Win Rate</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="mr-2 h-5 w-5" />
                  Performance Metrics
                </CardTitle>
                <CardDescription>
                  Key performance indicators and targets
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {performanceMetrics.map((metric, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="font-medium">{metric.metric}</div>
                        <Badge className={getStatusColor(metric.status)}>
                          {getStatusIcon(metric.status)}
                          <span className="ml-1 capitalize">{metric.status}</span>
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <div className="font-medium">{metric.value}</div>
                          <div className="text-xs text-muted-foreground">Current</div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{metric.target}</div>
                          <div className="text-xs text-muted-foreground">Target</div>
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