"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Building, Shield, Star, Key, Edit, Download, Globe, Mail, Target, Users, BarChart3, Activity, Award } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import type { VendorProfile } from "../types"
import { formatDate } from "@/lib/utils"

export function OverviewTab({ vendorProfile }: { vendorProfile: VendorProfile | null }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Business Profile Summary */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Building className="mr-2 h-5 w-5" />
              Business Profile
            </CardTitle>
            <CardDescription>
              Your vendor business information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">{vendorProfile?.businessName}</h3>
                  <p className="text-sm text-muted-foreground">{vendorProfile?.description}</p>
                </div>
                <div className="flex items-center space-x-2">
                  {vendorProfile?.isVerified && (
                    <Badge className="bg-sky-500/15 text-sky-700 dark:text-sky-400">
                      <Shield className="mr-1 h-3 w-3" />
                      Verified
                    </Badge>
                  )}
                  <Badge variant="outline">
                    <Star className="mr-1 h-3 w-3" />
                    {vendorProfile?.rating}
                  </Badge>
                </div>
              </div>
              
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label className="text-sm font-medium">Business ID</Label>
                  <p className="text-sm text-muted-foreground flex items-center">
                    <Key className="mr-1 h-3 w-3" />
                    {vendorProfile?.businessId}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Member Since</Label>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(vendorProfile?.memberSince || "")}
                  </p>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Categories</Label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {vendorProfile?.categories.map((category, index) => (
                    <Badge key={index} variant="secondary">{category}</Badge>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Specialties</Label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {vendorProfile?.specialties.map((specialty, index) => (
                    <Badge key={index} variant="outline">{specialty}</Badge>
                  ))}
                </div>
              </div>

              <div className="flex space-x-2">
                <Button size="sm" asChild>
                  <Link href="/vendor-dashboard/profile">
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Profile
                  </Link>
                </Button>
                <Button size="sm" variant="outline" onClick={() => {
                  if (!vendorProfile) return
                  const blob = new Blob([JSON.stringify(vendorProfile, null, 2)], { type: 'application/json' })
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement('a')
                  a.href = url; a.download = 'vendor-profile.json'; a.click()
                  URL.revokeObjectURL(url)
                  toast.success('Profile exported successfully')
                }}>
                  <Download className="mr-2 h-4 w-4" />
                  Export Profile
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common vendor tasks
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full justify-start" asChild>
              <Link href="/marketplace/rfps">
                <Globe className="mr-2 h-4 w-4" />
                Browse Marketplace
              </Link>
            </Button>
            <Button className="w-full justify-start" asChild>
              <Link href="/vendor-dashboard/invitations">
                <Mail className="mr-2 h-4 w-4" />
                View Invitations
              </Link>
            </Button>
            <Button className="w-full justify-start" asChild>
              <Link href="/vendor-dashboard/bids">
                <Target className="mr-2 h-4 w-4" />
                Manage Bids
              </Link>
            </Button>
            <Button className="w-full justify-start" asChild>
              <Link href="/vendor-dashboard/team">
                <Users className="mr-2 h-4 w-4" />
                Manage Team
              </Link>
            </Button>
            <Button className="w-full justify-start" asChild>
              <Link href="/vendor-dashboard/analytics">
                <BarChart3 className="mr-2 h-4 w-4" />
                View Analytics
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="mr-2 h-5 w-5" />
            Recent Activity
          </CardTitle>
          <CardDescription>
            Your latest vendor activities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-3 p-3 border rounded-lg">
              <div className="flex-shrink-0">
                <Mail className="h-5 w-5 text-sky-600 dark:text-sky-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">New invitation received</p>
                <p className="text-sm text-muted-foreground">
                  Enterprise Cloud Migration Services from TechCorp Inc.
                </p>
              </div>
              <div className="text-xs text-muted-foreground">
                2 hours ago
              </div>
            </div>
            
            <div className="flex items-center space-x-3 p-3 border rounded-lg">
              <div className="flex-shrink-0">
                <Target className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Bid submitted successfully</p>
                <p className="text-sm text-muted-foreground">
                  E-commerce Platform Development for Retail Giant Inc.
                </p>
              </div>
              <div className="text-xs text-muted-foreground">
                1 day ago
              </div>
            </div>
            
            <div className="flex items-center space-x-3 p-3 border rounded-lg">
              <div className="flex-shrink-0">
                <Award className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Project awarded</p>
                <p className="text-sm text-muted-foreground">
                  Data Analytics Implementation with DataCorp
                </p>
              </div>
              <div className="text-xs text-muted-foreground">
                3 days ago
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}