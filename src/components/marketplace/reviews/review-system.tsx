"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Star, 
  ThumbsUp, 
  ThumbsDown, 
  Flag,
  Send,
  Calendar,
  User,
  Briefcase,
  CheckCircle,
  AlertTriangle,
  MessageSquare,
  Filter,
  TrendingUp
} from "lucide-react"

interface Review {
  id: string
  reviewerName: string
  reviewerRole: string
  rating: number
  title: string
  comment: string
  response?: string
  projectTitle?: string
  projectType?: string
  completionDate: string
  verified: boolean
  helpful: number
  unhelpful: number
  status: "published" | "flagged" | "removed"
  createdAt: string
  updatedAt: string
}

interface ReviewFormProps {
  vendorId: string
  vendorName: string
  projectId?: string
  projectTitle?: string
  onSubmitReview: (reviewData: ReviewFormData) => void
  onCancel: () => void
}

interface ReviewFormData {
  rating: number
  title: string
  comment: string
  projectTitle: string
  projectType: string
  completionDate: string
  categories: string[]
  recommend: boolean
}

export function ReviewForm({ 
  vendorId, 
  vendorName, 
  projectId, 
  projectTitle, 
  onSubmitReview, 
  onCancel 
}: ReviewFormProps) {
  const [reviewData, setReviewData] = useState<ReviewFormData>({
    rating: 5,
    title: "",
    comment: "",
    projectTitle: projectTitle || "",
    projectType: "",
    completionDate: "",
    categories: [],
    recommend: true
  })

  const [hoveredRating, setHoveredRating] = useState(0)

  const projectTypes = [
    "Software Development", "IT Services", "Consulting", "Design", 
    "Marketing", "Construction", "Engineering", "Legal", "Other"
  ]

  const reviewCategories = [
    "Quality of Work", "Communication", "Timeliness", "Value for Money",
    "Professionalism", "Problem Solving", "Technical Expertise", "Project Management"
  ]

  const handleRatingClick = (rating: number) => {
    setReviewData(prev => ({ ...prev, rating }))
  }

  const handleCategoryToggle = (category: string) => {
    setReviewData(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category]
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmitReview(reviewData)
  }

  const renderStars = (rating: number, interactive = false) => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-6 w-6 cursor-pointer transition-colors ${
              star <= (interactive ? hoveredRating : rating)
                ? "text-yellow-500 fill-current"
                : "text-gray-300"
            }`}
            onClick={interactive ? () => handleRatingClick(star) : undefined}
            onMouseEnter={interactive ? () => setHoveredRating(star) : undefined}
            onMouseLeave={interactive ? () => setHoveredRating(0) : undefined}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Write a Review</CardTitle>
          <CardDescription>
            Share your experience working with {vendorName}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Rating */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Overall Rating *</Label>
              <div className="flex items-center space-x-2">
                {renderStars(reviewData.rating, true)}
                <span className="text-sm text-muted-foreground">
                  {reviewData.rating} out of 5
                </span>
              </div>
            </div>

            {/* Project Information */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="projectTitle">Project Title *</Label>
                <Input
                  id="projectTitle"
                  value={reviewData.projectTitle}
                  onChange={(e) => setReviewData(prev => ({ ...prev, projectTitle: e.target.value }))}
                  placeholder="Enter project title"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="projectType">Project Type *</Label>
                <Select value={reviewData.projectType} onValueChange={(value) => setReviewData(prev => ({ ...prev, projectType: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select project type" />
                  </SelectTrigger>
                  <SelectContent>
                    {projectTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="completionDate">Project Completion Date *</Label>
              <Input
                id="completionDate"
                type="date"
                value={reviewData.completionDate}
                onChange={(e) => setReviewData(prev => ({ ...prev, completionDate: e.target.value }))}
                required
              />
            </div>

            {/* Review Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Review Title *</Label>
              <Input
                id="title"
                value={reviewData.title}
                onChange={(e) => setReviewData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Summarize your experience"
                required
              />
            </div>

            {/* Review Categories */}
            <div className="space-y-2">
              <Label>What aspects should be highlighted?</Label>
              <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-4">
                {reviewCategories.map((category) => (
                  <div key={category} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`category-${category}`}
                      checked={reviewData.categories.includes(category)}
                      onChange={() => handleCategoryToggle(category)}
                      className="rounded"
                    />
                    <Label htmlFor={`category-${category}`} className="text-sm">
                      {category}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Detailed Review */}
            <div className="space-y-2">
              <Label htmlFor="comment">Detailed Review *</Label>
              <Textarea
                id="comment"
                value={reviewData.comment}
                onChange={(e) => setReviewData(prev => ({ ...prev, comment: e.target.value }))}
                placeholder="Share detailed feedback about your experience working with this vendor..."
                rows={6}
                required
              />
              <p className="text-xs text-muted-foreground">
                Be specific and constructive. Your review helps other businesses make informed decisions.
              </p>
            </div>

            {/* Recommendation */}
            <div className="space-y-2">
              <Label>Would you recommend this vendor?</Label>
              <div className="flex space-x-4">
                <Button
                  type="button"
                  variant={reviewData.recommend ? "default" : "outline"}
                  onClick={() => setReviewData(prev => ({ ...prev, recommend: true }))}
                  className="flex items-center space-x-2"
                >
                  <ThumbsUp className="h-4 w-4" />
                  <span>Yes, I recommend</span>
                </Button>
                <Button
                  type="button"
                  variant={!reviewData.recommend ? "default" : "outline"}
                  onClick={() => setReviewData(prev => ({ ...prev, recommend: false }))}
                  className="flex items-center space-x-2"
                >
                  <ThumbsDown className="h-4 w-4" />
                  <span>No, I don't recommend</span>
                </Button>
              </div>
            </div>

            {/* Guidelines */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="h-5 w-5 text-blue-500 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Review Guidelines</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Be honest and objective in your assessment</li>
                    <li>Focus on the work quality and business relationship</li>
                    <li>Avoid personal attacks or inappropriate language</li>
                    <li>Do not include confidential or sensitive information</li>
                    <li>Only review projects you've personally worked on</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex space-x-4">
              <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" className="flex-1">
                <Send className="mr-2 h-4 w-4" />
                Submit Review
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

interface ReviewListProps {
  reviews: Review[]
  onHelpfulVote: (reviewId: string, helpful: boolean) => void
  onFlagReview: (reviewId: string) => void
  vendorName: string
  showFilters?: boolean
}

export function ReviewList({ 
  reviews, 
  onHelpfulVote, 
  onFlagReview, 
  vendorName,
  showFilters = true 
}: ReviewListProps) {
  const [filter, setFilter] = useState<string>("all")
  const [sortBy, setSortBy] = useState<string>("newest")

  const filteredReviews = reviews.filter(review => {
    if (filter === "all") return true
    if (filter === "5star") return review.rating === 5
    if (filter === "4star") return review.rating === 4
    if (filter === "3star") return review.rating === 3
    if (filter === "2star") return review.rating === 2
    if (filter === "1star") return review.rating === 1
    if (filter === "withResponse") return review.response
    if (filter === "verified") return review.verified
    return true
  })

  const sortedReviews = [...filteredReviews].sort((a, b) => {
    switch (sortBy) {
      case "newest":
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      case "oldest":
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      case "highest":
        return b.rating - a.rating
      case "lowest":
        return a.rating - b.rating
      case "mostHelpful":
        return b.helpful - a.helpful
      default:
        return 0
    }
  })

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating 
                ? "text-yellow-500 fill-current" 
                : "text-gray-300"
            }`}
          />
        ))}
        <span className="ml-1 text-sm">{rating}</span>
      </div>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const calculateAverageRating = () => {
    if (reviews.length === 0) return 0
    const total = reviews.reduce((sum, review) => sum + review.rating, 0)
    return total / reviews.length
  }

  const getRatingDistribution = () => {
    const distribution = [0, 0, 0, 0, 0]
    reviews.forEach(review => {
      distribution[5 - review.rating]++
    })
    return distribution
  }

  const averageRating = calculateAverageRating()
  const ratingDistribution = getRatingDistribution()

  return (
    <div className="space-y-6">
      {/* Reviews Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Customer Reviews</CardTitle>
          <CardDescription>
            What clients are saying about {vendorName}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            {/* Average Rating */}
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">{averageRating.toFixed(1)}</div>
              <div className="flex justify-center mb-2">
                {renderStars(Math.round(averageRating))}
              </div>
              <div className="text-sm text-muted-foreground">
                Based on {reviews.length} reviews
              </div>
            </div>

            {/* Rating Distribution */}
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((rating) => {
                const count = ratingDistribution[5 - rating]
                const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0
                return (
                  <div key={rating} className="flex items-center space-x-2">
                    <span className="text-sm w-8">{rating} star</span>
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-yellow-500 h-2 rounded-full" 
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-sm w-8 text-right">{count}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      {showFilters && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4" />
                <span className="text-sm font-medium">Filter:</span>
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: "all", label: "All" },
                    { value: "5star", label: "5 Stars" },
                    { value: "4star", label: "4 Stars" },
                    { value: "3star", label: "3 Stars" },
                    { value: "withResponse", label: "With Response" },
                    { value: "verified", label: "Verified" }
                  ].map((f) => (
                    <Button
                      key={f.value}
                      variant={filter === f.value ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFilter(f.value)}
                    >
                      {f.label}
                    </Button>
                  ))}
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium">Sort by:</span>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest First</SelectItem>
                    <SelectItem value="oldest">Oldest First</SelectItem>
                    <SelectItem value="highest">Highest Rating</SelectItem>
                    <SelectItem value="lowest">Lowest Rating</SelectItem>
                    <SelectItem value="mostHelpful">Most Helpful</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        {sortedReviews.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No reviews found</h3>
              <p className="text-muted-foreground">
                {filter === "all" 
                  ? "Be the first to review this vendor."
                  : "No reviews match your selected filters."
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          sortedReviews.map((review) => (
            <Card key={review.id}>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        {renderStars(review.rating)}
                        {review.verified && (
                          <Badge className="bg-blue-100 text-blue-800">
                            <CheckCircle className="mr-1 h-3 w-3" />
                            Verified Purchase
                          </Badge>
                        )}
                        {review.status === "flagged" && (
                          <Badge className="bg-yellow-100 text-yellow-800">
                            <Flag className="mr-1 h-3 w-3" />
                            Under Review
                          </Badge>
                        )}
                      </div>
                      <h4 className="text-lg font-semibold mb-1">{review.title}</h4>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <span className="flex items-center">
                          <User className="mr-1 h-3 w-3" />
                          {review.reviewerName}
                        </span>
                        <span className="flex items-center">
                          <Briefcase className="mr-1 h-3 w-3" />
                          {review.reviewerRole}
                        </span>
                        <span className="flex items-center">
                          <Calendar className="mr-1 h-3 w-3" />
                          {formatDate(review.createdAt)}
                        </span>
                      </div>
                      {review.projectTitle && (
                        <div className="text-sm text-muted-foreground">
                          Project: {review.projectTitle} ({review.projectType})
                        </div>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onFlagReview(review.id)}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <Flag className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Review Content */}
                  <div className="space-y-3">
                    <p className="text-muted-foreground">{review.comment}</p>
                    
                    {/* Response */}
                    {review.response && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-center space-x-2 mb-2">
                          <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                            {vendorName.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-blue-900">{vendorName}</p>
                            <p className="text-xs text-blue-600">Vendor Response</p>
                          </div>
                        </div>
                        <p className="text-sm text-blue-800">{review.response}</p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onHelpfulVote(review.id, true)}
                          className={`flex items-center space-x-1 ${
                            review.helpful > 0 ? 'text-green-600' : ''
                          }`}
                        >
                          <ThumbsUp className="h-4 w-4" />
                          <span>Helpful ({review.helpful})</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onHelpfulVote(review.id, false)}
                          className={`flex items-center space-x-1 ${
                            review.unhelpful > 0 ? 'text-red-600' : ''
                          }`}
                        >
                          <ThumbsDown className="h-4 w-4" />
                          <span> ({review.unhelpful})</span>
                        </Button>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Review posted on {formatDate(review.createdAt)}
                      {review.updatedAt !== review.createdAt && (
                        <span> • Updated on {formatDate(review.updatedAt)}</span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}