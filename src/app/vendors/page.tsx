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
import { useCsvExport } from "@/hooks/use-csv-export"
import { Search, Filter, Plus, MoreHorizontal, Eye, Edit, Trash2, Building, Building2, Mail, Phone, Award, Users, Star, TrendingUp, TrendingDown, CheckCircle, Upload, Download, Loader2 } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { formatDate } from "@/lib/utils"

interface Vendor {
  id: string
  name: string
  verified?: boolean
  contactInfo?: {
    email?: string
    phone?: string
    address?: string
    taxId?: string
    insurance?: string
    licenseNumber?: string
    ndaSigned?: boolean
    backgroundCheck?: boolean
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
    contracts: number
  }
}

export default function VendorsPage() {
  useEffect(() => { document.title = 'Vendors | RFP Platform' }, [])
  const router = useRouter()
  const { exportCsv, exporting } = useCsvExport()
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
          verified: v.verified ?? false,
          contactInfo: v.contactInfo || undefined,
          categories: v.categories || [],
          certifications: v.certifications || [],
          diversityAttrs: v.diversityAttrs || undefined,
          isActive: v.isActive ?? true,
          createdAt: v.createdAt,
          _count: {
            invitations: v._count?.invitations || 0,
            submissions: v._count?.submissions || 0,
            contracts: v._count?.contracts || 0,
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

  const _getDiversityBadges = (diversityAttrs?: Vendor["diversityAttrs"]) => {
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
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:justify-between sm:items-center">
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
                        id: v.id, name: v.name, verified: v.verified ?? false, contactInfo: v.contactInfo || undefined,
                        categories: v.categories || [], certifications: v.certifications || [],
                        diversityAttrs: v.diversityAttrs || undefined, isActive: v.isActive ?? true,
                        createdAt: v.createdAt, _count: { invitations: v._count?.invitations || 0, submissions: v._count?.submissions || 0, contracts: v._count?.contracts || 0 },
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
            <Button
              variant="outline"
              disabled={exporting}
              onClick={() => {
                const date = new Date().toISOString().slice(0, 10)
                exportCsv('/api/export/vendors?format=csv', `vendors-export-${date}.csv`)
              }}
            >
              {exporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
              Export CSV
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
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Vendor Prequalification Management</CardTitle>
                  <CardDescription>
                    Review vendor verification status, compliance, and start prequalification processes
                  </CardDescription>
                </CardHeader>
              </Card>
              {vendors.length === 0 ? (
                <Card>
                  <CardContent className="py-12">
                    <EmptyState icon={CheckCircle} title="No vendors found" description="Add vendors to manage their prequalification status." />
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {vendors.map((vendor) => (
                    <Card key={vendor.id}>
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-2">
                          <CardTitle className="text-base font-semibold truncate">{vendor.name}</CardTitle>
                          <Badge className={vendor.verified
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 shrink-0"
                            : "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 shrink-0"
                          }>
                            {vendor.verified ? 'Verified' : 'Not Verified'}
                          </Badge>
                        </div>
                        <CardDescription className="text-xs">
                          Added {formatDate(vendor.createdAt)}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {/* Prequalification Status */}
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Prequalification</span>
                          {vendor.prequalification ? (
                            <Badge className={getPrequalificationColor(vendor.prequalification.status)}>
                              {vendor.prequalification.status.replace("_", " ")}
                            </Badge>
                          ) : (
                            <Badge variant="outline">Not Started</Badge>
                          )}
                        </div>
                        {/* Compliance Fields */}
                        <div className="space-y-2">
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Compliance</p>
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">Tax ID</span>
                              <span className={vendor.contactInfo?.taxId ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}>
                                {vendor.contactInfo?.taxId ? 'On file' : 'Missing'}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">Insurance</span>
                              <span className={vendor.contactInfo?.insurance ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}>
                                {vendor.contactInfo?.insurance ? 'On file' : 'Missing'}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">License</span>
                              <span className={vendor.contactInfo?.licenseNumber ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}>
                                {vendor.contactInfo?.licenseNumber ? 'On file' : 'Missing'}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">NDA Signed</span>
                              <span className={vendor.contactInfo?.ndaSigned ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}>
                                {vendor.contactInfo?.ndaSigned ? 'Yes' : 'No'}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">Background Check</span>
                              <span className={vendor.contactInfo?.backgroundCheck ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}>
                                {vendor.contactInfo?.backgroundCheck ? 'Passed' : 'Pending'}
                              </span>
                            </div>
                          </div>
                        </div>
                        <Button asChild variant="outline" size="sm" className="w-full mt-2">
                          <Link href={`/vendors/${vendor.id}/prequalify`}>
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Start Prequalification
                          </Link>
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="performance">
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Vendor Performance Tracking</CardTitle>
                  <CardDescription>
                    Monitor vendor performance metrics and trends
                  </CardDescription>
                </CardHeader>
              </Card>
              {vendors.length === 0 ? (
                <Card>
                  <CardContent className="py-12">
                    <EmptyState icon={TrendingUp} title="No vendors found" description="Add vendors to track their performance." />
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {vendors.map((vendor) => {
                    const submissions = vendor._count.submissions
                    const wonContracts = vendor._count.contracts
                    const winRate = submissions > 0 ? Math.round((wonContracts / submissions) * 100) : 0
                    const perfIndicator = submissions === 0
                      ? 'neutral'
                      : winRate >= 50
                        ? 'green'
                        : winRate >= 25
                          ? 'amber'
                          : 'red'

                    return (
                      <Card key={vendor.id}>
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between gap-2">
                            <CardTitle className="text-base font-semibold truncate">{vendor.name}</CardTitle>
                            <div className={`shrink-0 h-3 w-3 rounded-full ${
                              perfIndicator === 'green' ? 'bg-emerald-500' : perfIndicator === 'amber' ? 'bg-amber-500' : perfIndicator === 'red' ? 'bg-red-500' : 'bg-muted-foreground/40'
                            }`} title={`Win rate: ${winRate}%`} />
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                              <p className="text-muted-foreground">Submissions</p>
                              <p className="font-semibold">{submissions}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Won Contracts</p>
                              <p className="font-semibold">{wonContracts}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Win Rate</p>
                              <p className="font-semibold">{submissions > 0 ? `${winRate}%` : 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Avg Score</p>
                              <p className={`font-semibold ${vendor.performance ? getScoreColor(vendor.performance.overallScore) : ''}`}>
                                {vendor.performance ? `${vendor.performance.overallScore}%` : 'N/A'}
                              </p>
                            </div>
                          </div>
                          <Button asChild variant="outline" size="sm" className="w-full">
                            <Link href={`/vendors/${vendor.id}/performance`}>
                              <Star className="mr-2 h-4 w-4" />
                              View Performance
                            </Link>
                          </Button>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}
            </div>
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
                              className="bg-primary h-2 rounded-full"
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