"use client"

import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import { useState, useEffect } from "react"
import { toast } from "sonner"
import { LoadingCards } from "@/components/shared/loading-table"

export default function MarketplaceRFPs() {
  useEffect(() => { document.title = 'Marketplace RFPs | RFP Platform' }, [])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedBudget, setSelectedBudget] = useState("all")
  const [selectedLocation, setSelectedLocation] = useState("all")
  const [rfps, setRfps] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [sortValue, setSortValue] = useState("newest")
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    async function fetchRFPs() {
      try {
        const res = await fetch("/api/v1/rfps?limit=100")
        if (!res.ok) throw new Error("Failed to fetch")
        const json = await res.json()
        setRfps((json.data || []).map((rfp: any) => ({
          id: rfp.id,
          title: rfp.title,
          organization: rfp.title,
          description: rfp.description || "",
          budget: rfp.budget ? `$${rfp.budget.toLocaleString()}` : "Not specified",
          budgetNum: rfp.budget || 0,
          deadline: rfp.timeline?.submissionDeadline
            ? new Date(rfp.timeline.submissionDeadline).toISOString().split("T")[0]
            : "TBD",
          category: rfp.category || "Uncategorized",
          location: rfp.location || "Not specified",
          bids: rfp._count?.submissions ?? 0,
          featured: false,
          postedDate: new Date(rfp.createdAt).toISOString().split("T")[0],
          complexity: rfp.settings?.complexity || "Medium"
        })))
      } catch {
        toast.error("Failed to load RFPs")
      } finally {
        setLoading(false)
      }
    }
    fetchRFPs()
  }, [])

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

  const getComplexityColor = (complexity: string) => {
    const colors: Record<string, string> = {
      "Low": "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
      "Medium": "bg-amber-500/15 text-amber-700 dark:text-amber-400",
      "High": "bg-red-500/15 text-red-700 dark:text-red-400"
    }
    return colors[complexity] || "bg-muted text-muted-foreground"
  }

  const matchesBudget = (rfp: any) => {
    if (selectedBudget === "all") return true
    const b = rfp.budgetNum || 0
    switch (selectedBudget) {
      case "0-50k": return b > 0 && b <= 50000
      case "50k-100k": return b > 50000 && b <= 100000
      case "100k-250k": return b > 100000 && b <= 250000
      case "250k-500k": return b > 250000 && b <= 500000
      case "500k+": return b > 500000
      default: return true
    }
  }

  const filteredRFPs = rfps.filter(rfp => {
    const matchesSearch = rfp.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         rfp.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         rfp.organization.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "all" || rfp.category === selectedCategory
    const matchesLocation = selectedLocation === "all" || rfp.location === selectedLocation
    
    return matchesSearch && matchesCategory && matchesLocation && matchesBudget(rfp)
  })

  const sortedRfps = [...filteredRFPs].sort((a, b) => {
    switch (sortValue) {
      case 'newest': return (b.postedDate || '').localeCompare(a.postedDate || '')
      case 'deadline': return (a.deadline || '').localeCompare(b.deadline || '')
      case 'budget-high': return (b.budgetNum || 0) - (a.budgetNum || 0)
      case 'budget-low': return (a.budgetNum || 0) - (b.budgetNum || 0)
      case 'bids': return (b.bids || 0) - (a.bids || 0)
      default: return 0
    }
  })

  const ITEMS_PER_PAGE = 12
  const totalPages = Math.ceil(sortedRfps.length / ITEMS_PER_PAGE)
  const paginatedRfps = sortedRfps.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

  if (loading) {
    return (
      <MainLayout title="Browse RFPs">
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">Browse RFPs</h1>
              <p className="text-muted-foreground mt-1">Loading...</p>
            </div>
          </div>
          <LoadingCards count={6} />
        </div>
      </MainLayout>
    )
  }

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
            <Select value={sortValue} onValueChange={(v) => { setSortValue(v); setCurrentPage(1) }}>
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
          {paginatedRfps.map((rfp) => (
            <Card key={rfp.id} className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="text-xl font-semibold">{rfp.title}</h3>
                      {rfp.featured && (
                        <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400">
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

        {sortedRfps.length === 0 && (
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