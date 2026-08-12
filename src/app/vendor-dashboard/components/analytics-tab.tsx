"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { TrendingUp, Clock, Target, DollarSign, BarChart3, Award, Globe, Calendar, FileText, Download } from "lucide-react"
import { toast } from "sonner"
import type { VendorProfile } from "../types"

function downloadJsonReport(data: Record<string, unknown>, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${filename}-${new Date().toISOString().split('T')[0]}.json`
  a.click()
  URL.revokeObjectURL(url)
  toast.success(`${filename.replace(/-/g, ' ')} downloaded`)
}

export function AnalyticsTab({ vendorProfile }: { vendorProfile: VendorProfile | null }) {
  return (
    <div className="space-y-6">
      {/* Key Performance Indicators */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">78%</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-emerald-600 dark:text-emerald-400">+5.2%</span> from last month
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Response Time</CardTitle>
            <Clock className="h-4 w-4 text-sky-600 dark:text-sky-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2.3 days</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-emerald-600 dark:text-emerald-400">-0.5 days</span> improvement
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <Target className="h-4 w-4 text-violet-600 dark:text-violet-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">
              3 in evaluation phase
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue This Month</CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$125K</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-emerald-600 dark:text-emerald-400">+27.6%</span> growth
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Advanced Analytics Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Performance Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="mr-2 h-5 w-5" />
              Performance Metrics
            </CardTitle>
            <CardDescription>
              Your vendor performance statistics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span>Win Rate</span>
                <div className="flex items-center space-x-2">
                  <div className="w-24 bg-muted-foreground/20 rounded-full h-2">
                    <div className="bg-emerald-500 h-2 rounded-full" style={{ width: "78%" }}></div>
                  </div>
                  <span className="font-semibold">78%</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span>Average Response Time</span>
                <div className="flex items-center space-x-2">
                  <div className="w-24 bg-muted-foreground/20 rounded-full h-2">
                    <div className="bg-sky-500 h-2 rounded-full" style={{ width: "85%" }}></div>
                  </div>
                  <span className="font-semibold">2.3 days</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span>Total Projects Completed</span>
                <div className="flex items-center space-x-2">
                  <div className="w-24 bg-muted-foreground/20 rounded-full h-2">
                    <div className="bg-violet-500 h-2 rounded-full" style={{ width: "95%" }}></div>
                  </div>
                  <span className="font-semibold">{vendorProfile?.completedProjects}</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span>Client Satisfaction</span>
                <div className="flex items-center space-x-2">
                  <div className="w-24 bg-muted-foreground/20 rounded-full h-2">
                    <div className="bg-amber-500 h-2 rounded-full" style={{ width: "96%" }}></div>
                  </div>
                  <span className="font-semibold">{vendorProfile?.rating}/5.0</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span>On-Time Delivery</span>
                <div className="flex items-center space-x-2">
                  <div className="w-24 bg-muted-foreground/20 rounded-full h-2">
                    <div className="bg-emerald-500 h-2 rounded-full" style={{ width: "94%" }}></div>
                  </div>
                  <span className="font-semibold">94%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bid Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Target className="mr-2 h-5 w-5" />
              Bid Activity
            </CardTitle>
            <CardDescription>
              Your bidding activity this month
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span>Bids Submitted</span>
                <div className="flex items-center space-x-2">
                  <div className="w-24 bg-muted-foreground/20 rounded-full h-2">
                    <div className="bg-sky-500 h-2 rounded-full" style={{ width: "80%" }}></div>
                  </div>
                  <span className="font-semibold">12</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span>Bids Under Review</span>
                <div className="flex items-center space-x-2">
                  <div className="w-24 bg-muted-foreground/20 rounded-full h-2">
                    <div className="bg-amber-500 h-2 rounded-full" style={{ width: "25%" }}></div>
                  </div>
                  <span className="font-semibold">3</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span>Bids Awarded</span>
                <div className="flex items-center space-x-2">
                  <div className="w-24 bg-muted-foreground/20 rounded-full h-2">
                    <div className="bg-emerald-500 h-2 rounded-full" style={{ width: "17%" }}></div>
                  </div>
                  <span className="font-semibold">2</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span>Total Value (Awarded)</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">$550,000</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Success Rate</span>
                <div className="flex items-center space-x-2">
                  <div className="w-24 bg-muted-foreground/20 rounded-full h-2">
                    <div className="bg-violet-500 h-2 rounded-full" style={{ width: "17%" }}></div>
                  </div>
                  <span className="font-semibold">16.7%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Category Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Award className="mr-2 h-5 w-5" />
              Performance by Category
            </CardTitle>
            <CardDescription>
              Success rates across different service categories
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span>IT Services</span>
                <div className="flex items-center space-x-2">
                  <div className="w-20 bg-muted-foreground/20 rounded-full h-2">
                    <div className="bg-sky-500 h-2 rounded-full" style={{ width: "85%" }}></div>
                  </div>
                  <span className="text-sm font-medium">85%</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span>Software Development</span>
                <div className="flex items-center space-x-2">
                  <div className="w-20 bg-muted-foreground/20 rounded-full h-2">
                    <div className="bg-emerald-500 h-2 rounded-full" style={{ width: "92%" }}></div>
                  </div>
                  <span className="text-sm font-medium">92%</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span>Cloud Computing</span>
                <div className="flex items-center space-x-2">
                  <div className="w-20 bg-muted-foreground/20 rounded-full h-2">
                    <div className="bg-violet-500 h-2 rounded-full" style={{ width: "78%" }}></div>
                  </div>
                  <span className="text-sm font-medium">78%</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span>DevOps</span>
                <div className="flex items-center space-x-2">
                  <div className="w-20 bg-muted-foreground/20 rounded-full h-2">
                    <div className="bg-orange-500 h-2 rounded-full" style={{ width: "88%" }}></div>
                  </div>
                  <span className="text-sm font-medium">88%</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span>Mobile Apps</span>
                <div className="flex items-center space-x-2">
                  <div className="w-20 bg-muted-foreground/20 rounded-full h-2">
                    <div className="bg-pink-500 h-2 rounded-full" style={{ width: "82%" }}></div>
                  </div>
                  <span className="text-sm font-medium">82%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Revenue Trends */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="mr-2 h-5 w-5" />
              Revenue Trends
            </CardTitle>
            <CardDescription>
              Monthly revenue from awarded projects
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span>This Month</span>
                <div className="flex items-center space-x-2">
                  <div className="w-24 bg-muted-foreground/20 rounded-full h-2">
                    <div className="bg-emerald-500 h-2 rounded-full" style={{ width: "100%" }}></div>
                  </div>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">$125,000</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span>Last Month</span>
                <div className="flex items-center space-x-2">
                  <div className="w-24 bg-muted-foreground/20 rounded-full h-2">
                    <div className="bg-sky-500 h-2 rounded-full" style={{ width: "78%" }}></div>
                  </div>
                  <span className="font-semibold">$98,000</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span>3 Months Ago</span>
                <div className="flex items-center space-x-2">
                  <div className="w-24 bg-muted-foreground/20 rounded-full h-2">
                    <div className="bg-violet-500 h-2 rounded-full" style={{ width: "70%" }}></div>
                  </div>
                  <span className="font-semibold">$87,000</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span>6 Months Ago</span>
                <div className="flex items-center space-x-2">
                  <div className="w-24 bg-muted-foreground/20 rounded-full h-2">
                    <div className="bg-orange-500 h-2 rounded-full" style={{ width: "61%" }}></div>
                  </div>
                  <span className="font-semibold">$76,000</span>
                </div>
              </div>
              <div className="pt-2 border-t">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Growth Trend</span>
                  <div className="flex items-center text-emerald-600 dark:text-emerald-400">
                    <TrendingUp className="h-4 w-4 mr-1" />
                    <span className="font-medium">+27.6%</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Market Insights */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Globe className="mr-2 h-5 w-5" />
              Market Insights
            </CardTitle>
            <CardDescription>
              Your position in the marketplace
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span>Market Share</span>
                <div className="flex items-center space-x-2">
                  <div className="w-24 bg-muted-foreground/20 rounded-full h-2">
                    <div className="bg-sky-500 h-2 rounded-full" style={{ width: "12%" }}></div>
                  </div>
                  <span className="font-semibold">12%</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span>Competitive Index</span>
                <div className="flex items-center space-x-2">
                  <div className="w-24 bg-muted-foreground/20 rounded-full h-2">
                    <div className="bg-emerald-500 h-2 rounded-full" style={{ width: "88%" }}></div>
                  </div>
                  <span className="font-semibold">88/100</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span>Profile Visibility</span>
                <div className="flex items-center space-x-2">
                  <div className="w-24 bg-muted-foreground/20 rounded-full h-2">
                    <div className="bg-violet-500 h-2 rounded-full" style={{ width: "95%" }}></div>
                  </div>
                  <span className="font-semibold">95%</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span>Client Reach</span>
                <div className="flex items-center space-x-2">
                  <div className="w-24 bg-muted-foreground/20 rounded-full h-2">
                    <div className="bg-orange-500 h-2 rounded-full" style={{ width: "73%" }}></div>
                  </div>
                  <span className="font-semibold">73%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Project Timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="mr-2 h-5 w-5" />
              Project Timeline
            </CardTitle>
            <CardDescription>
              Upcoming project milestones
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-2 border rounded">
                <div>
                  <p className="font-medium">E-commerce Platform</p>
                  <p className="text-sm text-muted-foreground">Delivery due</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">Dec 15</p>
                  <p className="text-xs text-amber-600 dark:text-amber-400">5 days</p>
                </div>
              </div>
              <div className="flex items-center justify-between p-2 border rounded">
                <div>
                  <p className="font-medium">Mobile App Development</p>
                  <p className="text-sm text-muted-foreground">Review due</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">Dec 10</p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400">Completed</p>
                </div>
              </div>
              <div className="flex items-center justify-between p-2 border rounded">
                <div>
                  <p className="font-medium">Data Analytics</p>
                  <p className="text-sm text-muted-foreground">Milestone 2</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">Dec 20</p>
                  <p className="text-xs text-sky-600 dark:text-sky-400">10 days</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Export and Reports */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Download className="mr-2 h-5 w-5" />
            Export & Reports
          </CardTitle>
          <CardDescription>
            Download detailed reports and analytics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Button variant="outline" className="h-20 flex-col" onClick={() => {
              const data = { winRate: '78%', avgResponseTime: '2.3 days', activeProjects: 8, revenue: '$125,000', clientSatisfaction: vendorProfile?.rating, onTimeDelivery: '94%', completedProjects: vendorProfile?.completedProjects }
              downloadJsonReport(data, 'performance-report')
            }}>
              <FileText className="h-6 w-6 mb-2" />
              <span className="text-sm">Performance Report</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col" onClick={() => {
              const data = { thisMonth: '$125,000', lastMonth: '$98,000', threeMonthsAgo: '$87,000', sixMonthsAgo: '$76,000', growth: '+27.6%' }
              downloadJsonReport(data, 'revenue-analysis')
            }}>
              <BarChart3 className="h-6 w-6 mb-2" />
              <span className="text-sm">Revenue Analysis</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col" onClick={() => {
              const data = { submitted: 12, underReview: 3, awarded: 2, totalAwardedValue: '$550,000', successRate: '16.7%' }
              downloadJsonReport(data, 'bid-history')
            }}>
              <Target className="h-6 w-6 mb-2" />
              <span className="text-sm">Bid History</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col" onClick={() => {
              const data = { marketShare: '12%', competitiveIndex: '88/100', profileVisibility: '95%', clientReach: '73%' }
              downloadJsonReport(data, 'market-insights')
            }}>
              <Globe className="h-6 w-6 mb-2" />
              <span className="text-sm">Market Insights</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}