"use client"

import { useState, useEffect } from "react"
import { MainLayout } from "@/components/layout/main-layout"
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
  Calendar,
  DollarSign,
  TrendingUp,
  Filter,
  Search,
  Eye
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

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

interface Award {
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
  const [approvals, setApprovals] = useState<Approval[]>([])
  const [awards, setAwards] = useState<Award[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [stageFilter, setStageFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  // Mock data for demonstration
  const mockApprovals: Approval[] = [
    {
      id: "1",
      rfpId: "1",
      rfpTitle: "IT Managed Services 2024",
      stage: "budget",
      status: "pending",
      requestedBy: "John Smith",
      requestedByEmail: "john.smith@company.com",
      approver: "Sarah Johnson",
      approverEmail: "sarah.johnson@company.com",
      requestedAt: "2024-11-10T09:00:00Z",
      budget: 250000,
      priority: "high"
    },
    {
      id: "2",
      rfpId: "2",
      rfpTitle: "Marketing Campaign Services",
      stage: "legal_review",
      status: "approved",
      requestedBy: "Mike Chen",
      requestedByEmail: "mike.chen@company.com",
      approver: "Legal Team",
      approverEmail: "legal@company.com",
      requestedAt: "2024-11-09T14:00:00Z",
      decidedAt: "2024-11-09T16:30:00Z",
      comments: "All legal terms reviewed and approved.",
      priority: "medium"
    },
    {
      id: "3",
      rfpId: "3",
      rfpTitle: "Office Equipment Procurement",
      stage: "award",
      status: "pending",
      requestedBy: "Lisa Wang",
      requestedByEmail: "lisa.wang@company.com",
      approver: "Finance Director",
      approverEmail: "finance.director@company.com",
      requestedAt: "2024-11-11T10:30:00Z",
      budget: 75000,
      priority: "urgent"
    },
    {
      id: "4",
      rfpId: "1",
      rfpTitle: "IT Managed Services 2024",
      stage: "publish",
      status: "approved",
      requestedBy: "John Smith",
      requestedByEmail: "john.smith@company.com",
      approver: "Procurement Manager",
      approverEmail: "procurement@company.com",
      requestedAt: "2024-11-08T11:00:00Z",
      decidedAt: "2024-11-08T13:00:00Z",
      priority: "medium"
    }
  ]

  const mockAwards: Award[] = [
    {
      id: "1",
      rfpId: "4",
      rfpTitle: "Construction Services",
      vendorName: "Construction Pro",
      totalValue: 500000,
      status: "contract_signed",
      awardedAt: "2024-10-15T10:00:00Z",
      estimatedStartDate: "2024-11-01",
      estimatedDuration: "6 months"
    },
    {
      id: "2",
      rfpId: "5",
      rfpTitle: "Consulting Services",
      vendorName: "Business Consultants Inc",
      totalValue: 150000,
      status: "in_progress",
      awardedAt: "2024-10-20T14:00:00Z",
      estimatedStartDate: "2024-11-01",
      estimatedDuration: "3 months"
    },
    {
      id: "3",
      rfpId: "3",
      rfpTitle: "Office Equipment Procurement",
      vendorName: "Office Supplies Co",
      totalValue: 75000,
      status: "pending",
      awardedAt: "2024-11-11T15:00:00Z",
      estimatedStartDate: "2024-12-01",
      estimatedDuration: "1 month"
    }
  ]

  useEffect(() => {
    setTimeout(() => {
      setApprovals(mockApprovals)
      setAwards(mockAwards)
      setLoading(false)
    }, 1000)
  }, [])

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800"
      case "rejected":
        return "bg-red-100 text-red-800"
      case "pending":
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
        return "bg-blue-100 text-blue-800"
      case "contract_signed":
        return "bg-purple-100 text-purple-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (loading) {
    return (
      <MainLayout title="Approvals & Awards">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading approvals...</div>
        </div>
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
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="legal_review">Legal</SelectItem>
                      <SelectItem value="budget">Budget</SelectItem>
                      <SelectItem value="publish">Publish</SelectItem>
                      <SelectItem value="award">Award</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-40">
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
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>RFP</TableHead>
                    <TableHead>Stage</TableHead>
                    <TableHead>Requested By</TableHead>
                    <TableHead>Approver</TableHead>
                    <TableHead>Priority</TableHead>
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
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <User className="h-3 w-3" />
                          <div>
                            <div className="text-sm">{approval.approver}</div>
                            <div className="text-xs text-muted-foreground">{approval.approverEmail}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getPriorityColor(approval.priority)}>
                          {approval.priority}
                        </Badge>
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
                          {approval.status === "pending" && (
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
                          {new Date(award.awardedAt).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{award.estimatedStartDate}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{award.estimatedDuration}</div>
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
                ].map((stage, index) => (
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
    </MainLayout>
  )
}