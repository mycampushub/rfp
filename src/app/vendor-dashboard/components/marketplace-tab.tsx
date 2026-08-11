"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DollarSign, Building, Clock, Users, ArrowRight } from "lucide-react"
import Link from "next/link"
import type { VendorProfile, MarketplaceOpportunity } from "../types"
import { getMatchScoreColor } from "../lib/vendor-helpers"

export function MarketplaceTab({ vendorProfile, opportunities }: { vendorProfile: VendorProfile | null, opportunities: MarketplaceOpportunity[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recommended Opportunities</CardTitle>
        <CardDescription>
          Marketplace opportunities matched to your profile
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {opportunities.map((opportunity) => (
            <div key={opportunity.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold text-lg">{opportunity.title}</h3>
                  <p className="text-sm text-muted-foreground">{opportunity.organization}</p>
                </div>
                <div className="flex items-center space-x-2">
                  {opportunity.isFeatured && (
                    <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400">
                      Featured
                    </Badge>
                  )}
                  <Badge className={getMatchScoreColor(opportunity.matchScore)}>
                    {opportunity.matchScore}% Match
                  </Badge>
                </div>
              </div>
              
              <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-3">
                <span className="flex items-center">
                  <DollarSign className="mr-1 h-3 w-3" />
                  {opportunity.budget}
                </span>
                <span className="flex items-center">
                  <Building className="mr-1 h-3 w-3" />
                  {opportunity.category}
                </span>
                <span className="flex items-center">
                  <Clock className="mr-1 h-3 w-3" />
                  {opportunity.deadline}
                </span>
                <span className="flex items-center">
                  <Users className="mr-1 h-3 w-3" />
                  {opportunity.bids} bids
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <div className="flex flex-wrap gap-1">
                  {vendorProfile?.categories
                    .filter(cat => opportunity.category.includes(cat) || cat.includes(opportunity.category))
                    .map((category, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {category}
                      </Badge>
                    ))}
                </div>
                <Button size="sm" asChild>
                  <Link href={`/marketplace/rfps/${opportunity.id}`}>
                    View Details
                  </Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-6 text-center">
          <Button asChild>
            <Link href="/marketplace/rfps">
              View All Opportunities
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}