"use client"

import { useState, useEffect } from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { EmptyState } from "@/components/shared/empty-state"
import { LoadingTable } from "@/components/shared/loading-table"
import { getStatusColor, getPriorityColor, getAwardStatusColor } from "@/lib/status-utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { CheckSquare, Clock, AlertCircle, CheckCircle, Award, FileText, User, DollarSign, TrendingUp, Search, Eye, ShieldCheck } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "sonner"
import { formatDate } from "@/lib/utils"

interface Approval {
  id: string
  rfpId: string
  rfpTitle: string
  stage: "draft" | "legal_review" | "budget" | "publish" | "evaluation_complete" | "award" | "contract"
  status: "pending" | "approved" | "rejected"
  requestedBy: string
  requestedByEmail: string
  approver: string
  approverEmail: string
  requestedAt: string
  decidedAt?: string
  comments?: string
  budget?: number
  priority: "low" | "medium" | "high" | "urgent"
}

interface AwardItem {
  id: string
  rfpId: string
  rfpTitle: string
  vendorName: string
  totalValue: number
  status: "pending" | "approved" | "contract_signed" | "in_progress" | "completed"
  awardedAt: string
  estimatedStartDate: string
  estimatedDuration: string
}

export default function ApprovalsPage() {
  useEffect(() => { document.title = 'Approvals & Awards | RFP Platform' }, [])
  const [approvals, setApprovals] = useState<Approval[]>([])
  const [awards, setAwards] = useState<AwardItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [stageFilter, setStageFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [viewApproval, setViewApproval] = useState<Approval | null>(null)
  const [viewAward, setViewAward] = useState<AwardItem | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [approvalsRes, contractsRes] = await Promise.all([
          fetch('/api/approvals'),
          fetch('/api/contracts'),
        ])

        if (!approvalsRes.ok) throw new Error('Failed to fetch approvals')
        const approvalsData = await approvalsRes.json()

        const mappedApprovals: Approval[] = (Array.isArray(approvalsData) ? approvalsData : []).map((a: any) => ({
          id: a.id,
          rfpId: a.rfpId || a.rfp?.id || '',
          rfpTitle: a.rfp?.title || 'Untitled RFP',
          stage: a.stage || 'draft',
          status: a.status || 'pending',
          requestedBy: a.approver?.name || 'Unknown',
          requestedByEmail: a.approver?.email || '',
          approver: a.approver?.name || 'Unknown',
          approverEmail: a.approver?.email || '',
          requestedAt: a.createdAt || '',
          decidedAt: a.decidedAt || undefined,
          comments: a.comments || undefined,
          priority: 'medium',
        }))
        setApprovals(mappedApprovals)

        // Fetch awards from real contract data
        const statusMap: Record<string, AwardItem['status']> = {
          draft: 'pending',
          active: 'in_progress',
          completed: 'completed',
          terminated: 'pending',
          expired: 'completed',
        }
        if (contractsRes.ok) {
          const contractsData = await contractsRes.json()
          const mappedAwards: AwardItem[] = (Array.isArray(contractsData) ? contractsData : []).map((c: any) => {
            let estimatedDuration = ''
            if (c.startDate && c.endDate) {
              const start = new Date(c.startDate)
              const end = new Date(c.endDate)
              const months = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30))
              estimatedDuration = `${Math.max(1, months)} month${months !== 1 ? 's' : ''}`
            }
            return {
              id: c.id,
              rfpId: c.rfpId || '',
              rfpTitle: c.rfp?.title || 'Untitled RFP',
              vendorName: c.vendor?.companyName || 'Unknown Vendor',
              totalValue: c.value || 0,
              status: statusMap[c.status] || 'pending',
              awardedAt: c.startDate || c.createdAt || '',
              estimatedStartDate: c.startDate || '',
              estimatedDuration,
            }
          })
          setAwards(mappedAwards)
        }
      } catch (err) {
        console.error(err)
        toast.error('Failed to load approvals')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const handleApproveReject = async (approvalId: string, newStatus: 'approved' | 'rejected') => {
    try {
      const res = await fetch(`/api/approvals/${approvalId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) throw new Error('Failed to update approval')
      const updated = await res.json()
      setApprovals(prev => prev.map(a => a.id === approvalId ? {
        ...a,
        status: updated.status,
        decidedAt: updated.decidedAt || new Date().toISOString(),
      } : a))
      toast.success(`Approval ${newStatus} successfully`)
    } catch (err) {
      console.error(err)
      toast.error(`Failed to ${newStatus} approval`)
    }
  }

  const filteredApprovals = approvals.filter(approval => {
    const matchesSearch = approval.rfpTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         approval.requestedBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         approval.approver.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStage = stageFilter === "all" || approval.stage === stageFilter
    const matchesStatus = statusFilter === "all" || approval.status === statusFilter
    
    return matchesSearch && matchesStage && matchesStatus
  })

  const getStageLabel = (stage: string) => {
    const labels: Record<string, string> = {
      draft: "Draft Review",
      legal_review: "Legal Review",
      budget: "Budget Approval",
      publish: "Publish Approval",
      evaluation_complete: "Evaluation Complete",
      award: "Award Approval",
      contract: "Contract Review"
    }
    return labels[stage] || stage
  }

  if (loading) {
    return (
      <MainLayout title="Approvals & Awards">
        <LoadingTable rows={5} columns={7} />
      </MainLayout>
    )
  }

  return (
    <MainLayout title="Approvals & Awards">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">Approvals & Awards</h1>
          <p className="text-muted-foreground">
            Manage approval workflows and track award processes
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {approvals.filter(a => a.status === "pending").length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Awards</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{awards.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Contracts</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {awards.filter(a => a.status === "in_progress" || a.status === "contract_signed").length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Value</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${awards.reduce((sum, a) => sum + a.totalValue, 0).toLocaleString()}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <div className="space-y-4">
          {/* Approval Workflows */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="flex items-center">
                    <CheckSquare className="mr-2 h-4 w-4" />
                    Approval Workflows
                  </CardTitle>
                  <CardDescription>
                    Track and manage approval requests
                  </CardDescription>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search approvals..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8 w-full sm:w-64"
                      aria-label="Search approvals"
                    />
                  </div>
                  <Select value={stageFilter} onValueChange={setStageFilter}>
                    <SelectTrigger className="w-full sm:w-auto">
                      <SelectValue placeholder="Stage" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Stages</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="legal_review">Legal</SelectItem>
                      <SelectItem value="budget">Budget</SelectItem>
                      <SelectItem value="publish">Publish</SelectItem>
                      <SelectItem value="award">Award</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full sm:w-auto">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
              <Table className="min-w-[900px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>RFP</TableHead>
                    <TableHead>Stage</TableHead>
                    <TableHead>Requested By</TableHead>
                    <TableHead className="hidden lg:table-cell">Approver</TableHead>
                    <TableHead className="hidden md:table-cell">Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden sm:table-cell">Requested</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredApprovals.map((approval) => (
                    <TableRow key={approval.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{approval.rfpTitle}</div>
                          {approval.budget && (
                            <div className="text-sm text-muted-foreground">
                              Budget: ${approval.budget.toLocaleString()}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{getStageLabel(approval.stage)}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <User className="h-3 w-3" />
                          <div>
                            <div className="text-sm">{approval.requestedBy}</div>
                            <div className="text-xs text-muted-foreground">{approval.requestedByEmail}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <div className="flex items-center space-x-2">
                          <User className="h-3 w-3" />
                          <div>
                            <div className="text-sm">{approval.approver}</div>
                            <div className="text-xs text-muted-foreground">{approval.approverEmail}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge className={getPriorityColor(approval.priority)}>
                          {approval.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(approval.status)}>
                          {approval.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <div className="text-sm">
                          {formatDate(approval.requestedAt)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-1">
                          <Button variant="outline" size="sm" onClick={() => setViewApproval(approval)}>
                            <Eye className="h-3 w-3" />
                          </Button>
                          {approval.status === "pending" && (
                            <>
                              <Button variant="outline" size="sm" className="text-emerald-600 dark:text-emerald-400" onClick={() => handleApproveReject(approval.id, 'approved')} aria-label="Approve">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Approve
                              </Button>
                              <Button variant="outline" size="sm" className="text-red-600 dark:text-red-400" onClick={() => handleApproveReject(approval.id, 'rejected')} aria-label="Reject">
                                <AlertCircle className="h-3 w-3 mr-1" />
                                Reject
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {filteredApprovals.length === 0 && (
                <EmptyState icon={ShieldCheck} title="No approvals found" description="Approval requests will appear here when RFPs are submitted for review." />
              )}
              </div>
            </CardContent>
          </Card>

          {/* Awards Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Award className="mr-2 h-4 w-4" />
                Awards & Contracts
              </CardTitle>
              <CardDescription>
                Track awarded contracts and their status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>RFP</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Awarded</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {awards.map((award) => (
                    <TableRow key={award.id}>
                      <TableCell>
                        <div className="font-medium">{award.rfpTitle}</div>
                      </TableCell>
                      <TableCell>{award.vendorName}</TableCell>
                      <TableCell>
                        <div className="font-medium">${award.totalValue.toLocaleString()}</div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getAwardStatusColor(award.status)}>
                          {award.status.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {formatDate(award.awardedAt)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{award.estimatedStartDate || 'TBD'}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{award.estimatedDuration || 'TBD'}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-1">
                          <Button variant="outline" size="sm" onClick={() => setViewAward(award)}>
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => {
                            const text = `AWARD DOCUMENT\n\nRFP: ${award.rfpTitle}\nVendor: ${award.vendorName}\nTotal Value: $${award.totalValue.toLocaleString()}\nStatus: ${award.status.replace('_', ' ')}\nAwarded: ${formatDate(award.awardedAt)}\nStart: ${award.estimatedStartDate || 'TBD'}\nDuration: ${award.estimatedDuration || 'TBD'}\n\n---\nGenerated from RFP Platform`
                            const blob = new Blob([text], { type: 'text/plain' })
                            const url = URL.createObjectURL(blob)
                            const a = document.createElement('a')
                            a.href = url; a.download = `award-${award.rfpTitle.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.txt`; a.click()
                            URL.revokeObjectURL(url)
                            toast.success('Award document downloaded')
                          }}>
                            <FileText className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {awards.length === 0 && (
                <EmptyState icon={Award} title="No awards yet" description="Awards will appear here once approvals are granted." />
              )}
              </div>
            </CardContent>
          </Card>

          {/* Approval Pipeline */}
          <Card>
            <CardHeader>
              <CardTitle>Approval Pipeline</CardTitle>
              <CardDescription>
                Visual representation of approval stages and progress
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {[
                  { stage: "Draft Review", count: approvals.filter(a => a.stage === "draft").length, completed: approvals.filter(a => a.stage === "draft" && a.status === "approved").length },
                  { stage: "Legal Review", count: approvals.filter(a => a.stage === "legal_review").length, completed: approvals.filter(a => a.stage === "legal_review" && a.status === "approved").length },
                  { stage: "Budget Approval", count: approvals.filter(a => a.stage === "budget").length, completed: approvals.filter(a => a.stage === "budget" && a.status === "approved").length },
                  { stage: "Publish Approval", count: approvals.filter(a => a.stage === "publish").length, completed: approvals.filter(a => a.stage === "publish" && a.status === "approved").length },
                  { stage: "Award Approval", count: approvals.filter(a => a.stage === "award").length, completed: approvals.filter(a => a.stage === "award" && a.status === "approved").length }
                ].map((stage) => (
                  <div key={stage.stage} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">{stage.stage}</span>
                      <span className="text-sm text-muted-foreground">
                        {stage.completed} of {stage.count} completed
                      </span>
                    </div>
                    <Progress 
                      value={stage.count > 0 ? (stage.completed / stage.count) * 100 : 0} 
                      className="h-2"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* View Approval Dialog */}
      {viewApproval && (
        <Dialog open={!!viewApproval} onOpenChange={() => setViewApproval(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <CheckSquare className="mr-2 h-4 w-4" />
                Approval Details
              </DialogTitle>
              <DialogDescription>Full details of this approval request</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between"><span className="text-sm font-medium">RFP Title</span><span className="text-sm">{viewApproval.rfpTitle}</span></div>
                <div className="flex justify-between"><span className="text-sm font-medium">Stage</span><Badge variant="outline">{getStageLabel(viewApproval.stage)}</Badge></div>
                <div className="flex justify-between"><span className="text-sm font-medium">Status</span><Badge className={getStatusColor(viewApproval.status)}>{viewApproval.status}</Badge></div>
                <div className="flex justify-between"><span className="text-sm font-medium">Priority</span><Badge className={getPriorityColor(viewApproval.priority)}>{viewApproval.priority}</Badge></div>
                <div className="flex justify-between"><span className="text-sm font-medium">Requested By</span><span className="text-sm">{viewApproval.requestedBy} ({viewApproval.requestedByEmail})</span></div>
                <div className="flex justify-between"><span className="text-sm font-medium">Approver</span><span className="text-sm">{viewApproval.approver} ({viewApproval.approverEmail})</span></div>
                <div className="flex justify-between"><span className="text-sm font-medium">Requested At</span><span className="text-sm">{new Date(viewApproval.requestedAt).toLocaleString()}</span></div>
                {viewApproval.decidedAt && (
                  <div className="flex justify-between"><span className="text-sm font-medium">Decided At</span><span className="text-sm">{new Date(viewApproval.decidedAt).toLocaleString()}</span></div>
                )}
                {viewApproval.budget && (
                  <div className="flex justify-between"><span className="text-sm font-medium">Budget</span><span className="text-sm">${viewApproval.budget.toLocaleString()}</span></div>
                )}
                {viewApproval.comments && (
                  <div className="space-y-1"><span className="text-sm font-medium">Comments</span><p className="text-sm text-muted-foreground">{viewApproval.comments}</p></div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* View Award Dialog */}
      {viewAward && (
        <Dialog open={!!viewAward} onOpenChange={() => setViewAward(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <Award className="mr-2 h-4 w-4" />
                Award Details
              </DialogTitle>
              <DialogDescription>Full details of this award</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between"><span className="text-sm font-medium">RFP Title</span><span className="text-sm">{viewAward.rfpTitle}</span></div>
                <div className="flex justify-between"><span className="text-sm font-medium">Vendor Name</span><span className="text-sm">{viewAward.vendorName}</span></div>
                <div className="flex justify-between"><span className="text-sm font-medium">Total Value</span><span className="text-sm font-medium">${viewAward.totalValue.toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-sm font-medium">Status</span><Badge className={getAwardStatusColor(viewAward.status)}>{viewAward.status.replace("_", " ")}</Badge></div>
                <div className="flex justify-between"><span className="text-sm font-medium">Awarded At</span><span className="text-sm">{formatDate(viewAward.awardedAt)}</span></div>
                <div className="flex justify-between"><span className="text-sm font-medium">Start Date</span><span className="text-sm">{viewAward.estimatedStartDate || 'TBD'}</span></div>
                <div className="flex justify-between"><span className="text-sm font-medium">Duration</span><span className="text-sm">{viewAward.estimatedDuration || 'TBD'}</span></div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </MainLayout>
  )
}