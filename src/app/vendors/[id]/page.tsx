"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { MainLayout } from "@/components/layout/main-layout"
import { EmptyState } from "@/components/shared/empty-state"
import { LoadingCards } from "@/components/shared/loading-table"
import { getStatusColor } from "@/lib/status-utils"
import { formatDate, formatCurrency } from "@/lib/utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import {
  Building2,
  Mail,
  Phone,
  Globe,
  MapPin,
  Star,
  Trophy,
  FileText,
  Clock,
  Edit,
  Activity,
  Shield,
  TrendingUp,
  CheckCircle,
  AlertCircle,
} from "lucide-react"
import Link from "next/link"

interface VendorRFP {
  id: string
  title: string
  status: string
  category?: string | null
}

interface VendorSubmission {
  id: string
  version: number
  status: string
  submittedAt: string | null
  createdAt: string
  rfp: VendorRFP
}

interface VendorContract {
  id: string
  status: string
  startDate: string | null
  endDate: string | null
  value: number | null
  createdAt: string
  rfp: VendorRFP
}

interface Vendor {
  id: string
  name: string
  email?: string | null
  phone?: string | null
  website?: string | null
  location?: string | null
  description?: string | null
  categories?: string[] | null
  certifications?: string[] | null
  diversityAttrs?: Record<string, unknown> | null
  contactInfo?: Record<string, unknown> | null
  rating: number
  verified: boolean
  isActive: boolean
  logo?: string | null
  _count: { submissions: number; invitations: number }
  submissions: VendorSubmission[]
  contracts: VendorContract[]
  createdAt: string
  updatedAt: string
}

