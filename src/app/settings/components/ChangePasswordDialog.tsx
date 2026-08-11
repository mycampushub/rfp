"use client"

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

interface ChangePasswordDialogProps {
  open: boolean
  passwordForm: {
    currentPassword: string
    newPassword: string
    confirmPassword: string
  }
  passwordSubmitting: boolean
  onOpenChange: (open: boolean) => void
  setPasswordForm: React.Dispatch<React.SetStateAction<{
    currentPassword: string
    newPassword: string
    confirmPassword: string
  }>>
  setPasswordSubmitting: React.Dispatch<React.SetStateAction<boolean>>
}

export function ChangePasswordDialog({ open, passwordForm, passwordSubmitting, onOpenChange, setPasswordForm, setPasswordSubmitting }: ChangePasswordDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(open) => { onOpenChange(open); if (!open) setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" }) }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Change Password</DialogTitle>
          <DialogDescription>Enter your current password and choose a new one.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current-password">Current Password</Label>
            <Input
              id="current-password"
              type="password"
              value={passwordForm.currentPassword}
              onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
              placeholder="Enter current password"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-password">New Password</Label>
            <Input
              id="new-password"
              type="password"
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
              placeholder="Enter new password"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm New Password</Label>
            <Input
              id="confirm-password"
              type="password"
              value={passwordForm.confirmPassword}
              onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
              placeholder="Confirm new password"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => { onOpenChange(false); setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" }) }}>Cancel</Button>
          <Button onClick={async () => {
            if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
              toast.error("All password fields are required")
              return
            }
            if (passwordForm.newPassword !== passwordForm.confirmPassword) {
              toast.error("New passwords do not match")
              return
            }
            setPasswordSubmitting(true)
            try {
              const res = await fetch("/api/auth/change-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  currentPassword: passwordForm.currentPassword,
                  newPassword: passwordForm.newPassword,
                }),
              })
              if (!res.ok) throw new Error("Failed")
              toast.success("Password changed successfully")
              onOpenChange(false)
              setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" })
            } catch {
              toast.error("Failed to change password. Make sure your current password is correct.")
            } finally {
              setPasswordSubmitting(false)
            }
          }} disabled={passwordSubmitting}>
            {passwordSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Change Password
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
