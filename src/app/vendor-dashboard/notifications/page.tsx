"use client"

import { useState, useEffect } from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { 
  Bell, 
  CheckCircle, 
  X, 
  Settings,
  Filter,
  Search,
  Clock,
  Briefcase,
  Star,
  MessageSquare,
  Users,
  TrendingUp,
  ExternalLink,
  Eye,
  Trash2,
  Archive,
  Mail,
  Phone,
  Globe,
  Zap,
  AlertTriangle,
  ThumbsUp,
  DollarSign,
  Target,
  Calendar,
  MapPin,
  Shield,
  Wifi,
  WifiOff,
  Volume2,
  VolumeX,
  Plus
} from "lucide-react"

interface Notification {
  id: string
  type: "new_rfp" | "bid_accepted" | "bid_rejected" | "question_answered" | "review_received" | "deadline_reminder" | "vendor_update" | "system" | "market_insight" | "competitor_activity" | "price_alert" | "compliance_update"
  title: string
  message: string
  data?: any
  isRead: boolean
  isDismissed: boolean
  priority: "low" | "medium" | "high" | "urgent"
  createdAt: string
  expiresAt?: string
  actionUrl?: string
  actionText?: string
  deliveryMethod: "in_app" | "email" | "sms" | "push"
  category: "opportunity" | "performance" | "compliance" | "market" | "system"
}

interface NotificationPreference {
  type: string
  enabled: boolean
  deliveryMethods: string[]
  frequency: "immediate" | "daily" | "weekly" | "monthly"
  quietHours: boolean
  quietHoursStart?: string
  quietHoursEnd?: string
}

interface NotificationRule {
  id: string
  name: string
  description: string
  conditions: {
    categories?: string[]
    priorities?: string[]
    keywords?: string[]
    budgetRange?: { min: number; max: number }
    locations?: string[]
  }
  actions: {
    deliveryMethods: string[]
    autoRespond?: boolean
    escalateTo?: string
  }
  isActive: boolean
}

