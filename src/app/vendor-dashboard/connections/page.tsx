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
import { Search, MoreHorizontal, Eye, Edit, CheckCircle, Users, Link as LinkIcon, Unlink, Clock, Mail, Phone, Star, Shield, QrCode, Copy, UserPlus, RefreshCw, Activity, X, MessageSquare } from "lucide-react"
import { toast } from "sonner"
import { formatDate } from "@/lib/utils"

interface BusinessConnection {
  id: string
  businessId: string
  businessName: string
  category: string
  contactInfo: {
    email: string
    phone: string
    address: string
  }
  status: "pending" | "accepted" | "declined" | "blocked"
  connectionType: "vendor" | "client" | "partner" | "supplier"
  connectedAt?: string
  lastActivity?: string
  mutualConnections: number
  rating?: number
  description: string
  specialties: string[]
}

interface ConnectionRequest {
  id: string
  fromBusinessId: string
  fromBusinessName: string
  toBusinessId: string
  message: string
  connectionType: string
  status: "pending" | "accepted" | "declined"
  requestedAt: string
  respondedAt?: string
}

interface BusinessProfile {
  id: string
  businessId: string
  businessName: string
  description: string
  categories: string[]
  specialties: string[]
  contactInfo: {
    email: string
    phone: string
    address: string
    website?: string
  }
  isVerified: boolean
  rating: number
  connectionCount: number
}

