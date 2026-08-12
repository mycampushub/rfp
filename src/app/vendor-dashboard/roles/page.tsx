"use client"

import { useState, useEffect } from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { Search, Plus, MoreHorizontal, Eye, Edit, Trash2, CheckCircle, AlertTriangle, Users, Shield, Key, Settings, Filter, RefreshCw, Copy, Lock, Crown, User, Link } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { formatDate } from "@/lib/utils"

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

  // Static permissions list (not stored in DB, these are UI-only definitions)
  const STATIC_PERMISSIONS: Permission[] = [
    { id: "dashboard_view", name: "View Dashboard", description: "Access to vendor dashboard", category: "Dashboard", isDangerous: false },
    { id: "dashboard_analytics", name: "View Analytics", description: "Access to analytics and reports", category: "Dashboard", isDangerous: false },
    { id: "profile_view", name: "View Profile", description: "View business profile", category: "Profile", isDangerous: false },
    { id: "profile_edit", name: "Edit Profile", description: "Edit business profile information", category: "Profile", isDangerous: false },
    { id: "profile_manage", name: "Manage Profile", description: "Full control over business profile", category: "Profile", isDangerous: false },
    { id: "team_view", name: "View Team", description: "View team members", category: "Team", isDangerous: false },
    { id: "team_manage", name: "Manage Team", description: "Add, edit, remove team members", category: "Team", isDangerous: true },
    { id: "team_roles", name: "Manage Roles", description: "Create and manage user roles", category: "Team", isDangerous: true },
    { id: "bids_view", name: "View Bids", description: "View submitted bids", category: "Bidding", isDangerous: false },
    { id: "bids_create", name: "Create Bids", description: "Submit new bids", category: "Bidding", isDangerous: false },
    { id: "bids_manage", name: "Manage Bids", description: "Full control over bids", category: "Bidding", isDangerous: true },
    { id: "connections_view", name: "View Connections", description: "View business connections", category: "Connections", isDangerous: false },
    { id: "connections_manage", name: "Manage Connections", description: "Create and manage business connections", category: "Connections", isDangerous: true },
    { id: "marketplace_view", name: "View Marketplace", description: "Browse marketplace opportunities", category: "Marketplace", isDangerous: false },
    { id: "marketplace_bid", name: "Bid on Opportunities", description: "Submit bids on marketplace RFPs", category: "Marketplace", isDangerous: false },
    { id: "admin_settings", name: "Admin Settings", description: "Access to administrative settings", category: "Admin", isDangerous: true },
    { id: "admin_audit", name: "View Audit Logs", description: "Access to system audit logs", category: "Admin", isDangerous: true },
    { id: "admin_billing", name: "Manage Billing", description: "Access to billing and payments", category: "Admin", isDangerous: true },
  ]

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [rolesRes, logsRes] = await Promise.all([
          fetch('/api/roles').then(r => r.ok ? r.json() : []),
          fetch('/api/audit-logs?limit=10').then(r => r.ok ? r.json() : []),
        ])

        const rolesData = Array.isArray(rolesRes) ? rolesRes : []
        setRoles(rolesData.map((r: Record<string, unknown>) => ({
          id: r.id,
          name: r.name || '',
          description: r.description || '',
          permissions: Array.isArray(r.permissions) ? r.permissions as string[] : [],
          userCount: 0,
          isSystemRole: false,
          createdAt: r.createdAt || '',
          updatedAt: r.updatedAt || '',
        })))
        setPermissions(STATIC_PERMISSIONS)
        setUsers([])

        const logsData = Array.isArray(logsRes) ? logsRes : []
        setAccessLogs(logsData.map((log: Record<string, unknown>) => ({
          id: log.id,
          userId: log.actor || '',
          userName: log.actor || '',
          action: log.action || '',
          resource: log.targetType || '',
          ipAddress: '',
          timestamp: log.timestamp || '',
          status: 'success' as const,
        })))
      } catch {
        toast.error('Failed to load role management data')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
      case "success":
        return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
      case "inactive":
        return "bg-muted text-muted-foreground"
      case "pending":
        return "bg-amber-500/15 text-amber-700 dark:text-amber-400"
      case "suspended":
      case "failed":
      case "blocked":
        return "bg-red-500/15 text-red-700 dark:text-red-400"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  const getPermissionCategoryColor = (category: string) => {
    switch (category) {
      case "Dashboard":
        return "bg-sky-500/15 text-sky-700 dark:text-sky-400"
      case "Profile":
        return "bg-violet-500/15 text-violet-700 dark:text-violet-400"
      case "Team":
        return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
      case "Bidding":
        return "bg-orange-500/15 text-orange-700 dark:text-orange-400"
      case "Connections":
        return "bg-pink-500/15 text-pink-700 dark:text-pink-400"
      case "Marketplace":
        return "bg-indigo-500/15 text-indigo-700 dark:text-indigo-400"
      case "Admin":
        return "bg-red-500/15 text-red-700 dark:text-red-400"
      default:
        return "bg-muted text-muted-foreground"
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

  const handleCreateRole = async () => {
    try {
      const res = await fetch('/api/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newRole.name, permissions: newRole.permissions }),
      })
      if (res.ok) {
        toast.success('Role created successfully')
        setShowCreateRoleModal(false)
        setNewRole({ name: "", description: "", permissions: [] as string[] })
        // Refresh roles
        const rolesRes = await fetch('/api/roles')
        if (rolesRes.ok) {
          const rolesData = await rolesRes.json()
          setRoles((Array.isArray(rolesData) ? rolesData : []).map((r: Record<string, unknown>) => ({
            id: r.id,
            name: r.name || '',
            description: r.description || '',
            permissions: Array.isArray(r.permissions) ? r.permissions as string[] : [],
            userCount: 0,
            isSystemRole: false,
            createdAt: r.createdAt || '',
            updatedAt: r.updatedAt || '',
          })))
        }
      } else {
        const err = await res.json()
        toast.error(err.error || 'Failed to create role')
      }
    } catch {
      toast.error('Failed to create role')
    }
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
                                <Button variant="ghost" size="sm" aria-label={`Role options for ${role.name}`}>
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
                                  <DropdownMenuItem className="text-red-600 dark:text-red-400">
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
                                    className={`text-xs ${permission.isDangerous ? 'border-red-500/30 text-red-700 dark:text-red-400' : ''}`}
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
                            <span>Created: {formatDate(role.createdAt)}</span>
                            <span>Updated: {formatDate(role.updatedAt)}</span>
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
                <div className="overflow-x-auto">
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
                              <Shield className="h-4 w-4 text-emerald-600 dark:text-emerald-400" title="2FA Enabled" />
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
                              <Button variant="ghost" size="sm" aria-label={`User options for ${user.name}`}>
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
                </div>
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
                                      <Lock className="ml-2 h-3 w-3 text-red-600 dark:text-red-400" title="Dangerous permission" />
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
                <div className="overflow-x-auto">
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
                          <code className="bg-muted px-2 py-1 rounded text-xs">
                            {log.action}
                          </code>
                        </TableCell>
                        <TableCell>{log.resource}</TableCell>
                        <TableCell>
                          <code className="bg-muted px-2 py-1 rounded text-xs">
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
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Create Role Modal */}
      {showCreateRoleModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
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
                                    <Lock className="ml-1 h-3 w-3 text-red-600 dark:text-red-400" />
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
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
                                    <Lock className="ml-1 h-3 w-3 text-red-600 dark:text-red-400" />
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
                    <Button onClick={async () => {
                      if (!selectedRole) return
                      try {
                        const res = await fetch(`/api/roles/${selectedRole.id}`, {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ permissions: selectedRole.permissions }),
                        })
                        if (res.ok) {
                          toast.success('Permissions updated successfully')
                          setShowEditPermissionsModal(false)
                        } else {
                          const err = await res.json()
                          toast.error(err.error || 'Failed to update permissions')
                        }
                      } catch {
                        toast.error('Failed to update permissions')
                      }
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