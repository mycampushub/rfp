"use client"

import { useState, useEffect, useRef } from 'react'
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Bell, X, Eye, Settings, ExternalLink } from "lucide-react"
import { useNotificationService, Notification as AppNotification } from "@/lib/notification-service"
import { NotificationCenter } from "./notification-center"

interface NotificationBellProps {
  onOpenSettings?: () => void
}

export function NotificationBell({ onOpenSettings }: NotificationBellProps) {
  const {
    notifications,
    unreadCount,
    markAsRead,
    dismissNotification,
    markAllAsRead,
    clearAll,
    requestPermission
  } = useNotificationService()
  
  const [isOpen, setIsOpen] = useState(false)
  const [showNotificationCenter, setShowNotificationCenter] = useState(false)
  const bellRef = useRef<HTMLButtonElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        bellRef.current && !bellRef.current.contains(event.target as Node) &&
        dropdownRef.current && !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Request notification permission on first interaction
  const handleBellClick = async () => {
    if (!isOpen) {
      await requestPermission()
    }
    setIsOpen(!isOpen)
  }

  const handleNotificationAction = (notificationId: string) => {
    const notification = notifications.find(n => n.id === notificationId)
    if (notification?.actionUrl) {
      window.open(notification.actionUrl, '_blank')
    }
    markAsRead(notificationId)
    setIsOpen(false)
  }

  const handleViewAll = () => {
    setShowNotificationCenter(true)
    setIsOpen(false)
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    
    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `${diffInHours}h ago`
    
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) return `${diffInDays}d ago`
    
    return date.toLocaleDateString()
  }

  const getNotificationIcon = (type: string) => {
    const icons = {
      new_rfp: '📋',
      bid_accepted: '✅',
      bid_rejected: '❌',
      question_answered: '❓',
      review_received: '⭐',
      deadline_reminder: '⏰',
      vendor_update: '👥',
      system: '⚙️',
      marketplace_match: '🎯',
      price_alert: '💰',
      competitor_activity: '🏃'
    }
    return icons[type as keyof typeof icons] || '📢'
  }

  const getNotificationColor = (priority: string) => {
    const colors = {
      low: 'border-gray-200',
      medium: 'border-blue-200',
      high: 'border-orange-200',
      urgent: 'border-red-200'
    }
    return colors[priority as keyof typeof colors] || 'border-gray-200'
  }

  const recentNotifications = notifications
    .filter(n => !n.isRead && !n.isDismissed)
    .slice(0, 5)

  return (
    <>
      {/* Notification Bell */}
      <div className="relative">
        <Button
          ref={bellRef}
          variant="ghost"
          size="sm"
          className="relative p-2"
          onClick={handleBellClick}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-red-500 text-white rounded-full"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>

        {/* Dropdown */}
        {isOpen && (
          <div
            ref={dropdownRef}
            className="absolute right-0 mt-2 w-80 bg-white border rounded-lg shadow-lg z-50"
          >
            <Card className="border-0 rounded-t-none">
              <CardContent className="p-0">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b">
                  <div className="flex items-center space-x-2">
                    <Bell className="h-5 w-5" />
                    <h3 className="font-semibold">Notifications</h3>
                    {unreadCount > 0 && (
                      <Badge className="bg-red-500 text-white">
                        {unreadCount} unread
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center space-x-1">
                    {unreadCount > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={markAllAsRead}
                        className="text-xs"
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        Mark all read
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={onOpenSettings}
                      className="text-xs"
                    >
                      <Settings className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                {/* Notifications List */}
                <div className="max-h-96 overflow-y-auto">
                  {recentNotifications.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                      <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No new notifications</p>
                    </div>
                  ) : (
                    recentNotifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-4 border-b hover:bg-gray-50 cursor-pointer transition-colors ${getNotificationColor(notification.priority)}`}
                        onClick={() => handleNotificationAction(notification.id)}
                      >
                        <div className="flex items-start space-x-3">
                          <div className="text-lg">
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <h4 className="text-sm font-medium truncate">
                                {notification.title}
                              </h4>
                              <div className="flex items-center space-x-2">
                                <span className="text-xs text-muted-foreground">
                                  {formatTime(notification.createdAt)}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-4 w-4 p-0"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    dismissNotification(notification.id)
                                  }}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {notification.message}
                            </p>
                            {notification.actionUrl && (
                              <div className="mt-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-xs h-6"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleNotificationAction(notification.id)
                                  }}
                                >
                                  {notification.actionText || 'View Details'}
                                  <ExternalLink className="ml-1 h-3 w-3" />
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Footer */}
                <div className="p-3 border-t bg-gray-50">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-sm"
                    onClick={handleViewAll}
                  >
                    View all notifications
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Notification Center Modal */}
      {showNotificationCenter && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between">
              <h2 className="text-xl font-semibold">Notification Center</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowNotificationCenter(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
              <NotificationCenter
                notifications={notifications}
                onMarkAsRead={markAsRead}
                onDismissNotification={dismissNotification}
                onMarkAllAsRead={markAllAsRead}
                onClearAll={clearAll}
                onNotificationAction={handleNotificationAction}
              />
            </div>
          </div>
        </div>
      )}
    </>
  )
}