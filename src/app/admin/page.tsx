"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { MainLayout } from "@/components/layout/main-layout"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Settings, Users, Store, BarChart3, TrendingUp, Bell, Zap, FileText, Activity,
  RefreshCw,
} from "lucide-react"
import { LoadingTable } from "@/components/shared/loading-table"
import { Skeleton } from "@/components/ui/skeleton"

import type { User, Role, Tenant, AuditLog, ComplianceFramework, ComplianceControl, ComplianceReport, MarketplaceStats, VendorAnalytics, NotificationTemplate, SystemHealth, Integration } from "./types"
import { fetchAdminData } from "./lib/fetch-admin-data"
import { StatsOverview } from "./components/stats-overview"
import { DashboardTab } from "./components/dashboard-tab"
import { MarketplaceTab } from "./components/marketplace-tab"
import { AnalyticsTab } from "./components/analytics-tab"
import { NotificationsTab } from "./components/notifications-tab"
import { IntegrationsTab } from "./components/integrations-tab"
import { UsersTab } from "./components/users-tab"
import { RolesTab } from "./components/roles-tab"
import { TenantsTab } from "./components/tenants-tab"
import { ComplianceTab } from "./components/compliance-tab"
import { AuditTab } from "./components/audit-tab"
import { AdminDialogs } from "./components/admin-dialogs"

