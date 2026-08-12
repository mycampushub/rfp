"use client"

import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileText, Clock, DollarSign, CheckCircle, AlertCircle, Eye, MessageSquare, Calendar, TrendingUp, Briefcase, BookmarkPlus, ExternalLink } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { toast } from "sonner"

export default function MyActivity() {
  useEffect(() => { document.title = 'My Activity | RFP Platform' }, [])
  const [myBids, setMyBids] = useState<any[]>([])
  const [notifications, setNotifications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalBids: 0,
    acceptedBids: 0,
    pendingBids: 0,
    savedRFPs: 0,
    profileViews: 0,
    responseRate: 0
  })

  useEffect(() => {
    async function fetchData() {
      try {
        const [bidsRes, notifsRes] = await Promise.all([
          fetch("/api/bids").then(r => r.json()).catch(() => []),
          fetch("/api/notifications?unreadOnly=false").then(r => r.json()).catch(() => []),
        ])

        // Map bids
        const bids = Array.isArray(bidsRes) ? bidsRes : []
        setMyBids(bids.map((bid: any) => ({
          id: bid.id,
          rfpTitle: bid.publicRfp?.title || "Untitled RFP",
          rfpId: bid.publicRfpId,
          amount: bid.amount ? `$${bid.amount.toLocaleString()}` : "N/A",
          status: bid.status || "submitted",
          submittedAt: bid.createdAt,
          deadline: "",
          views: 0,
          messages: 0,
        })))

        // Map notifications
        const notifs = Array.isArray(notifsRes) ? notifsRes : []
        setNotifications(notifs.map((n: any) => ({
          id: n.id,
          type: n.type || "general",
          title: n.title || "Notification",
          message: n.message || n.content || "",
          timestamp: n.createdAt,
          read: n.isRead ?? true,
          rfpId: n.rfpId || n.targetId || "",
        })))

        // Compute stats
        const totalBids = bids.length
        const acceptedBids = bids.filter((b: any) => b.status === "accepted").length
        const pendingBids = bids.filter((b: any) => b.status === "submitted" || b.status === "pending").length
        const _unreadNotifs = notifs.filter((n: any) => !n.isRead).length
        setStats({
          totalBids,
          acceptedBids,
          pendingBids,
          savedRFPs: 0,
          profileViews: 0,
          responseRate: totalBids > 0 ? Math.round((acceptedBids / totalBids) * 100) : 0,
        })
      } catch {
        toast.error("Failed to load activity data")
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      "submitted": "bg-sky-500/15 text-sky-700 dark:text-sky-400",
      "pending": "bg-amber-500/15 text-amber-700 dark:text-amber-400",
      "under_review": "bg-sky-500/15 text-sky-700 dark:text-sky-400",
      "accepted": "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
      "rejected": "bg-red-500/15 text-red-700 dark:text-red-400",
      "draft": "bg-muted text-muted-foreground"
    }
    return colors[status] || "bg-muted text-muted-foreground"
  }

  const getStatusIcon = (status: string) => {
    const icons: Record<string, typeof Clock> = {
      "submitted": Clock,
      "pending": Clock,
      "under_review": Eye,
      "accepted": CheckCircle,
      "rejected": AlertCircle,
      "draft": FileText
    }
    return icons[status] || FileText
  }

  const getNotificationIcon = (type: string) => {
    const icons: Record<string, typeof MessageSquare> = {
      "bid_accepted": CheckCircle,
      "new_message": MessageSquare,
      "rfp_reminder": Clock,
      "new_rfp": FileText,
      "general": FileText,
    }
    return icons[type] || FileText
  }

  const _getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      "IT Services": "bg-sky-500/15 text-sky-700 dark:text-sky-400",
      "Marketing": "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
      "Construction": "bg-orange-500/15 text-orange-700 dark:text-orange-400",
      "Consulting": "bg-violet-500/15 text-violet-700 dark:text-violet-400",
      "Design": "bg-pink-500/15 text-pink-700 dark:text-pink-400"
    }
    return colors[category] || "bg-muted text-muted-foreground"
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatRelativeTime = (dateString: string) => {
    if (!dateString) return ""
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'Just now'
    if (diffInHours < 24) return `${diffInHours} hours ago`
    if (diffInHours < 48) return 'Yesterday'
    return `${Math.floor(diffInHours / 24)} days ago`
  }

  const unreadCount = notifications.filter(n => !n.read).length

  if (loading) {
    return (
      <MainLayout title="My Activity">
        <div className="space-y-6">
          <div>
            <div className="h-9 w-64 bg-muted rounded animate-pulse" />
            <div className="h-5 w-80 bg-muted rounded animate-pulse mt-2" />
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
            {[1,2,3,4,5,6].map(i => (
              <Card key={i}><CardContent className="p-6"><div className="h-16 bg-muted rounded animate-pulse" /></CardContent></Card>
            ))}
          </div>
          <Card><CardContent className="p-6"><div className="h-48 bg-muted rounded animate-pulse" /></CardContent></Card>
        </div>
      </MainLayout>
    )
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
              <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats.acceptedBids}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{stats.pendingBids}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Saved RFPs</CardTitle>
              <BookmarkPlus className="h-4 w-4 text-sky-600 dark:text-sky-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.savedRFPs}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Notifications</CardTitle>
              <Eye className="h-4 w-4 text-violet-600 dark:text-violet-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{notifications.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats.responseRate}%</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="bids" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="bids">My Bids ({myBids.length})</TabsTrigger>
            <TabsTrigger value="saved">Saved RFPs (0)</TabsTrigger>
            <TabsTrigger value="notifications">Notifications ({unreadCount})</TabsTrigger>
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
                  {myBids.length === 0 ? (
                    <div className="text-center py-8">
                      <Briefcase className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="text-lg font-semibold mb-2">No bids yet</h3>
                      <p className="text-muted-foreground mb-4">You haven't submitted any bids. Browse RFPs to get started.</p>
                      <Button asChild>
                        <Link href="/marketplace/rfps">Browse RFPs</Link>
                      </Button>
                    </div>
                  ) : (
                    myBids.map((bid) => {
                      const StatusIcon = getStatusIcon(bid.status)
                      return (
                        <div key={bid.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <h3 className="font-semibold text-lg mb-1">{bid.rfpTitle}</h3>
                              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                                <span className="flex items-center">
                                  <DollarSign className="mr-1 h-3 w-3" />
                                  {bid.amount}
                                </span>
                                <span className="flex items-center">
                                  <Calendar className="mr-1 h-3 w-3" />
                                  Submitted: {formatDate(bid.submittedAt)}
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
                          
                          <div className="flex items-center justify-end">
                            <div className="flex space-x-2">
                              {bid.rfpId && (
                                <Button variant="outline" size="sm" asChild>
                                  <Link href={`/marketplace/rfps/${bid.rfpId}`}>
                                    View RFP
                                  </Link>
                                </Button>
                              )}
                              <Button size="sm" asChild>
                                <Link href={`/marketplace/my-activity/bids/${bid.id}`}>
                                  View Details
                                </Link>
                              </Button>
                            </div>
                          </div>
                        </div>
                      )
                    })
                  )}
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
                <div className="text-center py-8">
                  <BookmarkPlus className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No saved RFPs</h3>
                  <p className="text-muted-foreground mb-4">
                    You haven't saved any RFPs yet. Browse and save RFPs that interest you.
                  </p>
                  <Button asChild>
                    <Link href="/marketplace/rfps">Browse RFPs</Link>
                  </Button>
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
                  {notifications.length === 0 ? (
                    <div className="text-center py-8">
                      <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="text-lg font-semibold mb-2">No notifications</h3>
                      <p className="text-muted-foreground">You're all caught up!</p>
                    </div>
                  ) : (
                    notifications.map((notification) => {
                      const NotificationIcon = getNotificationIcon(notification.type)
                      return (
                        <div key={notification.id} className={`border rounded-lg p-4 ${!notification.read ? 'bg-sky-500/10 dark:bg-sky-500/20 border-sky-500/30 dark:border-sky-500/40' : ''}`}>
                          <div className="flex items-start space-x-3">
                            <div className="flex-shrink-0">
                              <NotificationIcon className={`h-5 w-5 ${!notification.read ? 'text-sky-600 dark:text-sky-400' : 'text-muted-foreground'}`} />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-1">
                                <h4 className={`font-medium ${!notification.read ? 'text-sky-900 dark:text-sky-100' : ''}`}>
                                  {notification.title}
                                </h4>
                                <span className="text-xs text-muted-foreground">
                                  {formatRelativeTime(notification.timestamp)}
                                </span>
                              </div>
                              <p className={`text-sm ${!notification.read ? 'text-sky-700 dark:text-sky-400' : 'text-muted-foreground'}`}>
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
                    })
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  )
}