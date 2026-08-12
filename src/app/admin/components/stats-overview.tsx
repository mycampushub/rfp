"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Store, FileText, Activity } from "lucide-react"
import type { User, MarketplaceStats, SystemHealth } from "../types"

export function StatsOverview({ users, marketplaceStats, systemHealth }: { users: User[], marketplaceStats: MarketplaceStats | null, systemHealth: SystemHealth | null }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Users</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{users.length}</div>
          <p className="text-xs text-muted-foreground">
            {users.filter(u => u.status === "active").length} active
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Marketplace Vendors</CardTitle>
          <Store className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{marketplaceStats?.totalVendors.toLocaleString() || '0'}</div>
          <p className="text-xs text-muted-foreground">
            {marketplaceStats?.successRate || 0}% success rate
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active RFPs</CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{marketplaceStats?.activeRFPs || '0'}</div>
          <p className="text-xs text-muted-foreground">
            ${((marketplaceStats?.totalValue || 0) / 1000000).toFixed(1)}M total value
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">System Health</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{systemHealth?.uptime || 0}%</div>
          <p className="text-xs text-muted-foreground">
            {systemHealth?.activeUsers || 0} active users
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