export default function AdminPage() {
  useEffect(() => { document.title = 'Admin Panel | RFP Platform' }, [])
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [complianceFrameworks, setComplianceFrameworks] = useState<ComplianceFramework[]>([])
  const [complianceControls, setComplianceControls] = useState<ComplianceControl[]>([])
  const [complianceReports, setComplianceReports] = useState<ComplianceReport[]>([])
  const [marketplaceStats, setMarketplaceStats] = useState<MarketplaceStats | null>(null)
  const [vendorAnalytics, setVendorAnalytics] = useState<VendorAnalytics[]>([])
  const [notificationTemplates, setNotificationTemplates] = useState<NotificationTemplate[]>([])
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null)
  const [integrations, setIntegrations] = useState<Integration[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("dashboard")

  const [showViewUserDialog, setShowViewUserDialog] = useState(false)
  const [showCreateUserDialog, setShowCreateUserDialog] = useState(false)
  const [showEditUserDialog, setShowEditUserDialog] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showCreateRoleDialog, setShowCreateRoleDialog] = useState(false)
  const [showEditRoleDialog, setShowEditRoleDialog] = useState(false)
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [showDeleteRoleDialog, setShowDeleteRoleDialog] = useState(false)
  const [showCreateTenantDialog, setShowCreateTenantDialog] = useState(false)
  const [showViewTenantDialog, setShowViewTenantDialog] = useState(false)
  const [showEditTenantDialog, setShowEditTenantDialog] = useState(false)
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null)
  const [showCreateIntegrationDialog, setShowCreateIntegrationDialog] = useState(false)
  const [showEditIntegrationDialog, setShowEditIntegrationDialog] = useState(false)
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null)
  const [showViewFrameworkDialog, setShowViewFrameworkDialog] = useState(false)
  const [selectedFramework, setSelectedFramework] = useState<ComplianceFramework | null>(null)
  const [showViewAuditDialog, setShowViewAuditDialog] = useState(false)
  const [selectedAuditLog, setSelectedAuditLog] = useState<AuditLog | null>(null)
  const [formData, setFormData] = useState<Record<string, string | string[]>>({})
  const [rolePermissions, setRolePermissions] = useState<string[]>([])

  const fetchData = useCallback(() => {
    fetchAdminData({ setUsers, setRoles, setTenants, setAuditLogs, setSystemHealth, setIntegrations, setComplianceFrameworks, setComplianceControls, setComplianceReports, setMarketplaceStats, setVendorAnalytics, setNotificationTemplates, setLoading })
  }, [setUsers, setRoles, setTenants, setAuditLogs, setSystemHealth, setIntegrations, setComplianceFrameworks, setComplianceControls, setComplianceReports, setMarketplaceStats, setVendorAnalytics, setNotificationTemplates, setLoading])

  useEffect(() => { fetchData() }, [fetchData])

  if (loading) {
    return (
      <MainLayout title="Admin Panel">
        <div className="space-y-6">
          <div className="flex justify-between items-start">
            <div>
              <Skeleton className="h-10 w-64 mb-2" />
              <Skeleton className="h-4 w-96" />
            </div>
            <Skeleton className="h-10 w-32" />
          </div>
          <LoadingTable rows={6} columns={7} />
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout title="Admin Panel">
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">Administration Panel</h1>
            <p className="text-muted-foreground mt-1">Manage users, marketplace, analytics, and system settings</p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => { setLoading(true); fetchData() }}>
              <RefreshCw className="mr-2 h-4 w-4" />Refresh Data
            </Button>
            <Button onClick={() => router.push('/settings')}>
              <Settings className="mr-2 h-4 w-4" />System Settings
            </Button>
          </div>
        </div>

        <StatsOverview users={users} marketplaceStats={marketplaceStats} systemHealth={systemHealth} />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-8">
            <TabsTrigger value="dashboard" className="flex items-center space-x-2"><BarChart3 className="h-4 w-4" /><span>Dashboard</span></TabsTrigger>
            <TabsTrigger value="users" className="flex items-center space-x-2"><Users className="h-4 w-4" /><span>Users</span></TabsTrigger>
            <TabsTrigger value="marketplace" className="flex items-center space-x-2"><Store className="h-4 w-4" /><span>Marketplace</span></TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center space-x-2"><TrendingUp className="h-4 w-4" /><span>Analytics</span></TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center space-x-2"><Bell className="h-4 w-4" /><span>Notifications</span></TabsTrigger>
            <TabsTrigger value="integrations" className="flex items-center space-x-2"><Zap className="h-4 w-4" /><span>Integrations</span></TabsTrigger>
            <TabsTrigger value="compliance" className="flex items-center space-x-2"><FileText className="h-4 w-4" /><span>Compliance</span></TabsTrigger>
            <TabsTrigger value="audit" className="flex items-center space-x-2"><Activity className="h-4 w-4" /><span>Audit Log</span></TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard"><DashboardTab auditLogs={auditLogs} integrations={integrations} systemHealth={systemHealth} /></TabsContent>
          <TabsContent value="users"><UsersTab users={users} roles={roles} tenants={tenants} onAddUser={() => { setFormData({ name: '', email: '', password: '', roleId: '', tenantId: '' }); setSelectedUser(null); setShowCreateUserDialog(true) }} onViewUser={(u) => { setSelectedUser(u); setShowViewUserDialog(true) }} onEditUser={(u) => { setFormData({ name: u.name, email: u.email, roleId: u.role, tenantId: u.tenantId }); setSelectedUser(u); setShowEditUserDialog(true) }} /></TabsContent>
          <TabsContent value="marketplace"><MarketplaceTab marketplaceStats={marketplaceStats} vendorAnalytics={vendorAnalytics} /></TabsContent>
          <TabsContent value="analytics"><AnalyticsTab marketplaceStats={marketplaceStats} /></TabsContent>
          <TabsContent value="notifications"><NotificationsTab notificationTemplates={notificationTemplates} /></TabsContent>
          <TabsContent value="integrations"><IntegrationsTab integrations={integrations} onAddIntegration={() => { setFormData({ name: '', type: 'erp', description: '', apiKey: '', endpointUrl: '' }); setSelectedIntegration(null); setShowCreateIntegrationDialog(true) }} onEditIntegration={(i) => { setFormData({ name: i.name, type: i.type, description: i.description, apiKey: '', endpointUrl: '' }); setSelectedIntegration(i); setShowEditIntegrationDialog(true) }} /></TabsContent>
          <TabsContent value="roles"><RolesTab roles={roles} onAddRole={() => { setFormData({ name: '', description: '' }); setRolePermissions([]); setSelectedRole(null); setShowCreateRoleDialog(true) }} onEditRole={(r) => { setFormData({ name: r.name, description: '' }); setRolePermissions([...r.permissions]); setSelectedRole(r); setShowEditRoleDialog(true) }} onDeleteRole={(r) => { setSelectedRole(r); setShowDeleteRoleDialog(true) }} /></TabsContent>
          <TabsContent value="tenants"><TenantsTab tenants={tenants} onAddTenant={() => { setFormData({ name: '', orgId: '', region: 'us-east', plan: 'standard' }); setSelectedTenant(null); setShowCreateTenantDialog(true) }} onViewTenant={(t) => { setSelectedTenant(t); setShowViewTenantDialog(true) }} onEditTenant={(t) => { setFormData({ name: t.name, orgId: '', region: 'us-east', plan: t.plan }); setSelectedTenant(t); setShowEditTenantDialog(true) }} onSettings={() => router.push('/settings')} /></TabsContent>
          <TabsContent value="compliance"><ComplianceTab complianceFrameworks={complianceFrameworks} complianceControls={complianceControls} complianceReports={complianceReports} onViewFramework={(f) => { setSelectedFramework(f); setShowViewFrameworkDialog(true) }} /></TabsContent>
          <TabsContent value="audit"><AuditTab auditLogs={auditLogs} onViewAudit={(l) => { setSelectedAuditLog(l); setShowViewAuditDialog(true) }} /></TabsContent>
        </Tabs>

        <AdminDialogs
          showViewUserDialog={showViewUserDialog} setShowViewUserDialog={setShowViewUserDialog}
          showCreateUserDialog={showCreateUserDialog} setShowCreateUserDialog={setShowCreateUserDialog}
          showEditUserDialog={showEditUserDialog} setShowEditUserDialog={setShowEditUserDialog}
          selectedUser={selectedUser}
          showCreateRoleDialog={showCreateRoleDialog} setShowCreateRoleDialog={setShowCreateRoleDialog}
          showEditRoleDialog={showEditRoleDialog} setShowEditRoleDialog={setShowEditRoleDialog}
          showDeleteRoleDialog={showDeleteRoleDialog} setShowDeleteRoleDialog={setShowDeleteRoleDialog}
          selectedRole={selectedRole}
          showCreateTenantDialog={showCreateTenantDialog} setShowCreateTenantDialog={setShowCreateTenantDialog}
          showViewTenantDialog={showViewTenantDialog} setShowViewTenantDialog={setShowViewTenantDialog}
          showEditTenantDialog={showEditTenantDialog} setShowEditTenantDialog={setShowEditTenantDialog}
          selectedTenant={selectedTenant}
          showCreateIntegrationDialog={showCreateIntegrationDialog} setShowCreateIntegrationDialog={setShowCreateIntegrationDialog}
          showEditIntegrationDialog={showEditIntegrationDialog} setShowEditIntegrationDialog={setShowEditIntegrationDialog}
          selectedIntegration={selectedIntegration}
          showViewFrameworkDialog={showViewFrameworkDialog} setShowViewFrameworkDialog={setShowViewFrameworkDialog}
          selectedFramework={selectedFramework}
          showViewAuditDialog={showViewAuditDialog} setShowViewAuditDialog={setShowViewAuditDialog}
          selectedAuditLog={selectedAuditLog}
          formData={formData} setFormData={setFormData}
          rolePermissions={rolePermissions} setRolePermissions={setRolePermissions}
          roles={roles} tenants={tenants}
          fetchData={fetchData}
        />
      </div>
    </MainLayout>
  )
}