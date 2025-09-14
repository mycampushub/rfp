"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Briefcase, 
  DollarSign,
  Star,
  Eye,
  Calendar,
  MapPin,
  BarChart3,
  PieChart,
  Activity,
  Target,
  Zap,
  Award,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw
} from "lucide-react"

interface AnalyticsData {
  overview: {
    totalRfps: number
    activeRfps: number
    totalVendors: number
    activeVendors: number
    totalBids: number
    averageBidAmount: number
    successRate: number
    averageResponseTime: string
  }
  trends: {
    rfpGrowth: number
    vendorGrowth: number
    bidGrowth: number
    revenueGrowth: number
  }
  topCategories: Array<{
    name: string
    count: number
    growth: number
    revenue: number
  }>
  geographicData: Array<{
    location: string
    rfps: number
    vendors: number
    bids: number
  }>
  performanceMetrics: Array<{
    name: string
    value: number
    target: number
    change: number
    unit: string
  }>
  recentActivity: Array<{
    type: string
    title: string
    description: string
    timestamp: string
    impact: "high" | "medium" | "low"
  }>
}

interface AnalyticsDashboardProps {
  data: AnalyticsData
  timeRange: "7d" | "30d" | "90d" | "1y"
  onTimeRangeChange: (range: "7d" | "30d" | "90d" | "1y") => void
  onRefresh?: () => void
  isLoading?: boolean
}

