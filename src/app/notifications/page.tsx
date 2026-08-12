"use client"

import { useState, useEffect, useCallback } from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { EmptyState } from "@/components/shared/empty-state"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Bell,
  CheckCheck,
  Trash2,
  Eye,
  Loader2,
  Filter,
} from "lucide-react"
import { toast } from "sonner"
import { formatDate, formatRelativeTime } from "@/lib/utils"

interface Notification {
  id: string
  userId: string
  savedSearchId: string | null
  type: string
  title: string
  message: string
  data: Record<string, unknown> | null
  isRead: boolean
  isDismissed: boolean
  expiresAt: string | null
  createdAt: string
}

const TYPE_LABELS: Record<string, string> = {
  new_rfp: "New RFP",
  bid_accepted: "Bid Accepted",
  question_answered: "Q&A Answered",
  approval_request: "Approval Request",
  approval_decision: "Approval Decision",
  rfp_published: "RFP Published",
  rfp_closed: "RFP Closed",
  rfp_awarded: "RFP Awarded",
  deadline_reminder: "Deadline Reminder",
  contract_created: "Contract Created",
  contract_status: "Contract Update",
  vendor_registered: "Vendor Registered",
  evaluation_completed: "Evaluation Completed",
  announcement: "Announcement",
  system: "System",
}

const TYPE_VARIANTS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  new_rfp: "default",
  bid_accepted: "secondary",
  question_answered: "secondary",
  approval_request: "default",
  approval_decision: "secondary",
  rfp_published: "default",
  rfp_closed: "outline",
  rfp_awarded: "secondary",
  deadline_reminder: "destructive",
  contract_created: "default",
  contract_status: "outline",
  vendor_registered: "secondary",
  evaluation_completed: "secondary",
  announcement: "default",
  system: "outline",
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<"all" | "unread">("all")
  const [deleteTarget, setDeleteTarget] = useState<Notification | null>(null)
  const [markingRead, setMarkingRead] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [markingAll, setMarkingAll] = useState(false)

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true)
      const params = filter === "unread" ? "?unreadOnly=true" : ""
      const res = await fetch(`/api/notifications${params}`)
      if (!res.ok) throw new Error("Failed to fetch notifications")
      const data = await res.json()
      setNotifications(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error(err)
      toast.error("Failed to load notifications")
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => {
    document.title = "Notifications — RFP Platform"
  }, [])

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  const unreadCount = notifications.filter((n) => !n.isRead).length

  const handleMarkAllRead = async () => {
    try {
      setMarkingAll(true)
      const res = await fetch("/api/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAllRead: true }),
      })
      if (!res.ok) throw new Error("Failed to mark all as read")
      toast.success("All notifications marked as read")
      fetchNotifications()
    } catch (err) {
      console.error(err)
      toast.error("Failed to mark all as read")
    } finally {
      setMarkingAll(false)
    }
  }

  const handleToggleRead = async (notif: Notification) => {
    try {
      setMarkingRead(notif.id)
      const res = await fetch("/api/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [notif.id] }),
      })
      if (!res.ok) throw new Error("Failed to update notification")
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n))
      )
      toast.success(notif.isRead ? "Marked as read" : "Marked as read")
    } catch (err) {
      console.error(err)
      toast.error("Failed to update notification")
    } finally {
      setMarkingRead(null)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      setDeleting(true)
      const res = await fetch("/api/notifications", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [deleteTarget.id] }),
      })
      if (!res.ok) throw new Error("Failed to delete notification")
      toast.success("Notification deleted")
      setNotifications((prev) => prev.filter((n) => n.id !== deleteTarget.id))
      setDeleteTarget(null)
    } catch (err) {
      console.error(err)
      toast.error("Failed to delete notification")
    } finally {
      setDeleting(false)
    }
  }

  const handleClearAll = async () => {
    try {
      setDeleting(true)
      const res = await fetch("/api/notifications", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clearAll: true }),
      })
      if (!res.ok) throw new Error("Failed to clear notifications")
      toast.success("All notifications cleared")
      setNotifications([])
    } catch (err) {
      console.error(err)
      toast.error("Failed to clear notifications")
    } finally {
      setDeleting(false)
    }
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {loading
                ? "Loading..."
                : `${notifications.length} notification${notifications.length !== 1 ? "s" : ""}${unreadCount > 0 ? ` · ${unreadCount} unread` : ""}`}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={filter === "all" ? "secondary" : "outline"}
              size="sm"
              onClick={() => setFilter("all")}
              className="gap-1.5"
            >
              <Filter className="h-3.5 w-3.5" />
              All
            </Button>
            <Button
              variant={filter === "unread" ? "secondary" : "outline"}
              size="sm"
              onClick={() => setFilter("unread")}
              className="gap-1.5"
            >
              <Eye className="h-3.5 w-3.5" />
              Unread
            </Button>
            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleMarkAllRead}
                disabled={markingAll}
                className="gap-1.5"
              >
                {markingAll ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <CheckCheck className="h-3.5 w-3.5" />
                )}
                Mark all as read
              </Button>
            )}
            {notifications.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearAll}
                disabled={deleting}
                className="gap-1.5 text-destructive hover:text-destructive"
              >
                {deleting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5" />
                )}
                Clear all
              </Button>
            )}
          </div>
        </div>

        {/* Notification List */}
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                    <Skeleton className="h-6 w-20 rounded-full" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <EmptyState
            icon={Bell}
            title={
              filter === "unread"
                ? "No unread notifications"
                : "No notifications"
            }
            description={
              filter === "unread"
                ? "You're all caught up! All notifications have been read."
                : "You don't have any notifications yet. They'll appear here when there's something new."
            }
          />
        ) : (
          <div className="space-y-3 max-h-[calc(100vh-220px)] overflow-y-auto pr-1">
            {notifications.map((notif) => (
              <Card
                key={notif.id}
                className={
                  !notif.isRead
                    ? "border-l-4 border-l-primary bg-accent/30"
                    : ""
                }
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3
                          className={`text-sm font-semibold leading-tight ${
                            !notif.isRead ? "" : "text-muted-foreground"
                          }`}
                        >
                          {notif.title}
                        </h3>
                        {!notif.isRead && (
                          <span className="inline-block h-2 w-2 rounded-full bg-primary shrink-0" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed mt-1">
                        {notif.message}
                      </p>
                      <div className="flex items-center gap-2 mt-2.5 flex-wrap">
                        <Badge
                          variant={
                            TYPE_VARIANTS[notif.type] ?? "outline"
                          }
                          className="text-xs"
                        >
                          {TYPE_LABELS[notif.type] ?? notif.type}
                        </Badge>
                        <span className="text-xs text-muted-foreground" title={formatDate(notif.createdAt)}>
                          {formatRelativeTime(notif.createdAt)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {!notif.isRead && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleToggleRead(notif)}
                          disabled={markingRead === notif.id}
                          title="Mark as read"
                        >
                          {markingRead === notif.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                          <span className="sr-only">Mark as read</span>
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => setDeleteTarget(notif)}
                        title="Delete notification"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete notification</span>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Notification</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &ldquo;{deleteTarget?.title}&rdquo;? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  )
}
