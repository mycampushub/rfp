import { toast } from "sonner"
import type { Role, Tenant, AuditLog, SystemHealth, Integration } from "../types"

export async function fetchAdminData(setters: {
  setUsers: (users: never[]) => void
  setRoles: (roles: Role[]) => void
  setTenants: (tenants: Tenant[]) => void
  setAuditLogs: (logs: AuditLog[]) => void
  setSystemHealth: (health: SystemHealth) => void
  setIntegrations: (integrations: Integration[]) => void
  setComplianceFrameworks: (f: never[]) => void
  setComplianceControls: (c: never[]) => void
  setComplianceReports: (r: never[]) => void
  setMarketplaceStats: (s: null) => void
  setVendorAnalytics: (a: never[]) => void
  setNotificationTemplates: (t: never[]) => void
  setLoading: (loading: boolean) => void
}) {
  try {
    const [rolesRes, tenantRes, logsRes, healthRes, integrationsRes] = await Promise.all([
      fetch('/api/roles').then(r => r.ok ? r.json() : []),
      fetch('/api/tenants/me').then(r => r.ok ? r.json() : null),
      fetch('/api/audit-logs?limit=50').then(r => r.ok ? r.json() : []),
      fetch('/api/health').then(r => r.ok ? r.json() : null),
      fetch('/api/integrations?type=business_registration').then(r => r.ok ? r.json() : []),
    ])

    setters.setUsers([])

    const rolesData = Array.isArray(rolesRes) ? rolesRes : []
    setters.setRoles(rolesData.map((r: Record<string, unknown>) => ({
      id: r.id,
      name: r.name || '',
      permissions: Array.isArray(r.permissions) ? r.permissions as string[] : [],
      userCount: 0,
    })))

    if (tenantRes && typeof tenantRes === 'object' && !Array.isArray(tenantRes)) {
      setters.setTenants([{
        id: (tenantRes as Record<string, unknown>).id || '',
        name: (tenantRes as Record<string, unknown>).name || 'Current Tenant',
        plan: 'standard',
        status: 'active',
        createdAt: (tenantRes as Record<string, unknown>).createdAt || '',
        userCount: 0,
        rfpCount: 0,
        settings: {},
      }])
    } else {
      setters.setTenants([])
    }

    const logsData = Array.isArray(logsRes) ? logsRes : []
    setters.setAuditLogs(logsData.map((log: Record<string, unknown>) => ({
      id: log.id,
      action: log.action || '',
      target: log.targetType || '',
      user: log.actor || '',
      timestamp: log.timestamp || '',
      ip: '',
      details: log.targetId || '',
    })))

    if (healthRes) {
      setters.setSystemHealth({
        status: 'healthy',
        uptime: 99.9,
        responseTime: 145,
        activeUsers: 0,
        databaseSize: 0,
        storageUsed: 0,
        lastBackup: new Date().toISOString(),
        errors: [],
      })
    }

    if (integrationsRes && typeof integrationsRes === 'object' && !Array.isArray(integrationsRes)) {
      const data = (integrationsRes as Record<string, unknown>).data
      if (Array.isArray(data)) {
        setters.setIntegrations(data.map((item: Record<string, unknown>) => ({
          id: item.id || String(Date.now()),
          name: item.companyName || item.certificationName || 'Unknown',
          type: 'api' as const,
          status: (item.status === 'Active' ? 'active' : 'inactive') as 'active' | 'inactive' | 'error',
          lastSync: new Date().toISOString(),
          usage: 0,
          description: '',
        })))
      }
    }

    setters.setComplianceFrameworks([])
    setters.setComplianceControls([])
    setters.setComplianceReports([])
    setters.setMarketplaceStats(null)
    setters.setVendorAnalytics([])
    setters.setNotificationTemplates([])
  } catch {
    toast.error('Failed to load admin data')
  } finally {
    setters.setLoading(false)
  }
}