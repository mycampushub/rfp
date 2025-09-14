"use client"

import { useState, useEffect } from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { 
  FileText, 
  Plus, 
  Eye, 
  CheckCircle, 
  Clock,
  AlertCircle,
  Filter,
  Search,
  Users,
  Calendar,
  Paperclip,
  Download,
  Bell
} from "lucide-react"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

interface Addendum {
  id: string
  rfpId: string
  rfpTitle: string
  title: string
  note?: string
  attachments: string[]
  requiresAck: boolean
  createdAt: string
  acknowledgments: Acknowledgment[]
  status: "active" | "expired"
}

interface Acknowledgment {
  id: string
  vendorId: string
  vendorName: string
  vendorEmail: string
  acknowledgedAt: string
}

export default function AddendaPage() {
  const [addenda, setAddenda] = useState<Addendum[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [rfpFilter, setRfpFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [selectedAddendum, setSelectedAddendum] = useState<Addendum | null>(null)
  const [newAddendum, setNewAddendum] = useState({
    title: "",
    note: "",
    requiresAck: true,
    rfpId: ""
  })

  // Mock data for demonstration
  const mockAddenda: Addendum[] = [
    {
      id: "1",
      rfpId: "1",
      rfpTitle: "IT Managed Services 2024",
      title: "Extension of Submission Deadline",
      note: "Due to the high volume of inquiries, we are extending the submission deadline by 7 days. The new deadline is December 22, 2024.",
      attachments: ["deadline-extension.pdf"],
      requiresAck: true,
      createdAt: "2024-11-10T09:00:00Z",
      status: "active",
      acknowledgments: [
        {
          id: "1",
          vendorId: "1",
          vendorName: "Tech Solutions Inc",
          vendorEmail: "contact@techsolutions.com",
          acknowledgedAt: "2024-11-10T10:30:00Z"
        },
        {
          id: "2",
          vendorId: "2",
          vendorName: "Global IT Services",
          vendorEmail: "info@globalit.com",
          acknowledgedAt: "2024-11-10T11:15:00Z"
        }
      ]
    },
    {
      id: "2",
      rfpId: "1",
      rfpTitle: "IT Managed Services 2024",
      title: "Clarification on Security Requirements",
      note: "Additional security requirements have been specified in Section 4.2. All vendors must review and acknowledge these updated requirements.",
      attachments: ["security-updates.pdf", "compliance-checklist.xlsx"],
      requiresAck: true,
      createdAt: "2024-11-08T14:00:00Z",
      status: "active",
      acknowledgments: [
        {
          id: "3",
          vendorId: "3",
          vendorName: "Digital Dynamics",
          vendorEmail: "contact@digitaldynamics.com",
          acknowledgedAt: "2024-11-08T15:45:00Z"
        }
      ]
    },
    {
      id: "3",
      rfpId: "2",
      rfpTitle: "Marketing Campaign Services",
      title: "Budget Adjustment",
      note: "The budget for this RFP has been increased from $100,000 to $150,000 to accommodate expanded scope requirements.",
      attachments: ["budget-revision.pdf"],
      requiresAck: true,
      createdAt: "2024-11-05T11:00:00Z",
      status: "active",
      acknowledgments: []
    },
    {
      id: "4",
      rfpId: "3",
      rfpTitle: "Office Equipment Procurement",
      title: "Specification Updates",
      note: "Technical specifications for office equipment have been updated. Please review the new requirements in the attached document.",
      attachments: ["spec-updates-v2.pdf"],
      requiresAck: false,
      createdAt: "2024-11-01T16:00:00Z",
      status: "expired",
      acknowledgments: [
        {
          id: "4",
          vendorId: "4",
          vendorName: "Office Supplies Co",
          vendorEmail: "sales@officesupplies.com",
          acknowledgedAt: "2024-11-02T09:30:00Z"
        }
      ]
    }
  ]

  useEffect(() => {
    setTimeout(() => {
      setAddenda(mockAddenda)
      setLoading(false)
    }, 1000)
  }, [])

  const filteredAddenda = addenda.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (item.note && item.note.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (item.rfpTitle && item.rfpTitle.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesRfp = rfpFilter === "all" || item.rfpId === rfpFilter
    const matchesStatus = statusFilter === "all" || item.status === statusFilter
    
    return matchesSearch && matchesRfp && matchesStatus
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800"
      case "expired":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getAcknowledgmentRate = (acknowledgments: Acknowledgment[], totalVendors: number) => {
    if (totalVendors === 0) return 0
    return Math.round((acknowledgments.length / totalVendors) * 100)
  }

  const handleCreateAddendum = () => {
    if (!newAddendum.title.trim() || !newAddendum.rfpId) return
    
    const rfpTitle = addenda.find(a => a.rfpId === newAddendum.rfpId)?.rfpTitle || "Unknown RFP"
    
    const addendum: Addendum = {
      id: `add-${Date.now()}`,
      rfpId: newAddendum.rfpId,
      rfpTitle,
      title: newAddendum.title,
      note: newAddendum.note,
      attachments: [],
      requiresAck: newAddendum.requiresAck,
      createdAt: new Date().toISOString(),
      status: "active",
      acknowledgments: []
    }
    
    setAddenda(prev => [addendum, ...prev])
    setNewAddendum({ title: "", note: "", requiresAck: true, rfpId: "" })
  }

  const getUniqueRfps = () => {
    const rfps = Array.from(new Set(addenda.map(a => ({ id: a.rfpId, title: a.rfpTitle }))))
    return rfps
  }

  if (loading) {
    return (
      <MainLayout title="Addenda Management">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading addenda...</div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout title="Addenda Management">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Addenda Management</h1>
            <p className="text-muted-foreground">
              Manage RFP addenda and track vendor acknowledgments
            </p>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Addendum
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Addendum</DialogTitle>
                <DialogDescription>
                  Create an addendum to modify or clarify RFP requirements
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="rfp-select">RFP</Label>
                  <Select value={newAddendum.rfpId} onValueChange={(value) => setNewAddendum(prev => ({ ...prev, rfpId: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select RFP" />
                    </SelectTrigger>
                    <SelectContent>
                      {getUniqueRfps().map(rfp => (
                        <SelectItem key={rfp.id} value={rfp.id}>{rfp.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={newAddendum.title}
                    onChange={(e) => setNewAddendum(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Addendum title..."
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="note">Note</Label>
                  <Textarea
                    id="note"
                    value={newAddendum.note}
                    onChange={(e) => setNewAddendum(prev => ({ ...prev, note: e.target.value }))}
                    placeholder="Detailed description of changes..."
                    rows={3}
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="requires-ack"
                    checked={newAddendum.requiresAck}
                    onCheckedChange={(checked) => setNewAddendum(prev => ({ ...prev, requiresAck: checked }))}
                  />
                  <Label htmlFor="requires-ack">Requires vendor acknowledgment</Label>
                </div>
                
                <div className="flex justify-end">
                  <Button onClick={handleCreateAddendum}>
                    Create Addendum
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Addenda</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{addenda.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {addenda.filter(a => a.status === "active").length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Acknowledgments</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {addenda.filter(a => a.requiresAck && a.acknowledgments.length < 5).length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg. Acknowledgment Rate</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.round(addenda.reduce((acc, a) => acc + getAcknowledgmentRate(a.acknowledgments, 5), 0) / addenda.length)}%
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
                    placeholder="Search addenda..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
              <Select value={rfpFilter} onValueChange={setRfpFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filter by RFP" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All RFPs</SelectItem>
                  {getUniqueRfps().map(rfp => (
                    <SelectItem key={rfp.id} value={rfp.id}>{rfp.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Addenda Management */}
        <Card>
          <CardHeader>
            <CardTitle>Addenda</CardTitle>
            <CardDescription>
              {filteredAddenda.length} addendum{filteredAddenda.length !== 1 ? 'a' : ''} found
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>RFP</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Acknowledgments</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAddenda.map((addendum) => {
                  const acknowledgmentRate = getAcknowledgmentRate(addendum.acknowledgments, 5)
                  return (
                    <TableRow key={addendum.id}>
                      <TableCell>
                        <div className="max-w-xs">
                          <div className="font-medium">{addendum.title}</div>
                          {addendum.note && (
                            <div className="text-sm text-muted-foreground truncate">
                              {addendum.note}
                            </div>
                          )}
                          {addendum.attachments.length > 0 && (
                            <div className="flex items-center space-x-1 mt-1">
                              <Paperclip className="h-3 w-3 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">
                                {addendum.attachments.length} attachment{addendum.attachments.length !== 1 ? 's' : ''}
                              </span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{addendum.rfpTitle}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(addendum.status)}>
                          {addendum.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <div className="flex items-center space-x-1">
                            <Users className="h-3 w-3" />
                            <span className="text-sm">
                              {addendum.acknowledgments.length}/5
                            </span>
                          </div>
                          {addendum.requiresAck && (
                            <div className="flex items-center space-x-1">
                              <div className="w-16 bg-gray-200 rounded-full h-2">
                                <div 
                                  className={`h-2 rounded-full ${
                                    acknowledgmentRate === 100 ? 'bg-green-600' : 
                                    acknowledgmentRate >= 60 ? 'bg-yellow-600' : 'bg-red-600'
                                  }`}
                                  style={{ width: `${acknowledgmentRate}%` }}
                                ></div>
                              </div>
                              <span className="text-xs">{acknowledgmentRate}%</span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {new Date(addendum.createdAt).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedAddendum(addendum)}
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                          {addendum.attachments.length > 0 && (
                            <Button
                              variant="ghost"
                              size="sm"
                            >
                              <Download className="h-3 w-3" />
                            </Button>
                          )}
                          {addendum.requiresAck && acknowledgmentRate < 100 && (
                            <Button
                              variant="ghost"
                              size="sm"
                            >
                              <Bell className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
            
            {filteredAddenda.length === 0 && (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No addenda found matching your filters.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Addendum Detail Modal */}
        {selectedAddendum && (
          <Dialog open={!!selectedAddendum} onOpenChange={() => setSelectedAddendum(null)}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle className="flex items-center">
                  <FileText className="mr-2 h-4 w-4" />
                  {selectedAddendum.title}
                </DialogTitle>
                <DialogDescription>
                  {selectedAddendum.rfpTitle} • {new Date(selectedAddendum.createdAt).toLocaleDateString()}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Description</Label>
                  <p className="text-gray-700">{selectedAddendum.note || "No description provided."}</p>
                </div>
                
                {selectedAddendum.attachments.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Attachments</Label>
                    <div className="space-y-2">
                      {selectedAddendum.attachments.map((attachment, index) => (
                        <div key={index} className="flex items-center justify-between p-2 border rounded">
                          <div className="flex items-center space-x-2">
                            <Paperclip className="h-4 w-4" />
                            <span className="text-sm">{attachment}</span>
                          </div>
                          <Button variant="ghost" size="sm">
                            <Download className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {selectedAddendum.requiresAck && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Acknowledgments</Label>
                    <div className="space-y-2">
                      {selectedAddendum.acknowledgments.length > 0 ? (
                        selectedAddendum.acknowledgments.map((ack) => (
                          <div key={ack.id} className="flex items-center justify-between p-2 border rounded">
                            <div className="flex items-center space-x-2">
                              <CheckCircle className="h-4 w-4 text-green-600" />
                              <div>
                                <div className="text-sm font-medium">{ack.vendorName}</div>
                                <div className="text-xs text-muted-foreground">{ack.vendorEmail}</div>
                              </div>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(ack.acknowledgedAt).toLocaleDateString()}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-4 text-muted-foreground">
                          No acknowledgments received yet
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setSelectedAddendum(null)}>
                    Close
                  </Button>
                  {selectedAddendum.requiresAck && selectedAddendum.acknowledgments.length < 5 && (
                    <Button>
                      <Bell className="mr-2 h-4 w-4" />
                      Send Reminder
                    </Button>
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </MainLayout>
  )
}