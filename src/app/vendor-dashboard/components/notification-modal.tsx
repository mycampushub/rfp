"use client"

import { Button } from "@/components/ui/button"
import { X } from "lucide-react"
import { NotificationSettings } from "@/components/marketplace/notifications/notification-center"

interface NotificationModalProps {
  show: boolean
  onClose: () => void
  settings: {
    emailNotifications: boolean
    pushNotifications: boolean
    notificationTypes: {
      new_rfp: boolean
      bid_accepted: boolean
      bid_rejected: boolean
      question_answered: boolean
      review_received: boolean
      deadline_reminder: boolean
      vendor_update: boolean
      system: boolean
    }
    quietHours: {
      enabled: boolean
      start: string
      end: string
    }
    frequency: "instant" | "daily" | "weekly"
  }
  onSettingsChange: (_settings: NotificationModalProps['settings']) => void
  onSave: () => void
}

export function NotificationModal({ show, onClose, settings, onSettingsChange, onSave }: NotificationModalProps) {
  if (!show) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-xl font-semibold">Notification Settings</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="overflow-y-auto max-h-[calc(90vh-80px)] p-4">
          <NotificationSettings
            settings={settings}
            onSettingsChange={onSettingsChange}
          />
        </div>
        <div className="p-4 border-t bg-muted/50 flex justify-end space-x-2">
          <Button
            variant="outline"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button onClick={onSave}>
            Save Settings
          </Button>
        </div>
      </div>
    </div>
  )
}