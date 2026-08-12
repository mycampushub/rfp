"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { MainLayout } from "@/components/layout/main-layout"
import { EmptyState } from "@/components/shared/empty-state"
import { LoadingCards } from "@/components/shared/loading-table"
import { formatDate } from "@/lib/utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
import { Activity, Star, Truck, Award, AlertCircle, TrendingUp, BarChart3 } from "lucide-react"

interface VendorSubmission {
  id: string
  version: number
  status: string
  submittedAt: string | null
  createdAt: string
  rfp: {
    id: string
    title: string
    status: string
    category?: string | null
  }
}

interface VendorContract {
  id: string
  status: string
  startDate: string | null
  endDate: string | null
  value: number | null
  createdAt: string
  rfp: {
    id: string
    title: string
    status: string
  }
}

interface Vendor {
  id: string
  name: string
  rating: number
  submissions: VendorSubmission[]
  contracts: VendorContract[]
  _count: { submissions: number; invitations: number }
  createdAt: string
}

export default function VendorPerformancePage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [vendor, setVendor] = useState<Vendor | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    document.title = `Vendor Performance | RFP Platform`
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

  if (loading) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <div className="h-6 w-64 animate-pulse rounded bg-muted" />
          <LoadingCards count={3} />
          <div className="rounded-lg border p-6 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-4 animate-pulse rounded bg-muted" style={{ width: `${50 + Math.random() * 50}%` }} />
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

  // Derive performance metrics from submissions & contracts
  const awardedCount = vendor.submissions.filter(s => s.status === "awarded").length
  const totalSubmitted = vendor.submissions.filter(s => s.status === "submitted" || s.status === "awarded" || s.status === "reviewed").length
  const winRate = totalSubmitted > 0 ? Math.round((awardedCount / totalSubmitted) * 100) : 0
  const activeContracts = vendor.contracts.filter(c => c.status === "active").length
  const totalContractValue = vendor.contracts.reduce((sum, c) => sum + (c.value ?? 0), 0)
  const avgScore = vendor.rating > 0 ? vendor.rating : 0

  const hasPerformanceData = vendor.submissions.length > 0 || vendor.contracts.length > 0

  return (
    <MainLayout hideBreadcrumbs>
      <div className="space-y-6">
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
              <BreadcrumbLink href={`/vendors/${id}`}>{vendor.name}</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Performance</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div>
          <h1 className="text-2xl font-bold">Performance History</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track {vendor.name}&apos;s performance across RFP submissions and contracts
          </p>
        </div>

        {/* Performance Summary Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
                  <Star className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Avg Score</p>
                  <p className="text-2xl font-bold">{avgScore > 0 ? avgScore.toFixed(1) : "N/A"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                  <Truck className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Active Contracts</p>
                  <p className="text-2xl font-bold">{activeContracts}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-500/10">
                  <Award className="h-5 w-5 text-sky-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Win Rate</p>
                  <p className="text-2xl font-bold">{totalSubmitted > 0 ? `${winRate}%` : "N/A"}</p>
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
                  <p className="text-sm text-muted-foreground">Total Contract Value</p>
                  <p className="text-2xl font-bold">
                    {totalContractValue > 0 ? `$${totalContractValue.toLocaleString()}` : "N/A"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {!hasPerformanceData ? (
          <Card>
            <CardContent className="pt-6">
              <EmptyState
                icon={Activity}
                title="No performance evaluations recorded yet"
                description="Performance data will appear once this vendor has participated in RFP submissions."
              />
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Performance History Table */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" /> Submission Performance
                </CardTitle>
                <CardDescription>Overview of all RFP submissions by this vendor</CardDescription>
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
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {vendor.submissions.map((submission) => (
                        <TableRow key={submission.id}>
                          <TableCell className="font-medium">{submission.rfp.title}</TableCell>
                          <TableCell>
                            <Badge
                              variant="secondary"
                              className={
                                submission.status === "awarded"
                                  ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                                  : submission.status === "rejected"
                                  ? "bg-red-500/15 text-red-700 dark:text-red-400"
                                  : submission.status === "submitted"
                                  ? "bg-sky-500/15 text-sky-700 dark:text-sky-400"
                                  : "bg-amber-500/15 text-amber-700 dark:text-amber-400"
                              }
                            >
                              {submission.status}
                            </Badge>
                          </TableCell>
                          <TableCell>v{submission.version}</TableCell>
                          <TableCell>{formatDate(submission.submittedAt)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Simple Bar Chart for Submission Status Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Submission Status Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {["draft", "submitted", "reviewed", "awarded", "rejected"].map((status) => {
                    const count = vendor.submissions.filter(s => s.status === status).length
                    const maxCount = Math.max(...["draft", "submitted", "reviewed", "awarded", "rejected"].map(
                      (s) => vendor.submissions.filter(sub => sub.status === s).length
                    ), 1)
                    const width = (count / maxCount) * 100
                    const colorClass =
                      status === "awarded"
                        ? "bg-emerald-500"
                        : status === "rejected"
                        ? "bg-red-500"
                        : status === "submitted"
                        ? "bg-sky-500"
                        : status === "reviewed"
                        ? "bg-amber-500"
                        : "bg-muted-foreground/30"
                    return (
                      <div key={status} className="flex items-center gap-3">
                        <span className="text-sm font-medium w-20 capitalize shrink-0">{status}</span>
                        <div className="flex-1 h-8 rounded-md bg-muted overflow-hidden">
                          <div
                            className={`h-full rounded-md ${colorClass} transition-all duration-500`}
                            style={{ width: `${count > 0 ? Math.max(width, 4) : 0}%` }}
                          />
                        </div>
                        <span className="text-sm text-muted-foreground w-8 text-right">{count}</span>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Contracts Performance */}
            {vendor.contracts.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Contract History</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="max-h-96 overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>RFP</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Value</TableHead>
                          <TableHead>Start</TableHead>
                          <TableHead>End</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {vendor.contracts.map((contract) => (
                          <TableRow key={contract.id}>
                            <TableCell className="font-medium">{contract.rfp.title}</TableCell>
                            <TableCell>
                              <Badge
                                variant="secondary"
                                className={
                                  contract.status === "active"
                                    ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                                    : contract.status === "expired" || contract.status === "terminated"
                                    ? "bg-red-500/15 text-red-700 dark:text-red-400"
                                    : "bg-amber-500/15 text-amber-700 dark:text-amber-400"
                                }
                              >
                                {contract.status}
                              </Badge>
                            </TableCell>
                            <TableCell>{contract.value ? `$${contract.value.toLocaleString()}` : "N/A"}</TableCell>
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
          </>
        )}
      </div>
    </MainLayout>
  )
}