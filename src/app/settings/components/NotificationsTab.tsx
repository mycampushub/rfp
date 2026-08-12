"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Bell, RefreshCw, Save } from "lucide-react"

interface NotificationSettings {
  emailNotifications: boolean
  pushNotifications: boolean
  newRfpAlerts: boolean
  bidUpdates: boolean
  deadlineReminders: boolean
  weeklyDigest: boolean
  marketingEmails: boolean
}

interface NotificationsTabProps {
  notificationSettings: NotificationSettings
  isLoading: boolean
  setNotificationSettings: React.Dispatch<React.SetStateAction<NotificationSettings>>
  onSave: () => void
}

export function NotificationsTab({ notificationSettings, isLoading, setNotificationSettings, onSave }: NotificationsTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Bell className="mr-2 h-5 w-5" />
          Notification Preferences
        </CardTitle>
        <CardDescription>
          Choose how and when you want to receive notifications
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Notification Methods</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Email Notifications</p>
                <p className="text-sm text-muted-foreground">Receive notifications via email</p>
              </div>
              <Checkbox
                checked={notificationSettings.emailNotifications}
                onCheckedChange={(checked) => 
                  setNotificationSettings(prev => ({ ...prev, emailNotifications: checked as boolean }))
                }
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Push Notifications</p>
                <p className="text-sm text-muted-foreground">Receive real-time push notifications</p>
              </div>
              <Checkbox
                checked={notificationSettings.pushNotifications}
                onCheckedChange={(checked) => 
                  setNotificationSettings(prev => ({ ...prev, pushNotifications: checked as boolean }))
                }
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Notification Types</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">New RFP Alerts</p>
                <p className="text-sm text-muted-foreground">Get notified about new RFP opportunities</p>
              </div>
              <Checkbox
                checked={notificationSettings.newRfpAlerts}
                onCheckedChange={(checked) => 
                  setNotificationSettings(prev => ({ ...prev, newRfpAlerts: checked as boolean }))
                }
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Bid Updates</p>
                <p className="text-sm text-muted-foreground">Notifications about your bid status</p>
              </div>
              <Checkbox
                checked={notificationSettings.bidUpdates}
                onCheckedChange={(checked) => 
                  setNotificationSettings(prev => ({ ...prev, bidUpdates: checked as boolean }))
                }
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Deadline Reminders</p>
                <p className="text-sm text-muted-foreground">Reminders for approaching deadlines</p>
              </div>
              <Checkbox
                checked={notificationSettings.deadlineReminders}
                onCheckedChange={(checked) => 
                  setNotificationSettings(prev => ({ ...prev, deadlineReminders: checked as boolean }))
                }
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Weekly Digest</p>
                <p className="text-sm text-muted-foreground">Summary of weekly activity</p>
              </div>
              <Checkbox
                checked={notificationSettings.weeklyDigest}
                onCheckedChange={(checked) => 
                  setNotificationSettings(prev => ({ ...prev, weeklyDigest: checked as boolean }))
                }
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Marketing Emails</p>
                <p className="text-sm text-muted-foreground">Product updates and marketing content</p>
              </div>
              <Checkbox
                checked={notificationSettings.marketingEmails}
                onCheckedChange={(checked) => 
                  setNotificationSettings(prev => ({ ...prev, marketingEmails: checked as boolean }))
                }
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={onSave} disabled={isLoading}>
            {isLoading ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Preferences
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
