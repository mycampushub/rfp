"use client"

import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Search, 
  Filter, 
  Star, 
  Clock, 
  DollarSign, 
  Building,
  Users,
  ArrowRight,
  Calendar,
  MapPin,
  Briefcase
} from "lucide-react"
import Link from "next/link"
import { useState } from "react"

export default function MarketplaceRFPs() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedBudget, setSelectedBudget] = useState("all")
  const [selectedLocation, setSelectedLocation] = useState("all")

  // Mock data for RFPs
  const rfps = [
    {
      id: "1",
      title: "Enterprise Cloud Migration Services",
      organization: "TechCorp Inc.",
      description: "Seeking experienced cloud service provider for large-scale migration of on-premise infrastructure to AWS/Azure.",
      budget: "$500,000 - $750,000",
      deadline: "2024-12-30",
      category: "IT Services",
      location: "Remote",
      bids: 12,
      featured: true,
      postedDate: "2024-11-15",
      complexity: "High"
    },
    {
      id: "2",
      title: "Digital Marketing Campaign",
      organization: "Global Retail Co.",
      description: "Looking for creative agency to design and execute comprehensive digital marketing campaign for Q1 2025.",
      budget: "$100,000 - $200,000",
      deadline: "2024-12-25",
      category: "Marketing",
      location: "New York, NY",
      bids: 8,
      featured: true,
      postedDate: "2024-11-20",
      complexity: "Medium"
    },
    {
      id: "3",
      title: "Office Building Renovation",
      organization: "Property Management LLC",
      description: "Complete renovation of 50,000 sq ft office building including modernization of all systems and interiors.",
      budget: "$250,000 - $400,000",
      deadline: "2025-01-15",
      category: "Construction",
      location: "Chicago, IL",
      bids: 15,
      featured: false,
      postedDate: "2024-11-10",
      complexity: "High"
    },
    {
      id: "4",
      title: "Mobile App Development",
      organization: "StartupXYZ",
      description: "Need experienced mobile development team to build cross-platform e-commerce mobile application.",
      budget: "$80,000 - $120,000",
      deadline: "2024-12-20",
      category: "Software Development",
      location: "Remote",
      bids: 6,
      featured: false,
      postedDate: "2024-11-18",
      complexity: "Medium"
    },
    {
      id: "5",
      title: "Financial Consulting Services",
      organization: "Investment Firm",
      description: "Seeking financial consultants for portfolio optimization and risk assessment services.",
      budget: "$150,000 - $300,000",
      deadline: "2025-01-10",
      category: "Consulting",
      location: "Boston, MA",
      bids: 4,
      featured: false,
      postedDate: "2024-11-12",
      complexity: "High"
    },
    {
      id: "6",
      title: "Brand Identity Design",
      organization: "Fashion Brand",
      description: "Looking for creative designers to develop complete brand identity including logo, colors, and brand guidelines.",
      budget: "$25,000 - $50,000",
      deadline: "2024-12-15",
      category: "Design",
      location: "Los Angeles, CA",
      bids: 9,
      featured: false,
      postedDate: "2024-11-22",
      complexity: "Low"
    }
  ]

  const categories = [
    "all", "IT Services", "Marketing", "Construction", "Software Development", 
    "Consulting", "Design", "Engineering", "Legal", "Healthcare"
  ]

  const budgetRanges = [
    { value: "all", label: "Any Budget" },
    { value: "0-50k", label: "Under $50,000" },
    { value: "50k-100k", label: "$50,000 - $100,000" },
    { value: "100k-250k", label: "$100,000 - $250,000" },
    { value: "250k-500k", label: "$250,000 - $500,000" },
    { value: "500k+", label: "Over $500,000" }
  ]

  const locations = [
    "all", "Remote", "New York, NY", "Los Angeles, CA", "Chicago, IL", 
    "Boston, MA", "San Francisco, CA", "Austin, TX", "Seattle, WA"
  ]

  const getCategoryColor = (category: string) => {
    const colors = {
      "IT Services": "bg-blue-100 text-blue-800",
      "Marketing": "bg-green-100 text-green-800",
      "Construction": "bg-orange-100 text-orange-800",
      "Software Development": "bg-purple-100 text-purple-800",
      "Consulting": "bg-indigo-100 text-indigo-800",
      "Design": "bg-pink-100 text-pink-800",
      "Engineering": "bg-yellow-100 text-yellow-800",
      "Legal": "bg-red-100 text-red-800",
      "Healthcare": "bg-teal-100 text-teal-800"
    }
    return colors[category as keyof typeof colors] || "bg-gray-100 text-gray-800"
  }

  const getComplexityColor = (complexity: string) => {
    const colors = {
      "Low": "bg-green-100 text-green-800",
      "Medium": "bg-yellow-100 text-yellow-800",
      "High": "bg-red-100 text-red-800"
    }
    return colors[complexity as keyof typeof colors] || "bg-gray-100 text-gray-800"
  }

  const filteredRFPs = rfps.filter(rfp => {
    const matchesSearch = rfp.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         rfp.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         rfp.organization.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "all" || rfp.category === selectedCategory
    const matchesLocation = selectedLocation === "all" || rfp.location === selectedLocation
    
    return matchesSearch && matchesCategory && matchesLocation
  })

  return (
    <MainLayout title="Browse RFPs">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Browse RFPs</h1>
            <p className="text-muted-foreground mt-1">
              Discover new opportunities and find projects that match your expertise
            </p>
          </div>
          <Button asChild>
            <Link href="/rfps/create">
              <Briefcase className="mr-2 h-4 w-4" />
              Post RFP
            </Link>
          </Button>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Filter className="mr-2 h-5 w-5" />
              Search & Filter
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search RFPs..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Category</label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category === "all" ? "All Categories" : category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Budget Range</label>
                <Select value={selectedBudget} onValueChange={setSelectedBudget}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select budget" />
                  </SelectTrigger>
                  <SelectContent>
                    {budgetRanges.map((range) => (
                      <SelectItem key={range.value} value={range.value}>
                        {range.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Location</label>
                <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map((location) => (
                      <SelectItem key={location} value={location}>
                        {location === "all" ? "All Locations" : location}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results Summary */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {filteredRFPs.length} of {rfps.length} RFPs
          </p>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground">Sort by:</span>
            <Select defaultValue="newest">
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="deadline">Deadline</SelectItem>
                <SelectItem value="budget-high">Budget (High to Low)</SelectItem>
                <SelectItem value="budget-low">Budget (Low to High)</SelectItem>
                <SelectItem value="bids">Most Bids</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* RFP Listings */}
        <div className="space-y-4">
          {filteredRFPs.map((rfp) => (
            <Card key={rfp.id} className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="text-xl font-semibold">{rfp.title}</h3>
                      {rfp.featured && (
                        <Badge className="bg-yellow-100 text-yellow-800">
                          <Star className="mr-1 h-3 w-3" />
                          Featured
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-3">
                      <span className="flex items-center">
                        <Building className="mr-1 h-3 w-3" />
                        {rfp.organization}
                      </span>
                      <span className="flex items-center">
                        <MapPin className="mr-1 h-3 w-3" />
                        {rfp.location}
                      </span>
                      <span className="flex items-center">
                        <Calendar className="mr-1 h-3 w-3" />
                        Posted {rfp.postedDate}
                      </span>
                    </div>
                    <p className="text-muted-foreground mb-4 line-clamp-2">
                      {rfp.description}
                    </p>
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <Badge className={getCategoryColor(rfp.category)}>
                          {rfp.category}
                        </Badge>
                        <Badge className={getComplexityColor(rfp.complexity)}>
                          {rfp.complexity} Complexity
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <span className="flex items-center">
                          <DollarSign className="mr-1 h-3 w-3" />
                          {rfp.budget}
                        </span>
                        <span className="flex items-center">
                          <Clock className="mr-1 h-3 w-3" />
                          Deadline: {rfp.deadline}
                        </span>
                        <span className="flex items-center">
                          <Users className="mr-1 h-3 w-3" />
                          {rfp.bids} bids
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="ml-4">
                    <Button asChild>
                      <Link href={`/marketplace/rfps/${rfp.id}`}>
                        View Details
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredRFPs.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No RFPs found</h3>
              <p className="text-muted-foreground mb-4">
                Try adjusting your search criteria or filters to find more opportunities.
              </p>
              <Button onClick={() => {
                setSearchTerm("")
                setSelectedCategory("all")
                setSelectedBudget("all")
                setSelectedLocation("all")
              }}>
                Clear Filters
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Pagination */}
        <div className="flex justify-center">
          <div className="flex space-x-2">
            <Button variant="outline" disabled>
              Previous
            </Button>
            <Button variant="outline" className="bg-primary text-primary-foreground">
              1
            </Button>
            <Button variant="outline">
              2
            </Button>
            <Button variant="outline">
              3
            </Button>
            <Button variant="outline">
              Next
            </Button>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}