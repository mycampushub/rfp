"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, Target, BarChart3 } from "lucide-react"
import type { MarketplaceStats } from "../types"

export function AnalyticsTab({ marketplaceStats }: { marketplaceStats: MarketplaceStats | null }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Platform Metrics */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="mr-2 h-5 w-5" />
              Platform Analytics
            </CardTitle>
            <CardDescription>
              Key performance indicators and growth metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">User Growth</h4>
                <div className="text-2xl font-bold text-sky-600 dark:text-sky-400">+24%</div>
                <p className="text-sm text-muted-foreground">vs last month</p>
              </div>
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">RFP Volume</h4>
                <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">+18%</div>
                <p className="text-sm text-muted-foreground">vs last month</p>
              </div>
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">Vendor Engagement</h4>
                <div className="text-2xl font-bold text-violet-500 dark:text-violet-400">+32%</div>
                <p className="text-sm text-muted-foreground">vs last month</p>
              </div>
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">Success Rate</h4>
                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">+5%</div>
                <p className="text-sm text-muted-foreground">vs last month</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Category Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Target className="mr-2 h-5 w-5" />
              Category Performance
            </CardTitle>
            <CardDescription>
              Success rates by category
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {marketplaceStats?.categories.map((category, index) => (
                <div key={category} className="flex items-center justify-between">
                  <span className="text-sm">{category}</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-16 bg-muted-foreground/20 rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full" 
                        style={{ width: `${85 - index * 5}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium">{85 - index * 5}%</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Advanced Analytics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="mr-2 h-5 w-5" />
            Advanced Analytics Dashboard
          </CardTitle>
          <CardDescription>
            Comprehensive analytics and reporting tools
          </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-sky-600 dark:text-sky-400 mb-1">2.5M</div>
                <div className="text-sm text-muted-foreground">Total RFP Value</div>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mb-1">15,847</div>
                <div className="text-sm text-muted-foreground">Active Vendors</div>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-violet-500 dark:text-violet-400 mb-1">156</div>
                <div className="text-sm text-muted-foreground">Active RFPs</div>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400 mb-1">78%</div>
                <div className="text-sm text-muted-foreground">Success Rate</div>
              </div>
            </div>
          </CardContent>
      </Card>
    </div>
  )
}