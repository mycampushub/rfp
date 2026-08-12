"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Store, Star, BarChart3, Eye } from "lucide-react"
import type { MarketplaceStats, VendorAnalytics } from "../types"

export function MarketplaceTab({ marketplaceStats, vendorAnalytics }: { marketplaceStats: MarketplaceStats | null, vendorAnalytics: VendorAnalytics[] }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Marketplace Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Store className="mr-2 h-5 w-5" />
              Marketplace Overview
            </CardTitle>
            <CardDescription>
              Current marketplace statistics and performance
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span>Total Vendors</span>
              <span className="font-medium">{marketplaceStats?.totalVendors.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Active RFPs</span>
              <span className="font-medium">{marketplaceStats?.activeRFPs}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Total Value</span>
              <span className="font-medium">${((marketplaceStats?.totalValue || 0) / 1000000).toFixed(1)}M</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Success Rate</span>
              <span className="font-medium">{marketplaceStats?.successRate}%</span>
            </div>
          </CardContent>
        </Card>

        {/* Top Vendors */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Star className="mr-2 h-5 w-5" />
              Top Performing Vendors
            </CardTitle>
            <CardDescription>
              Highest-rated vendors on the platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {marketplaceStats?.topVendors.map((vendor) => (
                <div key={vendor.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <h4 className="font-medium">{vendor.name}</h4>
                    <p className="text-sm text-muted-foreground">{vendor.projects} projects</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Star className="h-4 w-4 text-yellow-500" />
                    <span className="font-medium">{vendor.rating}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Vendor Analytics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="mr-2 h-5 w-5" />
            Vendor Performance Analytics
          </CardTitle>
          <CardDescription>
            Detailed performance metrics for all vendors
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vendor</TableHead>
                <TableHead>Total Bids</TableHead>
                <TableHead>Success Rate</TableHead>
                <TableHead>Avg Response Time</TableHead>
                <TableHead>Total Value</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vendorAnalytics.map((vendor) => (
                <TableRow key={vendor.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{vendor.vendorName}</div>
                      <div className="text-sm text-muted-foreground">
                        {vendor.categories.join(", ")}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{vendor.totalBids}</TableCell>
                  <TableCell>
                    <Badge className={vendor.successRate >= 80
                      ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                      : "bg-amber-500/15 text-amber-700 dark:text-amber-400"}>
                      {vendor.successRate}%
                    </Badge>
                  </TableCell>
                  <TableCell>{vendor.averageResponseTime} days</TableCell>
                  <TableCell>${(vendor.totalValue / 1000000).toFixed(1)}M</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <Star className="h-4 w-4 text-yellow-500" />
                      <span>{vendor.rating}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm" aria-label="View vendor details">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}