export default function VendorDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [vendor, setVendor] = useState<Vendor | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    document.title = `Vendor Details | RFP Platform`
  }, [])

  useEffect(() => {
    async function fetchVendor() {
      try {
        const res = await fetch(`/api/vendors/${id}`)
        if (!res.ok) {
          if (res.status === 404) setError("Vendor not found")
          else throw new Error("Failed to fetch vendor")
          return
        }
        const data = await res.json()
        setVendor(data)
      } catch {
        setError("Failed to load vendor details")
      } finally {
        setLoading(false)
      }
    }
    if (id) fetchVendor()
  }, [id])

  const awardedSubmissions = vendor?.submissions.filter(s => s.status === "awarded") ?? []
  const totalContractValue = vendor?.contracts.reduce((sum, c) => sum + (c.value ?? 0), 0) ?? 0
  const winRate = vendor && vendor.submissions.length > 0
    ? Math.round((awardedSubmissions.length / vendor.submissions.length) * 100)
    : 0

  if (loading) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-8 w-64 animate-pulse rounded bg-muted" />
          </div>
          <LoadingCards count={4} />
          <div className="rounded-lg border p-6 space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-4 animate-pulse rounded bg-muted" style={{ width: `${60 + Math.random() * 40}%` }} />
            ))}
          </div>
        </div>
      </MainLayout>
    )
  }

  if (error || !vendor) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center py-20">
          <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Error</h2>
          <p className="text-muted-foreground mb-4">{error || "Vendor not found"}</p>
          <Button variant="outline" onClick={() => router.push("/vendors")}>
            Back to Vendors
          </Button>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout hideBreadcrumbs>
      <div className="space-y-6">
        {/* Breadcrumb */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/vendors">Vendors</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{vendor.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold">{vendor.name}</h1>
                {vendor.verified && (
                  <Badge variant="secondary" className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
                    <CheckCircle className="h-3 w-3 mr-1" /> Verified
                  </Badge>
                )}
                {vendor.isActive ? (
                  <Badge variant="secondary" className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
                    Active
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="bg-red-500/15 text-red-700 dark:text-red-400">
                    Inactive
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                Vendor since {formatDate(vendor.createdAt)}
              </p>
            </div>
          </div>
          <Button onClick={() => router.push(`/vendors/${id}/edit`)}>
            <Edit className="h-4 w-4 mr-2" /> Edit
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
                  <Star className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Score</p>
                  <p className="text-2xl font-bold">{vendor.rating > 0 ? vendor.rating.toFixed(1) : "N/A"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-500/10">
                  <FileText className="h-5 w-5 text-sky-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">RFPs Participated</p>
                  <p className="text-2xl font-bold">{vendor.submissions.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                  <Trophy className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Win Rate</p>
                  <p className="text-2xl font-bold">{vendor.submissions.length > 0 ? `${winRate}%` : "N/A"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/10">
                  <TrendingUp className="h-5 w-5 text-violet-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Contract Value</p>
                  <p className="text-2xl font-bold">{totalContractValue > 0 ? formatCurrency(totalContractValue) : "N/A"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="w-full sm:w-auto overflow-x-auto">
            <TabsTrigger value="overview" className="gap-1.5">
              <Building2 className="h-4 w-4 hidden sm:block" /> Overview
            </TabsTrigger>
            <TabsTrigger value="performance" className="gap-1.5">
              <Activity className="h-4 w-4 hidden sm:block" /> Performance
            </TabsTrigger>
            <TabsTrigger value="prequalification" className="gap-1.5">
              <Shield className="h-4 w-4 hidden sm:block" /> Prequalification
            </TabsTrigger>
            <TabsTrigger value="contracts" className="gap-1.5">
              <FileText className="h-4 w-4 hidden sm:block" /> Contracts
            </TabsTrigger>
            <TabsTrigger value="activity" className="gap-1.5">
              <Clock className="h-4 w-4 hidden sm:block" /> Activity
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Company Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Building2 className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-sm font-medium">Company Name</p>
                      <p className="text-sm text-muted-foreground">{vendor.name}</p>
                    </div>
                  </div>
                  {vendor.email && (
                    <div className="flex items-start gap-3">
                      <Mail className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                      <div>
                        <p className="text-sm font-medium">Email</p>
                        <p className="text-sm text-muted-foreground">{vendor.email}</p>
                      </div>
                    </div>
                  )}
                  {vendor.phone && (
                    <div className="flex items-start gap-3">
                      <Phone className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                      <div>
                        <p className="text-sm font-medium">Phone</p>
                        <p className="text-sm text-muted-foreground">{vendor.phone}</p>
                      </div>
                    </div>
                  )}
                  {vendor.website && (
                    <div className="flex items-start gap-3">
                      <Globe className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                      <div>
                        <p className="text-sm font-medium">Website</p>
                        <a href={vendor.website} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline break-all">
                          {vendor.website}
                        </a>
                      </div>
                    </div>
                  )}
                  {vendor.location && (
                    <div className="flex items-start gap-3">
                      <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                      <div>
                        <p className="text-sm font-medium">Location</p>
                        <p className="text-sm text-muted-foreground">{vendor.location}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Categories & Certifications</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm font-medium mb-2">Categories</p>
                    {vendor.categories && vendor.categories.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {vendor.categories.map((cat) => (
                          <Badge key={cat} variant="secondary">{cat}</Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No categories assigned</p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-2">Certifications</p>
                    {vendor.certifications && vendor.certifications.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {vendor.certifications.map((cert) => (
                          <Badge key={cert} variant="outline">{cert}</Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No certifications listed</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {vendor.description && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{vendor.description}</p>
                </CardContent>
              </Card>
            )}

            {vendor.contactInfo && Object.keys(vendor.contactInfo).length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Additional Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {Object.entries(vendor.contactInfo)
                      .filter(([, value]) => value !== null && value !== undefined && value !== "")
                      .map(([key, value]) => (
                        <div key={key}>
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            {key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase())}
                          </p>
                          <p className="text-sm mt-0.5">
                            {typeof value === "boolean" ? (value ? "Yes" : "No") : String(value)}
                          </p>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Performance Evaluation</CardTitle>
                <CardDescription>Performance scores are calculated from awarded submissions and contracts.</CardDescription>
              </CardHeader>
              <CardContent>
                <EmptyState
                  icon={Activity}
                  title="No performance evaluations recorded yet"
                  description="Performance data will appear once evaluations have been completed for this vendor's submissions."
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Prequalification Tab */}
          <TabsContent value="prequalification">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Prequalification Status</CardTitle>
                <CardDescription>Vendor prequalification records and compliance information.</CardDescription>
              </CardHeader>
              <CardContent>
                <EmptyState
                  icon={Shield}
                  title="No prequalification records found"
                  description="Prequalification records will appear once the vendor has been assessed against qualification criteria."
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Contracts Tab */}
          <TabsContent value="contracts">
            {vendor.contracts.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <EmptyState
                    icon={FileText}
                    title="No contracts found"
                    description="Contracts will appear here once this vendor has been awarded an RFP."
                  />
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Contracts ({vendor.contracts.length})</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="max-h-96 overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>RFP</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Value</TableHead>
                          <TableHead>Start Date</TableHead>
                          <TableHead>End Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {vendor.contracts.map((contract) => (
                          <TableRow key={contract.id}>
                            <TableCell className="font-medium">{contract.rfp.title}</TableCell>
                            <TableCell>
                              <Badge variant="secondary" className={getStatusColor(contract.status)}>
                                {contract.status}
                              </Badge>
                            </TableCell>
                            <TableCell>{contract.value ? formatCurrency(contract.value) : "N/A"}</TableCell>
                            <TableCell>{formatDate(contract.startDate)}</TableCell>
                            <TableCell>{formatDate(contract.endDate)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity">
            {vendor.submissions.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <EmptyState
                    icon={Clock}
                    title="No submission activity"
                    description="This vendor has not participated in any RFP submissions yet."
                  />
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Submission History ({vendor.submissions.length})</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="max-h-96 overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>RFP</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Version</TableHead>
                          <TableHead>Submitted</TableHead>
                          <TableHead>Category</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {vendor.submissions.map((submission) => (
                          <TableRow key={submission.id}>
                            <TableCell>
                              <Link href={`/submissions/${submission.id}`} className="font-medium text-primary hover:underline">
                                {submission.rfp.title}
                              </Link>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary" className={getStatusColor(submission.status)}>
                                {submission.status}
                              </Badge>
                            </TableCell>
                            <TableCell>v{submission.version}</TableCell>
                            <TableCell>{formatDate(submission.submittedAt)}</TableCell>
                            <TableCell>
                              {submission.rfp.category ? (
                                <Badge variant="outline">{submission.rfp.category}</Badge>
                              ) : "—"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  )
}
