"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Bell, Plus, Edit, Trash2 } from "lucide-react"
import { toast } from "sonner"
import type { NotificationTemplate } from "../types"
import { getNotificationTypeColor } from "../lib/admin-helpers"
import { formatDate } from "@/lib/utils"

export function NotificationsTab({ notificationTemplates, onRefresh }: { notificationTemplates: NotificationTemplate[], onRefresh?: () => void }) {
  const [deleteTarget, setDeleteTarget] = useState<NotificationTemplate | null>(null)

  const handleDeleteTemplate = async () => {
    if (!deleteTarget) return
    try {
      const res = await fetch(`/api/notifications`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: deleteTarget.id }) })
      if (res.ok) {
        toast.success(`Template "${deleteTarget.name}" deleted`)
        onRefresh?.()
      } else {
        toast.error('Failed to delete template')
      }
    } catch {
      toast.error('Failed to delete template')
    }
    setDeleteTarget(null)
  }

  const handleToggleTemplate = async (template: NotificationTemplate) => {
    try {
      const res = await fetch(`/api/notifications`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: template.id, isActive: !template.isActive }),
      })
      if (res.ok) {
        toast.success(`Template ${template.isActive ? 'deactivated' : 'activated'}`)
        onRefresh?.()
      } else {
        toast.error('Failed to update template')
      }
    } catch {
      toast.error('Failed to update template')
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center">
                <Bell className="mr-2 h-5 w-5" />
                Notification Templates
              </CardTitle>
              <CardDescription>
                Manage notification templates and delivery settings
              </CardDescription>
            </div>
            {/* TODO: Template creation dialog — requires template editor UI */}
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Used</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {notificationTemplates.map((template) => (
                <TableRow key={template.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{template.name}</div>
                      <div className="text-sm text-muted-foreground">{template.subject}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getNotificationTypeColor(template.type)}>
                      {template.type}
                    </Badge>
                  </TableCell>
                  <TableCell>{template.category}</TableCell>
                  <TableCell>
                    <Badge className={template.isActive ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400" : "bg-muted text-muted-foreground"}>
                      {template.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {template.lastUsed ? formatDate(template.lastUsed) : "Never"}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" onClick={() => handleToggleTemplate(template)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setDeleteTarget(template)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete notification template?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteTarget?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTemplate} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}