export default function VendorNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [preferences, setPreferences] = useState<NotificationPreference[]>([])
  const [rules, setRules] = useState<NotificationRule[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("notifications")
  const [realTimeEnabled, setRealTimeEnabled] = useState(true)

  // Mock data for demonstration
  const mockNotifications: Notification[] = [
    {
      id: "1",
      type: "new_rfp",
      title: "New RFP: Cloud Migration Project",
      message: "A new RFP matching your expertise has been posted. Budget: $500,000 - $750,000",
      data: { rfpId: "rfp-123", budget: "$500,000 - $750,000", category: "IT Services" },
      isRead: false,
      isDismissed: false,
      priority: "high",
      createdAt: "2024-12-10T10:30:00Z",
      expiresAt: "2024-12-17T10:30:00Z",
      actionUrl: "/marketplace/rfps/123",
      actionText: "View RFP",
      deliveryMethod: "in_app",
      category: "opportunity"
    },
    {
      id: "2",
      type: "bid_accepted",
      title: "Bid Accepted! E-commerce Platform",
      message: "Congratulations! Your bid for the E-commerce Platform Development has been accepted.",
      data: { bidId: "bid-456", amount: "$350,000", client: "Retail Giant Inc." },
      isRead: false,
      isDismissed: false,
      priority: "urgent",
      createdAt: "2024-12-10T09:15:00Z",
      actionUrl: "/vendor-dashboard/bids/456",
      actionText: "View Details",
      deliveryMethod: "in_app",
      category: "performance"
    },
    {
      id: "3",
      type: "question_answered",
      title: "New Question: Security Requirements",
      message: "A potential client has asked about your security certifications and compliance.",
      data: { questionId: "q-789", rfpId: "rfp-123" },
      isRead: true,
      isDismissed: false,
      priority: "medium",
      createdAt: "2024-12-09T14:20:00Z",
      actionUrl: "/marketplace/rfps/123#qna",
      actionText: "Answer Question",
      deliveryMethod: "email",
      category: "opportunity"
    },
    {
      id: "4",
      type: "market_insight",
      title: "Market Trend: AI Services Demand",
      message: "Demand for AI/ML services has increased by 45% in your region. Consider updating your profile.",
      data: { trend: "AI Services", growth: 45, region: "North America" },
      isRead: false,
      isDismissed: false,
      priority: "medium",
      createdAt: "2024-12-09T11:00:00Z",
      actionUrl: "/marketplace/analytics",
      actionText: "View Analytics",
      deliveryMethod: "in_app",
      category: "market"
    },
    {
      id: "5",
      type: "competitor_activity",
      title: "Competitor Alert: TechSolutions Pro",
      message: "TechSolutions Pro has won 3 similar projects in the last month. Review their strategy.",
      data: { competitor: "TechSolutions Pro", projectsWon: 3, categories: ["IT Services", "Cloud Computing"] },
      isRead: true,
      isDismissed: false,
      priority: "low",
      createdAt: "2024-12-08T16:45:00Z",
      actionUrl: "/marketplace/analytics#competitors",
      actionText: "View Competitors",
      deliveryMethod: "in_app",
      category: "market"
    },
    {
      id: "6",
      type: "deadline_reminder",
      title: "Deadline Reminder: Mobile App Development",
      message: "Bid submission deadline for Mobile App Development RFP is in 2 days.",
      data: { rfpId: "rfp-456", deadline: "2024-12-12", hoursRemaining: 48 },
      isRead: false,
      isDismissed: false,
      priority: "high",
      createdAt: "2024-12-08T10:00:00Z",
      expiresAt: "2024-12-12T23:59:00Z",
      actionUrl: "/marketplace/rfps/456",
      actionText: "Submit Bid",
      deliveryMethod: "in_app",
      category: "opportunity"
    },
    {
      id: "7",
      type: "compliance_update",
      title: "Compliance Update: New Data Protection Laws",
      message: "New data protection regulations may affect your current projects. Review requirements.",
      data: { regulation: "Data Protection Act", effectiveDate: "2025-01-01" },
      isRead: false,
      isDismissed: false,
      priority: "high",
      createdAt: "2024-12-07T13:30:00Z",
      actionUrl: "/vendor-dashboard/compliance",
      actionText: "Review Compliance",
      deliveryMethod: "email",
      category: "compliance"
    },
    {
      id: "8",
      type: "price_alert",
      title: "Price Alert: Below Market Rate",
      message: "Your average bid price is 15% below market rate for similar services. Consider adjusting.",
      data: { currentRate: "$85/hr", marketRate: "$100/hr", difference: "-15%" },
      isRead: true,
      isDismissed: false,
      priority: "medium",
      createdAt: "2024-12-07T09:00:00Z",
      actionUrl: "/marketplace/analytics#pricing",
      actionText: "View Pricing",
      deliveryMethod: "in_app",
      category: "performance"
    }
  ]

  const mockPreferences: NotificationPreference[] = [
    {
      type: "new_rfp",
      enabled: true,
      deliveryMethods: ["in_app", "email", "push"],
      frequency: "immediate",
      quietHours: true,
      quietHoursStart: "22:00",
      quietHoursEnd: "08:00"
    },
    {
      type: "bid_accepted",
      enabled: true,
      deliveryMethods: ["in_app", "email", "sms"],
      frequency: "immediate",
      quietHours: false
    },
    {
      type: "bid_rejected",
      enabled: true,
      deliveryMethods: ["in_app", "email"],
      frequency: "immediate",
      quietHours: false
    },
    {
      type: "question_answered",
      enabled: true,
      deliveryMethods: ["in_app", "email"],
      frequency: "immediate",
      quietHours: true,
      quietHoursStart: "22:00",
      quietHoursEnd: "08:00"
    },
    {
      type: "market_insight",
      enabled: true,
      deliveryMethods: ["in_app"],
      frequency: "daily",
      quietHours: false
    },
    {
      type: "competitor_activity",
      enabled: false,
      deliveryMethods: ["in_app"],
      frequency: "weekly",
      quietHours: false
    },
    {
      type: "deadline_reminder",
      enabled: true,
      deliveryMethods: ["in_app", "email", "sms"],
      frequency: "immediate",
      quietHours: false
    },
    {
      type: "compliance_update",
      enabled: true,
      deliveryMethods: ["in_app", "email"],
      frequency: "immediate",
      quietHours: false
    }
  ]

  const mockRules: NotificationRule[] = [
    {
      id: "1",
      name: "High Value RFPs",
      description: "Notify immediately for RFPs over $100,000",
      conditions: {
        categories: ["IT Services", "Software Development"],
        priorities: ["high", "urgent"],
        budgetRange: { min: 100000, max: 1000000 }
      },
      actions: {
        deliveryMethods: ["in_app", "email", "sms"],
        escalateTo: "manager"
      },
      isActive: true
    },
    {
      id: "2",
      name: "Local Opportunities",
      description: "Prioritize RFPs in service area",
      conditions: {
        locations: ["California", "Nevada", "Arizona"],
        keywords: ["local", "onsite", "regional"]
      },
      actions: {
        deliveryMethods: ["in_app", "email"],
        autoRespond: true
      },
      isActive: true
    }
  ]

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setNotifications(mockNotifications)
      setPreferences(mockPreferences)
      setRules(mockRules)
      setLoading(false)
    }, 1000)
  }, [])

  const unreadCount = notifications.filter(n => !n.isRead && !n.isDismissed).length

  const filteredNotifications = notifications.filter(notification => {
    if (notification.isDismissed) return false
    
    const matchesSearch = !searchQuery || 
      notification.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesFilter = filter === "all" || 
      notification.type === filter || 
      filter === notification.priority ||
      filter === notification.category
    
    return matchesSearch && matchesFilter
  })

  const inboxNotifications = filteredNotifications.filter(n => !n.isRead)
  const readNotifications = filteredNotifications.filter(n => n.isRead)

  const getNotificationIcon = (type: string) => {
    const icons = {
      new_rfp: Briefcase,
      bid_accepted: CheckCircle,
      bid_rejected: X,
      question_answered: MessageSquare,
      review_received: Star,
      deadline_reminder: Clock,
      vendor_update: Users,
      system: Settings,
      market_insight: TrendingUp,
      competitor_activity: Users,
      price_alert: DollarSign,
      compliance_update: Shield
    }
    return icons[type as keyof typeof icons] || Bell
  }

  const getNotificationColor = (type: string) => {
    const colors = {
      new_rfp: "bg-blue-100 text-blue-800",
      bid_accepted: "bg-green-100 text-green-800",
      bid_rejected: "bg-red-100 text-red-800",
      question_answered: "bg-purple-100 text-purple-800",
      review_received: "bg-yellow-100 text-yellow-800",
      deadline_reminder: "bg-orange-100 text-orange-800",
      vendor_update: "bg-indigo-100 text-indigo-800",
      system: "bg-gray-100 text-gray-800",
      market_insight: "bg-teal-100 text-teal-800",
      competitor_activity: "bg-pink-100 text-pink-800",
      price_alert: "bg-amber-100 text-amber-800",
      compliance_update: "bg-rose-100 text-rose-800"
    }
    return colors[type as keyof typeof colors] || "bg-gray-100 text-gray-800"
  }

  const getCategoryColor = (category: string) => {
    const colors = {
      opportunity: "bg-green-100 text-green-800",
      performance: "bg-blue-100 text-blue-800",
      compliance: "bg-red-100 text-red-800",
      market: "bg-purple-100 text-purple-800",
      system: "bg-gray-100 text-gray-800"
    }
    return colors[category as keyof typeof colors] || "bg-gray-100 text-gray-800"
  }

  const getPriorityColor = (priority: string) => {
    const colors = {
      low: "bg-gray-100 text-gray-800",
      medium: "bg-blue-100 text-blue-800",
      high: "bg-orange-100 text-orange-800",
      urgent: "bg-red-100 text-red-800"
    }
    return colors[priority as keyof typeof colors] || "bg-gray-100 text-gray-800"
  }

  const getDeliveryIcon = (method: string) => {
    const icons = {
      in_app: Bell,
      email: Mail,
      sms: Phone,
      push: Globe
    }
    return icons[method as keyof typeof icons] || Bell
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return "Just now"
    if (diffInHours < 24) return `${diffInHours}h ago`
    if (diffInHours < 48) return "Yesterday"
    return date.toLocaleDateString()
  }

  const isExpired = (expiresAt?: string) => {
    if (!expiresAt) return false
    return new Date(expiresAt) < new Date()
  }

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
    )
  }

  const dismissNotification = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, isDismissed: true } : n)
    )
  }

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(n => ({ ...n, isRead: true }))
    )
  }

  const clearAll = () => {
    setNotifications(prev => 
      prev.map(n => ({ ...n, isDismissed: true }))
    )
  }

  const togglePreference = (type: string, field: keyof NotificationPreference, value: any) => {
    setPreferences(prev => 
      prev.map(p => p.type === type ? { ...p, [field]: value } : p)
    )
  }

  const toggleRule = (ruleId: string) => {
    setRules(prev => 
      prev.map(r => r.id === ruleId ? { ...r, isActive: !r.isActive } : r)
    )
  }

  if (loading) {
    return (
      <MainLayout title="Vendor Notifications">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading notifications...</div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout title="Vendor Notifications">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Bell className="h-6 w-6" />
              <h1 className="text-3xl font-bold">Vendor Notifications</h1>
              {unreadCount > 0 && (
                <Badge className="bg-red-500 text-white">
                  {unreadCount} unread
                </Badge>
              )}
            </div>
            <div className="flex items-center space-x-2">
              {realTimeEnabled ? (
                <Wifi className="h-4 w-4 text-green-600" />
              ) : (
                <WifiOff className="h-4 w-4 text-gray-400" />
              )}
              <Switch
                checked={realTimeEnabled}
                onCheckedChange={setRealTimeEnabled}
              />
              <Label className="text-sm">Real-time</Label>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={markAllAsRead}>
              <CheckCircle className="mr-2 h-4 w-4" />
              Mark all as read
            </Button>
            <Button variant="outline" onClick={clearAll}>
              <Trash2 className="mr-2 h-4 w-4" />
              Clear all
            </Button>
          </div>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="preferences">Preferences</TabsTrigger>
            <TabsTrigger value="rules">Rules</TabsTrigger>
          </TabsList>

          <TabsContent value="notifications" className="space-y-6">
            {/* Search and Filters */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center space-x-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search notifications..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 w-64"
                      />
                    </div>
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <div className="flex flex-wrap gap-2">
                      {[
                        { value: "all", label: "All" },
                        { value: "opportunity", label: "Opportunities" },
                        { value: "performance", label: "Performance" },
                        { value: "compliance", label: "Compliance" },
                        { value: "market", label: "Market" },
                        { value: "urgent", label: "Urgent" },
                        { value: "high", label: "High Priority" }
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
                </div>
              </CardContent>
            </Card>

            {/* Notifications List */}
            <div className="space-y-4">
              {inboxNotifications.length === 0 && readNotifications.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">No notifications</h3>
                    <p className="text-muted-foreground">
                      You're all caught up! Check back later for new updates.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <>
                  {/* Unread Notifications */}
                  {inboxNotifications.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold flex items-center">
                        <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                        New Notifications ({inboxNotifications.length})
                      </h3>
                      {inboxNotifications.map((notification) => {
                        const NotificationIcon = getNotificationIcon(notification.type)
                        
                        return (
                          <Card key={notification.id} className={`transition-all ${
                            !notification.isRead ? 'border-l-4 border-l-blue-500' : ''
                          } ${isExpired(notification.expiresAt) ? 'opacity-60' : ''}`}>
                            <CardContent className="pt-6">
                              <div className="space-y-4">
                                {/* Header */}
                                <div className="flex items-start justify-between">
                                  <div className="flex items-start space-x-3">
                                    <div className={`p-2 rounded-full ${getNotificationColor(notification.type)}`}>
                                      <NotificationIcon className="h-4 w-4" />
                                    </div>
                                    <div className="flex-1">
                                      <div className="flex items-center space-x-2 mb-1">
                                        <h4 className="font-semibold">{notification.title}</h4>
                                        <Badge className={getPriorityColor(notification.priority)}>
                                          {notification.priority}
                                        </Badge>
                                        <Badge className={getCategoryColor(notification.category)}>
                                          {notification.category}
                                        </Badge>
                                        {isExpired(notification.expiresAt) && (
                                          <Badge className="bg-gray-100 text-gray-800">
                                            Expired
                                          </Badge>
                                        )}
                                      </div>
                                      <p className="text-sm text-muted-foreground mb-2">
                                        {notification.message}
                                      </p>
                                      <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                                        <span>{formatDate(notification.createdAt)}</span>
                                        <div className="flex items-center space-x-1">
                                          {getDeliveryIcon(notification.deliveryMethod)}
                                          <span>{notification.deliveryMethod}</span>
                                        </div>
                                        {notification.expiresAt && (
                                          <span>Expires: {formatDate(notification.expiresAt)}</span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    {!notification.isRead && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => markAsRead(notification.id)}
                                        title="Mark as read"
                                      >
                                        <Eye className="h-4 w-4" />
                                      </Button>
                                    )}
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => dismissNotification(notification.id)}
                                      title="Dismiss"
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>

                                {/* Actions */}
                                {notification.actionUrl && (
                                  <div className="flex items-center space-x-2 pt-4 border-t">
                                    <Button
                                      onClick={() => window.open(notification.actionUrl, '_blank')}
                                      size="sm"
                                    >
                                      {notification.actionText || "View Details"}
                                      <ExternalLink className="ml-2 h-4 w-4" />
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        )
                      })}
                    </div>
                  )}

                  {/* Read Notifications */}
                  {readNotifications.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold flex items-center">
                        <span className="w-2 h-2 bg-gray-400 rounded-full mr-2"></span>
                        Read Notifications ({readNotifications.length})
                      </h3>
                      {readNotifications.map((notification) => {
                        const NotificationIcon = getNotificationIcon(notification.type)
                        
                        return (
                          <Card key={notification.id} className="opacity-75">
                            <CardContent className="pt-6">
                              <div className="space-y-4">
                                <div className="flex items-start justify-between">
                                  <div className="flex items-start space-x-3">
                                    <div className={`p-2 rounded-full ${getNotificationColor(notification.type)}`}>
                                      <NotificationIcon className="h-4 w-4" />
                                    </div>
                                    <div className="flex-1">
                                      <div className="flex items-center space-x-2 mb-1">
                                        <h4 className="font-semibold">{notification.title}</h4>
                                        <Badge className={getPriorityColor(notification.priority)}>
                                          {notification.priority}
                                        </Badge>
                                        <Badge className={getCategoryColor(notification.category)}>
                                          {notification.category}
                                        </Badge>
                                      </div>
                                      <p className="text-sm text-muted-foreground mb-2">
                                        {notification.message}
                                      </p>
                                      <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                                        <span>Read on {formatDate(notification.createdAt)}</span>
                                        <div className="flex items-center space-x-1">
                                          {getDeliveryIcon(notification.deliveryMethod)}
                                          <span>{notification.deliveryMethod}</span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => dismissNotification(notification.id)}
                                  >
                                    <Archive className="h-4 w-4" />
                                  </Button>
                                </div>

                                {notification.actionUrl && (
                                  <div className="flex items-center space-x-2 pt-4 border-t">
                                    <Button
                                      onClick={() => window.open(notification.actionUrl, '_blank')}
                                      variant="outline"
                                      size="sm"
                                    >
                                      {notification.actionText || "View Details"}
                                      <ExternalLink className="ml-2 h-4 w-4" />
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        )
                      })}
                    </div>
                  )}
                </>
              )}
            </div>
          </TabsContent>

          <TabsContent value="preferences" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="mr-2 h-5 w-5" />
                  Notification Preferences
                </CardTitle>
                <CardDescription>
                  Configure how and when you receive notifications
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {preferences.map((pref) => (
                    <div key={pref.type} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <Switch
                            checked={pref.enabled}
                            onCheckedChange={(checked) => togglePreference(pref.type, 'enabled', checked)}
                          />
                          <h4 className="font-medium capitalize">{pref.type.replace('_', ' ')}</h4>
                        </div>
                        <div className="text-sm text-muted-foreground mb-2">
                          Delivery: {pref.deliveryMethods.join(', ')}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Frequency: {pref.frequency}
                        </div>
                        {pref.quietHours && (
                          <div className="text-sm text-muted-foreground">
                            Quiet hours: {pref.quietHoursStart} - {pref.quietHoursEnd}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm">
                          Edit
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="rules" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">Notification Rules</h2>
                <p className="text-muted-foreground">Automate your notification management</p>
              </div>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Rule
              </Button>
            </div>

            <div className="space-y-4">
              {rules.map((rule) => (
                <Card key={rule.id}>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Switch
                            checked={rule.isActive}
                            onCheckedChange={() => toggleRule(rule.id)}
                          />
                          <div>
                            <h4 className="font-semibold">{rule.name}</h4>
                            <p className="text-sm text-muted-foreground">{rule.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button variant="outline" size="sm">
                            Edit
                          </Button>
                          <Button variant="outline" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <h5 className="text-sm font-medium mb-2">Conditions</h5>
                          <div className="space-y-1 text-sm text-muted-foreground">
                            {rule.conditions.categories && (
                              <div>Categories: {rule.conditions.categories.join(', ')}</div>
                            )}
                            {rule.conditions.priorities && (
                              <div>Priorities: {rule.conditions.priorities.join(', ')}</div>
                            )}
                            {rule.conditions.keywords && (
                              <div>Keywords: {rule.conditions.keywords.join(', ')}</div>
                            )}
                            {rule.conditions.budgetRange && (
                              <div>Budget: ${rule.conditions.budgetRange.min.toLocaleString()} - ${rule.conditions.budgetRange.max.toLocaleString()}</div>
                            )}
                            {rule.conditions.locations && (
                              <div>Locations: {rule.conditions.locations.join(', ')}</div>
                            )}
                          </div>
                        </div>

                        <div>
                          <h5 className="text-sm font-medium mb-2">Actions</h5>
                          <div className="space-y-1 text-sm text-muted-foreground">
                            <div>Delivery: {rule.actions.deliveryMethods.join(', ')}</div>
                            {rule.actions.autoRespond && (
                              <div>Auto-respond: Enabled</div>
                            )}
                            {rule.actions.escalateTo && (
                              <div>Escalate to: {rule.actions.escalateTo}</div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  )
}