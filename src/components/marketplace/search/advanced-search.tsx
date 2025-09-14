"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { 
  Search, 
  Filter, 
  SlidersHorizontal, 
  X,
  ChevronDown,
  ChevronUp,
  MapPin,
  DollarSign,
  Calendar,
  Star,
  Briefcase,
  Users,
  Clock,
  RotateCcw
} from "lucide-react"

interface SearchFiltersProps {
  onFiltersChange: (filters: SearchFilters) => void
  onSearch: (query: string) => void
  initialFilters?: SearchFilters
  initialQuery?: string
}

export interface SearchFilters {
  query: string
  categories: string[]
  location: string
  budgetRange: string
  experience: string
  rating: number
  postedWithin: string
  status: string[]
  sortBy: string
  sortOrder: "asc" | "desc"
}

export function AdvancedSearch({ 
  onFiltersChange, 
  onSearch, 
  initialFilters,
  initialQuery = ""
}: SearchFiltersProps) {
  const [filters, setFilters] = useState<SearchFilters>(initialFilters || {
    query: initialQuery,
    categories: [],
    location: "",
    budgetRange: "",
    experience: "",
    rating: 0,
    postedWithin: "",
    status: [],
    sortBy: "relevance",
    sortOrder: "desc"
  })

  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false)

  const categories = [
    "IT Services", "Marketing", "Construction", "Software Development", 
    "Consulting", "Design", "Engineering", "Legal", "Healthcare", "Other"
  ]

  const budgetRanges = [
    { value: "", label: "Any Budget" },
    { value: "0-10k", label: "Under $10,000" },
    { value: "10k-25k", label: "$10,000 - $25,000" },
    { value: "25k-50k", label: "$25,000 - $50,000" },
    { value: "50k-100k", label: "$50,000 - $100,000" },
    { value: "100k-250k", label: "$100,000 - $250,000" },
    { value: "250k-500k", label: "$250,000 - $500,000" },
    { value: "500k+", label: "Over $500,000" }
  ]

  const experienceLevels = [
    { value: "", label: "Any Experience" },
    { value: "entry", label: "Entry Level (0-2 years)" },
    { value: "mid", label: "Mid Level (3-5 years)" },
    { value: "senior", label: "Senior Level (6-10 years)" },
    { value: "expert", label: "Expert (10+ years)" }
  ]

  const postedWithinOptions = [
    { value: "", label: "Any Time" },
    { value: "today", label: "Today" },
    { value: "week", label: "This Week" },
    { value: "month", label: "This Month" },
    { value: "quarter", label: "This Quarter" }
  ]

  const statusOptions = [
    { value: "active", label: "Active" },
    { value: "featured", label: "Featured" },
    { value: "urgent", label: "Urgent" }
  ]

  const sortOptions = [
    { value: "relevance", label: "Relevance" },
    { value: "posted", label: "Date Posted" },
    { value: "deadline", label: "Deadline" },
    { value: "budget", label: "Budget" },
    { value: "bids", label: "Number of Bids" },
    { value: "rating", label: "Vendor Rating" }
  ]

  const updateFilter = (key: keyof SearchFilters, value: any) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    onFiltersChange(newFilters)
  }

  const handleSearch = (query: string) => {
    updateFilter("query", query)
    onSearch(query)
  }

  const toggleCategory = (category: string) => {
    const newCategories = filters.categories.includes(category)
      ? filters.categories.filter(c => c !== category)
      : [...filters.categories, category]
    updateFilter("categories", newCategories)
  }

  const toggleStatus = (status: string) => {
    const newStatus = filters.status.includes(status)
      ? filters.status.filter(s => s !== status)
      : [...filters.status, status]
    updateFilter("status", newStatus)
  }

  const clearAllFilters = () => {
    const resetFilters: SearchFilters = {
      query: "",
      categories: [],
      location: "",
      budgetRange: "",
      experience: "",
      rating: 0,
      postedWithin: "",
      status: [],
      sortBy: "relevance",
      sortOrder: "desc"
    }
    setFilters(resetFilters)
    onFiltersChange(resetFilters)
    onSearch("")
  }

  const getActiveFiltersCount = () => {
    let count = 0
    if (filters.categories.length > 0) count++
    if (filters.location) count++
    if (filters.budgetRange) count++
    if (filters.experience) count++
    if (filters.rating > 0) count++
    if (filters.postedWithin) count++
    if (filters.status.length > 0) count++
    return count
  }

  return (
    <div className="space-y-4">
      {/* Main Search Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex space-x-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search RFPs, vendors, or keywords..."
                value={filters.query}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}>
              <SlidersHorizontal className="mr-2 h-4 w-4" />
              Filters
              {getActiveFiltersCount() > 0 && (
                <Badge className="ml-2">{getActiveFiltersCount()}</Badge>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Advanced Filters */}
      <Collapsible open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
        <CollapsibleContent className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Advanced Filters</CardTitle>
                  <CardDescription>
                    Narrow down your search results
                  </CardDescription>
                </div>
                <Button variant="ghost" size="sm" onClick={clearAllFilters}>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Clear All
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Categories */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Categories</Label>
                <div className="grid gap-2 md:grid-cols-3 lg:grid-cols-5">
                  {categories.map((category) => (
                    <div key={category} className="flex items-center space-x-2">
                      <Checkbox
                        id={`category-${category}`}
                        checked={filters.categories.includes(category)}
                        onCheckedChange={() => toggleCategory(category)}
                      />
                      <Label htmlFor={`category-${category}`} className="text-sm">
                        {category}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Location and Budget */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Location</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="City, State, or Remote"
                      value={filters.location}
                      onChange={(e) => updateFilter("location", e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Budget Range</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Select value={filters.budgetRange} onValueChange={(value) => updateFilter("budgetRange", value)}>
                      <SelectTrigger className="pl-10">
                        <SelectValue placeholder="Select budget range" />
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
                </div>
              </div>

              {/* Experience and Rating */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Experience Level</Label>
                  <Select value={filters.experience} onValueChange={(value) => updateFilter("experience", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select experience level" />
                    </SelectTrigger>
                    <SelectContent>
                      {experienceLevels.map((level) => (
                        <SelectItem key={level.value} value={level.value}>
                          {level.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Minimum Rating</Label>
                  <Select value={filters.rating.toString()} onValueChange={(value) => updateFilter("rating", parseInt(value) || 0)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select minimum rating" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Any Rating</SelectItem>
                      <SelectItem value="3">3+ Stars</SelectItem>
                      <SelectItem value="4">4+ Stars</SelectItem>
                      <SelectItem value="4.5">4.5+ Stars</SelectItem>
                      <SelectItem value="5">5 Stars Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Posted Within and Status */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Posted Within</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Select value={filters.postedWithin} onValueChange={(value) => updateFilter("postedWithin", value)}>
                      <SelectTrigger className="pl-10">
                        <SelectValue placeholder="Select time frame" />
                      </SelectTrigger>
                      <SelectContent>
                        {postedWithinOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Status</Label>
                  <div className="grid gap-2 md:grid-cols-3">
                    {statusOptions.map((status) => (
                      <div key={status.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={`status-${status.value}`}
                          checked={filters.status.includes(status.value)}
                          onCheckedChange={() => toggleStatus(status.value)}
                        />
                        <Label htmlFor={`status-${status.value}`} className="text-sm">
                          {status.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Sort Options */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Sort By</Label>
                  <Select value={filters.sortBy} onValueChange={(value) => updateFilter("sortBy", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {sortOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Sort Order</Label>
                  <Select value={filters.sortOrder} onValueChange={(value) => updateFilter("sortOrder", value as "asc" | "desc")}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="desc">Descending</SelectItem>
                      <SelectItem value="asc">Ascending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Active Filters Display */}
              {getActiveFiltersCount() > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Active Filters</Label>
                  <div className="flex flex-wrap gap-2">
                    {filters.categories.map((category) => (
                      <Badge key={category} variant="secondary" className="flex items-center space-x-1">
                        <span>{category}</span>
                        <button
                          onClick={() => toggleCategory(category)}
                          className="ml-1 hover:text-red-500"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                    {filters.location && (
                      <Badge variant="secondary" className="flex items-center space-x-1">
                        <span>Location: {filters.location}</span>
                        <button
                          onClick={() => updateFilter("location", "")}
                          className="ml-1 hover:text-red-500"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    )}
                    {filters.budgetRange && (
                      <Badge variant="secondary" className="flex items-center space-x-1">
                        <span>Budget: {budgetRanges.find(r => r.value === filters.budgetRange)?.label}</span>
                        <button
                          onClick={() => updateFilter("budgetRange", "")}
                          className="ml-1 hover:text-red-500"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    )}
                    {filters.experience && (
                      <Badge variant="secondary" className="flex items-center space-x-1">
                        <span>Experience: {experienceLevels.find(l => l.value === filters.experience)?.label}</span>
                        <button
                          onClick={() => updateFilter("experience", "")}
                          className="ml-1 hover:text-red-500"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    )}
                    {filters.rating > 0 && (
                      <Badge variant="secondary" className="flex items-center space-x-1">
                        <span>Rating: {filters.rating}+ Stars</span>
                        <button
                          onClick={() => updateFilter("rating", 0)}
                          className="ml-1 hover:text-red-500"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    )}
                    {filters.postedWithin && (
                      <Badge variant="secondary" className="flex items-center space-x-1">
                        <span>Posted: {postedWithinOptions.find(o => o.value === filters.postedWithin)?.label}</span>
                        <button
                          onClick={() => updateFilter("postedWithin", "")}
                          className="ml-1 hover:text-red-500"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    )}
                    {filters.status.map((status) => (
                      <Badge key={status} variant="secondary" className="flex items-center space-x-1">
                        <span>Status: {status}</span>
                        <button
                          onClick={() => toggleStatus(status)}
                          className="ml-1 hover:text-red-500"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}