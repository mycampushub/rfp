"use client"

import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Store, Search, Users, Star, Clock, DollarSign, Building, ArrowRight, CheckCircle } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { toast } from "sonner"

export default function Marketplace() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<{
    title: string
    value: string
    description: string
    icon: typeof Search
    color: string
  }[]>([])
  const [featuredRFPs, setFeaturedRFPs] = useState<any[]>([])
  const [topVendors, setTopVendors] = useState<any[]>([])

  useEffect(() => {
    async function fetchData() {
      try {
        const [statsRes, rfpsRes, vendorsRes] = await Promise.all([
          fetch("/api/dashboard/stats").then(r => r.json()).catch(() => null),
          fetch("/api/v1/rfps?limit=3").then(r => r.json()).catch(() => null),
          fetch("/api/v1/vendors?limit=3").then(r => r.json()).catch(() => null),
        ])

        // Map stats
        if (statsRes && !statsRes.error) {
          setStats([
            {
              title: "Active RFPs",
              value: String(statsRes.activeRfps ?? 0),
              description: "Available for bidding",
              icon: Search,
              color: "text-sky-600 dark:text-sky-400"
            },
            {
              title: "Registered Vendors",
              value: (statsRes.totalVendors ?? 0).toLocaleString(),
              description: "Ready to respond",
              icon: Users,
              color: "text-emerald-600 dark:text-emerald-400"
            },
            {
              title: "Vendor Responses",
              value: String(statsRes.vendorResponses ?? 0),
              description: "Total submissions",
              icon: DollarSign,
              color: "text-violet-600 dark:text-violet-400"
            },
            {
              title: "Pending Approvals",
              value: String(statsRes.approvalsPending ?? 0),
              description: "Awaiting review",
              icon: CheckCircle,
              color: "text-orange-600 dark:text-orange-400"
            }
          ])
        } else {
          setStats([])
        }

        // Map featured RFPs
        if (rfpsRes && rfpsRes.data) {
          setFeaturedRFPs(rfpsRes.data.map((rfp: any) => ({
            id: rfp.id,
            title: rfp.title,
            organization: rfp.title, // fallback since no tenant relation
            budget: rfp.budget ? `$${rfp.budget.toLocaleString()}` : "Not specified",
            deadline: rfp.timeline?.submissionDeadline
              ? new Date(rfp.timeline.submissionDeadline).toISOString().split("T")[0]
              : "TBD",
            category: rfp.category || "Uncategorized",
            bids: rfp._count?.submissions ?? 0,
            featured: false
          })))
        } else {
          setFeaturedRFPs([])
        }

        // Map top vendors
        if (vendorsRes && vendorsRes.data) {
          setTopVendors(vendorsRes.data.map((vendor: any) => ({
            id: vendor.id,
            name: vendor.name,
            rating: 0,
            projects: vendor._count?.submissions ?? 0,
            specialties: vendor.categories || [],
            verified: vendor.isActive ?? false
          })))
        } else {
          setTopVendors([])
        }
      } catch (error) {
        toast.error("Failed to load marketplace data")
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      "IT Services": "bg-sky-500/15 text-sky-700 dark:text-sky-400",
      "Marketing": "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
      "Construction": "bg-orange-500/15 text-orange-700 dark:text-orange-400",
      "Consulting": "bg-violet-500/15 text-violet-700 dark:text-violet-400",
      "Design": "bg-pink-500/15 text-pink-700 dark:text-pink-400"
    }
    return colors[category] || "bg-muted text-muted-foreground"
  }

  if (loading) {
    return (
      <MainLayout title="Marketplace">
        <div className="space-y-8">
          <div className="bg-gradient-to-r from-primary to-violet-500 text-white dark:text-white rounded-lg p-8">
            <div className="max-w-3xl">
              <div className="h-10 w-64 bg-white/20 rounded animate-pulse mb-4" />
              <div className="h-6 w-96 bg-white/20 rounded animate-pulse mb-6" />
              <div className="h-10 w-40 bg-white/20 rounded animate-pulse" />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1,2,3,4].map(i => (
              <Card key={i}><CardContent className="p-6"><div className="h-16 bg-muted rounded animate-pulse" /></CardContent></Card>
            ))}
          </div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout title="Marketplace">
      <div className="space-y-8">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-primary to-violet-500 text-white dark:text-white rounded-lg p-8">
          <div className="max-w-3xl">
            <h1 className="text-4xl font-bold mb-4">
              RFP Marketplace
            </h1>
            <p className="text-xl mb-6 opacity-90">
              Connect with top vendors and discover new opportunities. Post your RFPs or bid on projects from organizations worldwide.
            </p>
            <div className="flex space-x-4">
              <Button size="lg" variant="secondary" asChild>
                <Link href="/marketplace/rfps">
                  <Search className="mr-2 h-4 w-4" />
                  Browse RFPs
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="text-white dark:text-white border-white dark:border-white hover:bg-background hover:text-sky-600 dark:hover:text-sky-400" asChild>
                <Link href="/marketplace/vendors">
                  <Users className="mr-2 h-4 w-4" />
                  Find Vendors
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Featured RFPs */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center">
                    <Star className="mr-2 h-5 w-5 text-yellow-500" />
                    Featured RFPs
                  </CardTitle>
                  <CardDescription>
                    High-value opportunities from verified organizations
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/marketplace/rfps">
                    View All <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {featuredRFPs.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">No RFPs available yet.</p>
                ) : (
                  featuredRFPs.map((rfp) => (
                    <div key={rfp.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-lg">{rfp.title}</h3>
                        <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400">
                          Featured
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-3">
                        <span className="flex items-center">
                          <Building className="mr-1 h-3 w-3" />
                          {rfp.organization}
                        </span>
                        <span className="flex items-center">
                          <DollarSign className="mr-1 h-3 w-3" />
                          {rfp.budget}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Badge className={getCategoryColor(rfp.category)}>
                            {rfp.category}
                          </Badge>
                          <span className="flex items-center text-sm text-muted-foreground">
                            <Clock className="mr-1 h-3 w-3" />
                            {rfp.deadline}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-muted-foreground">
                            {rfp.bids} bids
                          </span>
                          <Button size="sm" asChild>
                            <Link href={`/marketplace/rfps/${rfp.id}`}>
                              View Details
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Top Vendors */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center">
                    <Users className="mr-2 h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    Top Vendors
                  </CardTitle>
                  <CardDescription>
                    Highest-rated service providers on our platform
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/marketplace/vendors">
                    View All <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topVendors.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">No vendors registered yet.</p>
                ) : (
                  topVendors.map((vendor) => (
                    <div key={vendor.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-lg">{vendor.name}</h3>
                        <div className="flex items-center space-x-2">
                          {vendor.verified && (
                            <Badge className="bg-sky-500/15 text-sky-700 dark:text-sky-400">
                              Verified
                            </Badge>
                          )}
                          <div className="flex items-center">
                            <Star className="mr-1 h-4 w-4 text-yellow-500" />
                            <span className="font-medium">{vendor.rating || "N/A"}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-3">
                        <span className="flex items-center">
                          <CheckCircle className="mr-1 h-3 w-3" />
                          {vendor.projects} projects
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1 mb-3">
                        {(vendor.specialties || []).slice(0, 3).map((specialty: string, index: number) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {specialty}
                          </Badge>
                        ))}
                      </div>
                      <Button size="sm" className="w-full" asChild>
                        <Link href={`/marketplace/vendors/${vendor.id}`}>
                          View Profile
                        </Link>
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Get Started</CardTitle>
            <CardDescription>
              Choose how you want to participate in the marketplace
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader className="text-center">
                  <Search className="h-12 w-12 mx-auto mb-4 text-sky-600 dark:text-sky-400" />
                  <CardTitle className="text-lg">Find RFPs</CardTitle>
                  <CardDescription>
                    Browse and bid on opportunities that match your expertise
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <Button className="w-full" asChild>
                    <Link href="/marketplace/rfps">
                      Browse RFPs
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader className="text-center">
                  <Store className="h-12 w-12 mx-auto mb-4 text-emerald-600 dark:text-emerald-400" />
                  <CardTitle className="text-lg">Post RFP</CardTitle>
                  <CardDescription>
                    Publish your RFP to reach qualified vendors
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <Button className="w-full" asChild>
                    <Link href="/rfps/create">
                      Create RFP
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader className="text-center">
                  <Users className="h-12 w-12 mx-auto mb-4 text-violet-600 dark:text-violet-400" />
                  <CardTitle className="text-lg">Join as Vendor</CardTitle>
                  <CardDescription>
                    Create your vendor profile and start bidding
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <Button className="w-full" asChild>
                    <Link href="/marketplace/vendors/register">
                      Register Now
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}