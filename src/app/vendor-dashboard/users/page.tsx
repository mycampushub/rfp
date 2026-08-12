"use client"

import { useState, useEffect, useRef } from "react"
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
import { Search, Edit, CheckCircle, Users, Shield, Key, UserPlus, Filter, Download, Upload, Mail, Phone, Activity, UserCheck, UserX, UserMinus, MoreVertical, Copy, ExternalLink } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { formatDate } from "@/lib/utils"

interface VendorUser {
  id: string
  name: string
  email: string
  phone?: string
  role: string
  roleName: string
  permissions: string[]
  department?: string
  title?: string
  avatar?: string
  status: "active" | "inactive" | "pending" | "suspended"
  lastActive: string
  createdAt: string
  updatedAt: string
  twoFactorEnabled: boolean
  emailVerified: boolean
  loginCount: number
  lastLoginAt?: string
  sessionCount: number
  activeSessions: number
}

interface UserActivity {
  id: string
  userId: string
  userName: string
  action: string
  details: string
  ipAddress: string
  location: string
  device: string
  timestamp: string
  status: "success" | "failed" | "blocked"
}

interface Role {
  id: string
  name: string
  description: string
  permissions: string[]
}

export default function UserManagement() {
  useEffect(() => { document.title = 'Vendor Users | RFP Platform' }, [])
  const [users, setUsers] = useState<VendorUser[]>([])
  const [activities, setActivities] = useState<UserActivity[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [departmentFilter, setDepartmentFilter] = useState("all")
  const [showAddUserModal, setShowAddUserModal] = useState(false)
  const [showEditUserModal, setShowEditUserModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<VendorUser | null>(null)
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    phone: "",
    role: "",
    department: "",
    title: ""
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [rolesRes, logsRes] = await Promise.all([
          fetch('/api/roles').then(r => r.ok ? r.json() : []),
          fetch('/api/audit-logs?limit=20').then(r => r.ok ? r.json() : []),
        ])

        const rolesData = Array.isArray(rolesRes) ? rolesRes : []
        setRoles(rolesData.map((r) => ({
          id: r.id,
          name: r.name || '',
          description: r.description || '',
          permissions: Array.isArray(r.permissions) ? r.permissions : [],
        })))
        setUsers([])

        const logsData = Array.isArray(logsRes) ? logsRes : []
        setActivities(logsData.map((log) => ({
          id: log.id,
          userId: log.actor || '',
          userName: log.actor || '',
          action: log.action || '',
          details: `${log.targetType || ''} - ${log.targetId || ''}`,
          ipAddress: '',
          location: '',
          device: '',
          timestamp: log.timestamp || '',
          status: 'success' as const,
        })))
      } catch (err) { toast.error('Failed to load user management data') } finally {
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

  const getActionIcon = (action: string) => {
    switch (action) {
      case "LOGIN":
      case "LOGIN_FAILED":
        return <Key className="h-4 w-4" />
      case "BID_SUBMITTED":
        return <Upload className="h-4 w-4" />
      case "PROFILE_UPDATED":
        return <Edit className="h-4 w-4" />
      case "USER_CREATED":
        return <UserPlus className="h-4 w-4" />
      default:
        return <Activity className="h-4 w-4" />
    }
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.roleName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (user.department && user.department.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (user.title && user.title.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesRole = roleFilter === "all" || user.role === roleFilter
    const matchesStatus = statusFilter === "all" || user.status === statusFilter
    const matchesDepartment = departmentFilter === "all" || user.department === departmentFilter
    return matchesSearch && matchesRole && matchesStatus && matchesDepartment
  })

  const departments = Array.from(new Set(users.map(u => u.department).filter(Boolean))) as string[]

  const handleAddUser = async () => {
    try {
      const res = await fetch('/api/tenant/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newUser.name,
          email: newUser.email,
          password: 'TempPass123!',
          role: newUser.role || undefined,
          department: newUser.department || undefined,
          title: newUser.title || undefined,
          phone: newUser.phone || undefined,
        }),
      })
      if (res.ok) {
        toast.success('User added successfully')
        setShowAddUserModal(false)
        setNewUser({ name: "", email: "", phone: "", role: "", department: "", title: "" })
      } else {
        const err = await res.json()
        toast.error(err.error || 'Failed to add user')
      }
    } catch (err) { toast.error('Failed to add user') }
  }

  const handleEditUser = (user: VendorUser) => {
    setSelectedUser(user)
    setShowEditUserModal(true)
  }

  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleUpdateUser = async () => {
    if (!selectedUser) return
    try {
      const res = await fetch(`/api/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: selectedUser.name, email: selectedUser.email, roleIds: [selectedUser.role] }),
      })
      if (res.ok) {
        toast.success('User updated successfully')
        setShowEditUserModal(false)
        setSelectedUser(null)
      } else {
        const err = await res.json()
        toast.error(err.error || 'Failed to update user')
      }
    } catch (err) { toast.error('Failed to update user') }
  }

  const [statusChangeTarget, setStatusChangeTarget] = useState<{ userId: string; newStatus: "active" | "inactive" | "suspended"; userName: string } | null>(null)

  const handleToggleUserStatus = async (userId: string, newStatus: "active" | "inactive" | "suspended") => {
    const prevUsers = [...users]
    setUsers(users.map(user => 
      user.id === userId ? { ...user, status: newStatus as VendorUser['status'] } : user
    ))
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: newStatus === 'active' }),
      })
      if (res.ok) {
        toast.success(`User ${newStatus === 'active' ? 'activated' : newStatus === 'suspended' ? 'suspended' : 'deactivated'} successfully`)
      } else {
        setUsers(prevUsers)
        toast.error('Failed to update user status')
      }
    } catch (err) { setUsers(prevUsers)
      toast.error('Failed to update user status') }
    setStatusChangeTarget(null)
  }

  const handleSendInvitation = async (user: VendorUser) => {
    try {
      const res = await fetch('/api/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, role: 'vendor_user' }),
      })
      if (res.ok) {
        toast.success('Invitation sent successfully')
      } else {
        const err = await res.json()
        toast.error(err.error || 'Failed to send invitation')
      }
    } catch (err) { toast.error('Failed to send invitation') }
  }

  const handleResetPassword = async (user: VendorUser) => {
    try {
      const res = await fetch('/api/auth/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email }),
      })
      if (res.ok) {
        toast.success('Password reset email sent to ' + user.email)
      } else {
        toast.error('Failed to send password reset email')
      }
    } catch {
      toast.error('Failed to send password reset email')
    }
  }

  const handleExportUsers = () => {
    const headers = ['Name', 'Email', 'Phone', 'Role', 'Status', 'Department', 'Title', 'Last Active', 'Created At']
    const rows = users.map(u => [
      u.name, u.email, u.phone || '', u.roleName, u.status, u.department || '', u.title || '', u.lastActive, u.createdAt
    ])
    const csvContent = [headers, ...rows].map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"]`).join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'users-export.csv'
    link.click()
    URL.revokeObjectURL(url)
    toast.success('Users exported')
  }

  const handleImportUsers = () => {
    fileInputRef.current?.click()
  }

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const text = await file.text()
      const lines = text.split('\n').filter(l => l.trim())
      if (lines.length < 2) {
        toast.error('CSV file is empty or has no data rows')
        return
      }
      const results = { success: 0, failed: 0 }
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',').map(c => c.replace(/^"|"$/g, '').trim())
        const name = cols[0] || ''
        const email = cols[1] || ''
        if (!name || !email) { results.failed++; continue }
        try {
          const res = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password: 'TempPass123!' }),
          })
          if (res.ok) { results.success++ } else { results.failed++ }
        } catch (err) { results.failed++ }
      }
      toast.success(`Import complete: ${results.success} succeeded, ${results.failed} failed`)
    } catch (err) { toast.error('Failed to parse CSV file') }
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  if (loading) {
    return (
      <MainLayout title="User Management">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading user management...</div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout title="User Management">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">User Management</h1>
            <p className="text-muted-foreground mt-1">
              Manage users, roles, and access for your vendor organization
            </p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleFileImport}
          />
          <div className="flex space-x-2">
            <Button variant="outline" onClick={handleExportUsers}>
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Button variant="outline" onClick={handleImportUsers}>
              <Upload className="mr-2 h-4 w-4" />
              Import
            </Button>
            <Button onClick={() => setShowAddUserModal(true)}>
              <UserPlus className="mr-2 h-4 w-4" />
              Add User
            </Button>
          </div>
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
              <CardTitle className="text-sm font-medium">Pending Invites</CardTitle>
              <Mail className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{users.filter(u => u.status === "pending").length}</div>
              <p className="text-xs text-muted-foreground">
                Awaiting acceptance
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Security Score</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">87%</div>
              <p className="text-xs text-muted-foreground">
                {users.filter(u => u.twoFactorEnabled).length} with 2FA
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {users.reduce((sum, u) => sum + u.activeSessions, 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                Across all users
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="users" className="space-y-4">
          <TabsList>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="departments">Departments</TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>User Directory</CardTitle>
                <CardDescription>
                  Manage all users in your vendor organization
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Filters */}
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search users by name, email, role, department..."
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
                  <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Departments</SelectItem>
                      {departments.map((dept) => (
                        <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Users Table */}
                <div className="rounded-md border">
                  <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Last Active</TableHead>
                        <TableHead>Security</TableHead>
                        <TableHead className="w-[100px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <div className="flex-shrink-0">
                                <div className="w-8 h-8 rounded-full bg-sky-500/15 dark:bg-sky-500/25 flex items-center justify-center">
                                  <span className="text-sm font-medium text-sky-700 dark:text-sky-400">
                                    {user.name.split(' ').map(n => n[0]).join('')}
                                  </span>
                                </div>
                              </div>
                              <div>
                                <div className="font-medium">{user.name}</div>
                                {user.title && (
                                  <div className="text-sm text-muted-foreground">{user.title}</div>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div className="flex items-center">
                                <Mail className="h-3 w-3 mr-1" />
                                {user.email}
                              </div>
                              {user.phone && (
                                <div className="flex items-center text-muted-foreground">
                                  <Phone className="h-3 w-3 mr-1" />
                                  {user.phone}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{user.roleName}</Badge>
                          </TableCell>
                          <TableCell>
                            {user.department || (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(user.status)}>
                              {user.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {user.lastActive ? (
                                <div>
                                  {formatDate(user.lastActive)}
                                  <div className="text-xs text-muted-foreground">
                                    {new Date(user.lastActive).toLocaleTimeString()}
                                  </div>
                                </div>
                              ) : (
                                <span className="text-muted-foreground">Never</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              {user.twoFactorEnabled && (
                                <span title="2FA Enabled"><Shield className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /></span>
                              )}
                              {user.emailVerified && (
                                <span title="Email Verified"><CheckCircle className="h-4 w-4 text-sky-600 dark:text-sky-400" /></span>
                              )}
                              {user.activeSessions > 0 && (
                                <div className="flex items-center">
                                  <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                                  <span className="text-xs ml-1">{user.activeSessions}</span>
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" aria-label="User actions">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEditUser(user)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit User
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleSendInvitation(user)}>
                                  <Mail className="mr-2 h-4 w-4" />
                                  Send Invitation
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleResetPassword(user)}>
                                  <Key className="mr-2 h-4 w-4" />
                                  Reset Password
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => { navigator.clipboard.writeText(user.id); toast.success('User ID copied to clipboard') }}>
                                  <Copy className="mr-2 h-4 w-4" />
                                  Copy User ID
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                  <Link href={`/vendor-dashboard/users/${user.id}`}>
                                    <ExternalLink className="mr-2 h-4 w-4" />
                                    View Profile
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuContent>
                                  {user.status === "active" && (
                                    <>
                                      <DropdownMenuItem onClick={() => setStatusChangeTarget({ userId: user.id, newStatus: 'inactive', userName: user.name })}>
                                        <UserMinus className="mr-2 h-4 w-4" />
                                        Deactivate
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => setStatusChangeTarget({ userId: user.id, newStatus: 'suspended', userName: user.name })}>
                                        <UserX className="mr-2 h-4 w-4" />
                                        Suspend
                                      </DropdownMenuItem>
                                    </>
                                  )}
                                  {user.status === "inactive" && (
                                    <DropdownMenuItem onClick={() => handleToggleUserStatus(user.id, "active")}>
                                      <UserCheck className="mr-2 h-4 w-4" />
                                      Activate
                                    </DropdownMenuItem>
                                  )}
                                  {user.status === "suspended" && (
                                    <DropdownMenuItem onClick={() => handleToggleUserStatus(user.id, "active")}>
                                      <UserCheck className="mr-2 h-4 w-4" />
                                      Unsuspend
                                    </DropdownMenuItem>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity">
            <Card>
              <CardHeader>
                <CardTitle>User Activity Log</CardTitle>
                <CardDescription>
                  Track recent user activities and security events
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {activities.map((activity) => (
                    <div key={activity.id} className="flex items-start space-x-4 p-4 border rounded-lg">
                      <div className="flex-shrink-0">
                        <div className={`p-2 rounded-full ${
                          activity.status === "success" ? "bg-emerald-500/15 dark:bg-emerald-500/25" : 
                          activity.status === "failed" ? "bg-red-500/15 dark:bg-red-500/25" : 
                          "bg-amber-500/15 dark:bg-amber-500/25"
                        }`}>
                          {getActionIcon(activity.action)}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">{activity.userName}</h4>
                            <p className="text-sm text-muted-foreground">{activity.details}</p>
                          </div>
                          <Badge className={getStatusColor(activity.status)}>
                            {activity.status}
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-4 mt-2 text-xs text-muted-foreground">
                          <span>{activity.device}</span>
                          <span>•</span>
                          <span>{activity.location}</span>
                          <span>•</span>
                          <span>{activity.ipAddress}</span>
                          <span>•</span>
                          <span>{new Date(activity.timestamp).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="departments">
            <Card>
              <CardHeader>
                <CardTitle>Department Overview</CardTitle>
                <CardDescription>
                  View users organized by department
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {departments.map((department) => {
                    const deptUsers = users.filter(u => u.department === department)
                    return (
                      <Card key={department} className="hover:shadow-md transition-shadow">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg">{department}</CardTitle>
                          <CardDescription>
                            {deptUsers.length} user{deptUsers.length !== 1 ? 's' : ''}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {deptUsers.map((user) => (
                              <div key={user.id} className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  <div className="w-6 h-6 rounded-full bg-sky-500/15 dark:bg-sky-500/25 flex items-center justify-center">
                                    <span className="text-xs font-medium text-sky-700 dark:text-sky-400">
                                      {user.name.split(' ').map(n => n[0]).join('')}
                                    </span>
                                  </div>
                                  <div>
                                    <div className="text-sm font-medium">{user.name}</div>
                                    <div className="text-xs text-muted-foreground">{user.title}</div>
                                  </div>
                                </div>
                                <Badge 
                                  variant="outline" 
                                  className={`text-xs ${user.status === "active" ? "" : "opacity-50"}`}
                                >
                                  {user.roleName}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Add User Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Add New User</CardTitle>
              <CardDescription>
                Invite a new user to your vendor organization
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="userName">Full Name *</Label>
                  <Input
                    id="userName"
                    placeholder="Enter full name"
                    value={newUser.name}
                    onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                  />
                </div>
                
                <div>
                  <Label htmlFor="userEmail">Email Address *</Label>
                  <Input
                    id="userEmail"
                    type="email"
                    placeholder="Enter email address"
                    value={newUser.email}
                    onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                  />
                </div>
                
                <div>
                  <Label htmlFor="userPhone">Phone Number</Label>
                  <Input
                    id="userPhone"
                    type="tel"
                    placeholder="Enter phone number"
                    value={newUser.phone}
                    onChange={(e) => setNewUser({...newUser, phone: e.target.value})}
                  />
                </div>
                
                <div>
                  <Label htmlFor="userRole">Role *</Label>
                  <Select value={newUser.role} onValueChange={(value) => setNewUser({...newUser, role: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((role) => (
                        <SelectItem key={role.id} value={role.id}>{role.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="userDepartment">Department</Label>
                  <Input
                    id="userDepartment"
                    placeholder="Enter department"
                    value={newUser.department}
                    onChange={(e) => setNewUser({...newUser, department: e.target.value})}
                  />
                </div>
                
                <div>
                  <Label htmlFor="userTitle">Job Title</Label>
                  <Input
                    id="userTitle"
                    placeholder="Enter job title"
                    value={newUser.title}
                    onChange={(e) => setNewUser({...newUser, title: e.target.value})}
                  />
                </div>
                
                <div className="flex space-x-2">
                  <Button onClick={handleAddUser} className="flex-1">
                    Send Invitation
                  </Button>
                  <Button variant="outline" onClick={() => setShowAddUserModal(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditUserModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Edit User</CardTitle>
              <CardDescription>
                Update user information and settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="editUserName">Full Name</Label>
                  <Input
                    id="editUserName"
                    value={selectedUser.name}
                    onChange={(e) => setSelectedUser({...selectedUser, name: e.target.value})}
                  />
                </div>
                
                <div>
                  <Label htmlFor="editUserEmail">Email Address</Label>
                  <Input
                    id="editUserEmail"
                    type="email"
                    value={selectedUser.email}
                    onChange={(e) => setSelectedUser({...selectedUser, email: e.target.value})}
                  />
                </div>
                
                <div>
                  <Label htmlFor="editUserPhone">Phone Number</Label>
                  <Input
                    id="editUserPhone"
                    type="tel"
                    value={selectedUser.phone || ""}
                    onChange={(e) => setSelectedUser({...selectedUser, phone: e.target.value})}
                  />
                </div>
                
                <div>
                  <Label htmlFor="editUserRole">Role</Label>
                  <Select value={selectedUser.role} onValueChange={(value) => setSelectedUser({...selectedUser, role: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((role) => (
                        <SelectItem key={role.id} value={role.id}>{role.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="editUserDepartment">Department</Label>
                  <Input
                    id="editUserDepartment"
                    value={selectedUser.department || ""}
                    onChange={(e) => setSelectedUser({...selectedUser, department: e.target.value})}
                  />
                </div>
                
                <div>
                  <Label htmlFor="editUserTitle">Job Title</Label>
                  <Input
                    id="editUserTitle"
                    value={selectedUser.title || ""}
                    onChange={(e) => setSelectedUser({...selectedUser, title: e.target.value})}
                  />
                </div>
                
                <div className="flex space-x-2">
                  <Button onClick={handleUpdateUser} className="flex-1">
                    Update User
                  </Button>
                  <Button variant="outline" onClick={() => setShowEditUserModal(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <AlertDialog open={!!statusChangeTarget} onOpenChange={(open) => { if (!open) setStatusChangeTarget(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change user status?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to {statusChangeTarget?.newStatus === 'suspended' ? 'suspend' : 'deactivate'} {statusChangeTarget?.userName}? {statusChangeTarget?.newStatus === 'suspended' ? 'They will not be able to log in until unsuspended.' : 'They will lose access to the platform until reactivated.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            {statusChangeTarget && (
              <AlertDialogAction onClick={() => handleToggleUserStatus(statusChangeTarget.userId, statusChangeTarget.newStatus)} className="bg-amber-600 hover:bg-amber-700">
                {statusChangeTarget.newStatus === 'suspended' ? 'Suspend' : 'Deactivate'}
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  )
}
