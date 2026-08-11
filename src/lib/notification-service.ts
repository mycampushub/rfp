"use client"

import { useEffect, useState, useCallback } from 'react'

export interface Notification {
  id: string
  type: "new_rfp" | "bid_accepted" | "bid_rejected" | "question_answered" | "review_received" | "deadline_reminder" | "vendor_update" | "system" | "marketplace_match" | "price_alert" | "competitor_activity"
  title: string
  message: string
  data?: Record<string, unknown>
  isRead: boolean
  isDismissed: boolean
  priority: "low" | "medium" | "high" | "urgent"
  createdAt: string
  expiresAt?: string
  actionUrl?: string
  actionText?: string
  sound?: boolean
  browserNotification?: boolean
}

interface NotificationServiceHook {
  notifications: Notification[]
  unreadCount: number
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'isRead' | 'isDismissed'>) => void
  markAsRead: (notificationId: string) => void
  dismissNotification: (notificationId: string) => void
  markAllAsRead: () => void
  clearAll: () => void
  connectWebSocket: () => void
  disconnectWebSocket: () => void
  requestPermission: () => Promise<boolean>
}

export function useNotificationService(): NotificationServiceHook {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [ws, setWs] = useState<WebSocket | null>(null)

  // Load notifications from localStorage on mount
  useEffect(() => {
    const savedNotifications = localStorage.getItem('vendor-notifications')
    if (savedNotifications) {
      try {
        const parsed = JSON.parse(savedNotifications)
        setNotifications(parsed)
      } catch (error) {
        console.error('Error loading notifications:', error)
      }
    }
  }, [])

  // Save notifications to localStorage when they change
  useEffect(() => {
    localStorage.setItem('vendor-notifications', JSON.stringify(notifications))
  }, [notifications])

  // Request browser notification permission
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!('Notification' in window)) {
      return false
    }

    if (Notification.permission === 'granted') {
      return true
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission()
      return permission === 'granted'
    }

    return false
  }, [])

  // Show browser notification
  const showBrowserNotification = useCallback((notification: Notification) => {
    if (notification.browserNotification && 'Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: notification.id,
        requireInteraction: notification.priority === 'urgent',
        silent: !notification.sound
      })
    }
  }, [])

  // Play notification sound
  const playNotificationSound = useCallback((priority: string) => {
    if (priority === 'urgent' || priority === 'high') {
      const audio = new Audio('/notification-sound.mp3')
      audio.play().catch(() => {
        // Silently handle audio play failures
      })
    }
  }, [])

  // Add new notification
  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'createdAt' | 'isRead' | 'isDismissed'>) => {
    const newNotification: Notification = {
      ...notification,
      id: `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      isRead: false,
      isDismissed: false
    }

    setNotifications(prev => [newNotification, ...prev])

    // Show browser notification if enabled
    if (newNotification.browserNotification) {
      showBrowserNotification(newNotification)
    }

    // Play sound if enabled
    if (newNotification.sound) {
      playNotificationSound(newNotification.priority)
    }
  }, [showBrowserNotification, playNotificationSound])

  // Mark notification as read
  const markAsRead = useCallback((notificationId: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === notificationId
          ? { ...notification, isRead: true }
          : notification
      )
    )
  }, [])

  // Dismiss notification
  const dismissNotification = useCallback((notificationId: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === notificationId
          ? { ...notification, isDismissed: true }
          : notification
      )
    )
  }, [])

  // Mark all as read
  const markAllAsRead = useCallback(() => {
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, isRead: true }))
    )
  }, [])

  // Clear all notifications
  const clearAll = useCallback(() => {
    setNotifications([])
  }, [])

  // WebSocket connection for real-time notifications
  const connectWebSocket = useCallback(() => {
    if (ws) {
      ws.close()
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const wsUrl = `${protocol}//${window.location.host}/api/notifications/ws`

    const websocket = new WebSocket(wsUrl)

    websocket.onopen = () => {
      // Send authentication token if available
      const token = localStorage.getItem('auth-token')
      if (token) {
        websocket.send(JSON.stringify({
          type: 'authenticate',
          token
        }))
      }
    }

    websocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        
        if (data.type === 'notification') {
          addNotification(data.notification)
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error)
      }
    }

    websocket.onclose = () => {
      // Attempt to reconnect after 5 seconds
      setTimeout(connectWebSocket, 5000)
    }

    websocket.onerror = (error) => {
      console.error('WebSocket error:', error)
    }

    setWs(websocket)
  }, [addNotification, ws])

  const disconnectWebSocket = useCallback(() => {
    if (ws) {
      ws.close()
      setWs(null)
    }
  }, [ws])

  // Connect WebSocket on mount and request permission
  useEffect(() => {
    requestPermission()
    connectWebSocket()

    return () => {
      disconnectWebSocket()
    }
  }, [connectWebSocket, disconnectWebSocket, requestPermission])

  // Simulated real-time notifications for demo
  useEffect(() => {
    const demoNotifications = [
      {
        type: 'new_rfp' as const,
        title: 'New RFP: Cloud Migration Project',
        message: 'A new RFP matching your expertise has been posted',
        priority: 'high' as const,
        browserNotification: true,
        sound: true
      },
      {
        type: 'marketplace_match' as const,
        title: 'Perfect Match Found',
        message: 'An RFP with 95% match to your profile is available',
        priority: 'medium' as const,
        browserNotification: true,
        sound: false
      },
      {
        type: 'deadline_reminder' as const,
        title: 'Bid Deadline Approaching',
        message: 'Your bid for E-commerce Platform is due in 2 days',
        priority: 'urgent' as const,
        browserNotification: true,
        sound: true
      }
    ]

    // Simulate receiving notifications
    const interval = setInterval(() => {
      if (Math.random() > 0.8) { // 20% chance every 30 seconds
        const randomNotification = demoNotifications[Math.floor(Math.random() * demoNotifications.length)]
        addNotification(randomNotification)
      }
    }, 30000)

    return () => clearInterval(interval)
  }, [addNotification])

  const unreadCount = notifications.filter(n => !n.isRead && !n.isDismissed).length

  return {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    dismissNotification,
    markAllAsRead,
    clearAll,
    connectWebSocket,
    disconnectWebSocket,
    requestPermission
  }
}