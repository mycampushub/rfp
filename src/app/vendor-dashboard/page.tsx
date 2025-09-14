"use client"

import { useState, useEffect } from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
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
  Download,
  Upload,
  Users,
  Building,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Star,
  Clock,
  CheckCircle,
  AlertTriangle,
  Bell,
  Settings,
  UserPlus,
  FileText,
  Globe,
  Award,
  Target,
  BarChart3,
  MessageSquare,
  Calendar,
  MapPin,
  Mail,
  Phone,
  Shield,
  Key,
  Activity,
  ArrowRight
} from "lucide-react"
import Link from "next/link"
import { Label } from "@/components/ui/label"

interface VendorProfile {
  id: string
  businessName: string
  description: string
  website: string
  contactInfo: {
    email: string
    phone: string
    address: string
    city: string
    state: string
    country: string
  }
  businessId: string
  categories: string[]
  specialties: string[]
  certifications: string[]
  isVerified: boolean
  rating: number
  completedProjects: number
  memberSince: string
}

interface VendorUser {
  id: string
  name: string
  email: string
  role: string
  permissions: string[]
  lastActive: string
  status: "active" | "inactive" | "pending"
}

interface Invitation {
  id: string
  rfpTitle: string
  organization: string
  budget: string
  deadline: string
  status: "pending" | "accepted" | "declined" | "expired"
  isPublic: boolean
  businessId?: string
  receivedAt: string
}

interface Bid {
  id: string
  rfpTitle: string
  organization: string
  amount: string
  status: "draft" | "submitted" | "under_review" | "awarded" | "rejected"
  submittedAt: string
  deadline: string
}

interface MarketplaceOpportunity {
  id: string
  title: string
  organization: string
  budget: string
  category: string
  deadline: string
  bids: number
  matchScore: number
  isFeatured: boolean
}

