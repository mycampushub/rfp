import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Store,
  Search,
  Users,
  TrendingUp,
  Star,
  Clock,
  DollarSign,
  Building,
  Globe,
  ArrowRight,
  CheckCircle
} from "lucide-react"
import Link from "next/link"
import { getTenantContextAsync } from "@/lib/tenant-context"
import { db } from "@/lib/db"
import { format } from "date-fns"

function getCategoryColor(category: string) {
  const colors: Record<string, string> = {
    "IT Services": "bg-blue-100 text-blue-800",
    "Marketing": "bg-green-100 text-green-800",
    "Construction": "bg-orange-100 text-orange-800",
    "Consulting": "bg-purple-100 text-purple-800",
    "Design": "bg-pink-100 text-pink-800"
  }
  return colors[category] || "bg-gray-100 text-gray-800"
}

function formatBudget(budget: number | null | undefined): string {
  if (budget == null) return "TBD"
  if (budget >= 1_000_000) return `$${(budget / 1_000_000).toFixed(1)}M`
  if (budget >= 1_000) return `$${(budget / 1_000).toFixed(0)}K`
  return `$${budget.toLocaleString()}`
}

export default async function Marketplace() {
  let tenantId: string
  try {
    const ctx = await getTenantContextAsync()
    tenantId = ctx.tenantId
  } catch {
    return null
  }

  const [publishedRfps, totalVendors, totalSubmissions, totalBudgetResult, awardedCount] = await Promise.all([
    db.rFP.count({ where: { status: "published" } }),
    db.vendor.count({ where: { isActive: true } }),
    db.submission.count({}),
    db.rFP.aggregate({
      where: { status: "published" },
      _sum: { budget: true },
    }),
    db.rFP.count({ where: { status: "awarded" } }),
  ])

  const totalBudget = totalBudgetResult._sum.budget ?? 0
  const totalRfps = publishedRfps + awardedCount
  const successRate = totalRfps > 0 ? Math.round((awardedCount / totalRfps) * 100) : 0

  const featuredRFPs = await db.rFP.findMany({
    where: { status: "published" },
    orderBy: { createdAt: "desc" },
    take: 6,
    select: { id: true, title: true, category: true, budget: true, closeAt: true, createdAt: true },
  })

  // Get top vendors by number of submissions
  const topVendorIds = await db.submission.groupBy({
    by: ["vendorId"],
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
    take: 3,
  })

  let topVendors: Array<{
    id: string
    name: string
    categories: unknown
    _count: { id: number }
  }> = []
  if (topVendorIds.length > 0) {
    topVendors = await db.vendor.findMany({
      where: { id: { in: topVendorIds.map(v => v.vendorId) }, isActive: true },
      select: { id: true, name: true, categories: true },
    }).then(vendors =>
      vendors.map(v => ({
        ...v,
        _count: { id: topVendorIds.find(t => t.vendorId === v.id)?._count.id ?? 0 },
      }))
    )
  }

  const stats = [
    {
      title: "Active RFPs",
      value: String(publishedRfps),
      description: "Available for bidding",
      icon: Search,
      color: "text-blue-600"
    },
    {
      title: "Registered Vendors",
      value: totalVendors.toLocaleString(),
      description: "Ready to respond",
      icon: Users,
      color: "text-green-600"
    },
    {
      title: "Total Value",
      value: formatBudget(totalBudget),
      description: "In active RFPs",
      icon: DollarSign,
      color: "text-purple-600"
    },
    {
      title: "Success Rate",
      value: `${successRate}%`,
      description: "Projects completed",
      icon: CheckCircle,
      color: "text-orange-600"
    }
  ]

  function parseCategories(categories: unknown): string[] {
    if (!categories || !Array.isArray(categories)) return []
    return categories.filter((c): c is string => typeof c === "string")
  }

  return (
    <MainLayout title="Marketplace">
      <div className="space-y-8">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg p-8">
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
              <Button size="lg" variant="outline" className="text-white border-white hover:bg-white hover:text-blue-600" asChild>
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
                  <p className="text-sm text-muted-foreground">No published RFPs available right now.</p>
                ) : (
                  featuredRFPs.map((rfp) => (
                    <div key={rfp.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-lg">{rfp.title}</h3>
                        <Badge className="bg-yellow-100 text-yellow-800">
                          Featured
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-3">
                        <span className="flex items-center">
                          <DollarSign className="mr-1 h-3 w-3" />
                          {formatBudget(rfp.budget)}
                        </span>
                        {rfp.closeAt && (
                          <span className="flex items-center">
                            <Clock className="mr-1 h-3 w-3" />
                            {format(new Date(rfp.closeAt), "MMM d, yyyy")}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {rfp.category && (
                            <Badge className={getCategoryColor(rfp.category)}>
                              {rfp.category}
                            </Badge>
                          )}
                        </div>
                        <Button size="sm" asChild>
                          <Link href={`/marketplace/rfps/${rfp.id}`}>
                            View Details
                          </Link>
                        </Button>
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
                    <Users className="mr-2 h-5 w-5 text-green-600" />
                    Top Vendors
                  </CardTitle>
                  <CardDescription>
                    Most active service providers on our platform
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
                  <p className="text-sm text-muted-foreground">No vendors with submissions yet.</p>
                ) : (
                  topVendors.map((vendor) => {
                    const cats = parseCategories(vendor.categories)
                    return (
                      <div key={vendor.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-lg">{vendor.name}</h3>
                          <div className="flex items-center space-x-2">
                            <Badge className="bg-blue-100 text-blue-800">
                              Verified
                            </Badge>
                            <div className="flex items-center">
                              <CheckCircle className="mr-1 h-4 w-4 text-green-500" />
                              <span className="font-medium">{vendor._count.id}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-3">
                          <span className="flex items-center">
                            <TrendingUp className="mr-1 h-3 w-3" />
                            {vendor._count.id} {vendor._count.id === 1 ? "submission" : "submissions"}
                          </span>
                        </div>
                        {cats.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-3">
                            {cats.slice(0, 3).map((specialty, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {specialty}
                              </Badge>
                            ))}
                          </div>
                        )}
                        <Button size="sm" className="w-full" asChild>
                          <Link href={`/marketplace/vendors/${vendor.id}`}>
                            View Profile
                          </Link>
                        </Button>
                      </div>
                    )
                  })
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
                  <Search className="h-12 w-12 mx-auto mb-4 text-blue-600" />
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
                  <Store className="h-12 w-12 mx-auto mb-4 text-green-600" />
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
                  <Users className="h-12 w-12 mx-auto mb-4 text-purple-600" />
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