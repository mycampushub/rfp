"use client"

import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  FileText, 
  Users, 
  Star, 
  Clock, 
  DollarSign,
  CheckCircle,
  AlertCircle,
  Eye,
  MessageSquare,
  Calendar,
  TrendingUp,
  Briefcase,
  BookmarkPlus,
  ExternalLink
} from "lucide-react"
import Link from "next/link"

export default function MyActivity() {
  // Mock data for user's marketplace activity
  const myBids = [
    {
      id: "1",
      rfpTitle: "Enterprise Cloud Migration Services",
      organization: "TechCorp Inc.",
      amount: "$650,000",
      status: "submitted",
      submittedAt: "2024-11-20",
      deadline: "2024-12-30",
      views: 45,
      messages: 3
    },
    {
      id: "2",
      rfpTitle: "Mobile App Development",
      organization: "StartupXYZ",
      amount: "$95,000",
      status: "under_review",
      submittedAt: "2024-11-18",
      deadline: "2024-12-20",
      views: 32,
      messages: 1
    },
    {
      id: "3",
      rfpTitle: "Digital Marketing Campaign",
      organization: "Global Retail Co.",
      amount: "$150,000",
      status: "accepted",
      submittedAt: "2024-11-15",
      deadline: "2024-12-25",
      views: 67,
      messages: 8
    }
  ]

  const savedRFPs = [
    {
      id: "1",
      title: "Financial Consulting Services",
      organization: "Investment Firm",
      budget: "$150,000 - $300,000",
      deadline: "2025-01-10",
      category: "Consulting",
      savedAt: "2024-11-22",
      newBids: 2
    },
    {
      id: "2",
      title: "Brand Identity Design",
      organization: "Fashion Brand",
      budget: "$25,000 - $50,000",
      deadline: "2024-12-15",
      category: "Design",
      savedAt: "2024-11-20",
      newBids: 0
    },
    {
      id: "3",
      title: "Office Building Renovation",
      organization: "Property Management LLC",
      budget: "$250,000 - $400,000",
      deadline: "2025-01-15",
      category: "Construction",
      savedAt: "2024-11-18",
      newBids: 5
    }
  ]

  const notifications = [
    {
      id: "1",
      type: "bid_accepted",
      title: "Bid Accepted!",
      message: "Congratulations! Your bid for Digital Marketing Campaign has been accepted.",
      timestamp: "2024-11-21T10:30:00Z",
      read: false,
      rfpId: "2"
    },
    {
      id: "2",
      type: "new_message",
      title: "New Message",
      message: "You have a new message regarding your bid for Enterprise Cloud Migration Services.",
      timestamp: "2024-11-20T14:15:00Z",
      read: true,
      rfpId: "1"
    },
    {
      id: "3",
      type: "rfp_reminder",
      title: "RFP Deadline Approaching",
      message: "The deadline for Financial Consulting Services is approaching in 5 days.",
      timestamp: "2024-11-19T09:00:00Z",
      read: true,
      rfpId: "1"
    }
  ]

  const stats = {
    totalBids: 12,
    acceptedBids: 3,
    pendingBids: 5,
    savedRFPs: 8,
    profileViews: 1247,
    responseRate: 98
  }

  const getStatusColor = (status: string) => {
    const colors = {
      "submitted": "bg-blue-100 text-blue-800",
      "under_review": "bg-yellow-100 text-yellow-800",
      "accepted": "bg-green-100 text-green-800",
      "rejected": "bg-red-100 text-red-800",
      "draft": "bg-gray-100 text-gray-800"
    }
    return colors[status as keyof typeof colors] || "bg-gray-100 text-gray-800"
  }

  const getStatusIcon = (status: string) => {
    const icons = {
      "submitted": Clock,
      "under_review": Eye,
      "accepted": CheckCircle,
      "rejected": AlertCircle,
      "draft": FileText
    }
    return icons[status as keyof typeof icons] || FileText
  }

  const getNotificationIcon = (type: string) => {
    const icons = {
      "bid_accepted": CheckCircle,
      "new_message": MessageSquare,
      "rfp_reminder": Clock,
      "new_rfp": FileText
    }
    return icons[type as keyof typeof icons] || FileText
  }

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'Just now'
    if (diffInHours < 24) return `${diffInHours} hours ago`
    if (diffInHours < 48) return 'Yesterday'
    return `${Math.floor(diffInHours / 24)} days ago`
  }

  return (
    <MainLayout title="My Activity">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">My Marketplace Activity</h1>
          <p className="text-muted-foreground mt-1">
            Track your bids, saved RFPs, and marketplace performance
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Bids</CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalBids}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Accepted</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.acceptedBids}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.pendingBids}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Saved RFPs</CardTitle>
              <BookmarkPlus className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.savedRFPs}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Profile Views</CardTitle>
              <Eye className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.profileViews}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Response Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.responseRate}%</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="bids" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="bids">My Bids ({myBids.length})</TabsTrigger>
            <TabsTrigger value="saved">Saved RFPs ({savedRFPs.length})</TabsTrigger>
            <TabsTrigger value="notifications">Notifications ({notifications.filter(n => !n.read).length})</TabsTrigger>
          </TabsList>

          <TabsContent value="bids" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>My Bids</CardTitle>
                <CardDescription>
                  Track the status of your submitted bids
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {myBids.map((bid) => {
                    const StatusIcon = getStatusIcon(bid.status)
                    return (
                      <div key={bid.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg mb-1">{bid.rfpTitle}</h3>
                            <p className="text-sm text-muted-foreground mb-2">{bid.organization}</p>
                            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                              <span className="flex items-center">
                                <DollarSign className="mr-1 h-3 w-3" />
                                {bid.amount}
                              </span>
                              <span className="flex items-center">
                                <Calendar className="mr-1 h-3 w-3" />
                                Submitted: {formatDate(bid.submittedAt)}
                              </span>
                              <span className="flex items-center">
                                <Clock className="mr-1 h-3 w-3" />
                                Deadline: {formatDate(bid.deadline)}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge className={getStatusColor(bid.status)}>
                              <StatusIcon className="mr-1 h-3 w-3" />
                              {bid.status.replace('_', ' ').toUpperCase()}
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                            <span className="flex items-center">
                              <Eye className="mr-1 h-3 w-3" />
                              {bid.views} views
                            </span>
                            <span className="flex items-center">
                              <MessageSquare className="mr-1 h-3 w-3" />
                              {bid.messages} messages
                            </span>
                          </div>
                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/marketplace/rfps/${bid.id}`}>
                                View RFP
                              </Link>
                            </Button>
                            <Button size="sm" asChild>
                              <Link href={`/marketplace/my-activity/bids/${bid.id}`}>
                                View Details
                              </Link>
                            </Button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="saved" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Saved RFPs</CardTitle>
                <CardDescription>
                  RFPs you've saved for later consideration
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {savedRFPs.map((rfp) => (
                    <div key={rfp.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg mb-1">{rfp.title}</h3>
                          <p className="text-sm text-muted-foreground mb-2">{rfp.organization}</p>
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                            <span className="flex items-center">
                              <DollarSign className="mr-1 h-3 w-3" />
                              {rfp.budget}
                            </span>
                            <span className="flex items-center">
                              <Clock className="mr-1 h-3 w-3" />
                              Deadline: {formatDate(rfp.deadline)}
                            </span>
                            <span className="flex items-center">
                              <BookmarkPlus className="mr-1 h-3 w-3" />
                              Saved: {formatDate(rfp.savedAt)}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className={getCategoryColor(rfp.category)}>
                            {rfp.category}
                          </Badge>
                          {rfp.newBids > 0 && (
                            <Badge className="bg-red-100 text-red-800">
                              {rfp.newBids} new bids
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <span>Deadline in {Math.ceil((new Date(rfp.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days</span>
                        </div>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/marketplace/rfps/${rfp.id}`}>
                              View RFP
                            </Link>
                          </Button>
                          <Button size="sm" asChild>
                            <Link href={`/marketplace/rfps/${rfp.id}#bid`}>
                              Submit Bid
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Notifications</CardTitle>
                <CardDescription>
                  Stay updated on your marketplace activities
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {notifications.map((notification) => {
                    const NotificationIcon = getNotificationIcon(notification.type)
                    return (
                      <div key={notification.id} className={`border rounded-lg p-4 ${!notification.read ? 'bg-blue-50 border-blue-200' : ''}`}>
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0">
                            <NotificationIcon className={`h-5 w-5 ${!notification.read ? 'text-blue-600' : 'text-muted-foreground'}`} />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <h4 className={`font-medium ${!notification.read ? 'text-blue-900' : ''}`}>
                                {notification.title}
                              </h4>
                              <span className="text-xs text-muted-foreground">
                                {formatRelativeTime(notification.timestamp)}
                              </span>
                            </div>
                            <p className={`text-sm ${!notification.read ? 'text-blue-700' : 'text-muted-foreground'}`}>
                              {notification.message}
                            </p>
                            {notification.rfpId && (
                              <div className="mt-2">
                                <Button variant="outline" size="sm" asChild>
                                  <Link href={`/marketplace/rfps/${notification.rfpId}`}>
                                    View RFP <ExternalLink className="ml-1 h-3 w-3" />
                                  </Link>
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  )
}