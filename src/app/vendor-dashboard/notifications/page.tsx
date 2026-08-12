"use client"

import { useState, useEffect } from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Bell, CheckCircle, X, Settings, Filter, Search, Clock, Briefcase, Star, MessageSquare, Users, TrendingUp, ExternalLink, Eye, Trash2, Archive, Mail, Phone, Globe, DollarSign, Shield, Wifi, WifiOff, Plus } from "lucide-react"
import { toast } from "sonner"
import { LoadingCards } from "@/components/shared/loading-table"
import { formatDate as formatDateDisplay } from "@/lib/utils"

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
  useEffect(() => { document.title = 'Vendor Notifications | RFP Platform' }, [])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [preferences, setPreferences] = useState<NotificationPreference[]>([])
  const [rules, setRules] = useState<NotificationRule[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("notifications")
  const [realTimeEnabled, setRealTimeEnabled] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [notifsRes, prefsRes] = await Promise.all([
          fetch('/api/notifications').then(r => r.ok ? r.json() : []),
          fetch('/api/notifications/preferences').then(r => r.ok ? r.json() : []),
        ])

        const notifsData = Array.isArray(notifsRes) ? notifsRes : []
        setNotifications(notifsData.map((n: Record<string, unknown>) => ({
          id: n.id,
          type: (n.type || 'system') as Notification['type'],
          title: n.title || '',
          message: n.message || '',
          data: n.data as Record<string, unknown> | undefined,
          isRead: n.isRead || false,
          isDismissed: false,
          priority: 'medium' as const,
          createdAt: n.createdAt || '',
          deliveryMethod: 'in_app' as const,
          category: 'system' as const,
        })))

        const prefsData = Array.isArray(prefsRes) ? prefsRes : []
        setPreferences(prefsData.map((p: Record<string, unknown>) => ({
          type: p.type || '',
          enabled: true,
          deliveryMethods: [],
          frequency: 'immediate' as const,
          quietHours: false,
        })))

        setRules([])
      } catch {
        toast.error('Failed to load notifications')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
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
      new_rfp: "bg-sky-500/15 text-sky-700 dark:text-sky-400",
      bid_accepted: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
      bid_rejected: "bg-red-500/15 text-red-700 dark:text-red-400",
      question_answered: "bg-violet-500/15 text-violet-700 dark:text-violet-400",
      review_received: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
      deadline_reminder: "bg-orange-500/15 text-orange-700 dark:text-orange-400",
      vendor_update: "bg-indigo-500/15 text-indigo-700 dark:text-indigo-400",
      system: "bg-muted text-muted-foreground",
      market_insight: "bg-teal-500/15 text-teal-700 dark:text-teal-400",
      competitor_activity: "bg-pink-500/15 text-pink-700 dark:text-pink-400",
      price_alert: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
      compliance_update: "bg-rose-500/15 text-rose-700 dark:text-rose-400"
    }
    return colors[type as keyof typeof colors] || "bg-muted text-muted-foreground"
  }

  const getCategoryColor = (category: string) => {
    const colors = {
      opportunity: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
      performance: "bg-sky-500/15 text-sky-700 dark:text-sky-400",
      compliance: "bg-red-500/15 text-red-700 dark:text-red-400",
      market: "bg-violet-500/15 text-violet-700 dark:text-violet-400",
      system: "bg-muted text-muted-foreground"
    }
    return colors[category as keyof typeof colors] || "bg-muted text-muted-foreground"
  }

  const getPriorityColor = (priority: string) => {
    const colors = {
      low: "bg-muted text-muted-foreground",
      medium: "bg-sky-500/15 text-sky-700 dark:text-sky-400",
      high: "bg-orange-500/15 text-orange-700 dark:text-orange-400",
      urgent: "bg-red-500/15 text-red-700 dark:text-red-400"
    }
    return colors[priority as keyof typeof colors] || "bg-muted text-muted-foreground"
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
    return formatDateDisplay(date)
  }

  const isExpired = (expiresAt?: string) => {
    if (!expiresAt) return false
    return new Date(expiresAt) < new Date()
  }

  const markAsRead = async (notificationId: string) => {
    try {
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [notificationId] }),
      })
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
      )
    } catch {
      toast.error('Failed to mark as read')
    }
  }

  const dismissNotification = async (notificationId: string) => {
    try {
      const res = await fetch('/api/notifications', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [notificationId] }),
      })
      if (res.ok) {
        setNotifications(prev => 
          prev.filter(n => n.id !== notificationId)
        )
      } else {
        toast.error('Failed to dismiss notification')
      }
    } catch {
      toast.error('Failed to dismiss notification')
    }
  }

  const markAllAsRead = async () => {
    try {
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAllRead: true }),
      })
      setNotifications(prev => 
        prev.map(n => ({ ...n, isRead: true }))
      )
      toast.success('All notifications marked as read')
    } catch {
      toast.error('Failed to mark all as read')
    }
  }

  const clearAll = async () => {
    try {
      const res = await fetch('/api/notifications', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clearAll: true }),
      })
      if (res.ok) {
        setNotifications([])
      } else {
        toast.error('Failed to clear notifications')
      }
    } catch {
      toast.error('Failed to clear notifications')
    }
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
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Vendor Notifications</h1>
            <p className="text-muted-foreground mt-1">Loading...</p>
          </div>
          <LoadingCards count={4} />
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
                <Badge className="bg-red-500 text-white dark:text-white">
                  {unreadCount} unread
                </Badge>
              )}
            </div>
            <div className="flex items-center space-x-2">
              {realTimeEnabled ? (
                <Wifi className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <WifiOff className="h-4 w-4 text-muted-foreground" />
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
                        <span className="w-2 h-2 bg-sky-500 rounded-full mr-2"></span>
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
                                          <Badge className="bg-muted text-muted-foreground">
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
                        <span className="w-2 h-2 bg-muted-foreground rounded-full mr-2"></span>
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