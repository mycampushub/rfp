"use client"

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

export default function Marketplace() {
  // Mock data for marketplace stats
  const stats = [
    {
      title: "Active RFPs",
      value: "156",
      description: "Available for bidding",
      icon: Search,
      color: "text-blue-600"
    },
    {
      title: "Registered Vendors",
      value: "2,847",
      description: "Ready to respond",
      icon: Users,
      color: "text-green-600"
    },
    {
      title: "Total Value",
      value: "$12.5M",
      description: "In active RFPs",
      icon: DollarSign,
      color: "text-purple-600"
    },
    {
      title: "Success Rate",
      value: "94%",
      description: "Projects completed",
      icon: CheckCircle,
      color: "text-orange-600"
    }
  ]

  // Mock featured RFPs
  const featuredRFPs = [
    {
      id: "1",
      title: "Enterprise Cloud Migration Services",
      organization: "TechCorp Inc.",
      budget: "$500,000 - $750,000",
      deadline: "2024-12-30",
      category: "IT Services",
      bids: 12,
      featured: true
    },
    {
      id: "2",
      title: "Digital Marketing Campaign",
      organization: "Global Retail Co.",
      budget: "$100,000 - $200,000",
      deadline: "2024-12-25",
      category: "Marketing",
      bids: 8,
      featured: true
    },
    {
      id: "3",
      title: "Office Building Renovation",
      organization: "Property Management LLC",
      budget: "$250,000 - $400,000",
      deadline: "2025-01-15",
      category: "Construction",
      bids: 15,
      featured: true
    }
  ]

  // Mock top vendors
  const topVendors = [
    {
      id: "1",
      name: "TechSolutions Pro",
      rating: 4.9,
      projects: 127,
      specialties: ["Cloud Services", "Software Development"],
      verified: true
    },
    {
      id: "2",
      name: "Marketing Masters",
      rating: 4.8,
      projects: 89,
      specialties: ["Digital Marketing", "Brand Strategy"],
      verified: true
    },
    {
      id: "3",
      name: "BuildRight Construction",
      rating: 4.7,
      projects: 156,
      specialties: ["Commercial Construction", "Renovation"],
      verified: true
    }
  ]

  const getCategoryColor = (category: string) => {
    const colors = {
      "IT Services": "bg-blue-100 text-blue-800",
      "Marketing": "bg-green-100 text-green-800",
      "Construction": "bg-orange-100 text-orange-800",
      "Consulting": "bg-purple-100 text-purple-800",
      "Design": "bg-pink-100 text-pink-800"
    }
    return colors[category as keyof typeof colors] || "bg-gray-100 text-gray-800"
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
                {featuredRFPs.map((rfp) => (
                  <div key={rfp.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-lg">{rfp.title}</h3>
                      <Badge className="bg-yellow-100 text-yellow-800">
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
                ))}
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
                {topVendors.map((vendor) => (
                  <div key={vendor.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-lg">{vendor.name}</h3>
                      <div className="flex items-center space-x-2">
                        {vendor.verified && (
                          <Badge className="bg-blue-100 text-blue-800">
                            Verified
                          </Badge>
                        )}
                        <div className="flex items-center">
                          <Star className="mr-1 h-4 w-4 text-yellow-500" />
                          <span className="font-medium">{vendor.rating}</span>
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
                      {vendor.specialties.map((specialty, index) => (
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
                ))}
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