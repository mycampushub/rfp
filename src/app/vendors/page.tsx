"use client"

import { useState, useEffect } from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { 
  Search, 
  Filter, 
  Plus, 
  MoreHorizontal, 
  Eye, 
  Edit, 
  Trash2,
  Building,
  Mail,
  Phone,
  Award,
  Users,
  Star,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  AlertTriangle,
  Upload,
  Download
} from "lucide-react"
import Link from "next/link"
import { VendorPrequalification } from "@/components/vendors/vendor-prequalification"
import { VendorPerformance } from "@/components/vendors/vendor-performance"

interface Vendor {
  id: string
  name: string
  contactInfo?: {
    email?: string
    phone?: string
    address?: string
  }
  categories?: string[]
  certifications?: string[]
  diversityAttrs?: {
    isMinorityOwned?: boolean
    isWomenOwned?: boolean
    isVeteranOwned?: boolean
    isDisabilityOwned?: boolean
  }
  isActive: boolean
  createdAt: string
  performance?: {
    overallScore: number
    onTimeDelivery: number
    qualityScore: number
    budgetAdherence: number
    projectsCompleted: number
    lastProjectDate?: string
    trend: "up" | "down" | "stable"
  }
  prequalification?: {
    status: "pending" | "approved" | "rejected" | "expired"
    score?: number
    expiryDate?: string
  }
  _count: {
    invitations: number
    submissions: number
  }
}

