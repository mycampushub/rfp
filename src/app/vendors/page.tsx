"use client"

import { useState, useEffect } from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
  Users
} from "lucide-react"
import Link from "next/link"

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
              Manage your vendor directory and relationships
            </p>
          </div>
          <Button asChild>
            <Link href="/vendors/create">
              <Plus className="mr-2 h-4 w-4" />
              Add Vendor
            </Link>
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
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
                  <TableHead>Categories</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Diversity</TableHead>
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
                      <div className="flex flex-wrap gap-1">
                        {getDiversityBadges(vendor.diversityAttrs).map((badge) => (
                          <Badge key={badge.label} className={badge.color}>
                            {badge.label}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm space-y-1">
                        <div>{vendor._count.invitations} invitations</div>
                        <div>{vendor._count.submissions} submissions</div>
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
                              View
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/vendors/${vendor.id}/edit`}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
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
      </div>
    </MainLayout>
  )
}