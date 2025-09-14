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
  Users, 
  MapPin, 
  CheckCircle,
  Briefcase,
  ArrowRight,
  Building,
  Award,
  Globe,
  Phone,
  Mail
} from "lucide-react"
import Link from "next/link"
import { useState } from "react"

export default function MarketplaceVendors() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedLocation, setSelectedLocation] = useState("all")
  const [selectedRating, setSelectedRating] = useState("all")

  // Mock data for vendors
  const vendors = [
    {
      id: "1",
      name: "TechSolutions Pro",
      description: "Leading cloud services and software development company with 10+ years of experience delivering enterprise solutions.",
      rating: 4.9,
      reviews: 127,
      projects: 156,
      employees: "50-200",
      founded: 2014,
      location: "San Francisco, CA",
      website: "https://techsolutions.example.com",
      verified: true,
      specialties: ["Cloud Services", "Software Development", "DevOps", "Cybersecurity"],
      categories: ["IT Services", "Software Development"],
      hourlyRate: "$150-200",
      responseTime: "2 hours",
      featured: true
    },
    {
      id: "2",
      name: "Marketing Masters",
      description: "Full-service digital marketing agency specializing in brand strategy, content creation, and performance marketing.",
      rating: 4.8,
      reviews: 89,
      projects: 203,
      employees: "20-50",
      founded: 2018,
      location: "New York, NY",
      website: "https://marketingmasters.example.com",
      verified: true,
      specialties: ["Digital Marketing", "Brand Strategy", "Content Marketing", "SEO/SEM"],
      categories: ["Marketing", "Design"],
      hourlyRate: "$100-150",
      responseTime: "1 hour",
      featured: true
    },
    {
      id: "3",
      name: "BuildRight Construction",
      description: "Commercial construction company with expertise in office buildings, retail spaces, and industrial facilities.",
      rating: 4.7,
      reviews: 156,
      projects: 89,
      employees: "200-500",
      founded: 2005,
      location: "Chicago, IL",
      website: "https://buildright.example.com",
      verified: true,
      specialties: ["Commercial Construction", "Renovation", "Project Management", "Design-Build"],
      categories: ["Construction", "Engineering"],
      hourlyRate: "$75-125",
      responseTime: "4 hours",
      featured: false
    },
    {
      id: "4",
      name: "Data Insights Consulting",
      description: "Business intelligence and data analytics consulting firm helping companies make data-driven decisions.",
      rating: 4.6,
      reviews: 67,
      projects: 94,
      employees: "10-20",
      founded: 2019,
      location: "Austin, TX",
      website: "https://datainsights.example.com",
      verified: false,
      specialties: ["Data Analytics", "Business Intelligence", "Machine Learning", "Visualization"],
      categories: ["Consulting", "IT Services"],
      hourlyRate: "$120-180",
      responseTime: "3 hours",
      featured: false
    },
    {
      id: "5",
      name: "Creative Studio Pro",
      description: "Award-winning design agency specializing in brand identity, web design, and user experience design.",
      rating: 4.8,
      reviews: 112,
      projects: 167,
      employees: "15-30",
      founded: 2016,
      location: "Los Angeles, CA",
      website: "https://creativestudio.example.com",
      verified: true,
      specialties: ["Brand Identity", "Web Design", "UI/UX Design", "Graphic Design"],
      categories: ["Design", "Marketing"],
      hourlyRate: "$80-120",
      responseTime: "2 hours",
      featured: true
    },
    {
      id: "6",
      name: "Legal Eagles LLP",
      description: "Full-service law firm with expertise in corporate law, contracts, and regulatory compliance.",
      rating: 4.5,
      reviews: 78,
      projects: 234,
      employees: "50-100",
      founded: 2008,
      location: "Boston, MA",
      website: "https://legaleagles.example.com",
      verified: true,
      specialties: ["Corporate Law", "Contract Review", "Compliance", "Intellectual Property"],
      categories: ["Legal", "Consulting"],
      hourlyRate: "$200-300",
      responseTime: "1 hour",
      featured: false
    }
  ]

  const categories = [
    "all", "IT Services", "Marketing", "Construction", "Software Development", 
    "Consulting", "Design", "Engineering", "Legal", "Healthcare"
  ]

  const locations = [
    "all", "San Francisco, CA", "New York, NY", "Chicago, IL", "Austin, TX", 
    "Los Angeles, CA", "Boston, MA", "Seattle, WA", "Remote"
  ]

  const ratings = [
    { value: "all", label: "Any Rating" },
    { value: "4.5+", label: "4.5+ Stars" },
    { value: "4.0+", label: "4.0+ Stars" },
    { value: "3.5+", label: "3.5+ Stars" }
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

  const filteredVendors = vendors.filter(vendor => {
    const matchesSearch = vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vendor.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vendor.specialties.some(specialty => 
                           specialty.toLowerCase().includes(searchTerm.toLowerCase())
                         )
    const matchesCategory = selectedCategory === "all" || 
                            vendor.categories.includes(selectedCategory)
    const matchesLocation = selectedLocation === "all" || vendor.location === selectedLocation
    const matchesRating = selectedRating === "all" || 
                          (selectedRating === "4.5+" && vendor.rating >= 4.5) ||
                          (selectedRating === "4.0+" && vendor.rating >= 4.0) ||
                          (selectedRating === "3.5+" && vendor.rating >= 3.5)
    
    return matchesSearch && matchesCategory && matchesLocation && matchesRating
  })

  return (
    <MainLayout title="Vendor Directory">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Vendor Directory</h1>
            <p className="text-muted-foreground mt-1">
              Discover and connect with top-rated service providers
            </p>
          </div>
          <Button asChild>
            <Link href="/marketplace/vendors/register">
              <Users className="mr-2 h-4 w-4" />
              Register as Vendor
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
                <label className="text-sm font-medium">Search Vendors</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, specialty..."
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

              <div className="space-y-2">
                <label className="text-sm font-medium">Minimum Rating</label>
                <Select value={selectedRating} onValueChange={setSelectedRating}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select rating" />
                  </SelectTrigger>
                  <SelectContent>
                    {ratings.map((rating) => (
                      <SelectItem key={rating.value} value={rating.value}>
                        {rating.label}
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
            Showing {filteredVendors.length} of {vendors.length} vendors
          </p>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground">Sort by:</span>
            <Select defaultValue="rating">
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rating">Highest Rated</SelectItem>
                <SelectItem value="projects">Most Projects</SelectItem>
                <SelectItem value="reviews">Most Reviews</SelectItem>
                <SelectItem value="newest">Newest</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Vendor Listings */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredVendors.map((vendor) => (
            <Card key={vendor.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                {/* Vendor Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="text-lg font-semibold">{vendor.name}</h3>
                      {vendor.verified && (
                        <Badge className="bg-blue-100 text-blue-800">
                          <CheckCircle className="mr-1 h-3 w-3" />
                          Verified
                        </Badge>
                      )}
                      {vendor.featured && (
                        <Badge className="bg-yellow-100 text-yellow-800">
                          <Star className="mr-1 h-3 w-3" />
                          Featured
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-3">
                      <span className="flex items-center">
                        <MapPin className="mr-1 h-3 w-3" />
                        {vendor.location}
                      </span>
                      <span className="flex items-center">
                        <Users className="mr-1 h-3 w-3" />
                        {vendor.employees}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Rating */}
                <div className="flex items-center space-x-2 mb-3">
                  <div className="flex items-center">
                    <Star className="mr-1 h-4 w-4 text-yellow-500" />
                    <span className="font-medium">{vendor.rating}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    ({vendor.reviews} reviews)
                  </span>
                  <span className="text-sm text-muted-foreground">•</span>
                  <span className="text-sm text-muted-foreground">
                    {vendor.projects} projects
                  </span>
                </div>

                {/* Description */}
                <p className="text-muted-foreground text-sm mb-4 line-clamp-3">
                  {vendor.description}
                </p>

                {/* Specialties */}
                <div className="flex flex-wrap gap-1 mb-4">
                  {vendor.specialties.slice(0, 3).map((specialty, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {specialty}
                    </Badge>
                  ))}
                  {vendor.specialties.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{vendor.specialties.length - 3} more
                    </Badge>
                  )}
                </div>

                {/* Categories */}
                <div className="flex flex-wrap gap-1 mb-4">
                  {vendor.categories.map((category, index) => (
                    <Badge key={index} className={getCategoryColor(category)}>
                      {category}
                    </Badge>
                  ))}
                </div>

                {/* Quick Info */}
                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground mb-4">
                  <div className="flex items-center">
                    <Briefcase className="mr-1 h-3 w-3" />
                    {vendor.hourlyRate}/hr
                  </div>
                  <div className="flex items-center">
                    <Phone className="mr-1 h-3 w-3" />
                    {vendor.responseTime} response
                  </div>
                  <div className="flex items-center">
                    <Building className="mr-1 h-3 w-3" />
                    Since {vendor.founded}
                  </div>
                  <div className="flex items-center">
                    <Globe className="mr-1 h-3 w-3" />
                    <a href={vendor.website} target="_blank" rel="noopener noreferrer" 
                       className="text-blue-600 hover:underline">
                      Website
                    </a>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex space-x-2">
                  <Button className="flex-1" asChild>
                    <Link href={`/marketplace/vendors/${vendor.id}`}>
                      View Profile
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/marketplace/vendors/${vendor.id}#contact`}>
                      <Mail className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredVendors.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No vendors found</h3>
              <p className="text-muted-foreground mb-4">
                Try adjusting your search criteria or filters to find more vendors.
              </p>
              <Button onClick={() => {
                setSearchTerm("")
                setSelectedCategory("all")
                setSelectedLocation("all")
                setSelectedRating("all")
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