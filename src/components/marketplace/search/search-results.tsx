"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
  Search, 
  TrendingUp, 
  Users, 
  Briefcase, 
  Star,
  MapPin,
  Clock,
  DollarSign,
  ArrowRight,
  Eye,
  BookmarkPlus,
  Filter
} from "lucide-react"
import Link from "next/link"

interface SearchResult {
  id: string
  type: "rfp" | "vendor"
  title: string
  description: string
  category?: string
  location?: string
  budget?: string
  rating?: number
  reviews?: number
  bids?: number
  deadline?: string
  featured?: boolean
  verified?: boolean
  url: string
  relevanceScore: number
}

interface SearchResultsProps {
  query: string
  filters?: any
  results: SearchResult[]
  isLoading?: boolean
  onLoadMore?: () => void
  hasMore?: boolean
}

export function SearchResults({ 
  query, 
  filters, 
  results, 
  isLoading = false, 
  onLoadMore, 
  hasMore = false 
}: SearchResultsProps) {
  const [savedItems, setSavedItems] = useState<Set<string>>(new Set())

  const toggleSaved = (id: string) => {
    const newSaved = new Set(savedItems)
    if (newSaved.has(id)) {
      newSaved.delete(id)
    } else {
      newSaved.add(id)
    }
    setSavedItems(newSaved)
  }

  const getTypeIcon = (type: string) => {
    return type === "rfp" ? Briefcase : Users
  }

  const getTypeColor = (type: string) => {
    return type === "rfp" ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800"
  }

  const getCategoryColor = (category: string) => {
    const colors = {
      "IT Services": "bg-blue-100 text-blue-800",
      "Marketing": "bg-green-100 text-green-800",
      "Construction": "bg-orange-100 text-orange-800",
      "Software Development": "bg-purple-100 text-purple-800",
      "Consulting": "bg-indigo-100 text-indigo-800",
      "Design": "bg-pink-100 text-pink-800"
    }
    return colors[category as keyof typeof colors] || "bg-gray-100 text-gray-800"
  }

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= Math.floor(rating) 
                ? "text-yellow-500 fill-current" 
                : star === Math.ceil(rating) && rating % 1 !== 0 
                ? "text-yellow-500 fill-current" 
                : "text-gray-300"
            }`}
          />
        ))}
        <span className="ml-1 text-sm">{rating}</span>
      </div>
    )
  }

  const highlightText = (text: string, highlight: string) => {
    if (!highlight) return text
    
    const regex = new RegExp(`(${highlight})`, 'gi')
    const parts = text.split(regex)
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 text-yellow-800 rounded px-1">
          {part}
        </mark>
      ) : (
        part
      )
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (results.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No results found</h3>
          <p className="text-muted-foreground mb-4">
            {query 
              ? `No results found for "${query}". Try adjusting your search terms or filters.`
              : "Enter a search term to find RFPs and vendors."
            }
          </p>
          <Button variant="outline">
            <Filter className="mr-2 h-4 w-4" />
            Adjust Filters
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Results Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">
            Search Results for "{query}"
          </h2>
          <p className="text-sm text-muted-foreground">
            Found {results.length} results
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline">
            {results.filter(r => r.type === "rfp").length} RFPs
          </Badge>
          <Badge variant="outline">
            {results.filter(r => r.type === "vendor").length} Vendors
          </Badge>
        </div>
      </div>

      {/* Results List */}
      <div className="space-y-4">
        {results.map((result) => {
          const TypeIcon = getTypeIcon(result.type)
          
          return (
            <Card key={result.id} className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <TypeIcon className="h-5 w-5 text-muted-foreground" />
                        <Badge className={getTypeColor(result.type)}>
                          {result.type === "rfp" ? "RFP" : "Vendor"}
                        </Badge>
                        {result.featured && (
                          <Badge className="bg-yellow-100 text-yellow-800">
                            <Star className="mr-1 h-3 w-3" />
                            Featured
                          </Badge>
                        )}
                        {result.verified && (
                          <Badge className="bg-blue-100 text-blue-800">
                            Verified
                          </Badge>
                        )}
                      </div>
                      <h3 className="text-lg font-semibold mb-2">
                        {highlightText(result.title, query)}
                      </h3>
                      <p className="text-muted-foreground mb-3 line-clamp-2">
                        {highlightText(result.description, query)}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => toggleSaved(result.id)}
                      >
                        <BookmarkPlus 
                          className={`h-4 w-4 ${savedItems.has(result.id) ? 'fill-current text-yellow-500' : ''}`} 
                        />
                      </Button>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={result.url}>
                          <Eye className="mr-2 h-4 w-4" />
                          View
                        </Link>
                      </Button>
                    </div>
                  </div>

                  {/* Metadata */}
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {result.category && (
                      <div>
                        <span className="text-xs text-muted-foreground">Category</span>
                        <div>
                          <Badge className={getCategoryColor(result.category)}>
                            {result.category}
                          </Badge>
                        </div>
                      </div>
                    )}
                    
                    {result.location && (
                      <div>
                        <span className="text-xs text-muted-foreground">Location</span>
                        <div className="flex items-center text-sm">
                          <MapPin className="mr-1 h-3 w-3" />
                          {result.location}
                        </div>
                      </div>
                    )}
                    
                    {result.budget && (
                      <div>
                        <span className="text-xs text-muted-foreground">Budget</span>
                        <div className="flex items-center text-sm font-medium text-green-600">
                          <DollarSign className="mr-1 h-3 w-3" />
                          {result.budget}
                        </div>
                      </div>
                    )}
                    
                    {result.deadline && (
                      <div>
                        <span className="text-xs text-muted-foreground">Deadline</span>
                        <div className="flex items-center text-sm">
                          <Clock className="mr-1 h-3 w-3" />
                          {result.deadline}
                        </div>
                      </div>
                    )}
                    
                    {result.rating && (
                      <div>
                        <span className="text-xs text-muted-foreground">Rating</span>
                        <div>
                          {renderStars(result.rating)}
                          {result.reviews && (
                            <span className="text-xs text-muted-foreground ml-1">
                              ({result.reviews} reviews)
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {result.bids !== undefined && (
                      <div>
                        <span className="text-xs text-muted-foreground">Bids</span>
                        <div className="flex items-center text-sm">
                          <Briefcase className="mr-1 h-3 w-3" />
                          {result.bids} bids
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Relevance Score */}
                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        Relevance: {Math.round(result.relevanceScore * 100)}%
                      </span>
                    </div>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={result.url}>
                        View Details <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Load More */}
      {hasMore && (
        <div className="flex justify-center">
          <Button onClick={onLoadMore} variant="outline">
            Load More Results
          </Button>
        </div>
      )}

      {/* Search Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Search Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="font-medium mb-2">For Better Results:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Use specific keywords related to your needs</li>
                <li>• Include location preferences</li>
                <li>• Specify budget ranges when applicable</li>
                <li>• Use category filters for targeted searches</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Advanced Search:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Use quotes for exact phrases ("cloud migration")</li>
                <li>• Use OR to search for multiple terms</li>
                <li>• Use - to exclude terms (software -development)</li>
                <li>• Combine filters for precise results</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}