export default function VendorDashboard() {
  const [vendorProfile, setVendorProfile] = useState<VendorProfile | null>(null)
  const [vendorUsers, setVendorUsers] = useState<VendorUser[]>([])
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [bids, setBids] = useState<Bid[]>([])
  const [opportunities, setOpportunities] = useState<MarketplaceOpportunity[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  // Mock data for demonstration
  const mockVendorProfile: VendorProfile = {
    id: "1",
    businessName: "Tech Solutions Inc",
    description: "Leading provider of IT services and software development solutions",
    website: "https://techsolutions.com",
    contactInfo: {
      email: "contact@techsolutions.com",
      phone: "+1-555-0123",
      address: "123 Tech St",
      city: "Silicon Valley",
      state: "CA",
      country: "USA"
    },
    businessId: "BUS-2024-001",
    categories: ["IT Services", "Software Development", "Cloud Computing"],
    specialties: ["Cloud Migration", "Web Development", "Mobile Apps", "DevOps"],
    certifications: ["ISO 27001", "SOC 2", "AWS Certified", "Microsoft Partner"],
    isVerified: true,
    rating: 4.8,
    completedProjects: 127,
    memberSince: "2020-01-15"
  }

  const mockVendorUsers: VendorUser[] = [
    {
      id: "1",
      name: "John Smith",
      email: "john@techsolutions.com",
      role: "Admin",
      permissions: ["manage_users", "manage_bids", "view_analytics", "manage_profile"],
      lastActive: "2024-12-10",
      status: "active"
    },
    {
      id: "2",
      name: "Sarah Johnson",
      email: "sarah@techsolutions.com",
      role: "Bid Manager",
      permissions: ["manage_bids", "view_analytics"],
      lastActive: "2024-12-09",
      status: "active"
    },
    {
      id: "3",
      name: "Mike Wilson",
      email: "mike@techsolutions.com",
      role: "Viewer",
      permissions: ["view_analytics"],
      lastActive: "2024-12-05",
      status: "active"
    }
  ]

  const mockInvitations: Invitation[] = [
    {
      id: "1",
      rfpTitle: "Enterprise Cloud Migration Services",
      organization: "TechCorp Inc.",
      budget: "$500,000 - $750,000",
      deadline: "2024-12-30",
      status: "pending",
      isPublic: false,
      businessId: "BUS-2024-002",
      receivedAt: "2024-12-01"
    },
    {
      id: "2",
      rfpTitle: "Digital Marketing Campaign",
      organization: "Global Retail Co.",
      budget: "$100,000 - $200,000",
      deadline: "2024-12-25",
      status: "accepted",
      isPublic: true,
      receivedAt: "2024-11-28"
    },
    {
      id: "3",
      rfpTitle: "Office Building Renovation",
      organization: "Property Management LLC",
      budget: "$250,000 - $400,000",
      deadline: "2025-01-15",
      status: "declined",
      isPublic: true,
      receivedAt: "2024-11-25"
    }
  ]

  const mockBids: Bid[] = [
    {
      id: "1",
      rfpTitle: "E-commerce Platform Development",
      organization: "Retail Giant Inc.",
      amount: "$350,000",
      status: "submitted",
      submittedAt: "2024-12-01",
      deadline: "2024-12-15"
    },
    {
      id: "2",
      rfpTitle: "Mobile App Development",
      organization: "StartupXYZ",
      amount: "$150,000",
      status: "under_review",
      submittedAt: "2024-11-28",
      deadline: "2024-12-10"
    },
    {
      id: "3",
      rfpTitle: "Data Analytics Implementation",
      organization: "DataCorp",
      amount: "$200,000",
      status: "awarded",
      submittedAt: "2024-11-15",
      deadline: "2024-11-30"
    }
  ]

  const mockOpportunities: MarketplaceOpportunity[] = [
    {
      id: "1",
      title: "Cloud Infrastructure Setup",
      organization: "Enterprise Corp",
      budget: "$300,000 - $500,000",
      category: "IT Services",
      deadline: "2024-12-20",
      bids: 5,
      matchScore: 95,
      isFeatured: true
    },
    {
      id: "2",
      title: "Website Redesign",
      organization: "Marketing Agency",
      budget: "$50,000 - $80,000",
      category: "Web Development",
      deadline: "2024-12-18",
      bids: 12,
      matchScore: 88,
      isFeatured: false
    },
    {
      id: "3",
      title: "Security Audit Services",
      organization: "Financial Services Inc",
      budget: "$100,000 - $150,000",
      category: "Security",
      deadline: "2024-12-25",
      bids: 8,
      matchScore: 92,
      isFeatured: true
    }
  ]

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setVendorProfile(mockVendorProfile)
      setVendorUsers(mockVendorUsers)
      setInvitations(mockInvitations)
      setBids(mockBids)
      setOpportunities(mockOpportunities)
      setLoading(false)
    }, 1000)
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
      case "accepted":
      case "submitted":
      case "awarded":
        return "bg-green-100 text-green-800"
      case "pending":
      case "under_review":
        return "bg-yellow-100 text-yellow-800"
      case "declined":
      case "rejected":
        return "bg-red-100 text-red-800"
      case "expired":
      case "inactive":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getMatchScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600"
    if (score >= 80) return "text-blue-600"
    if (score >= 70) return "text-yellow-600"
    return "text-red-600"
  }

  const filteredInvitations = invitations.filter(invitation => {
    const matchesSearch = invitation.rfpTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invitation.organization.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || invitation.status === statusFilter
    return matchesSearch && matchesStatus
  })

  if (loading) {
    return (
      <MainLayout title="Vendor Dashboard">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading vendor dashboard...</div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout title="Vendor Dashboard">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">Vendor Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Welcome back! Manage your vendor activities and opportunities.
            </p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Button>
            <Button asChild>
              <Link href="/marketplace/rfps">
                <Globe className="mr-2 h-4 w-4" />
                Browse Marketplace
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Profile Completion</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">95%</div>
              <p className="text-xs text-muted-foreground">
                {vendorProfile?.isVerified ? "Verified Business" : "Verification Pending"}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Invitations</CardTitle>
              <Mail className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {invitations.filter(i => i.status === "pending").length}
              </div>
              <p className="text-xs text-muted-foreground">
                {invitations.filter(i => i.status === "pending").length} require action
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Bids</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {bids.filter(b => b.status === "submitted" || b.status === "under_review").length}
              </div>
              <p className="text-xs text-muted-foreground">
                {bids.filter(b => b.status === "awarded").length} awarded this month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">78%</div>
              <p className="text-xs text-muted-foreground">
                {vendorProfile?.rating}/5.0 rating
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="invitations">Invitations</TabsTrigger>
            <TabsTrigger value="bids">My Bids</TabsTrigger>
            <TabsTrigger value="marketplace">Marketplace</TabsTrigger>
            <TabsTrigger value="team">Team</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Business Profile Summary */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Building className="mr-2 h-5 w-5" />
                    Business Profile
                  </CardTitle>
                  <CardDescription>
                    Your vendor business information
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold">{vendorProfile?.businessName}</h3>
                        <p className="text-sm text-muted-foreground">{vendorProfile?.description}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {vendorProfile?.isVerified && (
                          <Badge className="bg-blue-100 text-blue-800">
                            <Shield className="mr-1 h-3 w-3" />
                            Verified
                          </Badge>
                        )}
                        <Badge variant="outline">
                          <Star className="mr-1 h-3 w-3" />
                          {vendorProfile?.rating}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <Label className="text-sm font-medium">Business ID</Label>
                        <p className="text-sm text-muted-foreground flex items-center">
                          <Key className="mr-1 h-3 w-3" />
                          {vendorProfile?.businessId}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Member Since</Label>
                        <p className="text-sm text-muted-foreground">
                          {new Date(vendorProfile?.memberSince || "").toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-medium">Categories</Label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {vendorProfile?.categories.map((category, index) => (
                          <Badge key={index} variant="secondary">{category}</Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-medium">Specialties</Label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {vendorProfile?.specialties.map((specialty, index) => (
                          <Badge key={index} variant="outline">{specialty}</Badge>
                        ))}
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      <Button size="sm" asChild>
                        <Link href="/vendor-dashboard/profile">
                          <Edit className="mr-2 h-4 w-4" />
                          Edit Profile
                        </Link>
                      </Button>
                      <Button size="sm" variant="outline">
                        <Download className="mr-2 h-4 w-4" />
                        Export Profile
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>
                    Common vendor tasks
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button className="w-full justify-start" asChild>
                    <Link href="/marketplace/rfps">
                      <Globe className="mr-2 h-4 w-4" />
                      Browse Marketplace
                    </Link>
                  </Button>
                  <Button className="w-full justify-start" asChild>
                    <Link href="/vendor-dashboard/invitations">
                      <Mail className="mr-2 h-4 w-4" />
                      View Invitations
                    </Link>
                  </Button>
                  <Button className="w-full justify-start" asChild>
                    <Link href="/vendor-dashboard/bids">
                      <Target className="mr-2 h-4 w-4" />
                      Manage Bids
                    </Link>
                  </Button>
                  <Button className="w-full justify-start" asChild>
                    <Link href="/vendor-dashboard/team">
                      <Users className="mr-2 h-4 w-4" />
                      Manage Team
                    </Link>
                  </Button>
                  <Button className="w-full justify-start" asChild>
                    <Link href="/vendor-dashboard/analytics">
                      <BarChart3 className="mr-2 h-4 w-4" />
                      View Analytics
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="mr-2 h-5 w-5" />
                  Recent Activity
                </CardTitle>
                <CardDescription>
                  Your latest vendor activities
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 p-3 border rounded-lg">
                    <div className="flex-shrink-0">
                      <Mail className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">New invitation received</p>
                      <p className="text-sm text-muted-foreground">
                        Enterprise Cloud Migration Services from TechCorp Inc.
                      </p>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      2 hours ago
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3 p-3 border rounded-lg">
                    <div className="flex-shrink-0">
                      <Target className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Bid submitted successfully</p>
                      <p className="text-sm text-muted-foreground">
                        E-commerce Platform Development for Retail Giant Inc.
                      </p>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      1 day ago
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3 p-3 border rounded-lg">
                    <div className="flex-shrink-0">
                      <Award className="h-5 w-5 text-yellow-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Project awarded</p>
                      <p className="text-sm text-muted-foreground">
                        Data Analytics Implementation with DataCorp
                      </p>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      3 days ago
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="invitations">
            <Card>
              <CardHeader>
                <CardTitle>RFP Invitations</CardTitle>
                <CardDescription>
                  Manage your private and public RFP invitations
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Filters */}
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search invitations..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8"
                      />
                    </div>
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="accepted">Accepted</SelectItem>
                      <SelectItem value="declined">Declined</SelectItem>
                      <SelectItem value="expired">Expired</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Invitations Table */}
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>RFP Title</TableHead>
                      <TableHead>Organization</TableHead>
                      <TableHead>Budget</TableHead>
                      <TableHead>Deadline</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInvitations.map((invitation) => (
                      <TableRow key={invitation.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{invitation.rfpTitle}</div>
                            {invitation.businessId && (
                              <div className="text-sm text-muted-foreground">
                                Business ID: {invitation.businessId}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{invitation.organization}</TableCell>
                        <TableCell>{invitation.budget}</TableCell>
                        <TableCell>{invitation.deadline}</TableCell>
                        <TableCell>
                          <Badge variant={invitation.isPublic ? "default" : "secondary"}>
                            {invitation.isPublic ? "Public" : "Private"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(invitation.status)}>
                            {invitation.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem asChild>
                                <Link href={`/rfps/${invitation.id}`}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Details
                                </Link>
                              </DropdownMenuItem>
                              {invitation.status === "pending" && (
                                <>
                                  <DropdownMenuItem>
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    Accept
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    <AlertTriangle className="mr-2 h-4 w-4" />
                                    Decline
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
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bids">
            <Card>
              <CardHeader>
                <CardTitle>My Bids</CardTitle>
                <CardDescription>
                  Track your submitted bids and their status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>RFP Title</TableHead>
                      <TableHead>Organization</TableHead>
                      <TableHead>Bid Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead>Deadline</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bids.map((bid) => (
                      <TableRow key={bid.id}>
                        <TableCell>
                          <div className="font-medium">{bid.rfpTitle}</div>
                        </TableCell>
                        <TableCell>{bid.organization}</TableCell>
                        <TableCell>{bid.amount}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(bid.status)}>
                            {bid.status.replace("_", " ")}
                          </Badge>
                        </TableCell>
                        <TableCell>{bid.submittedAt}</TableCell>
                        <TableCell>{bid.deadline}</TableCell>
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
                                <Download className="mr-2 h-4 w-4" />
                                Download Proposal
                              </DropdownMenuItem>
                              {bid.status === "draft" && (
                                <DropdownMenuItem>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit Bid
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

          <TabsContent value="marketplace">
            <Card>
              <CardHeader>
                <CardTitle>Recommended Opportunities</CardTitle>
                <CardDescription>
                  Marketplace opportunities matched to your profile
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {opportunities.map((opportunity) => (
                    <div key={opportunity.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-semibold text-lg">{opportunity.title}</h3>
                          <p className="text-sm text-muted-foreground">{opportunity.organization}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          {opportunity.isFeatured && (
                            <Badge className="bg-yellow-100 text-yellow-800">
                              Featured
                            </Badge>
                          )}
                          <Badge className={getMatchScoreColor(opportunity.matchScore)}>
                            {opportunity.matchScore}% Match
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-3">
                        <span className="flex items-center">
                          <DollarSign className="mr-1 h-3 w-3" />
                          {opportunity.budget}
                        </span>
                        <span className="flex items-center">
                          <Building className="mr-1 h-3 w-3" />
                          {opportunity.category}
                        </span>
                        <span className="flex items-center">
                          <Clock className="mr-1 h-3 w-3" />
                          {opportunity.deadline}
                        </span>
                        <span className="flex items-center">
                          <Users className="mr-1 h-3 w-3" />
                          {opportunity.bids} bids
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <div className="flex flex-wrap gap-1">
                          {vendorProfile?.categories
                            .filter(cat => opportunity.category.includes(cat) || cat.includes(opportunity.category))
                            .map((category, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {category}
                              </Badge>
                            ))}
                        </div>
                        <Button size="sm" asChild>
                          <Link href={`/marketplace/rfps/${opportunity.id}`}>
                            View Details
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-6 text-center">
                  <Button asChild>
                    <Link href="/marketplace/rfps">
                      View All Opportunities
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="team">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Team Management</CardTitle>
                    <CardDescription>
                      Manage users and permissions for your vendor organization
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
                      <TableHead>Permissions</TableHead>
                      <TableHead>Last Active</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vendorUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="font-medium">{user.name}</div>
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{user.role}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {user.permissions.slice(0, 2).map((permission, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {permission.replace("_", " ")}
                              </Badge>
                            ))}
                            {user.permissions.length > 2 && (
                              <Badge variant="secondary" className="text-xs">
                                +{user.permissions.length - 2} more
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{user.lastActive}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(user.status)}>
                            {user.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Permissions
                              </DropdownMenuItem>
                              {user.status === "active" && (
                                <DropdownMenuItem>
                                  <AlertTriangle className="mr-2 h-4 w-4" />
                                  Deactivate
                                </DropdownMenuItem>
                              )}
                              {user.status === "inactive" && (
                                <DropdownMenuItem>
                                  <CheckCircle className="mr-2 h-4 w-4" />
                                  Activate
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

          <TabsContent value="analytics">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Performance Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart3 className="mr-2 h-5 w-5" />
                    Performance Metrics
                  </CardTitle>
                  <CardDescription>
                    Your vendor performance statistics
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Win Rate</span>
                      <span className="font-semibold">78%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Average Response Time</span>
                      <span className="font-semibold">2.3 days</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Total Projects Completed</span>
                      <span className="font-semibold">{vendorProfile?.completedProjects}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Client Satisfaction</span>
                      <span className="font-semibold">{vendorProfile?.rating}/5.0</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>On-Time Delivery</span>
                      <span className="font-semibold">94%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Bid Activity */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Target className="mr-2 h-5 w-5" />
                    Bid Activity
                  </CardTitle>
                  <CardDescription>
                    Your bidding activity this month
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Bids Submitted</span>
                      <span className="font-semibold">12</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Bids Under Review</span>
                      <span className="font-semibold">3</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Bids Awarded</span>
                      <span className="font-semibold">2</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Total Value (Awarded)</span>
                      <span className="font-semibold">$550,000</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Success Rate</span>
                      <span className="font-semibold">16.7%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Category Performance */}
              <Card>
                <CardHeader>
                  <CardTitle>Performance by Category</CardTitle>
                  <CardDescription>
                    Success rates across different service categories
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span>IT Services</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div className="bg-blue-600 h-2 rounded-full" style={{ width: "85%" }}></div>
                        </div>
                        <span className="text-sm font-medium">85%</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Software Development</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div className="bg-green-600 h-2 rounded-full" style={{ width: "92%" }}></div>
                        </div>
                        <span className="text-sm font-medium">92%</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Cloud Computing</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div className="bg-purple-600 h-2 rounded-full" style={{ width: "78%" }}></div>
                        </div>
                        <span className="text-sm font-medium">78%</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Revenue Trends */}
              <Card>
                <CardHeader>
                  <CardTitle>Revenue Trends</CardTitle>
                  <CardDescription>
                    Monthly revenue from awarded projects
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span>This Month</span>
                      <span className="font-semibold text-green-600">$125,000</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Last Month</span>
                      <span className="font-semibold">$98,000</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>3 Months Ago</span>
                      <span className="font-semibold">$87,000</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>6 Months Ago</span>
                      <span className="font-semibold">$76,000</span>
                    </div>
                    <div className="pt-2 border-t">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Growth Trend</span>
                        <div className="flex items-center text-green-600">
                          <TrendingUp className="h-4 w-4 mr-1" />
                          <span className="font-medium">+27.6%</span>
                        </div>
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