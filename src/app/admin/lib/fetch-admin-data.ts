import { toast } from "sonner"
import type { Role, Tenant, AuditLog, SystemHealth, Integration } from "../types"

export async function fetchAdminData(setters: {
  setUsers: (_users: never[]) => void
  setRoles: (_roles: Role[]) => void
  setTenants: (_tenants: Tenant[]) => void
  setAuditLogs: (_logs: AuditLog[]) => void
  setSystemHealth: (_health: SystemHealth) => void
  setIntegrations: (_integrations: Integration[]) => void
  setComplianceFrameworks: (_f: never[]) => void
  setComplianceControls: (_c: never[]) => void
  setComplianceReports: (_r: never[]) => void
  setMarketplaceStats: (_s: null) => void
  setVendorAnalytics: (_a: never[]) => void
  setNotificationTemplates: (_t: never[]) => void
  setLoading: (_loading: boolean) => void
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
      id: String(r.id),
      name: String(r.name || ''),
      permissions: Array.isArray(r.permissions) ? r.permissions as string[] : [],
      userCount: 0,
    })))

    if (tenantRes && typeof tenantRes === 'object' && !Array.isArray(tenantRes)) {
      const t = tenantRes as Record<string, unknown>
      setters.setTenants([{
        id: String(t.id || ''),
        name: String(t.name || 'Current Tenant'),
        plan: 'standard',
        status: 'active',
        createdAt: String(t.createdAt || ''),
        userCount: 0,
        rfpCount: 0,
        settings: {},
      }])
    } else {
      setters.setTenants([])
    }

    const logsData = Array.isArray(logsRes) ? logsRes : []
    setters.setAuditLogs(logsData.map((log: Record<string, unknown>) => ({
      id: String(log.id || ''),
      action: String(log.action || ''),
      target: String(log.targetType || ''),
      user: String(log.actor || ''),
      timestamp: String(log.timestamp || ''),
      ip: '',
      details: String(log.targetId || ''),
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
          id: String(item.id || Date.now()),
          name: String(item.companyName || item.certificationName || 'Unknown'),
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