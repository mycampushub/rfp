"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  DollarSign, 
  Clock, 
  Users, 
  Calendar,
  CheckCircle,
  AlertCircle,
  MessageSquare,
  Download,
  Eye,
  Star,
  FileText,
  BarChart3
} from "lucide-react"

interface Bid {
  id: string
  vendorName: string
  vendorRating: number
  vendorReviews: number
  amount: number
  currency: string
  duration: string
  status: "draft" | "submitted" | "reviewed" | "accepted" | "rejected" | "withdrawn"
  submittedAt?: string
  reviewedAt?: string
  decisionAt?: string
  proposal: string
  attachments: { name: string; size: string; type: string }[]
  timeline: { phase: string; duration: string; startDate: string }[]
  team: { name: string; role: string; experience: string }[]
  budgetBreakdown: { item: string; cost: string; description: string }[]
  messages: { id: string; sender: string; message: string; timestamp: string; isPublic: boolean }[]
}

interface BidListProps {
  bids: Bid[]
  onViewBid: (bidId: string) => void
  onMessageBid: (bidId: string) => void
  onAcceptBid: (bidId: string) => void
  onRejectBid: (bidId: string) => void
}

export function BidList({ bids, onViewBid, onMessageBid, onAcceptBid, onRejectBid }: BidListProps) {
  const getStatusColor = (status: string) => {
    const colors = {
      draft: "bg-gray-100 text-gray-800",
      submitted: "bg-blue-100 text-blue-800",
      reviewed: "bg-yellow-100 text-yellow-800",
      accepted: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
      withdrawn: "bg-purple-100 text-purple-800"
    }
    return colors[status as keyof typeof colors] || "bg-gray-100 text-gray-800"
  }

  const getStatusIcon = (status: string) => {
    const icons = {
      draft: Clock,
      submitted: FileText,
      reviewed: BarChart3,
      accepted: CheckCircle,
      rejected: AlertCircle,
      withdrawn: Users
    }
    return icons[status as keyof typeof icons] || Clock
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

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount)
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return "-"
    return new Date(dateString).toLocaleDateString()
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Received Bids ({bids.length})</h3>
          <p className="text-sm text-muted-foreground">
            Review and manage vendor proposals
          </p>
        </div>
      </div>

      {bids.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No bids received yet</h3>
            <p className="text-muted-foreground">
              Vendors will submit their proposals here. Check back later or promote your RFP to get more visibility.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {bids.map((bid) => {
            const StatusIcon = getStatusIcon(bid.status)
            const totalBudget = bid.budgetBreakdown.reduce((total, item) => {
              const cost = parseFloat(item.cost.replace(/[^0-9.-]+/g, "")) || 0
              return total + cost
            }, 0)

            return (
              <Card key={bid.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div>
                          <h4 className="text-lg font-semibold">{bid.vendorName}</h4>
                          <div className="flex items-center space-x-2">
                            {renderStars(bid.vendorRating)}
                            <span className="text-sm text-muted-foreground">
                              ({bid.vendorReviews} reviews)
                            </span>
                          </div>
                        </div>
                        <Badge className={getStatusColor(bid.status)}>
                          <StatusIcon className="mr-1 h-3 w-3" />
                          {bid.status.charAt(0).toUpperCase() + bid.status.slice(1)}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm" onClick={() => onViewBid(bid.id)}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => onMessageBid(bid.id)}>
                          <MessageSquare className="mr-2 h-4 w-4" />
                          Message
                        </Button>
                      </div>
                    </div>

                    {/* Key Info */}
                    <div className="grid gap-4 md:grid-cols-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {formatCurrency(bid.amount, bid.currency)}
                        </div>
                        <div className="text-sm text-muted-foreground">Bid Amount</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">{bid.duration}</div>
                        <div className="text-sm text-muted-foreground">Duration</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">{bid.timeline.length}</div>
                        <div className="text-sm text-muted-foreground">Timeline Phases</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">{bid.team.length}</div>
                        <div className="text-sm text-muted-foreground">Team Members</div>
                      </div>
                    </div>

                    {/* Proposal Preview */}
                    <div>
                      <h5 className="font-medium mb-2">Proposal Preview</h5>
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {bid.proposal}
                      </p>
                    </div>

                    {/* Timeline Preview */}
                    <div>
                      <h5 className="font-medium mb-2">Timeline Preview</h5>
                      <div className="flex space-x-4 overflow-x-auto">
                        {bid.timeline.slice(0, 3).map((phase, index) => (
                          <div key={index} className="flex-shrink-0 border rounded-lg p-3 min-w-[150px]">
                            <div className="text-sm font-medium">{phase.phase}</div>
                                <div className="text-xs text-muted-foreground">{phase.duration}</div>
                                <div className="text-xs text-muted-foreground">{phase.startDate}</div>
                              </div>
                            ))}
                            {bid.timeline.length > 3 && (
                              <div className="flex-shrink-0 border rounded-lg p-3 min-w-[100px] text-center">
                                <div className="text-sm text-muted-foreground">
                                  +{bid.timeline.length - 3} more
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Team Preview */}
                        <div>
                          <h5 className="font-medium mb-2">Key Team Members</h5>
                          <div className="flex space-x-4 overflow-x-auto">
                            {bid.team.slice(0, 3).map((member, index) => (
                              <div key={index} className="flex-shrink-0 border rounded-lg p-3 min-w-[150px]">
                                <div className="text-sm font-medium">{member.name}</div>
                                <div className="text-xs text-muted-foreground">{member.role}</div>
                                <div className="text-xs text-muted-foreground">{member.experience}</div>
                              </div>
                            ))}
                            {bid.team.length > 3 && (
                              <div className="flex-shrink-0 border rounded-lg p-3 min-w-[100px] text-center">
                                <div className="text-sm text-muted-foreground">
                                  +{bid.team.length - 3} more
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Budget Preview */}
                        <div>
                          <h5 className="font-medium mb-2">Budget Overview</h5>
                          <div className="flex items-center justify-between">
                            <div className="text-sm text-muted-foreground">
                              {bid.budgetBreakdown.length} line items
                            </div>
                            <div className="font-medium">
                              Total: {formatCurrency(totalBudget, bid.currency)}
                            </div>
                          </div>
                        </div>

                        {/* Status Dates */}
                        <div className="grid gap-4 md:grid-cols-3 text-sm">
                          <div>
                            <span className="text-muted-foreground">Submitted:</span>
                            <span className="ml-2 font-medium">{formatDate(bid.submittedAt)}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Reviewed:</span>
                            <span className="ml-2 font-medium">{formatDate(bid.reviewedAt)}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Decision:</span>
                            <span className="ml-2 font-medium">{formatDate(bid.decisionAt)}</span>
                          </div>
                        </div>

                        {/* Actions */}
                        {bid.status === "submitted" && (
                          <div className="flex space-x-2 pt-4 border-t">
                            <Button 
                              variant="outline" 
                              className="flex-1"
                              onClick={() => onRejectBid(bid.id)}
                            >
                              <AlertCircle className="mr-2 h-4 w-4" />
                              Reject
                            </Button>
                            <Button 
                              className="flex-1"
                              onClick={() => onAcceptBid(bid.id)}
                            >
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Accept Bid
                            </Button>
                          </div>
                        )}

                        {bid.status === "accepted" && (
                          <div className="flex items-center space-x-2 pt-4 border-t">
                            <CheckCircle className="h-5 w-5 text-green-500" />
                            <span className="text-green-600 font-medium">This bid has been accepted</span>
                          </div>
                        )}

                        {bid.status === "rejected" && (
                          <div className="flex items-center space-x-2 pt-4 border-t">
                            <AlertCircle className="h-5 w-5 text-red-500" />
                            <span className="text-red-600 font-medium">This bid has been rejected</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      )
}