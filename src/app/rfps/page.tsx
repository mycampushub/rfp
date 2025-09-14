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
  Calendar,
  DollarSign,
  Users,
  FileText
} from "lucide-react"
import Link from "next/link"

interface RFP {
  id: string
  title: string
  status: "draft" | "published" | "closed" | "awarded" | "archived"
  category?: string
  budget?: string
  publishAt?: string
  closeAt?: string
  responseCount: number
  createdAt: string
}

export default function RFPsPage() {
  const [rfps, setRfps] = useState<RFP[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")

  // Mock data for demonstration
  const mockRfps: RFP[] = [
    {
      id: "1",
      title: "IT Managed Services 2024",
      status: "published",
      category: "IT Services",
      budget: "$250,000",
      publishAt: "2024-11-01",
      closeAt: "2024-12-15",
      responseCount: 8,
      createdAt: "2024-10-15"
    },
    {
      id: "2",
      title: "Marketing Campaign Services",
      status: "draft",
      category: "Marketing",
      budget: "$100,000",
      responseCount: 0,
      createdAt: "2024-10-20"
    },
    {
      id: "3",
      title: "Office Equipment Procurement",
      status: "evaluation",
      category: "Office Supplies",
      budget: "$75,000",
      publishAt: "2024-10-10",
      closeAt: "2024-12-10",
      responseCount: 12,
      createdAt: "2024-10-01"
    },
    {
      id: "4",
      title: "Construction Services",
      status: "closed",
      category: "Construction",
      budget: "$500,000",
      publishAt: "2024-09-01",
      closeAt: "2024-10-31",
      responseCount: 15,
      createdAt: "2024-08-15"
    },
    {
      id: "5",
      title: "Consulting Services",
      status: "awarded",
      category: "Consulting",
      budget: "$150,000",
      publishAt: "2024-08-15",
      closeAt: "2024-09-30",
      responseCount: 6,
      createdAt: "2024-07-20"
    }
  ]

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setRfps(mockRfps)
      setLoading(false)
    }, 1000)
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "published":
        return "bg-green-100 text-green-800"
      case "draft":
        return "bg-gray-100 text-gray-800"
      case "evaluation":
        return "bg-blue-100 text-blue-800"
      case "closed":
        return "bg-red-100 text-red-800"
      case "awarded":
        return "bg-purple-100 text-purple-800"
      case "archived":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const filteredRfps = rfps.filter(rfp => {
    const matchesSearch = rfp.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (rfp.category && rfp.category.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesStatus = statusFilter === "all" || rfp.status === statusFilter
    const matchesCategory = categoryFilter === "all" || rfp.category === categoryFilter
    
    return matchesSearch && matchesStatus && matchesCategory
  })

  const categories = Array.from(new Set(rfps.map(rfp => rfp.category).filter(Boolean)))

  if (loading) {
    return (
      <MainLayout title="RFPs">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading RFPs...</div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout title="RFPs">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Requests for Proposal</h1>
            <p className="text-muted-foreground">
              Manage and track all your RFPs in one place
            </p>
          </div>
          <Button asChild>
            <Link href="/rfps/create">
              <Plus className="mr-2 h-4 w-4" />
              Create New RFP
            </Link>
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total RFPs</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{rfps.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Published</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{rfps.filter(r => r.status === "published").length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Responses</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{rfps.reduce((sum, r) => sum + r.responseCount, 0)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {rfps.filter(r => r.budget).length}
              </div>
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
                    placeholder="Search RFPs..."
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
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="evaluation">In Evaluation</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                  <SelectItem value="awarded">Awarded</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
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

        {/* RFP Table */}
        <Card>
          <CardHeader>
            <CardTitle>RFP List</CardTitle>
            <CardDescription>
              {filteredRfps.length} RFP{filteredRfps.length !== 1 ? 's' : ''} found
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Budget</TableHead>
                  <TableHead>Responses</TableHead>
                  <TableHead>Deadline</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRfps.map((rfp) => (
                  <TableRow key={rfp.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{rfp.title}</div>
                        <div className="text-sm text-muted-foreground">
                          Created: {new Date(rfp.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(rfp.status)}>
                        {rfp.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{rfp.category || "-"}</TableCell>
                    <TableCell>{rfp.budget || "-"}</TableCell>
                    <TableCell>{rfp.responseCount}</TableCell>
                    <TableCell>
                      {rfp.closeAt ? new Date(rfp.closeAt).toLocaleDateString() : "-"}
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
                            <Link href={`/rfps/${rfp.id}`}>
                              <Eye className="mr-2 h-4 w-4" />
                              View
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/rfps/${rfp.id}/edit`}>
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
            
            {filteredRfps.length === 0 && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No RFPs found matching your filters.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}