export default function BusinessConnections() {
  const [connections, setConnections] = useState<BusinessConnection[]>([])
  const [requests, setRequests] = useState<ConnectionRequest[]>([])
  const [suggestions, setSuggestions] = useState<BusinessProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [connectionTypeFilter, setConnectionTypeFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [showConnectModal, setShowConnectModal] = useState(false)
  const [newConnection, setNewConnection] = useState({
    businessId: "",
    message: "",
    connectionType: "vendor"
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [connRes, vendorsRes] = await Promise.all([
          fetch('/api/vendor-connections').then(r => r.ok ? r.json() : []),
          fetch('/api/vendors').then(r => r.ok ? r.json() : []),
        ])

        const connData = Array.isArray(connRes) ? connRes : []
        const connectedVendorIds = new Set(connData.map((c: Record<string, unknown>) => c.fromVendorId || c.toVendorId))

        // Map accepted connections
        const acceptedConns = connData.filter((c: Record<string, unknown>) => c.status === 'accepted')
        setConnections(acceptedConns.map((c: Record<string, unknown>) => {
          const other = c.fromVendorId !== undefined ? (c.toVendor as Record<string, unknown> || {}) : (c.fromVendor as Record<string, unknown> || {})
          const contact = (other as Record<string, unknown>)?.contactInfo as Record<string, unknown> || {}
          return {
            id: String(c.id),
            businessId: String((other as Record<string, unknown>)?.id || ''),
            businessName: String((other as Record<string, unknown>)?.name || 'Unknown'),
            category: '',
            contactInfo: {
              email: String(contact.email || ''),
              phone: String(contact.phone || ''),
              address: String(contact.address || ''),
            },
            status: 'accepted' as const,
            connectionType: 'partner' as const,
            connectedAt: String(c.respondedAt || c.createdAt || ''),
            lastActivity: String(c.updatedAt || ''),
            mutualConnections: 0,
            rating: Number((other as Record<string, unknown>)?.rating) || 0,
            description: String((other as Record<string, unknown>)?.description || ''),
            specialties: [],
          }
        }))

        // Map pending requests
        const pendingConns = connData.filter((c: Record<string, unknown>) => c.status === 'pending')
        setRequests(pendingConns.map((c: Record<string, unknown>) => ({
          id: String(c.id),
          fromBusinessId: String((c.fromVendor as Record<string, unknown>)?.id || ''),
          fromBusinessName: String((c.fromVendor as Record<string, unknown>)?.name || 'Unknown'),
          toBusinessId: String((c.toVendor as Record<string, unknown>)?.id || ''),
          message: String(c.message || ''),
          connectionType: 'vendor',
          status: 'pending' as const,
          requestedAt: String(c.createdAt || ''),
        })))

        // Suggestions: vendors not already connected
        const vendorsData = Array.isArray(vendorsRes) ? vendorsRes : []
        setSuggestions(vendorsData
          .filter((v: Record<string, unknown>) => !connectedVendorIds.has(v.id))
          .map((v: Record<string, unknown>) => {
            const contact = v.contactInfo as Record<string, unknown> || {}
            return {
              id: String(v.id),
              businessId: String(v.id),
              businessName: String(v.name || 'Unknown'),
              description: String(v.description || ''),
              categories: Array.isArray(v.categories) ? v.categories : [],
              specialties: [],
              contactInfo: {
                email: String(contact.email || ''),
                phone: String(contact.phone || ''),
                address: String(contact.address || ''),
                website: String(contact.website || ''),
              },
              isVerified: Boolean(v.verified),
              rating: Number(v.rating) || 0,
              connectionCount: 0,
            }
          })
        )
      } catch {
        toast.error('Failed to load connections data')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "accepted":
      case "active":
        return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
      case "pending":
        return "bg-amber-500/15 text-amber-700 dark:text-amber-400"
      case "declined":
      case "blocked":
        return "bg-red-500/15 text-red-700 dark:text-red-400"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  const getConnectionTypeColor = (type: string) => {
    switch (type) {
      case "vendor":
        return "bg-sky-500/15 text-sky-700 dark:text-sky-400"
      case "client":
        return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
      case "partner":
        return "bg-violet-500/15 text-violet-700 dark:text-violet-400"
      case "supplier":
        return "bg-orange-500/15 text-orange-700 dark:text-orange-400"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  const filteredConnections = connections.filter(connection => {
    const matchesSearch = connection.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         connection.businessId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         connection.category.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = connectionTypeFilter === "all" || connection.connectionType === connectionTypeFilter
    const matchesStatus = statusFilter === "all" || connection.status === statusFilter
    return matchesSearch && matchesType && matchesStatus
  })

  const handleConnectRequest = async () => {
    if (!newConnection.businessId) {
      toast.error('Please select a vendor to connect with')
      return
    }
    try {
      const res = await fetch('/api/vendor-connections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toVendorId: newConnection.businessId, message: newConnection.message }),
      })
      if (res.ok) {
        toast.success('Connection request sent successfully')
        setShowConnectModal(false)
        setNewConnection({ businessId: "", message: "", connectionType: "vendor" })
      } else {
        const err = await res.json()
        toast.error(err.error || 'Failed to send connection request')
      }
    } catch {
      toast.error('Failed to send connection request')
    }
  }

  const handleAcceptRequest = async (requestId: string) => {
    try {
      const res = await fetch(`/api/vendor-connections/${requestId}/accept`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'accept' }),
      })
      if (res.ok) {
        toast.success('Connection accepted')
        setRequests(requests.map(req => 
          req.id === requestId ? { ...req, status: "accepted" as const, respondedAt: new Date().toISOString() } : req
        ))
      } else {
        toast.error('Failed to accept connection')
      }
    } catch {
      toast.error('Failed to accept connection')
    }
  }

  const handleDeclineRequest = async (requestId: string) => {
    try {
      const res = await fetch(`/api/vendor-connections/${requestId}/accept`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'block' }),
      })
      if (res.ok) {
        toast.success('Connection declined')
        setRequests(requests.map(req => 
          req.id === requestId ? { ...req, status: "declined" as const, respondedAt: new Date().toISOString() } : req
        ))
      } else {
        toast.error('Failed to decline connection')
      }
    } catch {
      toast.error('Failed to decline connection')
    }
  }

  const copyBusinessId = (businessId: string) => {
    navigator.clipboard.writeText(businessId)
  }

  if (loading) {
    return (
      <MainLayout title="Business Connections">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading business connections...</div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout title="Business Connections">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">Business Connections</h1>
            <p className="text-muted-foreground mt-1">
              Manage your business network and create new partnerships
            </p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Button onClick={() => setShowConnectModal(true)}>
              <UserPlus className="mr-2 h-4 w-4" />
              Connect Business
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Connections</CardTitle>
              <LinkIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{connections.length}</div>
              <p className="text-xs text-muted-foreground">
                {connections.filter(c => c.status === "accepted").length} active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{requests.filter(r => r.status === "pending").length}</div>
              <p className="text-xs text-muted-foreground">
                {requests.filter(r => r.status === "pending").length} awaiting response
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Mutual Connections</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {connections.reduce((sum, c) => sum + c.mutualConnections, 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                Across all connections
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Rating</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {connections.filter(c => c.rating).length > 0 
                  ? (connections.filter(c => c.rating).reduce((sum, c) => sum + (c.rating || 0), 0) / connections.filter(c => c.rating).length).toFixed(1)
                  : "0.0"
                }
              </div>
              <p className="text-xs text-muted-foreground">
                From connected businesses
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="connections" className="space-y-4">
          <TabsList>
            <TabsTrigger value="connections">My Connections</TabsTrigger>
            <TabsTrigger value="requests">Connection Requests</TabsTrigger>
            <TabsTrigger value="suggestions">Suggestions</TabsTrigger>
            <TabsTrigger value="discover">Discover</TabsTrigger>
          </TabsList>

          <TabsContent value="connections">
            <Card>
              <CardHeader>
                <CardTitle>Business Connections</CardTitle>
                <CardDescription>
                  Your connected business partners and network
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Filters */}
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search connections..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8"
                      />
                    </div>
                  </div>
                  <Select value={connectionTypeFilter} onValueChange={setConnectionTypeFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Connection Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="vendor">Vendor</SelectItem>
                      <SelectItem value="client">Client</SelectItem>
                      <SelectItem value="partner">Partner</SelectItem>
                      <SelectItem value="supplier">Supplier</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="accepted">Accepted</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="declined">Declined</SelectItem>
                      <SelectItem value="blocked">Blocked</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Connections Table */}
                <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Business</TableHead>
                      <TableHead>Business ID</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Connected</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredConnections.map((connection) => (
                      <TableRow key={connection.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium flex items-center">
                              {connection.businessName}
                              {connection.rating && (
                                <div className="flex items-center ml-2">
                                  <Star className="h-3 w-3 text-amber-500 dark:text-amber-400" />
                                  <span className="text-xs ml-1">{connection.rating}</span>
                                </div>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">{connection.description}</p>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {connection.specialties.slice(0, 2).map((specialty, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {specialty}
                                </Badge>
                              ))}
                              {connection.specialties.length > 2 && (
                                <Badge variant="outline" className="text-xs">
                                  +{connection.specialties.length - 2}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <code className="bg-muted px-2 py-1 rounded text-xs">
                              {connection.businessId}
                            </code>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyBusinessId(connection.businessId)}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getConnectionTypeColor(connection.connectionType)}>
                            {connection.connectionType}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div className="flex items-center">
                              <Mail className="h-3 w-3 mr-1" />
                              {connection.contactInfo.email}
                            </div>
                            <div className="flex items-center text-muted-foreground">
                              <Phone className="h-3 w-3 mr-1" />
                              {connection.contactInfo.phone}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(connection.status)}>
                            {connection.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {connection.connectedAt ? (
                            <div className="text-sm">
                              {formatDate(connection.connectedAt)}
                              {connection.lastActivity && (
                                <div className="text-xs text-muted-foreground">
                                  Last: {formatDate(connection.lastActivity)}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" aria-label="Connection actions">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem>
                                <Eye className="mr-2 h-4 w-4" />
                                View Profile
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <MessageSquare className="mr-2 h-4 w-4" />
                                Send Message
                              </DropdownMenuItem>
                              {connection.status === "accepted" && (
                                <>
                                  <DropdownMenuItem>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit Connection
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="text-red-600 dark:text-red-400">
                                    <Unlink className="mr-2 h-4 w-4" />
                                    Disconnect
                                  </DropdownMenuItem>
                                </>
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

          <TabsContent value="requests">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Received Requests */}
              <Card>
                <CardHeader>
                  <CardTitle>Received Requests</CardTitle>
                  <CardDescription>
                    Connection requests from other businesses
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {requests.filter(r => r.status === "pending").map((request) => (
                      <div key={request.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-semibold">{request.fromBusinessName}</h4>
                            <p className="text-sm text-muted-foreground">
                              Business ID: {request.fromBusinessId}
                            </p>
                          </div>
                          <Badge className={getConnectionTypeColor(request.connectionType)}>
                            {request.connectionType}
                          </Badge>
                        </div>
                        
                        <p className="text-sm mb-3">{request.message}</p>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-muted-foreground">
                            Requested: {formatDate(request.requestedAt)}
                          </span>
                          <div className="flex space-x-2">
                            <Button 
                              size="sm" 
                              onClick={() => handleAcceptRequest(request.id)}
                            >
                              <CheckCircle className="mr-1 h-3 w-3" />
                              Accept
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleDeclineRequest(request.id)}
                            >
                              <X className="mr-1 h-3 w-3" />
                              Decline
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {requests.filter(r => r.status === "pending").length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No pending connection requests</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Sent Requests */}
              <Card>
                <CardHeader>
                  <CardTitle>Sent Requests</CardTitle>
                  <CardDescription>
                    Connection requests you've sent
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {requests.filter(r => r.status !== "pending").map((request) => (
                      <div key={request.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-semibold">To: {request.toBusinessId}</h4>
                            <p className="text-sm text-muted-foreground">
                              Sent: {formatDate(request.requestedAt)}
                            </p>
                          </div>
                          <Badge className={getStatusColor(request.status)}>
                            {request.status}
                          </Badge>
                        </div>
                        
                        <p className="text-sm mb-3">{request.message}</p>
                        
                        {request.respondedAt && (
                          <p className="text-xs text-muted-foreground">
                            Responded: {formatDate(request.respondedAt)}
                          </p>
                        )}
                      </div>
                    ))}
                    
                    {requests.filter(r => r.status !== "pending").length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No sent connection requests</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="suggestions">
            <Card>
              <CardHeader>
                <CardTitle>Suggested Connections</CardTitle>
                <CardDescription>
                  Businesses we recommend you connect with based on your profile and activity
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {suggestions.map((suggestion) => (
                    <Card key={suggestion.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg">{suggestion.businessName}</CardTitle>
                            <CardDescription className="text-sm">
                              {suggestion.businessId}
                            </CardDescription>
                          </div>
                          {suggestion.isVerified && (
                            <Shield className="h-4 w-4 text-sky-600 dark:text-sky-400 mt-1" />
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <p className="text-sm text-muted-foreground">
                          {suggestion.description}
                        </p>
                        
                        <div className="flex flex-wrap gap-1">
                          {suggestion.categories.map((category, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {category}
                            </Badge>
                          ))}
                        </div>
                        
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center">
                            <Star className="h-3 w-3 text-amber-500 dark:text-amber-400 mr-1" />
                            <span>{suggestion.rating}</span>
                          </div>
                          <div className="flex items-center text-muted-foreground">
                            <Users className="h-3 w-3 mr-1" />
                            <span>{suggestion.connectionCount} connections</span>
                          </div>
                        </div>
                        
                        <div className="flex space-x-2">
                          <Button size="sm" className="flex-1">
                            <UserPlus className="mr-1 h-3 w-3" />
                            Connect
                          </Button>
                          <Button size="sm" variant="outline">
                            <Eye className="h-3 w-3" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="discover">
            <Card>
              <CardHeader>
                <CardTitle>Discover Businesses</CardTitle>
                <CardDescription>
                  Search for businesses to connect with using their Business ID
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Business ID Search */}
                  <div className="flex space-x-4">
                    <div className="flex-1">
                      <Input
                        placeholder="Enter Business ID (e.g., BUS-2024-001)"
                        value={newConnection.businessId}
                        onChange={(e) => setNewConnection({...newConnection, businessId: e.target.value})}
                      />
                    </div>
                    <Button onClick={() => setShowConnectModal(true)}>
                      <Search className="mr-2 h-4 w-4" />
                      Search
                    </Button>
                  </div>

                  {/* QR Code Section */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <QrCode className="mr-2 h-5 w-5" />
                        Your Business ID
                      </CardTitle>
                      <CardDescription>
                        Share this Business ID or QR code for others to connect with you
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center space-x-4">
                        <div className="bg-muted p-4 rounded-lg">
                          <QrCode className="h-24 w-24" />
                        </div>
                        <div className="flex-1">
                          <div className="mb-2">
                            <Label className="text-sm font-medium">Business ID</Label>
                            <div className="flex items-center space-x-2 mt-1">
                              <code className="bg-muted px-3 py-2 rounded text-sm font-mono">
                                BUS-2024-001
                              </code>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => copyBusinessId("BUS-2024-001")}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Other businesses can use this ID to send you connection requests
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Browse by Category */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Browse by Category</CardTitle>
                      <CardDescription>
                        Explore businesses in different categories
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                        {["IT Services", "Marketing", "Construction", "Consulting", "Software Development", "Security", "Design", "Other"].map((category) => (
                          <Button
                            key={category}
                            variant="outline"
                            className="justify-start h-auto p-4"
                          >
                            <div className="text-left">
                              <div className="font-medium">{category}</div>
                              <div className="text-sm text-muted-foreground">
                                {Math.floor(Math.random() * 200) + 50} businesses
                              </div>
                            </div>
                          </Button>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Connect Modal */}
      {showConnectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Connect to Business</CardTitle>
              <CardDescription>
                Send a connection request to another business
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="businessId">Business ID *</Label>
                  <Input
                    id="businessId"
                    placeholder="Enter Business ID (e.g., BUS-2024-001)"
                    value={newConnection.businessId}
                    onChange={(e) => setNewConnection({...newConnection, businessId: e.target.value})}
                  />
                </div>
                
                <div>
                  <Label htmlFor="connectionType">Connection Type</Label>
                  <Select value={newConnection.connectionType} onValueChange={(value) => setNewConnection({...newConnection, connectionType: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vendor">Vendor</SelectItem>
                      <SelectItem value="client">Client</SelectItem>
                      <SelectItem value="partner">Partner</SelectItem>
                      <SelectItem value="supplier">Supplier</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="message">Message (Optional)</Label>
                  <Textarea
                    id="message"
                    placeholder="Introduce yourself and explain why you'd like to connect..."
                    value={newConnection.message}
                    onChange={(e) => setNewConnection({...newConnection, message: e.target.value})}
                    rows={3}
                  />
                </div>
                
                <div className="flex space-x-2">
                  <Button onClick={handleConnectRequest} className="flex-1">
                    Send Request
                  </Button>
                  <Button variant="outline" onClick={() => setShowConnectModal(false)}>
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