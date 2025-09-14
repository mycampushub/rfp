"use client"

import { useState, useEffect } from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { 
  Checkbox,
} from "@/components/ui/checkbox"
import { 
  Search, 
  Plus, 
  MoreHorizontal, 
  Eye, 
  Edit, 
  Trash2,
  CheckCircle,
  AlertTriangle,
  Users,
  Shield,
  Key,
  Settings,
  UserPlus,
  Filter,
  RefreshCw,
  Copy,
  Lock,
  Unlock,
  Crown,
  User,
  Users2,
  Activity,
  Star,
  Clock,
  Mail,
  Phone,
  MapPin,
  Globe,
  Target,
  BarChart3,
  FileText,
  MessageSquare,
  Calendar,
  TrendingUp,
  Award,
  Building,
  DollarSign,
  Bell,
  Download,
  Upload,
  Link,
  Unlink,
  QrCode
} from "lucide-react"
import Link from "next/link"

interface Role {
  id: string
  name: string
  description: string
  permissions: string[]
  userCount: number
  isSystemRole: boolean
  createdAt: string
  updatedAt: string
}

interface Permission {
  id: string
  name: string
  description: string
  category: string
  isDangerous: boolean
}

interface VendorUser {
  id: string
  name: string
  email: string
  role: string
  roleName: string
  permissions: string[]
  lastActive: string
  status: "active" | "inactive" | "pending" | "suspended"
  createdAt: string
  twoFactorEnabled: boolean
}

interface AccessLog {
  id: string
  userId: string
  userName: string
  action: string
  resource: string
  ipAddress: string
  timestamp: string
  status: "success" | "failed" | "blocked"
}

