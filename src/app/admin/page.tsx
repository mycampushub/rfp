"use client"

import { useState, useEffect } from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { 
  Settings, 
  Users, 
  Shield, 
  Building,
  Plus,
  Edit,
  Trash2,
  Eye,
  Key,
  Bell,
  Database,
  Activity,
  UserPlus,
  Save,
  FileText,
  Lock,
  AlertTriangle,
  CheckCircle,
  Store,
  BarChart3,
  Globe,
  TrendingUp,
  DollarSign,
  Zap,
  MessageSquare,
  Calendar,
  MapPin,
  Star,
  Award,
  Target,
  Clock,
  Filter,
  Download,
  Upload,
  RefreshCw,
  Search
} from "lucide-react"

interface User {
  id: string
  name: string
  email: string
  role: string
  status: "active" | "inactive"
  lastLogin: string
  tenantId: string
}

interface Role {
  id: string
  name: string
  permissions: string[]
  userCount: number
}

interface Tenant {
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

interface AuditLog {
  id: string
  action: string
  target: string
  user: string
  timestamp: string
  ip: string
  details: string
}

interface ComplianceFramework {
  id: string
  name: string
  description: string
  version: string
  status: "active" | "inactive" | "draft"
  lastUpdated: string
  controlsCount: number
  implementedControls: number
}

interface ComplianceControl {
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

interface ComplianceReport {
  id: string
  title: string
  framework: string
  period: string
  status: "draft" | "pending_review" | "approved" | "published"
  generatedAt: string
  submittedBy: string
  score: number
}

interface MarketplaceStats {
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

interface VendorAnalytics {
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

interface NotificationTemplate {
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

interface SystemHealth {
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

interface Integration {
  id: string
  name: string
  type: "api" | "webhook" | "oauth" | "saml"
  status: "active" | "inactive" | "error"
  lastSync: string
  usage: number
  description: string
}

export default function AdminPage() {
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

  // Mock data
  const mockUsers: User[] = [
    {
      id: "1",
      name: "John Smith",
      email: "john.smith@company.com",
      role: "Tenant Admin",
      status: "active",
      lastLogin: "2024-11-10T09:30:00Z",
      tenantId: "tenant-1"
    },
    {
      id: "2",
      name: "Sarah Johnson",
      email: "sarah.johnson@company.com",
      role: "RFP Owner",
      status: "active",
      lastLogin: "2024-11-09T14:15:00Z",
      tenantId: "tenant-1"
    },
    {
      id: "3",
      name: "Mike Chen",
      email: "mike.chen@company.com",
      role: "Evaluator",
      status: "active",
      lastLogin: "2024-11-08T11:20:00Z",
      tenantId: "tenant-1"
    },
    {
      id: "4",
      name: "Lisa Wang",
      email: "lisa.wang@company.com",
      role: "Viewer",
      status: "inactive",
      lastLogin: "2024-10-15T16:45:00Z",
      tenantId: "tenant-2"
    }
  ]

  const mockRoles: Role[] = [
    {
      id: "1",
      name: "System Admin",
      permissions: ["system:admin", "admin:users", "admin:roles", "admin:tenant"],
      userCount: 2
    },
    {
      id: "2",
      name: "Tenant Admin",
      permissions: ["admin:users", "admin:roles", "rfp:create", "rfp:edit", "rfp:delete"],
      userCount: 5
    },
    {
      id: "3",
      name: "RFP Owner",
      permissions: ["rfp:create", "rfp:edit", "rfp:view", "vendor:invite"],
      userCount: 8
    },
    {
      id: "4",
      name: "Evaluator",
      permissions: ["rfp:view", "score:create", "score:edit"],
      userCount: 12
    }
  ]

  const mockTenants: Tenant[] = [
    {
      id: "tenant-1",
      name: "Acme Corporation",
      plan: "enterprise",
      status: "active",
      createdAt: "2024-01-15T10:00:00Z",
      userCount: 15,
      rfpCount: 23,
      settings: {
        branding: {
          logo: "/logo.png",
          primaryColor: "#3B82F6"
        },
        notifications: {
          emailEnabled: true,
          smsEnabled: false
        },
        security: {
          mfaRequired: true,
          sessionTimeout: 3600
        }
      }
    },
    {
      id: "tenant-2",
      name: "Tech Solutions Inc",
      plan: "standard",
      status: "active",
      createdAt: "2024-02-20T14:00:00Z",
      userCount: 8,
      rfpCount: 12,
      settings: {
        notifications: {
          emailEnabled: true,
          smsEnabled: true
        },
        security: {
          mfaRequired: false,
          sessionTimeout: 1800
        }
      }
    }
  ]

  const mockAuditLogs: AuditLog[] = [
    {
      id: "1",
      action: "User Login",
      target: "john.smith@company.com",
      user: "john.smith@company.com",
      timestamp: "2024-11-10T09:30:15Z",
      ip: "192.168.1.100",
      details: "Successful login from New York"
    },
    {
      id: "2",
      action: "RFP Created",
      target: "IT Managed Services 2024",
      user: "john.smith@company.com",
      timestamp: "2024-11-10T10:15:30Z",
      ip: "192.168.1.100",
      details: "Created new RFP with budget $250,000"
    },
    {
      id: "3",
      action: "Role Assigned",
      target: "sarah.johnson@company.com",
      user: "admin@company.com",
      timestamp: "2024-11-09T16:45:00Z",
      ip: "192.168.1.50",
      details: "Assigned Evaluator role to user"
    }
  ]

  const mockComplianceFrameworks: ComplianceFramework[] = [
    {
      id: "1",
      name: "SOC 2 Type II",
      description: "Service Organization Control 2 Type II compliance framework for security, availability, processing integrity, confidentiality, and privacy",
      version: "2024",
      status: "active",
      lastUpdated: "2024-10-15T10:00:00Z",
      controlsCount: 150,
      implementedControls: 142
    },
    {
      id: "2",
      name: "ISO 27001",
      description: "International standard for information security management systems",
      version: "2022",
      status: "active",
      lastUpdated: "2024-09-20T14:00:00Z",
      controlsCount: 114,
      implementedControls: 108
    },
    {
      id: "3",
      name: "GDPR",
      description: "General Data Protection Regulation compliance framework",
      version: "2018",
      status: "active",
      lastUpdated: "2024-08-10T09:00:00Z",
      controlsCount: 89,
      implementedControls: 85
    }
  ]

  const mockComplianceControls: ComplianceControl[] = [
    {
      id: "1",
      frameworkId: "1",
      name: "Access Control Policy",
      description: "Formal documented access control policy approved by management",
      category: "Security",
      status: "implemented",
      evidence: ["policy_document.pdf", "approval_email.pdf"],
      lastAssessed: "2024-10-15T10:00:00Z",
      nextReview: "2025-04-15T10:00:00Z"
    },
    {
      id: "2",
      frameworkId: "1",
      name: "Data Encryption",
      description: "Encryption of sensitive data at rest and in transit",
      category: "Security",
      status: "implemented",
      evidence: ["encryption_audit.pdf", "certificate.pdf"],
      lastAssessed: "2024-10-10T14:00:00Z",
      nextReview: "2025-04-10T14:00:00Z"
    },
    {
      id: "3",
      frameworkId: "2",
      name: "Risk Assessment",
      description: "Regular risk assessment process for information assets",
      category: "Risk Management",
      status: "partial",
      evidence: ["risk_assessment_draft.pdf"],
      lastAssessed: "2024-09-20T09:00:00Z",
      nextReview: "2025-03-20T09:00:00Z"
    }
  ]

  const mockComplianceReports: ComplianceReport[] = [
    {
      id: "1",
      title: "SOC 2 Type II - Q3 2024",
      framework: "SOC 2 Type II",
      period: "Q3 2024",
      status: "published",
      generatedAt: "2024-10-15T10:00:00Z",
      submittedBy: "compliance@company.com",
      score: 95
    },
    {
      id: "2",
      title: "ISO 27001 - Annual Review 2024",
      framework: "ISO 27001",
      period: "Annual 2024",
      status: "pending_review",
      generatedAt: "2024-10-10T14:00:00Z",
      submittedBy: "compliance@company.com",
      score: 92
    },
    {
      id: "3",
      title: "GDPR Compliance - Monthly Report",
      framework: "GDPR",
      period: "September 2024",
      status: "draft",
      generatedAt: "2024-10-01T09:00:00Z",
      submittedBy: "compliance@company.com",
      score: 88
    }
  ]

  const mockMarketplaceStats: MarketplaceStats = {
    totalVendors: 15847,
    activeRFPs: 156,
    totalValue: 12500000,
    successRate: 78,
    categories: ["IT Services", "Software Development", "Marketing", "Construction", "Consulting"],
    topVendors: [
      { id: "1", name: "Tech Solutions Inc", rating: 4.9, projects: 127 },
      { id: "2", name: "Marketing Masters", rating: 4.8, projects: 89 },
      { id: "3", name: "BuildRight Construction", rating: 4.7, projects: 156 }
    ]
  }

  const mockVendorAnalytics: VendorAnalytics[] = [
    {
      id: "1",
      vendorName: "Tech Solutions Inc",
      totalBids: 45,
      successfulBids: 35,
      successRate: 78,
      averageResponseTime: 2.3,
      totalValue: 2500000,
      rating: 4.9,
      categories: ["IT Services", "Software Development"],
      joinDate: "2020-01-15",
      lastActive: "2024-12-10"
    },
    {
      id: "2",
      vendorName: "Marketing Masters",
      totalBids: 32,
      successfulBids: 25,
      successRate: 78,
      averageResponseTime: 1.8,
      totalValue: 1200000,
      rating: 4.8,
      categories: ["Marketing", "Digital Strategy"],
      joinDate: "2021-03-20",
      lastActive: "2024-12-09"
    },
    {
      id: "3",
      vendorName: "BuildRight Construction",
      totalBids: 28,
      successfulBids: 22,
      successRate: 79,
      averageResponseTime: 3.1,
      totalValue: 3500000,
      rating: 4.7,
      categories: ["Construction", "Renovation"],
      joinDate: "2019-07-10",
      lastActive: "2024-12-08"
    }
  ]

  const mockNotificationTemplates: NotificationTemplate[] = [
    {
      id: "1",
      name: "New RFP Notification",
      type: "email",
      category: "Marketplace",
      subject: "New RFP Opportunity: {{rfpTitle}}",
      content: "A new RFP matching your expertise has been posted. Budget: {{budget}}, Deadline: {{deadline}}",
      variables: ["rfpTitle", "budget", "deadline"],
      isActive: true,
      createdAt: "2024-01-15T10:00:00Z",
      lastUsed: "2024-12-10T09:30:00Z"
    },
    {
      id: "2",
      name: "Bid Accepted",
      type: "email",
      category: "Bidding",
      subject: "Congratulations! Your bid has been accepted",
      content: "Your bid for {{rfpTitle}} has been accepted. Please contact {{contactEmail}} for next steps.",
      variables: ["rfpTitle", "contactEmail"],
      isActive: true,
      createdAt: "2024-01-15T10:00:00Z",
      lastUsed: "2024-12-08T14:20:00Z"
    },
    {
      id: "3",
      name: "System Maintenance",
      type: "in_app",
      category: "System",
      subject: "Scheduled Maintenance",
      content: "System maintenance scheduled for {{maintenanceTime}}. Expected downtime: {{duration}}",
      variables: ["maintenanceTime", "duration"],
      isActive: true,
      createdAt: "2024-01-15T10:00:00Z",
      lastUsed: "2024-12-05T18:00:00Z"
    }
  ]

  const mockSystemHealth: SystemHealth = {
    status: "healthy",
    uptime: 99.9,
    responseTime: 145,
    activeUsers: 1247,
    databaseSize: 2.5,
    storageUsed: 75,
    lastBackup: "2024-12-10T02:00:00Z",
    errors: [
      {
        timestamp: "2024-12-10T08:15:00Z",
        service: "API Gateway",
        message: "High response time detected",
        severity: "medium"
      }
    ]
  }

  const mockIntegrations: Integration[] = [
    {
      id: "1",
      name: "Salesforce CRM",
      type: "api",
      status: "active",
      lastSync: "2024-12-10T09:30:00Z",
      usage: 15420,
      description: "Sync RFP data with Salesforce CRM"
    },
    {
      id: "2",
      name: "Slack Notifications",
      type: "webhook",
      status: "active",
      lastSync: "2024-12-10T08:45:00Z",
      usage: 8750,
      description: "Send notifications to Slack channels"
    },
    {
      id: "3",
      name: "Microsoft SSO",
      type: "saml",
      status: "active",
      lastSync: "2024-12-10T07:00:00Z",
      usage: 3200,
      description: "Single Sign-On integration"
    }
  ]

  useEffect(() => {
    setTimeout(() => {
      setUsers(mockUsers)
      setRoles(mockRoles)
      setTenants(mockTenants)
      setAuditLogs(mockAuditLogs)
      setComplianceFrameworks(mockComplianceFrameworks)
      setComplianceControls(mockComplianceControls)
      setComplianceReports(mockComplianceReports)
      setMarketplaceStats(mockMarketplaceStats)
      setVendorAnalytics(mockVendorAnalytics)
      setNotificationTemplates(mockNotificationTemplates)
      setSystemHealth(mockSystemHealth)
      setIntegrations(mockIntegrations)
      setLoading(false)
    }, 1000)
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800"
      case "inactive":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case "enterprise":
        return "bg-purple-100 text-purple-800"
      case "standard":
        return "bg-blue-100 text-blue-800"
      case "custom":
        return "bg-orange-100 text-orange-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getComplianceStatusColor = (status: string) => {
    switch (status) {
      case "implemented":
        return "bg-green-100 text-green-800"
      case "partial":
        return "bg-yellow-100 text-yellow-800"
      case "not_implemented":
        return "bg-red-100 text-red-800"
      case "not_applicable":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getReportStatusColor = (status: string) => {
    switch (status) {
      case "published":
        return "bg-green-100 text-green-800"
      case "approved":
        return "bg-blue-100 text-blue-800"
      case "pending_review":
        return "bg-yellow-100 text-yellow-800"
      case "draft":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getHealthStatusColor = (status: string) => {
    switch (status) {
      case "healthy":
        return "bg-green-100 text-green-800"
      case "warning":
        return "bg-yellow-100 text-yellow-800"
      case "critical":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getIntegrationStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800"
      case "inactive":
        return "bg-gray-100 text-gray-800"
      case "error":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getNotificationTypeColor = (type: string) => {
    switch (type) {
      case "email":
        return "bg-blue-100 text-blue-800"
      case "sms":
        return "bg-green-100 text-green-800"
      case "push":
        return "bg-purple-100 text-purple-800"
      case "in_app":
        return "bg-orange-100 text-orange-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (loading) {
    return (
      <MainLayout title="Admin Panel">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading admin panel...</div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout title="Admin Panel">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">Administration Panel</h1>
            <p className="text-muted-foreground mt-1">
              Manage users, marketplace, analytics, and system settings
            </p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh Data
            </Button>
            <Button>
              <Settings className="mr-2 h-4 w-4" />
              System Settings
            </Button>
          </div>
        </div>

        {/* Enhanced Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{users.length}</div>
              <p className="text-xs text-muted-foreground">
                {users.filter(u => u.status === "active").length} active
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Marketplace Vendors</CardTitle>
              <Store className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{marketplaceStats?.totalVendors.toLocaleString() || '0'}</div>
              <p className="text-xs text-muted-foreground">
                {marketplaceStats?.successRate || 0}% success rate
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active RFPs</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{marketplaceStats?.activeRFPs || '0'}</div>
              <p className="text-xs text-muted-foreground">
                ${((marketplaceStats?.totalValue || 0) / 1000000).toFixed(1)}M total value
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">System Health</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{systemHealth?.uptime || 0}%</div>
              <p className="text-xs text-muted-foreground">
                {systemHealth?.activeUsers || 0} active users
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-8">
            <TabsTrigger value="dashboard" className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4" />
              <span>Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>Users</span>
            </TabsTrigger>
            <TabsTrigger value="marketplace" className="flex items-center space-x-2">
              <Store className="h-4 w-4" />
              <span>Marketplace</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4" />
              <span>Analytics</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center space-x-2">
              <Bell className="h-4 w-4" />
              <span>Notifications</span>
            </TabsTrigger>
            <TabsTrigger value="integrations" className="flex items-center space-x-2">
              <Zap className="h-4 w-4" />
              <span>Integrations</span>
            </TabsTrigger>
            <TabsTrigger value="compliance" className="flex items-center space-x-2">
              <FileText className="h-4 w-4" />
              <span>Compliance</span>
            </TabsTrigger>
            <TabsTrigger value="audit" className="flex items-center space-x-2">
              <Activity className="h-4 w-4" />
              <span>Audit Log</span>
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* System Health */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Activity className="mr-2 h-5 w-5" />
                    System Health
                  </CardTitle>
                  <CardDescription>
                    Current system status and performance metrics
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Status</span>
                    <Badge className={getHealthStatusColor(systemHealth?.status || "healthy")}>
                      {systemHealth?.status || "Unknown"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Uptime</span>
                    <span className="font-medium">{systemHealth?.uptime || 0}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Response Time</span>
                    <span className="font-medium">{systemHealth?.responseTime || 0}ms</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Active Users</span>
                    <span className="font-medium">{systemHealth?.activeUsers || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Database Size</span>
                    <span className="font-medium">{systemHealth?.databaseSize || 0}GB</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Storage Used</span>
                    <span className="font-medium">{systemHealth?.storageUsed || 0}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Last Backup</span>
                    <span className="font-medium">
                      {systemHealth?.lastBackup ? new Date(systemHealth.lastBackup).toLocaleDateString() : "Never"}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Clock className="mr-2 h-5 w-5" />
                    Recent Activity
                  </CardTitle>
                  <CardDescription>
                    Latest system activities and events
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {auditLogs.slice(0, 5).map((log) => (
                      <div key={log.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                        <div className="flex-shrink-0">
                          <Activity className="h-4 w-4 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{log.action}</p>
                          <p className="text-xs text-muted-foreground">{log.details}</p>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Integrations Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Zap className="mr-2 h-5 w-5" />
                  Integration Status
                </CardTitle>
                <CardDescription>
                  Status of connected third-party services
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  {integrations.map((integration) => (
                    <div key={integration.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{integration.name}</h4>
                        <Badge className={getIntegrationStatusColor(integration.status)}>
                          {integration.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{integration.description}</p>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{integration.usage.toLocaleString()} calls</span>
                        <span>{new Date(integration.lastSync).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Marketplace Tab */}
          <TabsContent value="marketplace" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Marketplace Overview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Store className="mr-2 h-5 w-5" />
                    Marketplace Overview
                  </CardTitle>
                  <CardDescription>
                    Current marketplace statistics and performance
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Total Vendors</span>
                    <span className="font-medium">{marketplaceStats?.totalVendors.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Active RFPs</span>
                    <span className="font-medium">{marketplaceStats?.activeRFPs}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Total Value</span>
                    <span className="font-medium">${((marketplaceStats?.totalValue || 0) / 1000000).toFixed(1)}M</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Success Rate</span>
                    <span className="font-medium">{marketplaceStats?.successRate}%</span>
                  </div>
                </CardContent>
              </Card>

              {/* Top Vendors */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Star className="mr-2 h-5 w-5" />
                    Top Performing Vendors
                  </CardTitle>
                  <CardDescription>
                    Highest-rated vendors on the platform
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {marketplaceStats?.topVendors.map((vendor) => (
                      <div key={vendor.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <h4 className="font-medium">{vendor.name}</h4>
                          <p className="text-sm text-muted-foreground">{vendor.projects} projects</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Star className="h-4 w-4 text-yellow-500" />
                          <span className="font-medium">{vendor.rating}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Vendor Analytics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="mr-2 h-5 w-5" />
                  Vendor Performance Analytics
                </CardTitle>
                <CardDescription>
                  Detailed performance metrics for all vendors
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Vendor</TableHead>
                      <TableHead>Total Bids</TableHead>
                      <TableHead>Success Rate</TableHead>
                      <TableHead>Avg Response Time</TableHead>
                      <TableHead>Total Value</TableHead>
                      <TableHead>Rating</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vendorAnalytics.map((vendor) => (
                      <TableRow key={vendor.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{vendor.vendorName}</div>
                            <div className="text-sm text-muted-foreground">
                              {vendor.categories.join(", ")}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{vendor.totalBids}</TableCell>
                        <TableCell>
                          <Badge className={vendor.successRate >= 80 ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}>
                            {vendor.successRate}%
                          </Badge>
                        </TableCell>
                        <TableCell>{vendor.averageResponseTime} days</TableCell>
                        <TableCell>${(vendor.totalValue / 1000000).toFixed(1)}M</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            <Star className="h-4 w-4 text-yellow-500" />
                            <span>{vendor.rating}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Platform Metrics */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingUp className="mr-2 h-5 w-5" />
                    Platform Analytics
                  </CardTitle>
                  <CardDescription>
                    Key performance indicators and growth metrics
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-2">User Growth</h4>
                      <div className="text-2xl font-bold text-blue-600">+24%</div>
                      <p className="text-sm text-muted-foreground">vs last month</p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-2">RFP Volume</h4>
                      <div className="text-2xl font-bold text-green-600">+18%</div>
                      <p className="text-sm text-muted-foreground">vs last month</p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-2">Vendor Engagement</h4>
                      <div className="text-2xl font-bold text-purple-600">+32%</div>
                      <p className="text-sm text-muted-foreground">vs last month</p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-2">Success Rate</h4>
                      <div className="text-2xl font-bold text-orange-600">+5%</div>
                      <p className="text-sm text-muted-foreground">vs last month</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Category Performance */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Target className="mr-2 h-5 w-5" />
                    Category Performance
                  </CardTitle>
                  <CardDescription>
                    Success rates by category
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {marketplaceStats?.categories.map((category, index) => (
                      <div key={category} className="flex items-center justify-between">
                        <span className="text-sm">{category}</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ width: `${85 - index * 5}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium">{85 - index * 5}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Advanced Analytics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="mr-2 h-5 w-5" />
                  Advanced Analytics Dashboard
                </CardTitle>
                <CardDescription>
                  Comprehensive analytics and reporting tools
                </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-4">
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-blue-600 mb-1">2.5M</div>
                      <div className="text-sm text-muted-foreground">Total RFP Value</div>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-green-600 mb-1">15,847</div>
                      <div className="text-sm text-muted-foreground">Active Vendors</div>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-purple-600 mb-1">156</div>
                      <div className="text-sm text-muted-foreground">Active RFPs</div>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-orange-600 mb-1">78%</div>
                      <div className="text-sm text-muted-foreground">Success Rate</div>
                    </div>
                  </div>
                </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6">
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
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Template
                  </Button>
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
                          <Badge className={template.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                            {template.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {template.lastUsed ? new Date(template.lastUsed).toLocaleDateString() : "Never"}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm">
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
          </TabsContent>

          {/* Integrations Tab */}
          <TabsContent value="integrations" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="flex items-center">
                      <Zap className="mr-2 h-5 w-5" />
                      Third-Party Integrations
                    </CardTitle>
                    <CardDescription>
                      Manage connected services and API integrations
                    </CardDescription>
                  </div>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Integration
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {integrations.map((integration) => (
                    <div key={integration.id} className="p-6 border rounded-lg hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-medium">{integration.name}</h4>
                        <Badge className={getIntegrationStatusColor(integration.status)}>
                          {integration.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-4">{integration.description}</p>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Type:</span>
                          <span className="font-medium">{integration.type}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Usage:</span>
                          <span className="font-medium">{integration.usage.toLocaleString()} calls</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Last Sync:</span>
                          <span className="font-medium">{new Date(integration.lastSync).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex space-x-2 mt-4">
                        <Button variant="outline" size="sm" className="flex-1">
                          <Settings className="h-4 w-4 mr-1" />
                          Configure
                        </Button>
                        <Button variant="outline" size="sm">
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>User Management</CardTitle>
                    <CardDescription>
                      Manage system users and their access levels
                    </CardDescription>
                  </div>
                  <Button>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Add User
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Login</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                              {user.name.charAt(0)}
                            </div>
                            <span className="font-medium">{user.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{user.role}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(user.status)}>
                            {user.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : "Never"}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-1">
                            <Button variant="ghost" size="sm">
                              <Eye className="h-3 w-3" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Key className="h-3 w-3" />
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
          </TabsContent>

          <TabsContent value="roles" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Role Management</CardTitle>
                    <CardDescription>
                      Define roles and their permissions
                    </CardDescription>
                  </div>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Role
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {roles.map((role) => (
                    <div key={role.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-medium">{role.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {role.userCount} users assigned
                          </p>
                        </div>
                        <div className="flex space-x-1">
                          <Button variant="ghost" size="sm">
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {role.permissions.map((permission) => (
                          <Badge key={permission} variant="secondary" className="text-xs">
                            {permission}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tenants" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Tenant Management</CardTitle>
                    <CardDescription>
                      Manage multi-tenant organizations
                    </CardDescription>
                  </div>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Tenant
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {tenants.map((tenant) => (
                    <div key={tenant.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <div className="flex items-center space-x-2 mb-1">
                            <h4 className="font-medium">{tenant.name}</h4>
                            <Badge className={getPlanColor(tenant.plan)}>
                              {tenant.plan}
                            </Badge>
                            <Badge className={getStatusColor(tenant.status)}>
                              {tenant.status}
                            </Badge>
                          </div>
                          <div className="flex space-x-4 text-sm text-muted-foreground">
                            <span>{tenant.userCount} users</span>
                            <span>{tenant.rfpCount} RFPs</span>
                            <span>Created: {new Date(tenant.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className="flex space-x-1">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Settings className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      
                      {tenant.settings.branding && (
                        <div className="mt-3 p-3 bg-gray-50 rounded text-sm">
                          <strong>Branding:</strong> {tenant.settings.branding.primaryColor && (
                            <span className="ml-2">Primary: {tenant.settings.branding.primaryColor}</span>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="compliance" className="space-y-4">
            <div className="grid gap-6 md:grid-cols-3">
              {/* Compliance Overview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileText className="mr-2 h-5 w-5" />
                    Compliance Overview
                  </CardTitle>
                  <CardDescription>
                    Framework compliance status
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {complianceFrameworks.map((framework) => (
                      <div key={framework.id} className="border rounded-lg p-3">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-medium">{framework.name}</h4>
                            <p className="text-xs text-muted-foreground">v{framework.version}</p>
                          </div>
                          <Badge className={getStatusColor(framework.status)}>
                            {framework.status}
                          </Badge>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Controls:</span>
                            <span>{framework.implementedControls}/{framework.controlsCount}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-green-600 h-2 rounded-full" 
                              style={{ width: `${(framework.implementedControls / framework.controlsCount) * 100}%` }}
                            ></div>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {Math.round((framework.implementedControls / framework.controlsCount) * 100)}% complete
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Reports */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <CheckCircle className="mr-2 h-5 w-5" />
                    Recent Reports
                  </CardTitle>
                  <CardDescription>
                    Latest compliance reports
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {complianceReports.slice(0, 4).map((report) => (
                      <div key={report.id} className="border rounded-lg p-3">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-medium text-sm">{report.title}</h4>
                            <p className="text-xs text-muted-foreground">{report.framework}</p>
                          </div>
                          <Badge className={getReportStatusColor(report.status)}>
                            {report.status}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center text-xs text-muted-foreground">
                          <span>Score: {report.score}%</span>
                          <span>{new Date(report.generatedAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Controls Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <AlertTriangle className="mr-2 h-5 w-5" />
                    Controls Status
                  </CardTitle>
                  <CardDescription>
                    Control implementation status
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Implemented</span>
                      <Badge className="bg-green-100 text-green-800">
                        {complianceControls.filter(c => c.status === 'implemented').length}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Partial</span>
                      <Badge className="bg-yellow-100 text-yellow-800">
                        {complianceControls.filter(c => c.status === 'partial').length}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Not Implemented</span>
                      <Badge className="bg-red-100 text-red-800">
                        {complianceControls.filter(c => c.status === 'not_implemented').length}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Compliance Management */}
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>Compliance Frameworks</CardTitle>
                      <CardDescription>
                        Manage compliance frameworks and standards
                      </CardDescription>
                    </div>
                    <Button size="sm">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Framework
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {complianceFrameworks.map((framework) => (
                      <div key={framework.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-medium">{framework.name}</h4>
                            <p className="text-sm text-muted-foreground">{framework.description}</p>
                          </div>
                          <div className="flex space-x-1">
                            <Button variant="ghost" size="sm">
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Eye className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <div className="flex justify-between items-center text-sm text-muted-foreground">
                          <span>Version {framework.version}</span>
                          <span>Updated {new Date(framework.lastUpdated).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>Compliance Controls</CardTitle>
                      <CardDescription>
                        Manage individual compliance controls
                      </CardDescription>
                    </div>
                    <Button size="sm">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Control
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {complianceControls.map((control) => (
                      <div key={control.id} className="border rounded-lg p-3">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-medium text-sm">{control.name}</h4>
                            <p className="text-xs text-muted-foreground">{control.category}</p>
                          </div>
                          <Badge className={getComplianceStatusColor(control.status)}>
                            {control.status.replace('_', ' ')}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-600 mb-2">{control.description}</p>
                        <div className="flex justify-between items-center text-xs text-muted-foreground">
                          <span>Next review: {new Date(control.nextReview).toLocaleDateString()}</span>
                          <span>{control.evidence.length} evidence files</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="audit" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Audit Log</CardTitle>
                <CardDescription>
                  System activity and security events
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Target</TableHead>
                      <TableHead>IP Address</TableHead>
                      <TableHead>Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {auditLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>
                          {new Date(log.timestamp).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{log.action}</Badge>
                        </TableCell>
                        <TableCell>{log.user}</TableCell>
                        <TableCell>{log.target}</TableCell>
                        <TableCell>{log.ip}</TableCell>
                        <TableCell className="max-w-xs truncate">
                          {log.details}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  )
}