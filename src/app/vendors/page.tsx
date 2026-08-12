"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { MainLayout } from "@/components/layout/main-layout"
import { EmptyState } from "@/components/shared/empty-state"
import { LoadingCards } from "@/components/shared/loading-table"
import { getPrequalificationColor, getScoreColor } from "@/lib/status-utils"
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Search, Filter, Plus, MoreHorizontal, Eye, Edit, Trash2, Building, Building2, Mail, Phone, Award, Users, Star, TrendingUp, TrendingDown, CheckCircle, Upload, Download } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { formatDate } from "@/lib/utils"

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
  useEffect(() => { document.title = 'Vendors | RFP Platform' }, [])
  const router = useRouter()
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [deleteTarget, setDeleteTarget] = useState<Vendor | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const fetchVendors = async () => {
      try {
        const res = await fetch('/api/vendors')
        if (!res.ok) throw new Error('Failed to fetch vendors')
        const data = await res.json()
        const mapped: Vendor[] = (Array.isArray(data) ? data : []).map((v: any) => ({
          id: v.id,
          name: v.name,
          contactInfo: v.contactInfo || undefined,
          categories: v.categories || [],
          certifications: v.certifications || [],
          diversityAttrs: v.diversityAttrs || undefined,
          isActive: v.isActive ?? true,
          createdAt: v.createdAt,
          _count: {
            invitations: v._count?.invitations || 0,
            submissions: v._count?.submissions || 0,
          },
        }))
        setVendors(mapped)
      } catch (err) {
        console.error(err)
        toast.error('Failed to load vendors')
      } finally {
        setLoading(false)
      }
    }
    fetchVendors()
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
      badges.push({ label: "Minority Owned", color: "bg-sky-500/15 text-sky-700 dark:text-sky-300" })
    }
    if (diversityAttrs?.isWomenOwned) {
      badges.push({ label: "Women Owned", color: "bg-pink-500/15 text-pink-700 dark:text-pink-300" })
    }
    if (diversityAttrs?.isVeteranOwned) {
      badges.push({ label: "Veteran Owned", color: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" })
    }
    if (diversityAttrs?.isDisabilityOwned) {
      badges.push({ label: "Disability Owned", color: "bg-violet-500/15 text-violet-700 dark:text-violet-300" })
    }
    
    return badges
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up":
        return <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
      case "down":
        return <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
      default:
        return <Star className="h-4 w-4 text-muted-foreground/80" />
    }
  }

  if (loading) {
    return (
      <MainLayout title="Vendors">
        <LoadingCards count={6} />
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
            <input
              type="file"
              accept=".csv"
              ref={fileInputRef}
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0]
                if (!file) return
                try {
                  const text = await file.text()
                  const rawRows = text.trim().split('\n')
                  if (rawRows.length < 2) { toast.error('CSV file is empty'); return }

                  // Robust CSV parser that handles quoted fields
                  function parseCsvLine(line: string): string[] {
                    const fields: string[] = []
                    const regex = /(?:"([^"]*)"|([^,]*))/g
                    let match: RegExpExecArray | null
                    while ((match = regex.exec(line)) !== null) {
                      fields.push((match[1] !== undefined ? match[1] : match[2]).trim())
                    }
                    return fields
                  }

                  const headers = parseCsvLine(rawRows[0]).map(h => h.toLowerCase())
                  const dataRows = rawRows.slice(1)

                  // Build vendor payloads
                  const payloads: object[] = []
                  for (const row of dataRows) {
                    if (!row.trim()) continue
                    const values = parseCsvLine(row)
                    const name = values[headers.indexOf('name')] || values[0]
                    if (!name) continue
                    const email = values[headers.indexOf('email')] || values[1]
                    const phone = values[headers.indexOf('phone')] || ''
                    const body: any = { name }
                    if (email || phone) {
                      body.contactInfo = {}
                      if (email) body.contactInfo.email = email
                      if (phone) body.contactInfo.phone = phone
                    }
                    payloads.push(body)
                  }

                  // Process in batches of 15 with 100ms delay between batches
                  const BATCH_SIZE = 15
                  const BATCH_DELAY_MS = 100
                  let imported = 0
                  for (let i = 0; i < payloads.length; i += BATCH_SIZE) {
                    const batch = payloads.slice(i, i + BATCH_SIZE)
                    const results = await Promise.allSettled(
                      batch.map(body =>
                        fetch('/api/vendors', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify(body),
                        }).then(res => res.ok ? 1 : 0)
                      )
                    )
                    imported += results.reduce((sum, r) => sum + (r.status === 'fulfilled' ? r.value : 0), 0)
                    if (i + BATCH_SIZE < payloads.length) {
                      await new Promise(resolve => setTimeout(resolve, BATCH_DELAY_MS))
                    }
                  }
                  if (imported > 0) {
                    toast.success(`Successfully imported ${imported} vendor(s)`)
                    const vendorsRes = await fetch('/api/vendors')
                    if (vendorsRes.ok) {
                      const data = await vendorsRes.json()
                      const mapped: Vendor[] = (Array.isArray(data) ? data : []).map((v: any) => ({
                        id: v.id, name: v.name, contactInfo: v.contactInfo || undefined,
                        categories: v.categories || [], certifications: v.certifications || [],
                        diversityAttrs: v.diversityAttrs || undefined, isActive: v.isActive ?? true,
                        createdAt: v.createdAt, _count: { invitations: v._count?.invitations || 0, submissions: v._count?.submissions || 0 },
                      }))
                      setVendors(mapped)
                    }
                  } else { toast.error('No vendors were imported') }
                } catch { toast.error('Failed to parse CSV file') }
                e.target.value = ''
              }}
            />
            <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
              <Upload className="mr-2 h-4 w-4" />
              Import Vendors
            </Button>
            <Button variant="outline" onClick={() => {
              if (vendors.length === 0) { toast.info('No vendors to export'); return }
              const headers = ['Name','Email','Phone','Categories','Active','Created']
              const rows = vendors.map(v => [
                v.name,
                v.contactInfo?.email || '',
                v.contactInfo?.phone || '',
                (v.categories || []).join('; '),
                v.isActive ? 'Yes' : 'No',
                formatDate(v.createdAt),
              ].map(field => `"${field}"`).join(','))
              const csv = [headers.join(','), ...rows].join('\n')
              const blob = new Blob([csv], { type: 'text/csv' })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url; a.download = 'vendor-export.csv'; a.click()
              URL.revokeObjectURL(url)
              toast.success('Vendor data exported successfully')
            }}>
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Button asChild>
              <Link href="/marketplace/vendors/register">
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
                <div className="overflow-x-auto">
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
                              Added: {formatDate(vendor.createdAt)}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {vendor.performance ? (
                            <div className="flex items-center space-x-2">
                              <div className={`font-bold ${getScoreColor(vendor.performance.overallScore)}`}>
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
                              <Button variant="ghost" className="h-8 w-8 p-0" aria-label="Vendor actions">
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
                              <DropdownMenuItem className="text-red-600 dark:text-red-400" onClick={() => setDeleteTarget(vendor)}>
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
                </div>
                
                {filteredVendors.length === 0 && (
                  <EmptyState icon={Building2} title="No vendors found" description="Add your first vendor or import from a CSV file." action={{ label: "Add Vendor", onClick: () => router.push('/marketplace/vendors/register') }} />
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
                          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                            {vendors.filter(v => v.prequalification?.status === "approved").length}
                          </div>
                          <p className="text-sm text-muted-foreground">Approved</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                            {vendors.filter(v => v.prequalification?.status === "pending").length}
                          </div>
                          <p className="text-sm text-muted-foreground">Pending</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-muted-foreground/80">
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
                          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                            {vendors.length > 0 ? Math.round(vendors.filter(v => v.performance?.overallScore && v.performance.overallScore >= 90).length / vendors.length * 100) : 0}%
                          </div>
                          <p className="text-sm text-muted-foreground">High Performers</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-sky-600 dark:text-sky-400">
                            {vendors.filter(v => v.performance?.trend === "up").length}
                          </div>
                          <p className="text-sm text-muted-foreground">Improving</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                            {vendors.filter(v => v.performance?.trend === "stable").length}
                          </div>
                          <p className="text-sm text-muted-foreground">Stable</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-red-600 dark:text-red-400">
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
                      const percentage = vendors.length > 0 ? (count / vendors.length) * 100 : 0
                      return (
                        <div key={category} className="space-y-2">
                          <div className="flex justify-between">
                            <span className="font-medium">{category}</span>
                            <span className="text-sm text-muted-foreground">{count} vendors</span>
                          </div>
                          <div className="w-full bg-muted-foreground/20 rounded-full h-2">
                            <div 
                              className="bg-sky-500 h-2 rounded-full"
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
                      <div className="w-full bg-muted-foreground/20 rounded-full h-2">
                        <div 
                          className="bg-emerald-500 h-2 rounded-full"
                          style={{ 
                            width: `${vendors.length > 0 ? (vendors.filter(v => v.prequalification?.status === "approved").length / vendors.length) * 100 : 0}%` 
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
                      <div className="w-full bg-muted-foreground/20 rounded-full h-2">
                        <div 
                          className="bg-amber-500 h-2 rounded-full"
                          style={{ 
                            width: `${vendors.length > 0 ? (vendors.filter(v => v.prequalification?.status === "pending").length / vendors.length) * 100 : 0}%` 
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
                      <div className="w-full bg-muted-foreground/20 rounded-full h-2">
                        <div 
                          className="bg-muted-foreground/80 h-2 rounded-full"
                          style={{ 
                            width: `${vendors.length > 0 ? (vendors.filter(v => !v.prequalification).length / vendors.length) * 100 : 0}%` 
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Vendor</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteTarget?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-800"
              onClick={async () => {
                if (!deleteTarget) return
                try {
                  const res = await fetch(`/api/vendors/${deleteTarget.id}`, { method: 'DELETE' })
                  if (res.ok) {
                    setVendors(prev => prev.filter(v => v.id !== deleteTarget.id))
                    toast.success(`Vendor "${deleteTarget.name}" deleted successfully`)
                  } else {
                    toast.error('Failed to delete vendor')
                  }
                } catch { toast.error('Failed to delete vendor') }
                setDeleteTarget(null)
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  )
}