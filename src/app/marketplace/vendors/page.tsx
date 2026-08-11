"use client"

import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Filter, Star, Users, MapPin, CheckCircle, Briefcase, Building, Globe, Phone, Mail } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { toast } from "sonner"
import { LoadingCards } from "@/components/shared/loading-table"

export default function MarketplaceVendors() {
  useEffect(() => { document.title = 'Vendor Directory | RFP Platform' }, [])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedLocation, setSelectedLocation] = useState("all")
  const [selectedRating, setSelectedRating] = useState("all")
  const [vendors, setVendors] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [sortValue, setSortValue] = useState("rating")
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    async function fetchVendors() {
      try {
        const res = await fetch("/api/v1/vendors?limit=100")
        if (!res.ok) throw new Error("Failed to fetch")
        const json = await res.json()
        setVendors((json.data || []).map((v: any) => ({
          id: v.id,
          name: v.name,
          description: v.contactInfo?.address || "",
          rating: 0,
          reviews: 0,
          projects: v._count?.submissions ?? 0,
          employees: "",
          founded: "",
          location: v.contactInfo?.address || "N/A",
          website: v.contactInfo?.website || "",
          verified: v.isActive ?? false,
          specialties: v.categories || [],
          categories: v.categories || [],
          certifications: v.certifications || [],
          hourlyRate: "",
          responseTime: "",
          featured: false,
          email: v.contactInfo?.email || "",
          phone: v.contactInfo?.phone || "",
          createdAt: v.createdAt || "",
        })))
      } catch {
        toast.error("Failed to load vendors")
      } finally {
        setLoading(false)
      }
    }
    fetchVendors()
  }, [])

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
    const colors: Record<string, string> = {
      "IT Services": "bg-sky-500/15 text-sky-700 dark:text-sky-400",
      "Marketing": "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
      "Construction": "bg-orange-500/15 text-orange-700 dark:text-orange-400",
      "Software Development": "bg-violet-500/15 text-violet-700 dark:text-violet-400",
      "Consulting": "bg-indigo-500/15 text-indigo-700 dark:text-indigo-400",
      "Design": "bg-pink-500/15 text-pink-700 dark:text-pink-400",
      "Engineering": "bg-amber-500/15 text-amber-700 dark:text-amber-400",
      "Legal": "bg-red-500/15 text-red-700 dark:text-red-400",
      "Healthcare": "bg-teal-500/15 text-teal-700 dark:text-teal-400"
    }
    return colors[category] || "bg-muted text-muted-foreground"
  }

  const filteredVendors = vendors.filter(vendor => {
    const matchesSearch = vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vendor.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vendor.specialties.some((s: string) => 
                           s.toLowerCase().includes(searchTerm.toLowerCase())
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

  const sortedVendors = [...filteredVendors].sort((a, b) => {
    switch (sortValue) {
      case 'rating': return (b.rating || 0) - (a.rating || 0)
      case 'projects': return (b.projects || 0) - (a.projects || 0)
      case 'reviews': return (b.reviews || 0) - (a.reviews || 0)
      case 'newest': return (b.createdAt || '').localeCompare(a.createdAt || '')
      default: return 0
    }
  })

  const ITEMS_PER_PAGE = 12
  const totalPages = Math.ceil(sortedVendors.length / ITEMS_PER_PAGE)
  const paginatedVendors = sortedVendors.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

  if (loading) {
    return (
      <MainLayout title="Vendor Directory">
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">Vendor Directory</h1>
              <p className="text-muted-foreground mt-1">Loading...</p>
            </div>
          </div>
          <LoadingCards count={6} />
        </div>
      </MainLayout>
    )
  }

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
            <Select value={sortValue} onValueChange={(v) => { setSortValue(v); setCurrentPage(1) }}>
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
          {paginatedVendors.map((vendor) => (
            <Card key={vendor.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                {/* Vendor Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="text-lg font-semibold">{vendor.name}</h3>
                      {vendor.verified && (
                        <Badge className="bg-sky-500/15 text-sky-700 dark:text-sky-400">
                          <CheckCircle className="mr-1 h-3 w-3" />
                          Verified
                        </Badge>
                      )}
                      {vendor.featured && (
                        <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400">
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
                      {vendor.employees && (
                        <span className="flex items-center">
                          <Users className="mr-1 h-3 w-3" />
                          {vendor.employees}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Rating */}
                <div className="flex items-center space-x-2 mb-3">
                  <div className="flex items-center">
                    <Star className="mr-1 h-4 w-4 text-yellow-500" />
                    <span className="font-medium">{vendor.rating || "N/A"}</span>
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
                  {vendor.description || "No description available."}
                </p>

                {/* Specialties */}
                <div className="flex flex-wrap gap-1 mb-4">
                  {vendor.specialties.slice(0, 3).map((specialty: string, index: number) => (
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
                  {vendor.categories.map((category: string, index: number) => (
                    <Badge key={index} className={getCategoryColor(category)}>
                      {category}
                    </Badge>
                  ))}
                </div>

                {/* Quick Info */}
                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground mb-4">
                  {vendor.hourlyRate && (
                    <div className="flex items-center">
                      <Briefcase className="mr-1 h-3 w-3" />
                      {vendor.hourlyRate}/hr
                    </div>
                  )}
                  {vendor.phone && (
                    <div className="flex items-center">
                      <Phone className="mr-1 h-3 w-3" />
                      {vendor.phone}
                    </div>
                  )}
                  {vendor.founded && (
                    <div className="flex items-center">
                      <Building className="mr-1 h-3 w-3" />
                      Since {vendor.founded}
                    </div>
                  )}
                  {vendor.website ? (
                    <div className="flex items-center">
                      <Globe className="mr-1 h-3 w-3" />
                      <a href={vendor.website} target="_blank" rel="noopener noreferrer" 
                         className="text-sky-600 dark:text-sky-400 hover:underline">
                        Website
                      </a>
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <Globe className="mr-1 h-3 w-3" />
                      <span>No website</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex space-x-2">
                  <Button className="flex-1" asChild>
                    <Link href={`/marketplace/vendors/${vendor.id}`}>
                      View Profile
                    </Link>
                  </Button>
                  {vendor.email && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={`mailto:${vendor.email}`}>
                        <Mail className="h-4 w-4" />
                      </a>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {sortedVendors.length === 0 && (
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
        {totalPages > 1 && (
        <div className="flex justify-center">
          <div className="flex space-x-2">
            <Button variant="outline" disabled={currentPage <= 1} onClick={() => setCurrentPage(p => p - 1)}>
              Previous
            </Button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <Button
                key={page}
                variant="outline"
                className={page === currentPage ? 'bg-primary text-primary-foreground' : ''}
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </Button>
            ))}
            <Button variant="outline" disabled={currentPage >= totalPages} onClick={() => setCurrentPage(p => p + 1)}>
              Next
            </Button>
          </div>
        </div>
        )}
      </div>
    </MainLayout>
  )
}