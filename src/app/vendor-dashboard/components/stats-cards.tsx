"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, Mail, Target, Award } from "lucide-react"
import type { VendorProfile, Invitation, Bid } from "../types"

export function StatsCards({ vendorProfile, invitations, bids }: { vendorProfile: VendorProfile | null, invitations: Invitation[], bids: Bid[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Profile Completion</CardTitle>
          <CheckCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">95%</div>
          <p className="text-xs text-muted-foreground">
            {vendorProfile?.isVerified ? "Verified Business" : "Verification Pending"}
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Invitations</CardTitle>
          <Mail className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {invitations.filter(i => i.status === "pending").length}
          </div>
          <p className="text-xs text-muted-foreground">
            {invitations.filter(i => i.status === "pending").length} require action
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Bids</CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {bids.filter(b => b.status === "submitted" || b.status === "under_review").length}
          </div>
          <p className="text-xs text-muted-foreground">
            {bids.filter(b => b.status === "awarded").length} awarded this month
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
          <Award className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">78%</div>
          <p className="text-xs text-muted-foreground">
            {vendorProfile?.rating}/5.0 rating
          </p>
        </CardContent>
      </Card>
    </div>
  )
}