export default function RoleManagement() {
  const [roles, setRoles] = useState<Role[]>([])
  const [users, setUsers] = useState<VendorUser[]>([])
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [accessLogs, setAccessLogs] = useState<AccessLog[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [showCreateRoleModal, setShowCreateRoleModal] = useState(false)
  const [showEditPermissionsModal, setShowEditPermissionsModal] = useState(false)
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [newRole, setNewRole] = useState({
    name: "",
    description: "",
    permissions: [] as string[]
  })

  // Mock data for demonstration
  const mockPermissions: Permission[] = [
    // Dashboard Permissions
    { id: "dashboard_view", name: "View Dashboard", description: "Access to vendor dashboard", category: "Dashboard", isDangerous: false },
    { id: "dashboard_analytics", name: "View Analytics", description: "Access to analytics and reports", category: "Dashboard", isDangerous: false },
    
    // Profile Permissions
    { id: "profile_view", name: "View Profile", description: "View business profile", category: "Profile", isDangerous: false },
    { id: "profile_edit", name: "Edit Profile", description: "Edit business profile information", category: "Profile", isDangerous: false },
    { id: "profile_manage", name: "Manage Profile", description: "Full control over business profile", category: "Profile", isDangerous: false },
    
    // Team Permissions
    { id: "team_view", name: "View Team", description: "View team members", category: "Team", isDangerous: false },
    { id: "team_manage", name: "Manage Team", description: "Add, edit, remove team members", category: "Team", isDangerous: true },
    { id: "team_roles", name: "Manage Roles", description: "Create and manage user roles", category: "Team", isDangerous: true },
    
    // Bidding Permissions
    { id: "bids_view", name: "View Bids", description: "View submitted bids", category: "Bidding", isDangerous: false },
    { id: "bids_create", name: "Create Bids", description: "Submit new bids", category: "Bidding", isDangerous: false },
    { id: "bids_manage", name: "Manage Bids", description: "Full control over bids", category: "Bidding", isDangerous: true },
    
    // Connections Permissions
    { id: "connections_view", name: "View Connections", description: "View business connections", category: "Connections", isDangerous: false },
    { id: "connections_manage", name: "Manage Connections", description: "Create and manage business connections", category: "Connections", isDangerous: true },
    
    // Marketplace Permissions
    { id: "marketplace_view", name: "View Marketplace", description: "Browse marketplace opportunities", category: "Marketplace", isDangerous: false },
    { id: "marketplace_bid", name: "Bid on Opportunities", description: "Submit bids on marketplace RFPs", category: "Marketplace", isDangerous: false },
    
    // Admin Permissions
    { id: "admin_settings", name: "Admin Settings", description: "Access to administrative settings", category: "Admin", isDangerous: true },
    { id: "admin_audit", name: "View Audit Logs", description: "Access to system audit logs", category: "Admin", isDangerous: true },
    { id: "admin_billing", name: "Manage Billing", description: "Access to billing and payments", category: "Admin", isDangerous: true },
  ]

  const mockRoles: Role[] = [
    {
      id: "1",
      name: "Admin",
      description: "Full access to all vendor dashboard features",
      permissions: mockPermissions.map(p => p.id),
      userCount: 1,
      isSystemRole: true,
      createdAt: "2024-01-01",
      updatedAt: "2024-12-01"
    },
    {
      id: "2",
      name: "Bid Manager",
      description: "Manage bidding activities and proposals",
      permissions: [
        "dashboard_view", "dashboard_analytics", "profile_view", "profile_edit",
        "team_view", "bids_view", "bids_create", "bids_manage",
        "connections_view", "connections_manage", "marketplace_view", "marketplace_bid"
      ],
      userCount: 2,
      isSystemRole: false,
      createdAt: "2024-02-01",
      updatedAt: "2024-11-15"
    },
    {
      id: "3",
      name: "Team Member",
      description: "Basic access to dashboard and team features",
      permissions: [
        "dashboard_view", "profile_view", "team_view", "bids_view",
        "connections_view", "marketplace_view"
      ],
      userCount: 3,
      isSystemRole: false,
      createdAt: "2024-02-15",
      updatedAt: "2024-10-20"
    },
    {
      id: "4",
      name: "Viewer",
      description: "Read-only access to dashboard and analytics",
      permissions: [
        "dashboard_view", "dashboard_analytics", "profile_view", "team_view"
      ],
      userCount: 1,
      isSystemRole: false,
      createdAt: "2024-03-01",
      updatedAt: "2024-09-10"
    }
  ]

  const mockUsers: VendorUser[] = [
    {
      id: "1",
      name: "John Smith",
      email: "john@techsolutions.com",
      role: "1",
      roleName: "Admin",
      permissions: mockRoles.find(r => r.id === "1")?.permissions || [],
      lastActive: "2024-12-10",
      status: "active",
      createdAt: "2024-01-15",
      twoFactorEnabled: true
    },
    {
      id: "2",
      name: "Sarah Johnson",
      email: "sarah@techsolutions.com",
      role: "2",
      roleName: "Bid Manager",
      permissions: mockRoles.find(r => r.id === "2")?.permissions || [],
      lastActive: "2024-12-09",
      status: "active",
      createdAt: "2024-02-20",
      twoFactorEnabled: false
    },
    {
      id: "3",
      name: "Mike Wilson",
      email: "mike@techsolutions.com",
      role: "2",
      roleName: "Bid Manager",
      permissions: mockRoles.find(r => r.id === "2")?.permissions || [],
      lastActive: "2024-12-08",
      status: "active",
      createdAt: "2024-03-15",
      twoFactorEnabled: true
    },
    {
      id: "4",
      name: "Emily Davis",
      email: "emily@techsolutions.com",
      role: "3",
      roleName: "Team Member",
      permissions: mockRoles.find(r => r.id === "3")?.permissions || [],
      lastActive: "2024-12-05",
      status: "active",
      createdAt: "2024-04-10",
      twoFactorEnabled: false
    },
    {
      id: "5",
      name: "Robert Brown",
      email: "robert@techsolutions.com",
      role: "4",
      roleName: "Viewer",
      permissions: mockRoles.find(r => r.id === "4")?.permissions || [],
      lastActive: "2024-12-01",
      status: "inactive",
      createdAt: "2024-05-20",
      twoFactorEnabled: false
    }
  ]

  const mockAccessLogs: AccessLog[] = [
    {
      id: "1",
      userId: "1",
      userName: "John Smith",
      action: "LOGIN",
      resource: "Dashboard",
      ipAddress: "192.168.1.100",
      timestamp: "2024-12-10T09:30:00Z",
      status: "success"
    },
    {
      id: "2",
      userId: "2",
      userName: "Sarah Johnson",
      action: "BID_CREATE",
      resource: "RFP-1234",
      ipAddress: "192.168.1.101",
      timestamp: "2024-12-10T10:15:00Z",
      status: "success"
    },
    {
      id: "3",
      userId: "3",
      userName: "Mike Wilson",
      action: "PROFILE_EDIT",
      resource: "Business Profile",
      ipAddress: "192.168.1.102",
      timestamp: "2024-12-10T11:20:00Z",
      status: "success"
    },
    {
      id: "4",
      userId: "4",
      userName: "Emily Davis",
      action: "LOGIN",
      resource: "Dashboard",
      ipAddress: "192.168.1.103",
      timestamp: "2024-12-10T14:45:00Z",
      status: "failed"
    },
    {
      id: "5",
      userId: "5",
      userName: "Robert Brown",
      action: "DASHBOARD_VIEW",
      resource: "Analytics",
      ipAddress: "192.168.1.104",
      timestamp: "2024-12-09T16:30:00Z",
      status: "success"
    }
  ]

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setRoles(mockRoles)
      setUsers(mockUsers)
      setPermissions(mockPermissions)
      setAccessLogs(mockAccessLogs)
      setLoading(false)
    }, 1000)
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
      case "success":
        return "bg-green-100 text-green-800"
      case "inactive":
        return "bg-gray-100 text-gray-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "suspended":
      case "failed":
        return "bg-red-100 text-red-800"
      case "blocked":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getPermissionCategoryColor = (category: string) => {
    switch (category) {
      case "Dashboard":
        return "bg-blue-100 text-blue-800"
      case "Profile":
        return "bg-purple-100 text-purple-800"
      case "Team":
        return "bg-green-100 text-green-800"
      case "Bidding":
        return "bg-orange-100 text-orange-800"
      case "Connections":
        return "bg-pink-100 text-pink-800"
      case "Marketplace":
        return "bg-indigo-100 text-indigo-800"
      case "Admin":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.roleName.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = roleFilter === "all" || user.role === roleFilter
    const matchesStatus = statusFilter === "all" || user.status === statusFilter
    return matchesSearch && matchesRole && matchesStatus
  })

  const handleCreateRole = () => {
    // Handle role creation logic
    console.log("Creating role:", newRole)
    setShowCreateRoleModal(false)
    setNewRole({ name: "", description: "", permissions: [] as string[] })
  }

  const handlePermissionToggle = (permissionId: string, checked: boolean) => {
    if (checked) {
      setNewRole(prev => ({
        ...prev,
        permissions: [...prev.permissions, permissionId]
      }))
    } else {
      setNewRole(prev => ({
        ...prev,
        permissions: prev.permissions.filter(p => p !== permissionId)
      }))
    }
  }

  const getPermissionsByCategory = () => {
    const categories = permissions.reduce((acc, permission) => {
      if (!acc[permission.category]) {
        acc[permission.category] = []
      }
      acc[permission.category].push(permission)
      return acc
    }, {} as Record<string, Permission[]>)
    
    return categories
  }

  if (loading) {
    return (
      <MainLayout title="Role Management">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading role management...</div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout title="Role Management">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">Role & Access Management</h1>
            <p className="text-muted-foreground mt-1">
              Manage user roles, permissions, and access control for your vendor organization
            </p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Button onClick={() => setShowCreateRoleModal(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Role
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Roles</CardTitle>
              <Crown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{roles.length}</div>
              <p className="text-xs text-muted-foreground">
                {roles.filter(r => r.isSystemRole).length} system roles
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{users.filter(u => u.status === "active").length}</div>
              <p className="text-xs text-muted-foreground">
                {users.filter(u => u.twoFactorEnabled).length} with 2FA
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Permissions</CardTitle>
              <Key className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{permissions.length}</div>
              <p className="text-xs text-muted-foreground">
                {permissions.filter(p => p.isDangerous).length} dangerous
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Security Events</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{accessLogs.filter(l => l.status !== "success").length}</div>
              <p className="text-xs text-muted-foreground">
                Last 24 hours
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="roles" className="space-y-4">
          <TabsList>
            <TabsTrigger value="roles">Roles</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="permissions">Permissions</TabsTrigger>
            <TabsTrigger value="audit">Audit Log</TabsTrigger>
          </TabsList>

          <TabsContent value="roles">
            <Card>
              <CardHeader>
                <CardTitle>Roles & Permissions</CardTitle>
                <CardDescription>
                  Manage user roles and their associated permissions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {roles.map((role) => (
                    <Card key={role.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <CardTitle className="text-lg">{role.name}</CardTitle>
                              {role.isSystemRole && (
                                <Badge variant="outline">
                                  <Shield className="mr-1 h-3 w-3" />
                                  System
                                </Badge>
                              )}
                            </div>
                            <CardDescription>{role.description}</CardDescription>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant="secondary">
                              <Users className="mr-1 h-3 w-3" />
                              {role.userCount} users
                            </Badge>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent>
                                <DropdownMenuItem onClick={() => {
                                  setSelectedRole(role)
                                  setShowEditPermissionsModal(true)
                                }}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit Permissions
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Copy className="mr-2 h-4 w-4" />
                                  Duplicate Role
                                </DropdownMenuItem>
                                {!role.isSystemRole && (
                                  <DropdownMenuItem className="text-red-600">
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete Role
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div>
                            <Label className="text-sm font-medium">Permissions ({role.permissions.length})</Label>
                            <div className="flex flex-wrap gap-1 mt-2">
                              {role.permissions.slice(0, 8).map((permissionId) => {
                                const permission = permissions.find(p => p.id === permissionId)
                                return permission ? (
                                  <Badge 
                                    key={permissionId} 
                                    variant="outline" 
                                    className={`text-xs ${permission.isDangerous ? 'border-red-200 text-red-700' : ''}`}
                                  >
                                    {permission.name}
                                    {permission.isDangerous && <Lock className="ml-1 h-2 w-2" />}
                                  </Badge>
                                ) : null
                              })}
                              {role.permissions.length > 8 && (
                                <Badge variant="outline" className="text-xs">
                                  +{role.permissions.length - 8} more
                                </Badge>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between text-sm text-muted-foreground">
                            <span>Created: {new Date(role.createdAt).toLocaleDateString()}</span>
                            <span>Updated: {new Date(role.updatedAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>
                  Manage users and their role assignments
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Filters */}
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search users..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8"
                      />
                    </div>
                  </div>
                  <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      {roles.map((role) => (
                        <SelectItem key={role.id} value={role.id}>{role.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Users Table */}
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Permissions</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Active</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <div className="font-medium">{user.name}</div>
                            {user.twoFactorEnabled && (
                              <Shield className="h-4 w-4 text-green-600" title="2FA Enabled" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{user.roleName}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {user.permissions.slice(0, 3).map((permission, index) => {
                              const perm = permissions.find(p => p.id === permission)
                              return perm ? (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {perm.name}
                                </Badge>
                              ) : null
                            })}
                            {user.permissions.length > 3 && (
                              <Badge variant="secondary" className="text-xs">
                                +{user.permissions.length - 3}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(user.status)}>
                            {user.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{user.lastActive}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit User
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Key className="mr-2 h-4 w-4" />
                                Change Permissions
                              </DropdownMenuItem>
                              {user.status === "active" && (
                                <DropdownMenuItem>
                                  <AlertTriangle className="mr-2 h-4 w-4" />
                                  Suspend User
                                </DropdownMenuItem>
                              )}
                              {user.status === "inactive" && (
                                <DropdownMenuItem>
                                  <CheckCircle className="mr-2 h-4 w-4" />
                                  Activate User
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="permissions">
            <Card>
              <CardHeader>
                <CardTitle>Permission Catalog</CardTitle>
                <CardDescription>
                  View all available permissions and their descriptions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {Object.entries(getPermissionsByCategory()).map(([category, categoryPermissions]) => (
                    <div key={category}>
                      <h3 className="text-lg font-semibold mb-3 flex items-center">
                        <Badge className={getPermissionCategoryColor(category)} variant="secondary">
                          {category}
                        </Badge>
                      </h3>
                      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                        {categoryPermissions.map((permission) => (
                          <Card key={permission.id} className="hover:shadow-md transition-shadow">
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex-1">
                                  <h4 className="font-medium flex items-center">
                                    {permission.name}
                                    {permission.isDangerous && (
                                      <Lock className="ml-2 h-3 w-3 text-red-600" title="Dangerous permission" />
                                    )}
                                  </h4>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {permission.description}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span>ID: {permission.id}</span>
                                <span>
                                  {roles.filter(r => r.permissions.includes(permission.id)).length} roles
                                </span>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="audit">
            <Card>
              <CardHeader>
                <CardTitle>Audit Log</CardTitle>
                <CardDescription>
                  Track user activities and security events
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Resource</TableHead>
                      <TableHead>IP Address</TableHead>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {accessLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>
                          <div className="font-medium">{log.userName}</div>
                        </TableCell>
                        <TableCell>
                          <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                            {log.action}
                          </code>
                        </TableCell>
                        <TableCell>{log.resource}</TableCell>
                        <TableCell>
                          <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                            {log.ipAddress}
                          </code>
                        </TableCell>
                        <TableCell>
                          {new Date(log.timestamp).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(log.status)}>
                            {log.status}
                          </Badge>
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

      {/* Create Role Modal */}
      {showCreateRoleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Create New Role</CardTitle>
              <CardDescription>
                Define a new role with specific permissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="roleName">Role Name *</Label>
                    <Input
                      id="roleName"
                      placeholder="Enter role name"
                      value={newRole.name}
                      onChange={(e) => setNewRole({...newRole, name: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="roleDescription">Description</Label>
                    <Input
                      id="roleDescription"
                      placeholder="Describe the role's purpose"
                      value={newRole.description}
                      onChange={(e) => setNewRole({...newRole, description: e.target.value})}
                    />
                  </div>
                </div>

                <div>
                  <Label>Permissions</Label>
                  <div className="space-y-4 mt-2">
                    {Object.entries(getPermissionsByCategory()).map(([category, categoryPermissions]) => (
                      <div key={category}>
                        <h4 className="font-medium mb-2 flex items-center">
                          <Badge className={getPermissionCategoryColor(category)} variant="secondary">
                            {category}
                          </Badge>
                        </h4>
                        <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                          {categoryPermissions.map((permission) => (
                            <div key={permission.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={permission.id}
                                checked={newRole.permissions.includes(permission.id)}
                                onCheckedChange={(checked) => handlePermissionToggle(permission.id, checked as boolean)}
                              />
                              <label htmlFor={permission.id} className="text-sm cursor-pointer">
                                <div className="flex items-center">
                                  {permission.name}
                                  {permission.isDangerous && (
                                    <Lock className="ml-1 h-3 w-3 text-red-600" />
                                  )}
                                </div>
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <div className="text-sm text-muted-foreground">
                    {newRole.permissions.length} permissions selected
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" onClick={() => setShowCreateRoleModal(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateRole}>
                      Create Role
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Edit Permissions Modal */}
      {showEditPermissionsModal && selectedRole && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Edit Permissions - {selectedRole.name}</CardTitle>
              <CardDescription>
                Modify permissions for this role
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label>Permissions</Label>
                  <div className="space-y-4 mt-2">
                    {Object.entries(getPermissionsByCategory()).map(([category, categoryPermissions]) => (
                      <div key={category}>
                        <h4 className="font-medium mb-2 flex items-center">
                          <Badge className={getPermissionCategoryColor(category)} variant="secondary">
                            {category}
                          </Badge>
                        </h4>
                        <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                          {categoryPermissions.map((permission) => (
                            <div key={permission.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={`edit-${permission.id}`}
                                checked={selectedRole.permissions.includes(permission.id)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setSelectedRole({
                                      ...selectedRole,
                                      permissions: [...selectedRole.permissions, permission.id]
                                    })
                                  } else {
                                    setSelectedRole({
                                      ...selectedRole,
                                      permissions: selectedRole.permissions.filter(p => p !== permission.id)
                                    })
                                  }
                                }}
                                disabled={selectedRole.isSystemRole && permission.isDangerous}
                              />
                              <label htmlFor={`edit-${permission.id}`} className="text-sm cursor-pointer">
                                <div className="flex items-center">
                                  {permission.name}
                                  {permission.isDangerous && (
                                    <Lock className="ml-1 h-3 w-3 text-red-600" />
                                  )}
                                </div>
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <div className="text-sm text-muted-foreground">
                    {selectedRole.permissions.length} permissions selected
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" onClick={() => setShowEditPermissionsModal(false)}>
                      Cancel
                    </Button>
                    <Button onClick={() => {
                      // Handle saving permissions
                      console.log("Saving permissions for role:", selectedRole)
                      setShowEditPermissionsModal(false)
                    }}>
                      Save Changes
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </MainLayout>
  )
}