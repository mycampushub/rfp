import { db } from "@/lib/db"

interface SendParams {
  userId: string
  type: string
  title: string
  message: string
  data?: Record<string, unknown> | unknown
}

export default class NotificationService {
  static async send(params: SendParams): Promise<void> {
    try {
      await db.notification.create({
        data: {
          userId: params.userId,
          type: params.type,
          title: params.title,
          message: params.message,
          data: params.data ?? undefined,
        },
      })
    } catch (error) {
      console.error("Failed to send notification:", error)
    }
  }
}

// Re-export a noop client hook so notification-bell.tsx compiles.
// The bell component fetches real data via its own useEffect internally.
export function useNotificationService() {
  return {
    notifications: [] as NotificationWithDetails[],
    unreadCount: 0,
    markAsRead: async (_id: string) => {},
    dismissNotification: async (_id: string) => {},
    markAllAsRead: async () => {},
    clearAll: async () => {},
    requestPermission: async () => {},
  }
}

/** Mirrors the Prisma Notification model exactly. */
export interface Notification {
  id: string
  userId: string
  savedSearchId?: string | null
  type: string
  title: string
  message: string
  data?: unknown
  isRead: boolean
  isDismissed: boolean
  expiresAt?: Date | null
  createdAt: Date
}

/** Client-side notification shape with UI-only fields (priority, actionUrl, actionText)
 *  and serialised date strings for frontend consumption. */
export interface NotificationWithDetails extends Omit<Notification, 'createdAt' | 'expiresAt'> {
  priority?: "low" | "medium" | "high" | "urgent"
  actionUrl?: string
  actionText?: string
  /** Serialised ISO string for client consumption. */
  createdAt: string
  expiresAt?: string | null
}
