"use client"

import { useState, useEffect, useCallback } from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Download,
  RefreshCw,
} from "lucide-react"
import { useSession } from "next-auth/react"
import { toast } from "sonner"
import { ProfileTab } from "./components/ProfileTab"
import { CompanyTab } from "./components/CompanyTab"
import { NotificationsTab } from "./components/NotificationsTab"
import { SecurityTab } from "./components/SecurityTab"
import { AppearanceTab } from "./components/AppearanceTab"
import { ChangePasswordDialog } from "./components/ChangePasswordDialog"

export default function SettingsPage() {
  useEffect(() => { document.title = 'Settings | RFP Platform' }, [])
  const { data: _session } = useSession()
  const [activeTab, setActiveTab] = useState("profile")
  const [isLoading, setIsLoading] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)

  // User data - fetched from API
  const [userData, setUserData] = useState({
    name: "",
    email: "",
    phone: "",
    bio: "",
    location: "",
    timezone: "America/Los_Angeles",
    language: "en"
  })

  // Company data - fetched from API
  const [companyData, setCompanyData] = useState({
    name: "",
    industry: "Technology",
    size: "1000-5000",
    website: "",
    address: "",
    phone: "",
    description: ""
  })

  // Notification settings - local state only
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    newRfpAlerts: true,
    bidUpdates: true,
    deadlineReminders: true,
    weeklyDigest: false,
    marketingEmails: false
  })

  // Security settings - local state only
  const [securitySettings, setSecuritySettings] = useState({
    twoFactorAuth: false,
    loginAlerts: true,
    sessionTimeout: "30min",
    passwordExpiry: "90days"
  })

  // Appearance settings - local state only, persisted to localStorage
  const [appearanceSettings, setAppearanceSettings] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('appearance')
        if (saved) return JSON.parse(saved)
      } catch { /* ignore */ }
    }
    return {
      theme: "system",
      fontSize: "medium",
      sidebarCollapsed: false,
      highContrast: false
    }
  })

  // Tenant branding data for logo upload
  const [tenantBranding, setTenantBranding] = useState<Record<string, string>>({})

  // Change password dialog state
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false)
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" })
  const [passwordSubmitting, setPasswordSubmitting] = useState(false)

  const fontSizeMap: Record<string, string> = {
    small: "14px",
    medium: "16px",
    large: "18px",
  }

  // Fetch user and tenant data on mount
  const fetchData = useCallback(async () => {
    try {
      const [userRes, tenantRes] = await Promise.all([
        fetch("/api/users/me"),
        fetch("/api/tenants/me"),
      ])

      if (userRes.ok) {
        const user = await userRes.json()
        setUserData(prev => ({
          ...prev,
          name: user.name || "",
          email: user.email || "",
        }))
      }

      if (tenantRes.ok) {
        const tenant = await tenantRes.json()
        const settings = tenant.settings as Record<string, unknown> | null
        setCompanyData(prev => ({
          ...prev,
          name: tenant.name || "",
          industry: (settings?.industry as string) || "Technology",
          size: (settings?.size as string) || "1000-5000",
        }))
        if (tenant.branding && typeof tenant.branding === 'object') {
          setTenantBranding(tenant.branding as Record<string, string>)
        }
      }
    } catch (error) {
      console.error("Error fetching settings data:", error)
      toast.error("Failed to load settings")
    } finally {
      setPageLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleSaveProfile = async () => {
    setIsLoading(true)
    try {
      const res = await fetch("/api/users/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: userData.name, email: userData.email }),
      })
      if (!res.ok) throw new Error("Failed to save profile")
      toast.success("Profile updated successfully")
    } catch (error) {
      console.error("Error saving profile:", error)
      toast.error("Failed to save profile")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveCompany = async () => {
    setIsLoading(true)
    try {
      const res = await fetch("/api/tenants/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: companyData.name,
          settings: {
            industry: companyData.industry,
            size: companyData.size,
          },
        }),
      })
      if (!res.ok) throw new Error("Failed to save company")
      toast.success("Company information updated successfully")
    } catch (error) {
      console.error("Error saving company:", error)
      toast.error("Failed to save company information")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveNotifications = async () => {
    setIsLoading(true)
    try {
      const res = await fetch("/api/users/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emailNotifications: notificationSettings.emailNotifications,
          notificationPreferences: notificationSettings,
        }),
      })
      if (!res.ok) throw new Error("Failed to save")
      toast.success("Notification preferences saved")
    } catch {
      toast.error("Failed to save notification preferences")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveSecurity = async () => {
    setIsLoading(true)
    try {
      const res = await fetch("/api/users/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mfaEnabled: securitySettings.twoFactorAuth,
          securitySettings: {
            loginAlerts: securitySettings.loginAlerts,
            sessionTimeout: securitySettings.sessionTimeout,
            passwordExpiry: securitySettings.passwordExpiry,
          },
        }),
      })
      if (!res.ok) throw new Error("Failed to save")
      toast.success("Security settings saved")
    } catch {
      toast.error("Failed to save security settings")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveAppearance = async () => {
    setIsLoading(true)
    try {
      localStorage.setItem('appearance', JSON.stringify(appearanceSettings))
      toast.success("Appearance settings saved")
    } catch {
      toast.error("Failed to save appearance settings")
    } finally {
      setIsLoading(false)
    }
  }

  if (pageLoading) {
    return (
      <MainLayout title="Settings">
        <div className="space-y-6">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-full" />
          <div className="grid gap-6 md:grid-cols-2">
            <Skeleton className="h-64 w-full rounded-lg" />
            <Skeleton className="h-64 w-full rounded-lg" />
          </div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout title="Settings">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Settings</h1>
            <p className="text-muted-foreground mt-1">
              Manage your account, company, and preferences
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={async () => {
              try {
                const res = await fetch("/api/users/me")
                if (!res.ok) throw new Error("Failed to fetch")
                const data = await res.json()
                const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
                const url = URL.createObjectURL(blob)
                const a = document.createElement("a")
                a.href = url
                a.download = "user-data.json"
                document.body.appendChild(a)
                a.click()
                document.body.removeChild(a)
                URL.revokeObjectURL(url)
                toast.success("Data exported successfully")
              } catch {
                toast.error("Failed to export data")
              }
            }}>
              <Download className="mr-2 h-4 w-4" />
              Export Data
            </Button>
            <Button variant="outline" size="sm" onClick={() => {
              setPageLoading(true)
              fetchData()
            }}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="flex flex-wrap gap-1 w-full">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="company">Company</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <ProfileTab
              userData={userData}
              isLoading={isLoading}
              setUserData={setUserData}
              onSave={handleSaveProfile}
            />
          </TabsContent>

          <TabsContent value="company" className="space-y-6">
            <CompanyTab
              companyData={companyData}
              tenantBranding={tenantBranding}
              isLoading={isLoading}
              setCompanyData={setCompanyData}
              setTenantBranding={setTenantBranding}
              onSave={handleSaveCompany}
            />
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <NotificationsTab
              notificationSettings={notificationSettings}
              isLoading={isLoading}
              setNotificationSettings={setNotificationSettings}
              onSave={handleSaveNotifications}
            />
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <SecurityTab
              securitySettings={securitySettings}
              isLoading={isLoading}
              setSecuritySettings={setSecuritySettings}
              onSave={handleSaveSecurity}
              onChangePasswordClick={() => {
                setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" })
                setPasswordDialogOpen(true)
              }}
            />
          </TabsContent>

          <TabsContent value="appearance" className="space-y-6">
            <AppearanceTab
              appearanceSettings={appearanceSettings}
              isLoading={isLoading}
              fontSizeMap={fontSizeMap}
              setAppearanceSettings={setAppearanceSettings}
              onSave={handleSaveAppearance}
            />
          </TabsContent>
        </Tabs>
      </div>

      <ChangePasswordDialog
        open={passwordDialogOpen}
        passwordForm={passwordForm}
        passwordSubmitting={passwordSubmitting}
        onOpenChange={setPasswordDialogOpen}
        setPasswordForm={setPasswordForm}
        setPasswordSubmitting={setPasswordSubmitting}
      />
    </MainLayout>
  )
}