export default function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")

  // Mock data for demonstration
  const mockVendors: Vendor[] = [
    {
      id: "1",
      name: "Tech Solutions Inc",
      contactInfo: {
        email: "contact@techsolutions.com",
        phone: "+1-555-0123",
        address: "123 Tech St, Silicon Valley, CA 94000"
      },
      categories: ["IT Services", "Software Development"],
      certifications: ["ISO 27001", "SOC 2"],
      diversityAttrs: {
        isMinorityOwned: true,
        isVeteranOwned: false
      },
      isActive: true,
      createdAt: "2024-01-15",
      performance: {
        overallScore: 92,
        onTimeDelivery: 95,
        qualityScore: 94,
        budgetAdherence: 88,
        projectsCompleted: 8,
        lastProjectDate: "2024-11-15",
        trend: "up"
      },
      prequalification: {
        status: "approved",
        score: 85,
        expiryDate: "2025-12-31"
      },
      _count: {
        invitations: 5,
        submissions: 3
      }
    },
    {
      id: "2",
      name: "Global IT Services",
      contactInfo: {
        email: "info@globalit.com",
        phone: "+1-555-0456",
        address: "456 Global Ave, New York, NY 10001"
      },
      categories: ["IT Services", "Cloud Computing"],
      certifications: ["ISO 9001", "CMMI Level 3"],
      diversityAttrs: {
        isWomenOwned: true,
        isMinorityOwned: false
      },
      isActive: true,
      createdAt: "2024-02-01",
      performance: {
        overallScore: 88,
        onTimeDelivery: 90,
        qualityScore: 92,
        budgetAdherence: 85,
        projectsCompleted: 12,
        lastProjectDate: "2024-12-01",
        trend: "stable"
      },
      prequalification: {
        status: "approved",
        score: 78,
        expiryDate: "2025-06-30"
      },
      _count: {
        invitations: 8,
        submissions: 6
      }
    },
    {
      id: "3",
      name: "Digital Dynamics",
      contactInfo: {
        email: "hello@digitaldynamics.com",
        phone: "+1-555-0789",
        address: "789 Digital Way, Austin, TX 73301"
      },
      categories: ["Digital Marketing", "Web Development"],
      certifications: ["Google Partner", "HubSpot Certified"],
      diversityAttrs: {
        isDisabilityOwned: true,
        isMinorityOwned: false
      },
      isActive: true,
      createdAt: "2024-02-15",
      performance: {
        overallScore: 76,
        onTimeDelivery: 82,
        qualityScore: 78,
        budgetAdherence: 70,
        projectsCompleted: 4,
        lastProjectDate: "2024-10-20",
        trend: "down"
      },
      prequalification: {
        status: "pending",
        score: 0
      },
      _count: {
        invitations: 3,
        submissions: 2
      }
    },
    {
      id: "4",
      name: "Construction Pro",
      contactInfo: {
        email: "projects@constructionpro.com",
        phone: "+1-555-0321",
        address: "321 Build Rd, Chicago, IL 60601"
      },
      categories: ["Construction", "Renovation"],
      certifications: ["LEED Certified", "OSHA Compliant"],
      diversityAttrs: {
        isVeteranOwned: true,
        isWomenOwned: false
      },
      isActive: true,
      createdAt: "2024-03-01",
      performance: {
        overallScore: 95,
        onTimeDelivery: 98,
        qualityScore: 96,
        budgetAdherence: 92,
        projectsCompleted: 15,
        lastProjectDate: "2024-12-10",
        trend: "up"
      },
      prequalification: {
        status: "approved",
        score: 92,
        expiryDate: "2025-09-30"
      },
      _count: {
        invitations: 4,
        submissions: 4
      }
    }
  ]

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setVendors(mockVendors)
      setLoading(false)
    }, 1000)
  }, [])

  const filteredVendors = vendors.filter(vendor => {
    const matchesSearch = vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (vendor.contactInfo?.email && vendor.contactInfo.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (vendor.categories && vendor.categories.some(cat => cat.toLowerCase().includes(searchTerm.toLowerCase())))
    const matchesCategory = categoryFilter === "all" || 
                           (vendor.categories && vendor.categories.includes(categoryFilter))
    
    return matchesSearch && matchesCategory
  })

  const categories = Array.from(new Set(vendors.flatMap(v => v.categories || [])))

  const getDiversityBadges = (diversityAttrs?: Vendor["diversityAttrs"]) => {
    const badges = []
    
    if (diversityAttrs?.isMinorityOwned) {
      badges.push({ label: "Minority Owned", color: "bg-blue-100 text-blue-800" })
    }
    if (diversityAttrs?.isWomenOwned) {
      badges.push({ label: "Women Owned", color: "bg-pink-100 text-pink-800" })
    }
    if (diversityAttrs?.isVeteranOwned) {
      badges.push({ label: "Veteran Owned", color: "bg-green-100 text-green-800" })
    }
    if (diversityAttrs?.isDisabilityOwned) {
      badges.push({ label: "Disability Owned", color: "bg-purple-100 text-purple-800" })
    }
    
    return badges
  }

  const getPerformanceColor = (score: number) => {
    if (score >= 90) return "text-green-600"
    if (score >= 80) return "text-blue-600"
    if (score >= 70) return "text-yellow-600"
    return "text-red-600"
  }

  const getPrequalificationColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "rejected":
        return "bg-red-100 text-red-800"
      case "expired":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up":
        return <TrendingUp className="h-4 w-4 text-green-600" />
      case "down":
        return <TrendingDown className="h-4 w-4 text-red-600" />
      default:
        return <Star className="h-4 w-4 text-gray-600" />
    }
  }

  if (loading) {
    return (
      <MainLayout title="Vendors">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading vendors...</div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout title="Vendors">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Vendor Management</h1>
            <p className="text-muted-foreground">
              Manage your vendor directory, performance, and prequalification
            </p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline">
              <Upload className="mr-2 h-4 w-4" />
              Import Vendors
            </Button>
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Button asChild>
              <Link href="/vendors/create">
                <Plus className="mr-2 h-4 w-4" />
                Add Vendor
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Vendors</CardTitle>
              <Building className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{vendors.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Vendors</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{vendors.filter(v => v.isActive).length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Prequalified</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {vendors.filter(v => v.prequalification?.status === "approved").length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Performance</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {vendors.filter(v => v.performance).length > 0 
                  ? Math.round(vendors.filter(v => v.performance).reduce((sum, v) => sum + (v.performance?.overallScore || 0), 0) / vendors.filter(v => v.performance).length)
                  : 0}%
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Invitations</CardTitle>
              <Mail className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{vendors.reduce((sum, v) => sum + v._count.invitations, 0)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Submissions</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{vendors.reduce((sum, v) => sum + v._count.submissions, 0)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="directory" className="space-y-4">
          <TabsList>
            <TabsTrigger value="directory">Vendor Directory</TabsTrigger>
            <TabsTrigger value="prequalification">Prequalification</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="directory">
            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Filter className="mr-2 h-4 w-4" />
                  Filters
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search vendors..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8"
                      />
                    </div>
                  </div>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map(category => (
                        <SelectItem key={category} value={category}>{category}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Vendor Table */}
            <Card>
              <CardHeader>
                <CardTitle>Vendor Directory</CardTitle>
                <CardDescription>
                  {filteredVendors.length} vendor{filteredVendors.length !== 1 ? 's' : ''} found
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Vendor</TableHead>
                      <TableHead>Performance</TableHead>
                      <TableHead>Prequalification</TableHead>
                      <TableHead>Categories</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Activity</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredVendors.map((vendor) => (
                      <TableRow key={vendor.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{vendor.name}</div>
                            <div className="text-sm text-muted-foreground">
                              Added: {new Date(vendor.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {vendor.performance ? (
                            <div className="flex items-center space-x-2">
                              <div className={`font-bold ${getPerformanceColor(vendor.performance.overallScore)}`}>
                                {vendor.performance.overallScore}%
                              </div>
                              {getTrendIcon(vendor.performance.trend)}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {vendor.prequalification ? (
                            <Badge className={getPrequalificationColor(vendor.prequalification.status)}>
                              {vendor.prequalification.status.replace("_", " ")}
                              {vendor.prequalification.score && ` (${vendor.prequalification.score}%)`}
                            </Badge>
                          ) : (
                            <Badge variant="outline">Not Started</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {vendor.categories?.map((category) => (
                              <Badge key={category} variant="outline" className="text-xs">
                                {category}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {vendor.contactInfo?.email && (
                              <div className="flex items-center text-sm">
                                <Mail className="mr-1 h-3 w-3" />
                                {vendor.contactInfo.email}
                              </div>
                            )}
                            {vendor.contactInfo?.phone && (
                              <div className="flex items-center text-sm text-muted-foreground">
                                <Phone className="mr-1 h-3 w-3" />
                                {vendor.contactInfo.phone}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm space-y-1">
                            <div>{vendor._count.invitations} invitations</div>
                            <div>{vendor._count.submissions} submissions</div>
                            {vendor.performance?.projectsCompleted && (
                              <div>{vendor.performance.projectsCompleted} projects</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link href={`/vendors/${vendor.id}`}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Details
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link href={`/vendors/${vendor.id}/edit`}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link href={`/vendors/${vendor.id}/performance`}>
                                  <Star className="mr-2 h-4 w-4" />
                                  Performance
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link href={`/vendors/${vendor.id}/prequalify`}>
                                  <CheckCircle className="mr-2 h-4 w-4" />
                                  Prequalify
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-red-600">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                
                {filteredVendors.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No vendors found matching your filters.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="prequalification">
            <Card>
              <CardHeader>
                <CardTitle>Vendor Prequalification Management</CardTitle>
                <CardDescription>
                  Manage vendor prequalification status and processes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Prequalification Dashboard</h3>
                  <p className="text-muted-foreground mb-4">
                    View and manage vendor prequalification processes
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">
                            {vendors.filter(v => v.prequalification?.status === "approved").length}
                          </div>
                          <p className="text-sm text-muted-foreground">Approved</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-yellow-600">
                            {vendors.filter(v => v.prequalification?.status === "pending").length}
                          </div>
                          <p className="text-sm text-muted-foreground">Pending</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-gray-600">
                            {vendors.filter(v => !v.prequalification).length}
                          </div>
                          <p className="text-sm text-muted-foreground">Not Started</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance">
            <Card>
              <CardHeader>
                <CardTitle>Vendor Performance Tracking</CardTitle>
                <CardDescription>
                  Monitor vendor performance metrics and trends
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Performance Analytics</h3>
                  <p className="text-muted-foreground mb-4">
                    Track vendor performance across key metrics
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">
                            {Math.round(vendors.filter(v => v.performance?.overallScore && v.performance.overallScore >= 90).length / vendors.length * 100)}%
                          </div>
                          <p className="text-sm text-muted-foreground">High Performers</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">
                            {vendors.filter(v => v.performance?.trend === "up").length}
                          </div>
                          <p className="text-sm text-muted-foreground">Improving</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-yellow-600">
                            {vendors.filter(v => v.performance?.trend === "stable").length}
                          </div>
                          <p className="text-sm text-muted-foreground">Stable</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-red-600">
                            {vendors.filter(v => v.performance?.trend === "down").length}
                          </div>
                          <p className="text-sm text-muted-foreground">Declining</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Vendor Distribution by Category</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {categories.map(category => {
                      const count = vendors.filter(v => v.categories?.includes(category)).length
                      const percentage = (count / vendors.length) * 100
                      return (
                        <div key={category} className="space-y-2">
                          <div className="flex justify-between">
                            <span className="font-medium">{category}</span>
                            <span className="text-sm text-muted-foreground">{count} vendors</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Prequalification Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="font-medium">Approved</span>
                        <span className="text-sm text-muted-foreground">
                          {vendors.filter(v => v.prequalification?.status === "approved").length}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full"
                          style={{ 
                            width: `${(vendors.filter(v => v.prequalification?.status === "approved").length / vendors.length) * 100}%` 
                          }}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="font-medium">Pending</span>
                        <span className="text-sm text-muted-foreground">
                          {vendors.filter(v => v.prequalification?.status === "pending").length}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-yellow-600 h-2 rounded-full"
                          style={{ 
                            width: `${(vendors.filter(v => v.prequalification?.status === "pending").length / vendors.length) * 100}%` 
                          }}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="font-medium">Not Started</span>
                        <span className="text-sm text-muted-foreground">
                          {vendors.filter(v => !v.prequalification).length}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-gray-600 h-2 rounded-full"
                          style={{ 
                            width: `${(vendors.filter(v => !v.prequalification).length / vendors.length) * 100}%` 
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  )
}