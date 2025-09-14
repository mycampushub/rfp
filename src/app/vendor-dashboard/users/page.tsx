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
  Download,
  Upload,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Clock,
  Activity,
  Star,
  Lock,
  Unlock,
  UserCheck,
  UserX,
  UserMinus,
  MoreVertical,
  Copy,
  ExternalLink,
  Bell,
  BellOff
} from "lucide-react"
import Link from "next/link"

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

  // Mock roles data
  const mockRoles: Role[] = [
    {
      id: "1",
      name: "Admin",
      description: "Full access to all vendor dashboard features",
      permissions: ["dashboard_view", "dashboard_analytics", "profile_view", "profile_edit", "profile_manage", "team_view", "team_manage", "team_roles", "bids_view", "bids_create", "bids_manage", "connections_view", "connections_manage", "marketplace_view", "marketplace_bid", "admin_settings", "admin_audit", "admin_billing"]
    },
    {
      id: "2",
      name: "Bid Manager",
      description: "Manage bidding activities and proposals",
      permissions: ["dashboard_view", "dashboard_analytics", "profile_view", "profile_edit", "team_view", "bids_view", "bids_create", "bids_manage", "connections_view", "connections_manage", "marketplace_view", "marketplace_bid"]
    },
    {
      id: "3",
      name: "Team Member",
      description: "Basic access to dashboard and team features",
      permissions: ["dashboard_view", "profile_view", "team_view", "bids_view", "connections_view", "marketplace_view"]
    },
    {
      id: "4",
      name: "Viewer",
      description: "Read-only access to dashboard and analytics",
      permissions: ["dashboard_view", "dashboard_analytics", "profile_view", "team_view"]
    }
  ]

  // Mock users data
  const mockUsers: VendorUser[] = [
    {
      id: "1",
      name: "John Smith",
      email: "john@techsolutions.com",
      phone: "+1-555-0123",
      role: "1",
      roleName: "Admin",
      permissions: mockRoles.find(r => r.id === "1")?.permissions || [],
      department: "Executive",
      title: "CEO",
      status: "active",
      lastActive: "2024-12-10T14:30:00Z",
      createdAt: "2024-01-15T09:00:00Z",
      updatedAt: "2024-12-10T14:30:00Z",
      twoFactorEnabled: true,
      emailVerified: true,
      loginCount: 247,
      lastLoginAt: "2024-12-10T09:15:00Z",
      sessionCount: 3,
      activeSessions: 1
    },
    {
      id: "2",
      name: "Sarah Johnson",
      email: "sarah@techsolutions.com",
      phone: "+1-555-0456",
      role: "2",
      roleName: "Bid Manager",
      permissions: mockRoles.find(r => r.id === "2")?.permissions || [],
      department: "Operations",
      title: "Bid Manager",
      status: "active",
      lastActive: "2024-12-10T16:45:00Z",
      createdAt: "2024-02-20T10:30:00Z",
      updatedAt: "2024-12-09T16:45:00Z",
      twoFactorEnabled: false,
      emailVerified: true,
      loginCount: 156,
      lastLoginAt: "2024-12-10T08:30:00Z",
      sessionCount: 2,
      activeSessions: 1
    },
    {
      id: "3",
      name: "Mike Wilson",
      email: "mike@techsolutions.com",
      phone: "+1-555-0789",
      role: "2",
      roleName: "Bid Manager",
      permissions: mockRoles.find(r => r.id === "2")?.permissions || [],
      department: "Operations",
      title: "Senior Bid Manager",
      status: "active",
      lastActive: "2024-12-10T11:20:00Z",
      createdAt: "2024-03-15T14:00:00Z",
      updatedAt: "2024-12-08T11:20:00Z",
      twoFactorEnabled: true,
      emailVerified: true,
      loginCount: 89,
      lastLoginAt: "2024-12-09T15:45:00Z",
      sessionCount: 1,
      activeSessions: 0
    },
    {
      id: "4",
      name: "Emily Davis",
      email: "emily@techsolutions.com",
      phone: "+1-555-0321",
      role: "3",
      roleName: "Team Member",
      permissions: mockRoles.find(r => r.id === "3")?.permissions || [],
      department: "Sales",
      title: "Sales Representative",
      status: "active",
      lastActive: "2024-12-09T13:15:00Z",
      createdAt: "2024-04-10T09:15:00Z",
      updatedAt: "2024-12-05T13:15:00Z",
      twoFactorEnabled: false,
      emailVerified: true,
      loginCount: 67,
      lastLoginAt: "2024-12-05T09:30:00Z",
      sessionCount: 0,
      activeSessions: 0
    },
    {
      id: "5",
      name: "Robert Brown",
      email: "robert@techsolutions.com",
      phone: "+1-555-0654",
      role: "4",
      roleName: "Viewer",
      permissions: mockRoles.find(r => r.id === "4")?.permissions || [],
      department: "Finance",
      title: "Financial Analyst",
      status: "inactive",
      lastActive: "2024-12-01T10:30:00Z",
      createdAt: "2024-05-20T11:00:00Z",
      updatedAt: "2024-12-01T10:30:00Z",
      twoFactorEnabled: false,
      emailVerified: true,
      loginCount: 23,
      lastLoginAt: "2024-12-01T08:15:00Z",
      sessionCount: 0,
      activeSessions: 0
    },
    {
      id: "6",
      name: "Lisa Anderson",
      email: "lisa@techsolutions.com",
      phone: "+1-555-0987",
      role: "3",
      roleName: "Team Member",
      permissions: mockRoles.find(r => r.id === "3")?.permissions || [],
      department: "Marketing",
      title: "Marketing Coordinator",
      status: "pending",
      lastActive: "",
      createdAt: "2024-12-08T14:00:00Z",
      updatedAt: "2024-12-08T14:00:00Z",
      twoFactorEnabled: false,
      emailVerified: false,
      loginCount: 0,
      sessionCount: 0,
      activeSessions: 0
    }
  ]

  // Mock activities data
  const mockActivities: UserActivity[] = [
    {
      id: "1",
      userId: "1",
      userName: "John Smith",
      action: "LOGIN",
      details: "Successful login from Chrome browser",
      ipAddress: "192.168.1.100",
      location: "New York, NY",
      device: "Chrome on Windows",
      timestamp: "2024-12-10T09:15:00Z",
      status: "success"
    },
    {
      id: "2",
      userId: "2",
      userName: "Sarah Johnson",
      action: "BID_SUBMITTED",
      details: "Submitted bid for RFP-2024-001",
      ipAddress: "192.168.1.101",
      location: "Los Angeles, CA",
      device: "Safari on macOS",
      timestamp: "2024-12-10T10:30:00Z",
      status: "success"
    },
    {
      id: "3",
      userId: "3",
      userName: "Mike Wilson",
      action: "PROFILE_UPDATED",
      details: "Updated business profile information",
      ipAddress: "192.168.1.102",
      location: "Chicago, IL",
      device: "Firefox on Linux",
      timestamp: "2024-12-10T11:20:00Z",
      status: "success"
    },
    {
      id: "4",
      userId: "4",
      userName: "Emily Davis",
      action: "LOGIN_FAILED",
      details: "Failed login attempt - incorrect password",
      ipAddress: "192.168.1.103",
      location: "Houston, TX",
      device: "Chrome on Android",
      timestamp: "2024-12-10T12:45:00Z",
      status: "failed"
    },
    {
      id: "5",
      userId: "1",
      userName: "John Smith",
      action: "USER_CREATED",
      details: "Created new user: Lisa Anderson",
      ipAddress: "192.168.1.100",
      location: "New York, NY",
      device: "Chrome on Windows",
      timestamp: "2024-12-08T14:00:00Z",
      status: "success"
    }
  ]

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setUsers(mockUsers)
      setActivities(mockActivities)
      setRoles(mockRoles)
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

  const handleAddUser = () => {
    // Handle user creation logic
    console.log("Adding user:", newUser)
    setShowAddUserModal(false)
    setNewUser({ name: "", email: "", phone: "", role: "", department: "", title: "" })
  }

  const handleEditUser = (user: VendorUser) => {
    setSelectedUser(user)
    setShowEditUserModal(true)
  }

  const handleUpdateUser = () => {
    // Handle user update logic
    console.log("Updating user:", selectedUser)
    setShowEditUserModal(false)
    setSelectedUser(null)
  }

  const handleToggleUserStatus = (userId: string, newStatus: "active" | "inactive" | "suspended") => {
    setUsers(users.map(user => 
      user.id === userId ? { ...user, status: newStatus } : user
    ))
  }

  const handleSendInvitation = (userId: string) => {
    console.log("Sending invitation to user:", userId)
  }

  const handleResetPassword = (userId: string) => {
    console.log("Resetting password for user:", userId)
  }

  const handleExportUsers = () => {
    console.log("Exporting users data")
  }

  const handleImportUsers = () => {
    console.log("Importing users data")
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
                                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                                  <span className="text-sm font-medium text-blue-800">
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
                                  {new Date(user.lastActive).toLocaleDateString()}
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
                                <Shield className="h-4 w-4 text-green-600" title="2FA Enabled" />
                              )}
                              {user.emailVerified && (
                                <CheckCircle className="h-4 w-4 text-blue-600" title="Email Verified" />
                              )}
                              {user.activeSessions > 0 && (
                                <div className="flex items-center">
                                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                  <span className="text-xs ml-1">{user.activeSessions}</span>
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEditUser(user)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit User
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleSendInvitation(user.id)}>
                                  <Mail className="mr-2 h-4 w-4" />
                                  Send Invitation
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleResetPassword(user.id)}>
                                  <Key className="mr-2 h-4 w-4" />
                                  Reset Password
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Copy className="mr-2 h-4 w-4" />
                                  Copy User ID
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <ExternalLink className="mr-2 h-4 w-4" />
                                  View Profile
                                </DropdownMenuItem>
                                <DropdownMenuContent>
                                  {user.status === "active" && (
                                    <>
                                      <DropdownMenuItem onClick={() => handleToggleUserStatus(user.id, "inactive")}>
                                        <UserMinus className="mr-2 h-4 w-4" />
                                        Deactivate
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => handleToggleUserStatus(user.id, "suspended")}>
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
                          activity.status === "success" ? "bg-green-100" : 
                          activity.status === "failed" ? "bg-red-100" : 
                          "bg-yellow-100"
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
                                  <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                                    <span className="text-xs font-medium text-blue-800">
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
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
                    Save Changes
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
    </MainLayout>
  )
}