export function AnalyticsDashboard({ 
  data, 
  timeRange, 
  onTimeRangeChange, 
  onRefresh,
  isLoading = false 
}: AnalyticsDashboardProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact'
    }).format(amount)
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num)
  }

  const getTrendIcon = (trend: number) => {
    return trend >= 0 ? TrendingUp : TrendingDown
  }

  const getTrendColor = (trend: number) => {
    return trend >= 0 ? "text-green-600" : "text-red-600"
  }

  const getImpactColor = (impact: string) => {
    const colors = {
      high: "bg-red-100 text-red-800",
      medium: "bg-yellow-100 text-yellow-800",
      low: "bg-blue-100 text-blue-800"
    }
    return colors[impact as keyof typeof colors] || "bg-gray-100 text-gray-800"
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Marketplace Analytics</h2>
          <div className="flex items-center space-x-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>Loading...</span>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Marketplace Analytics</h2>
          <p className="text-muted-foreground">
            Comprehensive insights into marketplace performance and trends
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1">
            {["7d", "30d", "90d", "1y"].map((range) => (
              <Button
                key={range}
                variant={timeRange === range ? "default" : "outline"}
                size="sm"
                onClick={() => onTimeRangeChange(range as any)}
              >
                {range}
              </Button>
            ))}
          </div>
          {onRefresh && (
            <Button variant="outline" size="sm" onClick={onRefresh}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="geography">Geography</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total RFPs</CardTitle>
                <Briefcase className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(data.overview.totalRfps)}</div>
                <p className="text-xs text-muted-foreground">
                  {formatNumber(data.overview.activeRfps)} active
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Vendors</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(data.overview.totalVendors)}</div>
                <p className="text-xs text-muted-foreground">
                  {formatNumber(data.overview.activeVendors)} active
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Bids</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(data.overview.totalBids)}</div>
                <p className="text-xs text-muted-foreground">
                  Avg: {formatCurrency(data.overview.averageBidAmount)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.overview.successRate}%</div>
                <p className="text-xs text-muted-foreground">
                  Avg response: {data.overview.averageResponseTime}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Growth Trends */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">RFP Growth</CardTitle>
                {getTrendIcon(data.trends.rfpGrowth)({ className: `h-4 w-4 ${getTrendColor(data.trends.rfpGrowth)}` })}
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${getTrendColor(data.trends.rfpGrowth)}`}>
                  {data.trends.rfpGrowth >= 0 ? '+' : ''}{data.trends.rfpGrowth}%
                </div>
                <p className="text-xs text-muted-foreground">vs previous period</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Vendor Growth</CardTitle>
                {getTrendIcon(data.trends.vendorGrowth)({ className: `h-4 w-4 ${getTrendColor(data.trends.vendorGrowth)}` })}
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${getTrendColor(data.trends.vendorGrowth)}`}>
                  {data.trends.vendorGrowth >= 0 ? '+' : ''}{data.trends.vendorGrowth}%
                </div>
                <p className="text-xs text-muted-foreground">vs previous period</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Bid Growth</CardTitle>
                {getTrendIcon(data.trends.bidGrowth)({ className: `h-4 w-4 ${getTrendColor(data.trends.bidGrowth)}` })}
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${getTrendColor(data.trends.bidGrowth)}`}>
                  {data.trends.bidGrowth >= 0 ? '+' : ''}{data.trends.bidGrowth}%
                </div>
                <p className="text-xs text-muted-foreground">vs previous period</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Revenue Growth</CardTitle>
                {getTrendIcon(data.trends.revenueGrowth)({ className: `h-4 w-4 ${getTrendColor(data.trends.revenueGrowth)}` })}
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${getTrendColor(data.trends.revenueGrowth)}`}>
                  {data.trends.revenueGrowth >= 0 ? '+' : ''}{data.trends.revenueGrowth}%
                </div>
                <p className="text-xs text-muted-foreground">vs previous period</p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Latest marketplace activities and events
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-full ${getImpactColor(activity.impact)}`}>
                        <Activity className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="font-medium">{activity.title}</h4>
                        <p className="text-sm text-muted-foreground">{activity.description}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(activity.timestamp)}</p>
                      </div>
                    </div>
                    <Badge className={getImpactColor(activity.impact)}>
                      {activity.impact}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Performance Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
                <CardDescription>
                  Key performance indicators and targets
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.performanceMetrics.map((metric, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{metric.name}</span>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-muted-foreground">
                            Target: {metric.target}{metric.unit}
                          </span>
                          {getTrendIcon(metric.change)({
                            className: `h-4 w-4 ${getTrendColor(metric.change)}`
                          })}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${Math.min((metric.value / metric.target) * 100, 100)}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium">
                          {metric.value}{metric.unit}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Growth Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Growth Summary</CardTitle>
                <CardDescription>
                  Overall marketplace growth trends
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-green-600">
                      {data.trends.revenueGrowth >= 0 ? '+' : ''}{data.trends.revenueGrowth}%
                    </div>
                    <p className="text-sm text-muted-foreground">Overall Growth Rate</p>
                  </div>
                  
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {formatNumber(data.overview.totalRfps)}
                      </div>
                      <p className="text-sm text-muted-foreground">Total RFPs</p>
                      <p className={`text-xs ${getTrendColor(data.trends.rfpGrowth)}`}>
                        {data.trends.rfpGrowth >= 0 ? '+' : ''}{data.trends.rfpGrowth}% from last period
                      </p>
                    </div>
                    
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {formatNumber(data.overview.totalVendors)}
                      </div>
                      <p className="text-sm text-muted-foreground">Total Vendors</p>
                      <p className={`text-xs ${getTrendColor(data.trends.vendorGrowth)}`}>
                        {data.trends.vendorGrowth >= 0 ? '+' : ''}{data.trends.vendorGrowth}% from last period
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="categories" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Top Categories</CardTitle>
              <CardDescription>
                Most active categories by RFP count and revenue
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.topCategories.map((category, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="text-2xl font-bold text-gray-400">
                        #{index + 1}
                      </div>
                      <div>
                        <h4 className="font-semibold">{category.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {formatNumber(category.count)} RFPs
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold">
                        {formatCurrency(category.revenue)}
                      </div>
                      <div className={`flex items-center text-sm ${getTrendColor(category.growth)}`}>
                        {getTrendIcon(category.growth)({ className: "h-3 w-3 mr-1" })}
                        {category.growth >= 0 ? '+' : ''}{category.growth}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="geography" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Geographic Distribution</CardTitle>
              <CardDescription>
                Marketplace activity by location
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.geographicData.map((location, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <MapPin className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <h4 className="font-semibold">{location.location}</h4>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <span>{location.rfps} RFPs</span>
                          <span>{location.vendors} Vendors</span>
                          <span>{location.bids} Bids</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold">
                        {formatNumber(location.rfps)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Active RFPs
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Success Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>Success Metrics</CardTitle>
                <CardDescription>
                  Marketplace performance indicators
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-green-600">
                      {data.overview.successRate}%
                    </div>
                    <p className="text-sm text-muted-foreground">Overall Success Rate</p>
                  </div>
                  
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {data.overview.averageResponseTime}
                      </div>
                      <p className="text-sm text-muted-foreground">Avg Response Time</p>
                    </div>
                    
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">
                        {formatCurrency(data.overview.averageBidAmount)}
                      </div>
                      <p className="text-sm text-muted-foreground">Avg Bid Amount</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Activity Overview */}
            <Card>
              <CardHeader>
                <CardTitle>Activity Overview</CardTitle>
                <CardDescription>
                  Current marketplace activity levels
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Zap className="h-4 w-4 text-yellow-500" />
                      <span className="font-medium">High Activity</span>
                    </div>
                    <Badge className="bg-green-100 text-green-800">
                      Active
                    </Badge>
                  </div>
                  
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">
                        {formatNumber(data.overview.activeRfps)}
                      </div>
                      <p className="text-sm text-muted-foreground">Active RFPs</p>
                    </div>
                    
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-indigo-600">
                        {formatNumber(data.overview.activeVendors)}
                      </div>
                      <p className="text-sm text-muted-foreground">Active Vendors</p>
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