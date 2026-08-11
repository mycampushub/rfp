"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Shield, Globe, Key, RefreshCw, Save } from "lucide-react"
import { toast } from "sonner"

interface SecuritySettings {
  twoFactorAuth: boolean
  loginAlerts: boolean
  sessionTimeout: string
  passwordExpiry: string
}

interface SecurityTabProps {
  securitySettings: SecuritySettings
  isLoading: boolean
  setSecuritySettings: React.Dispatch<React.SetStateAction<SecuritySettings>>
  onSave: () => void
  onChangePasswordClick: () => void
}

export function SecurityTab({ securitySettings, isLoading, setSecuritySettings, onSave, onChangePasswordClick }: SecurityTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Shield className="mr-2 h-5 w-5" />
          Security Settings
        </CardTitle>
        <CardDescription>
          Manage your account security and authentication preferences
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Authentication</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Two-Factor Authentication</p>
                <p className="text-sm text-muted-foreground">Add an extra layer of security to your account</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => {
                // TODO: Integrate TOTP/QR code 2FA provider (e.g., speakeasy, otpauth)
                toast.info("Two-factor authentication requires a TOTP provider integration")
              }}>
                Enable
              </Button>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Login Alerts</p>
                <p className="text-sm text-muted-foreground">Get notified when someone logs into your account</p>
              </div>
              <Checkbox
                checked={securitySettings.loginAlerts}
                onCheckedChange={(checked) => 
                  setSecuritySettings(prev => ({ ...prev, loginAlerts: checked as boolean }))
                }
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Session Management</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Session Timeout</p>
                <p className="text-sm text-muted-foreground">Automatically log out after inactivity</p>
              </div>
              <Select value={securitySettings.sessionTimeout} onValueChange={(value) => setSecuritySettings(prev => ({ ...prev, sessionTimeout: value }))}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15min">15 minutes</SelectItem>
                  <SelectItem value="30min">30 minutes</SelectItem>
                  <SelectItem value="1hour">1 hour</SelectItem>
                  <SelectItem value="4hours">4 hours</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Password Expiry</p>
                <p className="text-sm text-muted-foreground">Require password changes periodically</p>
              </div>
              <Select value={securitySettings.passwordExpiry} onValueChange={(value) => setSecuritySettings(prev => ({ ...prev, passwordExpiry: value }))}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30days">30 days</SelectItem>
                  <SelectItem value="60days">60 days</SelectItem>
                  <SelectItem value="90days">90 days</SelectItem>
                  <SelectItem value="180days">180 days</SelectItem>
                  <SelectItem value="never">Never</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Connected Devices</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-sky-500/15 dark:bg-sky-500/25 rounded-full flex items-center justify-center">
                  <Globe className="h-5 w-5 text-sky-600 dark:text-sky-400" />
                </div>
                <div>
                  <p className="font-medium">Chrome on Windows</p>
                  <p className="text-sm text-muted-foreground">San Francisco, CA • Current session</p>
                </div>
              </div>
              <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">Active</Badge>
            </div>
          </div>
        </div>

        <div className="flex justify-between">
          <Button variant="outline" onClick={onChangePasswordClick}>
            <Key className="mr-2 h-4 w-4" />
            Change Password
          </Button>
          <Button onClick={onSave} disabled={isLoading}>
            {isLoading ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Changes
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
