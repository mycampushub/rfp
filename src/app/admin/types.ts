export interface User {
  id: string
  name: string
  email: string
  role: string
  status: "active" | "inactive"
  lastLogin: string
  tenantId: string
}

export interface Role {
  id: string
  name: string
  permissions: string[]
  userCount: number
}

export interface Tenant {
  id: string
  name: string
  plan: "standard" | "enterprise" | "custom"
  status: "active" | "inactive"
  createdAt: string
  userCount: number
  rfpCount: number
  settings: {
    branding?: {
      logo?: string
      primaryColor?: string
    }
    notifications?: {
      emailEnabled: boolean
      smsEnabled: boolean
    }
    security?: {
      mfaRequired: boolean
      sessionTimeout: number
    }
  }
}

export interface AuditLog {
  id: string
  action: string
  target: string
  user: string
  timestamp: string
  ip: string
  details: string
}

export interface ComplianceFramework {
  id: string
  name: string
  description: string
  version: string
  status: "active" | "inactive" | "draft"
  lastUpdated: string
  controlsCount: number
  implementedControls: number
}

export interface ComplianceControl {
  id: string
  frameworkId: string
  name: string
  description: string
  category: string
  status: "implemented" | "partial" | "not_implemented" | "not_applicable"
  evidence: string[]
  lastAssessed: string
  nextReview: string
}

export interface ComplianceReport {
  id: string
  title: string
  framework: string
  period: string
  status: "draft" | "pending_review" | "approved" | "published"
  generatedAt: string
  submittedBy: string
  score: number
}

export interface MarketplaceStats {
  totalVendors: number
  activeRFPs: number
  totalValue: number
  successRate: number
  categories: string[]
  topVendors: Array<{
    id: string
    name: string
    rating: number
    projects: number
  }>
}

export interface VendorAnalytics {
  id: string
  vendorName: string
  totalBids: number
  successfulBids: number
  successRate: number
  averageResponseTime: number
  totalValue: number
  rating: number
  categories: string[]
  joinDate: string
  lastActive: string
}

export interface NotificationTemplate {
  id: string
  name: string
  type: "email" | "sms" | "push" | "in_app"
  category: string
  subject: string
  content: string
  variables: string[]
  isActive: boolean
  createdAt: string
  lastUsed: string
}

export interface SystemHealth {
  status: "healthy" | "warning" | "critical"
  uptime: number
  responseTime: number
  activeUsers: number
  databaseSize: number
  storageUsed: number
  lastBackup: string
  errors: Array<{
    timestamp: string
    service: string
    message: string
    severity: "low" | "medium" | "high" | "critical"
  }>
}

export interface Integration {
  id: string
  name: string
  type: "api" | "webhook" | "oauth" | "saml"
  status: "active" | "inactive" | "error"
  lastSync: string
  usage: number
  description: string
}
