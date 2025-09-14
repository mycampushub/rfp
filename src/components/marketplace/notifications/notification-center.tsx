"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
  Input,
  Label
} from "lucide-react"

interface Notification {
  id: string
  type: "new_rfp" | "bid_accepted" | "bid_rejected" | "question_answered" | "review_received" | "deadline_reminder" | "vendor_update" | "system"
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
}

interface NotificationCenterProps {
  notifications: Notification[]
  onMarkAsRead: (notificationId: string) => void
  onDismissNotification: (notificationId: string) => void
  onMarkAllAsRead: () => void
  onClearAll: () => void
  onNotificationAction: (notificationId: string) => void
}

export function NotificationCenter({
  notifications,
  onMarkAsRead,
  onDismissNotification,
  onMarkAllAsRead,
  onClearAll,
  onNotificationAction
}: NotificationCenterProps) {
  const [filter, setFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("inbox")

  const unreadCount = notifications.filter(n => !n.isRead && !n.isDismissed).length

  const filteredNotifications = notifications.filter(notification => {
    if (notification.isDismissed) return false
    
    const matchesSearch = !searchQuery || 
      notification.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesFilter = filter === "all" || notification.type === filter || filter === notification.priority
    
    return matchesSearch && matchesFilter
  })

  const inboxNotifications = filteredNotifications.filter(n => !n.isRead)
  const readNotifications = filteredNotifications.filter(n => n.isRead)
  const archivedNotifications = notifications.filter(n => n.isDismissed)

  const getNotificationIcon = (type: string) => {
    const icons = {
      new_rfp: Briefcase,
      bid_accepted: CheckCircle,
      bid_rejected: X,
      question_answered: MessageSquare,
      review_received: Star,
      deadline_reminder: Clock,
      vendor_update: Users,
      system: Settings
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
      system: "bg-gray-100 text-gray-800"
    }
    return colors[type as keyof typeof colors] || "bg-gray-100 text-gray-800"
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Bell className="h-6 w-6" />
          <h2 className="text-2xl font-bold">Notifications</h2>
          {unreadCount > 0 && (
            <Badge className="bg-red-500 text-white">
              {unreadCount} unread
            </Badge>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={onMarkAllAsRead}>
            <CheckCircle className="mr-2 h-4 w-4" />
            Mark all as read
          </Button>
          <Button variant="outline" size="sm" onClick={onClearAll}>
            <Trash2 className="mr-2 h-4 w-4" />
            Clear all
          </Button>
        </div>
      </div>

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
                  { value: "new_rfp", label: "New RFPs" },
                  { value: "bid_accepted", label: "Bid Accepted" },
                  { value: "bid_rejected", label: "Bid Rejected" },
                  { value: "question_answered", label: "Q&A" },
                  { value: "review_received", label: "Reviews" },
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

      {/* Notification Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="inbox">
            Inbox ({inboxNotifications.length})
          </TabsTrigger>
          <TabsTrigger value="read">
            Read ({readNotifications.length})
          </TabsTrigger>
          <TabsTrigger value="archived">
            Archived ({archivedNotifications.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="inbox" className="space-y-4">
          {inboxNotifications.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No new notifications</h3>
                <p className="text-muted-foreground">
                  You're all caught up! Check back later for new updates.
                </p>
              </CardContent>
            </Card>
          ) : (
            inboxNotifications.map((notification) => {
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
                              onClick={() => onMarkAsRead(notification.id)}
                              title="Mark as read"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDismissNotification(notification.id)}
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
                            onClick={() => onNotificationAction(notification.id)}
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
            })
          )}
        </TabsContent>

        <TabsContent value="read" className="space-y-4">
          {readNotifications.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Eye className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No read notifications</h3>
                <p className="text-muted-foreground">
                  Your read notifications will appear here.
                </p>
              </CardContent>
            </Card>
          ) : (
            readNotifications.map((notification) => {
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
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              {notification.message}
                            </p>
                            <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                              <span>Read on {formatDate(notification.createdAt)}</span>
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDismissNotification(notification.id)}
                        >
                          <Archive className="h-4 w-4" />
                        </Button>
                      </div>

                      {notification.actionUrl && (
                        <div className="flex items-center space-x-2 pt-4 border-t">
                          <Button
                            onClick={() => onNotificationAction(notification.id)}
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
            })
          )}
        </TabsContent>

        <TabsContent value="archived" className="space-y-4">
          {archivedNotifications.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Archive className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No archived notifications</h3>
                <p className="text-muted-foreground">
                  Your archived notifications will appear here.
                </p>
              </CardContent>
            </Card>
          ) : (
            archivedNotifications.map((notification) => {
              const NotificationIcon = getNotificationIcon(notification.type)
              
              return (
                <Card key={notification.id} className="opacity-50">
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
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              {notification.message}
                            </p>
                            <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                              <span>Archived on {formatDate(notification.createdAt)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

interface NotificationSettingsProps {
  settings: {
    emailNotifications: boolean
    pushNotifications: boolean
    notificationTypes: Record<string, boolean>
    quietHours: {
      enabled: boolean
      start: string
      end: string
    }
    frequency: "instant" | "daily" | "weekly"
  }
  onSettingsChange: (settings: any) => void
}

export function NotificationSettings({ settings, onSettingsChange }: NotificationSettingsProps) {
  const notificationTypes = [
    { key: "new_rfp", label: "New RFPs matching my criteria", description: "Get notified when new RFPs are posted" },
    { key: "bid_accepted", label: "Bid accepted", description: "When your bid is accepted by a client" },
    { key: "bid_rejected", label: "Bid rejected", description: "When your bid is rejected by a client" },
    { key: "question_answered", label: "Q&A responses", description: "When your questions are answered" },
    { key: "review_received", label: "New reviews", description: "When you receive new reviews" },
    { key: "deadline_reminder", label: "Deadline reminders", description: "Reminders for approaching deadlines" },
    { key: "vendor_update", label: "Vendor updates", description: "Updates from vendors you follow" },
    { key: "system", label: "System notifications", description: "Important system updates and announcements" }
  ]

  const handleSettingChange = (key: string, value: any) => {
    onSettingsChange({
      ...settings,
      [key]: value
    })
  }

  const handleNotificationTypeChange = (type: string, enabled: boolean) => {
    onSettingsChange({
      ...settings,
      notificationTypes: {
        ...settings.notificationTypes,
        [type]: enabled
      }
    })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Notification Preferences</CardTitle>
          <CardDescription>
            Configure how and when you receive notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Notification Methods */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Notification Methods</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Email Notifications</p>
                  <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                </div>
                <Button
                  variant={settings.emailNotifications ? "default" : "outline"}
                  onClick={() => handleSettingChange("emailNotifications", !settings.emailNotifications)}
                >
                  {settings.emailNotifications ? "Enabled" : "Disabled"}
                </Button>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Push Notifications</p>
                  <p className="text-sm text-muted-foreground">Receive real-time push notifications</p>
                </div>
                <Button
                  variant={settings.pushNotifications ? "default" : "outline"}
                  onClick={() => handleSettingChange("pushNotifications", !settings.pushNotifications)}
                >
                  {settings.pushNotifications ? "Enabled" : "Disabled"}
                </Button>
              </div>
            </div>
          </div>

          {/* Notification Frequency */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Notification Frequency</h3>
            <div className="flex items-center space-x-4">
              {[
                { value: "instant", label: "Instant" },
                { value: "daily", label: "Daily Digest" },
                { value: "weekly", label: "Weekly Summary" }
              ].map((freq) => (
                <Button
                  key={freq.value}
                  variant={settings.frequency === freq.value ? "default" : "outline"}
                  onClick={() => handleSettingChange("frequency", freq.value)}
                >
                  {freq.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Quiet Hours */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Quiet Hours</h3>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Enable Quiet Hours</p>
                <p className="text-sm text-muted-foreground">Pause notifications during specific hours</p>
              </div>
              <Button
                variant={settings.quietHours.enabled ? "default" : "outline"}
                onClick={() => handleSettingChange("quietHours", {
                  ...settings.quietHours,
                  enabled: !settings.quietHours.enabled
                })}
              >
                {settings.quietHours.enabled ? "Enabled" : "Disabled"}
              </Button>
            </div>
            
            {settings.quietHours.enabled && (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Start Time</Label>
                  <Input
                    type="time"
                    value={settings.quietHours.start}
                    onChange={(e) => handleSettingChange("quietHours", {
                      ...settings.quietHours,
                      start: e.target.value
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>End Time</Label>
                  <Input
                    type="time"
                    value={settings.quietHours.end}
                    onChange={(e) => handleSettingChange("quietHours", {
                      ...settings.quietHours,
                      end: e.target.value
                    })}
                  />
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Notification Types */}
      <Card>
        <CardHeader>
          <CardTitle>Notification Types</CardTitle>
          <CardDescription>
            Choose which types of notifications you want to receive
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {notificationTypes.map((type) => (
              <div key={type.key} className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="font-medium">{type.label}</p>
                  <p className="text-sm text-muted-foreground">{type.description}</p>
                </div>
                <Button
                  variant={settings.notificationTypes[type.key] ? "default" : "outline"}
                  onClick={() => handleNotificationTypeChange(type.key, !settings.notificationTypes[type.key])}
                >
                  {settings.notificationTypes[type.key] ? "Enabled" : "Disabled"}
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}