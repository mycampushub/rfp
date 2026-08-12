"use client"

import { useState, useEffect } from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
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
import { toast } from "sonner"
import {
  FileText,
  Search,
  Filter,
  MoreHorizontal,
  ExternalLink,
  CheckCircle2,
  Clock,
  Ban,
  ChevronLeft,
  ChevronRight,
  FileSignature,
} from "lucide-react"
import Link from "next/link"
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

interface ContractRow {
  id: string
  rfpId: string
  rfp: { id: string; title: string; status: string }
  submissionId: string
  vendorId: string
  vendor: { id: string; name: string }
  status: string
  startDate: string | null
  endDate: string | null
  value: number | null
  notes: string | null
  awardedBy: string
  awardedByUser: { id: string; name: string; email: string }
  createdAt: string
  updatedAt: string
}

const statusConfig: Record<string, { label: string; className: string }> = {
  draft: {
    label: "Draft",
    className: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
  },
  active: {
    label: "Active",
    className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  },
  expired: {
    label: "Expired",
    className: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  },
  terminated: {
    label: "Terminated",
    className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  },
}

export default function ContractsPage() {
  const [contracts, setContracts] = useState<ContractRow[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [statusDialogOpen, setStatusDialogOpen] = useState(false)
  const [newStatus, setNewStatus] = useState<string | null>(null)
  const [selectedContract, setSelectedContract] = useState<ContractRow | null>(null)

  useEffect(() => {
    document.title = "Contracts | RFP Platform"
  }, [])

  const fetchContracts = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
      })
      if (statusFilter !== "all") {
        params.set("status", statusFilter)
      }

      const res = await fetch(`/api/contracts?${params}`)
      if (!res.ok) throw new Error("Failed to fetch contracts")
      const data = await res.json()
      setContracts(data.data || [])
      setTotalPages(data.pagination?.pages || 1)
    } catch (err) {
      console.error(err)
      toast.error("Failed to load contracts")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchContracts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, page])

  const filteredContracts = contracts.filter((c) => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return (
      c.rfp.title.toLowerCase().includes(q) ||
      c.vendor.name.toLowerCase().includes(q) ||
      c.id.toLowerCase().includes(q)
    )
  })

  const handleStatusChange = async (contractId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/contracts/${contractId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to update contract")
      }

      toast.success(`Contract status updated to ${statusConfig[newStatus]?.label || newStatus}`)
      fetchContracts()
    } catch (err) {
      console.error(err)
      toast.error(err instanceof Error ? err.message : "Failed to update contract")
    }
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—"
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const formatCurrency = (value: number | null) => {
    if (!value) return "—"
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  return (
    <MainLayout title="Contracts">
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:justify-between sm:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Contracts</h1>
          <p className="text-muted-foreground mt-1">Manage vendor contracts and agreements</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search contracts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-48 sm:w-64"
            />
          </div>
        </div>
      </div>

      {/* Status Filter */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Filter className="h-4 w-4" />
              <span>Status:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {["all", "draft", "active", "expired", "terminated"].map((status) => (
                <Button
                  key={status}
                  variant={statusFilter === status ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setStatusFilter(status)
                    setPage(1)
                  }}
                >
                  {status === "all" ? "All" : statusConfig[status]?.label || status}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contracts Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : filteredContracts.length === 0 ? (
            <div className="text-center py-16">
              <FileSignature className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No contracts found</h3>
              <p className="text-muted-foreground max-w-md mx-auto mb-4">
                {statusFilter !== "all"
                  ? `No contracts with "${statusConfig[statusFilter]?.label || statusFilter}" status.`
                  : "Contracts will appear here once vendors are awarded through the evaluation process."}
              </p>
              {statusFilter === "all" && (
                <Button variant="outline" asChild>
                  <Link href="/rfps"><FileText className="mr-2 h-4 w-4" />Go to RFPs</Link>
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table className="min-w-[800px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>RFP</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Value</TableHead>
                    <TableHead className="hidden sm:table-cell">Start Date</TableHead>
                    <TableHead className="hidden sm:table-cell">End Date</TableHead>
                    <TableHead className="hidden md:table-cell">Awarded By</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredContracts.map((contract) => (
                    <TableRow key={contract.id}>
                      <TableCell>
                        <Link
                          href={`/rfps/${contract.rfpId}`}
                          className="flex items-center gap-2 text-sm font-medium hover:underline"
                        >
                          <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <span className="truncate max-w-[200px]">{contract.rfp.title}</span>
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/vendors/${contract.vendorId}`}
                          className="text-sm hover:underline"
                        >
                          {contract.vendor.name}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Badge className={statusConfig[contract.status]?.className || ""}>
                          {statusConfig[contract.status]?.label || contract.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(contract.value)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground hidden sm:table-cell">
                        {formatDate(contract.startDate)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground hidden sm:table-cell">
                        {formatDate(contract.endDate)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground hidden md:table-cell">
                        {contract.awardedByUser?.name || "—"}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Actions</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/rfps/${contract.rfpId}`}>
                                <ExternalLink className="mr-2 h-4 w-4" />
                                View RFP
                              </Link>
                            </DropdownMenuItem>
                            {contract.status === "draft" && (
                              <DropdownMenuItem onClick={() => {
                                setSelectedContract(contract)
                                setNewStatus("active")
                                setStatusDialogOpen(true)
                              }}>
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                Activate Contract
                              </DropdownMenuItem>
                            )}
                            {(contract.status === "draft" || contract.status === "active") && (
                              <DropdownMenuItem onClick={() => {
                                setSelectedContract(contract)
                                setNewStatus("terminated")
                                setStatusDialogOpen(true)
                              }}>
                                <Ban className="mr-2 h-4 w-4" />
                                Terminate Contract
                              </DropdownMenuItem>
                            )}
                            {contract.status === "active" && (
                              <DropdownMenuItem onClick={() => {
                                setSelectedContract(contract)
                                setNewStatus("expired")
                                setStatusDialogOpen(true)
                              }}>
                                <Clock className="mr-2 h-4 w-4" />
                                Mark as Expired
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
      {/* Status Change Confirmation Dialog */}
      <AlertDialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {newStatus === "active"
                ? "Activate Contract?"
                : newStatus === "terminated"
                ? "Terminate Contract?"
                : "Mark as Expired?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to change this contract status to {statusConfig[newStatus || ""]?.label || newStatus}? This action may have legal implications.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className={newStatus === "terminated" ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}
              onClick={async () => {
                if (!selectedContract || !newStatus) return
                await handleStatusChange(selectedContract.id, newStatus)
                setStatusDialogOpen(false)
                setSelectedContract(null)
                setNewStatus(null)
              }}
            >
              {newStatus === "active"
                ? "Activate"
                : newStatus === "terminated"
                ? "Terminate"
                : "Mark Expired"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  )
}
