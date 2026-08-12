"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
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
import { useCsvExport } from "@/hooks/use-csv-export"
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
  FileText,
  FileSearch,
  Download,
  Loader2
} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
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
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/shared/empty-state"
import { getStatusColor } from "@/lib/status-utils"
import { formatDate } from "@/lib/utils"

interface APIRFP {
  id: string
  title: string
  status: string
  budget: number | null
  category: string | null
  description: string | null
  createdAt: string
  updatedAt: string
  timeline?: {
    id: string
    qnaStart: string | null
    qnaEnd: string | null
    submissionDeadline: string | null
    evaluationStart: string | null
    awardTarget: string | null
    evaluationEnd: string | null
  } | null
  _count?: {
    submissions: number
    invitations: number
  }
}

interface RFP {
  id: string
  title: string
  status: string
  category?: string
  budget?: string
  rawBudget: number
  deadline?: string
  responseCount: number
  createdAt: string
}

export default function RFPsPage() {
  useEffect(() => { document.title = 'RFPs | RFP Platform' }, [])
  const router = useRouter()
  const { exportCsv, exporting } = useCsvExport()
  const [rfps, setRfps] = useState<RFP[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")

  const fetchRfps = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (statusFilter && statusFilter !== "all") params.set("status", statusFilter)
      if (searchTerm) params.set("search", searchTerm)

      const res = await fetch(`/api/rfps?${params.toString()}`)
      if (!res.ok) {
        throw new Error(`Failed to fetch RFPs (${res.status})`)
      }
      const json = await res.json()
      const data: APIRFP[] = json.data ?? json

      const mapped: RFP[] = data.map((r) => ({
        id: r.id,
        title: r.title,
        status: r.status,
        category: r.category || undefined,
        budget: r.budget != null ? `$${r.budget.toLocaleString()}` : undefined,
        rawBudget: r.budget || 0,
        deadline: r.timeline?.submissionDeadline || undefined,
        responseCount: r._count?.submissions ?? 0,
        createdAt: r.createdAt,
      }))

      setRfps(mapped)
    } catch (error) {
      console.error("Error fetching RFPs:", error)
      toast.error("Failed to load RFPs")
    } finally {
      setLoading(false)
    }
  }, [statusFilter, searchTerm])

  useEffect(() => {
    fetchRfps()
  }, [fetchRfps])

  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/rfps/${id}`, { method: "DELETE" })
      if (!res.ok) {
        throw new Error(`Failed to delete RFP (${res.status})`)
      }
      setRfps((prev) => prev.filter((r) => r.id !== id))
      toast.success("RFP deleted successfully")
    } catch (error) {
      console.error("Error deleting RFP:", error)
      toast.error("Failed to delete RFP")
    } finally {
      setDeleteTarget(null)
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
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <Skeleton className="h-8 w-64 mb-2" />
              <Skeleton className="h-4 w-48" />
            </div>
            <Skeleton className="h-10 w-40" />
          </div>
          <div className="grid gap-4 md:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-12" />
                </CardContent>
              </Card>
            ))}
          </div>
          <Card>
            <CardHeader><Skeleton className="h-6 w-24" /></CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-4">
                <Skeleton className="h-10 flex-1" />
                <Skeleton className="h-10 w-[180px]" />
                <Skeleton className="h-10 w-[180px]" />
              </div>
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4 py-3">
                  <Skeleton className="h-4 flex-1" />
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-24" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout title="RFPs">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:justify-between sm:items-center">
          <div>
            <h1 className="text-2xl font-bold">Requests for Proposal</h1>
            <p className="text-muted-foreground">
              Manage and track all your RFPs in one place
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              disabled={exporting}
              onClick={() => {
                const date = new Date().toISOString().slice(0, 10)
                const params = new URLSearchParams({ format: 'csv' })
                if (statusFilter && statusFilter !== 'all') params.set('status', statusFilter)
                exportCsv(`/api/export/rfps?${params.toString()}`, `rfps-export-${date}.csv`)
              }}
            >
              {exporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
              Export CSV
            </Button>
            <Button asChild>
              <Link href="/rfps/create">
                <Plus className="mr-2 h-4 w-4" />
                Create New RFP
              </Link>
            </Button>
          </div>
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
                {rfps.reduce((sum, r) => sum + r.rawBudget, 0).toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })}
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
                    <SelectItem key={category} value={category!}>{category}</SelectItem>
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
            <div className="overflow-x-auto">
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
                          Created: {formatDate(rfp.createdAt)}
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
                      {rfp.deadline ? formatDate(rfp.deadline) : "-"}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0" aria-label="More actions">
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
                          <DropdownMenuItem className="text-red-600 dark:text-red-400" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setDeleteTarget(rfp.id) }}>
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
            
            {filteredRfps.length === 0 && (
              <EmptyState 
                icon={FileSearch}
                title={searchTerm || statusFilter !== 'all' || categoryFilter !== 'all' ? "No matching RFPs" : "No RFPs found"}
                description={searchTerm || statusFilter !== 'all' || categoryFilter !== 'all'
                  ? "Try adjusting your search or filters to find what you're looking for."
                  : "Get started by creating your first RFP."}
                action={{ label: "Create RFP", onClick: () => router.push('/rfps/create') }}
              />
            )}
          </CardContent>
        </Card>

        <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the RFP and all associated data including submissions, evaluations, and invitations.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => deleteTarget && handleDelete(deleteTarget)} className="bg-red-600 hover:bg-red-700">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </MainLayout>
  )
}