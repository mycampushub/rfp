"use client"

import { useState } from "react"
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
import { 
  CheckSquare, 
  Clock, 
  AlertCircle, 
  CheckCircle,
  Award,
  FileText,
  User,
  DollarSign,
  TrendingUp,
  Search,
  Eye
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export interface ApprovalData {
  id: string
  rfpId: string
  rfpTitle: string
  stageName: string
  status: string
  requestedByEmail: string
  approverEmail: string | null
  requestedAt: string
  decidedAt: string | null
  budget: number | null
  priority: string
}

export interface AwardData {
  id: string
  rfpId: string
  rfpTitle: string
  vendorName: string
  totalValue: number
  status: string
  awardedAt: string
}

export function ApprovalsContent({ approvals, awards }: { approvals: ApprovalData[]; awards: AwardData[] }) {
  const [searchTerm, setSearchTerm] = useState("")
  const [stageFilter, setStageFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  const filteredApprovals = approvals.filter(approval => {
    const matchesSearch = approval.rfpTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         approval.requestedByEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (approval.approverEmail && approval.approverEmail.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesStage = stageFilter === "all" || approval.stageName === stageFilter
    const matchesStatus = statusFilter === "all" || approval.status === statusFilter
    
    return matchesSearch && matchesStage && matchesStatus
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800"
      case "rejected":
        return "bg-red-100 text-red-800"
      case "pending":
      case "waiting":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 text-red-800"
      case "high":
        return "bg-orange-100 text-orange-800"
      case "medium":
        return "bg-yellow-100 text-yellow-800"
      case "low":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getAwardStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800"
      case "in_progress":
      case "submitted":
        return "bg-blue-100 text-blue-800"
      case "contract_signed":
        return "bg-purple-100 text-purple-800"
      case "pending":
      case "draft":
        return "bg-yellow-100 text-yellow-800"
      case "awarded":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  // Unique stages for the filter
  const stages = Array.from(new Set(approvals.map(a => a.stageName)))

  return (
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
              {approvals.filter(a => a.status === "pending" || a.status === "waiting").length}
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
              {awards.filter(a => a.status === "in_progress" || a.status === "submitted").length}
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
              ${awards.reduce((sum, a) => sum + a.totalValue, 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
          </CardContent>
        </Card>
      </div>

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
              <div className="flex space-x-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search approvals..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 w-64"
                  />
                </div>
                <Select value={stageFilter} onValueChange={setStageFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Stage" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Stages</SelectItem>
                    {stages.map(stage => (
                      <SelectItem key={stage} value={stage}>{stage}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="waiting">Waiting</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>RFP</TableHead>
                    <TableHead>Stage</TableHead>
                    <TableHead>Requested By</TableHead>
                    <TableHead>Approver</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Requested</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredApprovals.map((approval) => (
                    <TableRow key={approval.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{approval.rfpTitle}</div>
                          {approval.budget != null && (
                            <div className="text-sm text-muted-foreground">
                              Budget: ${approval.budget.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{approval.stageName}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <User className="h-3 w-3" />
                          <div className="text-sm">{approval.requestedByEmail}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <User className="h-3 w-3" />
                          <div className="text-sm">{approval.approverEmail || "Unassigned"}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(approval.status)}>
                          {approval.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {new Date(approval.requestedAt).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-1">
                          <Button variant="outline" size="sm">
                            <Eye className="h-3 w-3" />
                          </Button>
                          {(approval.status === "pending" || approval.status === "waiting") && (
                            <>
                              <Button variant="outline" size="sm" className="text-green-600">
                                <CheckCircle className="h-3 w-3" />
                              </Button>
                              <Button variant="outline" size="sm" className="text-red-600">
                                <AlertCircle className="h-3 w-3" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            {filteredApprovals.length === 0 && (
              <div className="text-center py-8">
                <CheckSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No approvals found matching your filters.</p>
              </div>
            )}
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
                        <div className="font-medium">${award.totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getAwardStatusColor(award.status)}>
                          {award.status.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {new Date(award.awardedAt).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-1">
                          <Button variant="outline" size="sm">
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <FileText className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {awards.length === 0 && (
              <div className="text-center py-8">
                <Award className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No awards yet.</p>
              </div>
            )}
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
              {stages.map((stage) => {
                const stageApprovals = approvals.filter(a => a.stageName === stage)
                const completed = stageApprovals.filter(a => a.status === "approved").length
                return (
                  <div key={stage} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">{stage}</span>
                      <span className="text-sm text-muted-foreground">
                        {completed} of {stageApprovals.length} completed
                      </span>
                    </div>
                    <Progress 
                      value={stageApprovals.length > 0 ? (completed / stageApprovals.length) * 100 : 0} 
                      className="h-2"
                    />
                  </div>
                )
              })}
              {stages.length === 0 && (
                <p className="text-sm text-muted-foreground">No approval stages to display.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}