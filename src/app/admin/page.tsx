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
  Save
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

export default function AdminPage() {
  const [users, setUsers] = useState<User[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("users")

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

  useEffect(() => {
    setTimeout(() => {
      setUsers(mockUsers)
      setRoles(mockRoles)
      setTenants(mockTenants)
      setAuditLogs(mockAuditLogs)
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
        <div>
          <h1 className="text-2xl font-bold">Administration Panel</h1>
          <p className="text-muted-foreground">
            Manage users, roles, tenants, and system settings
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
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
              <CardTitle className="text-sm font-medium">Tenants</CardTitle>
              <Building className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tenants.length}</div>
              <p className="text-xs text-muted-foreground">
                {tenants.filter(t => t.status === "active").length} active
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Roles</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{roles.length}</div>
              <p className="text-xs text-muted-foreground">
                Custom permission sets
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">System Activity</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{auditLogs.length}</div>
              <p className="text-xs text-muted-foreground">
                Recent audit logs
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="users" className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>Users</span>
            </TabsTrigger>
            <TabsTrigger value="roles" className="flex items-center space-x-2">
              <Shield className="h-4 w-4" />
              <span>Roles</span>
            </TabsTrigger>
            <TabsTrigger value="tenants" className="flex items-center space-x-2">
              <Building className="h-4 w-4" />
              <span>Tenants</span>
            </TabsTrigger>
            <TabsTrigger value="audit" className="flex items-center space-x-2">
              <Activity className="h-4 w-4" />
              <span>Audit Log</span>
            </TabsTrigger>
          </TabsList>

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

          <TabsContent value="audit" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Audit Log</CardTitle>
                <CardDescription>
                  System activity and security events
                </CardDescription>
              </CardHeader>
              <CardContent>
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
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  )
}