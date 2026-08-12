"use client"

import { useState, useEffect } from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { EmptyState } from "@/components/shared/empty-state"
import { LoadingTable } from "@/components/shared/loading-table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { FileText, Plus, Eye, CheckCircle, Clock, Filter, Search, Users, Paperclip, Download, Bell } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { formatDate } from "@/lib/utils"

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
  useEffect(() => { document.title = 'Addenda | RFP Platform' }, [])
  const [addenda, setAddenda] = useState<Addendum[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [rfpFilter, setRfpFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [selectedAddendum, setSelectedAddendum] = useState<Addendum | null>(null)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [newAddendum, setNewAddendum] = useState({
    title: "",
    note: "",
    requiresAck: true,
    rfpId: ""
  })

  useEffect(() => {
    const fetchAddenda = async () => {
      try {
        const res = await fetch('/api/addenda')
        if (!res.ok) throw new Error('Failed to fetch addenda')
        const data = await res.json()
        const mapped: Addendum[] = (Array.isArray(data) ? data : []).map((item: any) => ({
          id: item.id,
          rfpId: item.rfpId || '',
          rfpTitle: item.rfp?.title || 'Unknown RFP',
          title: item.title || '',
          note: item.note || item.description || undefined,
          attachments: item.attachments || [],
          requiresAck: item.requiresAck ?? false,
          createdAt: item.createdAt || '',
          status: item.status || 'active',
          acknowledgments: (item.acknowledgments || []).map((ack: any) => ({
            id: ack.id,
            vendorId: ack.vendorId || '',
            vendorName: ack.vendor?.name || 'Unknown',
            vendorEmail: ack.vendor?.contactInfo?.email || '',
            acknowledgedAt: ack.createdAt || '',
          })),
        }))
        setAddenda(mapped)
      } catch (err) {
        console.error(err)
        toast.error('Failed to load addenda')
      } finally {
        setLoading(false)
      }
    }
    fetchAddenda()
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
        return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
      case "expired":
        return "bg-red-500/15 text-red-700 dark:text-red-300"
      default:
        return "bg-muted text-foreground"
    }
  }

  const getAcknowledgmentRate = (acknowledgments: Acknowledgment[], totalVendors: number) => {
    if (totalVendors === 0) return 0
    return Math.round((acknowledgments.length / totalVendors) * 100)
  }

  const handleCreateAddendum = async () => {
    if (!newAddendum.title.trim() || !newAddendum.rfpId) {
      toast.error('Title and RFP selection are required')
      return
    }
    
    try {
      const res = await fetch('/api/addenda', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rfpId: newAddendum.rfpId,
          title: newAddendum.title,
          note: newAddendum.note,
          requiresAck: newAddendum.requiresAck,
        }),
      })
      if (!res.ok) throw new Error('Failed to create addendum')
      const created = await res.json()
      const rfpTitle = addenda.find(a => a.rfpId === newAddendum.rfpId)?.rfpTitle || created.rfp?.title || 'Unknown RFP'
      
      const addendum: Addendum = {
        id: created.id,
        rfpId: newAddendum.rfpId,
        rfpTitle,
        title: newAddendum.title,
        note: newAddendum.note,
        attachments: [],
        requiresAck: newAddendum.requiresAck,
        createdAt: created.createdAt || new Date().toISOString(),
        status: 'active',
        acknowledgments: []
      }
      
      setAddenda(prev => [addendum, ...prev])
      setNewAddendum({ title: "", note: "", requiresAck: true, rfpId: "" })
      toast.success('Addendum created successfully')
    } catch (err) {
      console.error(err)
      toast.error('Failed to create addendum')
    }
  }

  const getUniqueRfps = () => {
    const rfps = Array.from(new Set(addenda.map(a => ({ id: a.rfpId, title: a.rfpTitle }))))
    return rfps
  }

  if (loading) {
    return (
      <MainLayout title="Addenda Management">
        <LoadingTable rows={5} columns={6} />
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
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
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
                {addenda.length > 0 ? Math.round(addenda.reduce((acc, a) => acc + getAcknowledgmentRate(a.acknowledgments, 5), 0) / addenda.length) : 0}%
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
            <div className="overflow-x-auto">
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
                              <div className="w-16 bg-muted-foreground/20 rounded-full h-2">
                                <div 
                                  className={`h-2 rounded-full ${
                                    acknowledgmentRate === 100 ? 'bg-emerald-500' : 
                                    acknowledgmentRate >= 60 ? 'bg-amber-500' : 'bg-red-500'
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
                          {formatDate(addendum.createdAt)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedAddendum(addendum)}
                            aria-label="View"
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                          {addendum.attachments.length > 0 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                              const text = `ADDENDUM: ${addendum.title}\n\nDate: ${formatDate(addendum.createdAt)}\nRFP: ${addendum.rfpTitle || 'N/A'}\n\n${addendum.note}\n\n---\nGenerated from RFP Platform`
                              const blob = new Blob([text], { type: 'text/plain' })
                              const url = URL.createObjectURL(blob)
                              const a = document.createElement('a')
                              a.href = url; a.download = `addendum-${addendum.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.txt`; a.click()
                              URL.revokeObjectURL(url)
                              toast.success('Addendum downloaded')
                            }}
                            aria-label="Download"
                            >
                              <Download className="h-3 w-3" />
                            </Button>
                          )}
                          {addendum.requiresAck && acknowledgmentRate < 100 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={async () => {
                                try {
                                  const res = await fetch(`/api/addenda/${addendum.id}/remind`, { method: 'POST' })
                                  if (res.ok) {
                                    toast.success('Reminder sent successfully')
                                  } else {
                                    toast.error('Failed to send reminder')
                                  }
                                } catch (err) { toast.error('Failed to send reminder') }
                              }}
                              aria-label="Send reminder"
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
            </div>
            
            {filteredAddenda.length === 0 && (
              <EmptyState icon={FileText} title="No addenda found" description="Addenda will appear here once they are created for RFPs." action={{ label: "Create Addendum", onClick: () => setCreateDialogOpen(true) }} />
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
                  {selectedAddendum.rfpTitle} • {formatDate(selectedAddendum.createdAt)}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Description</Label>
                  <p className="text-foreground/80">{selectedAddendum.note || "No description provided."}</p>
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
                          <Button variant="ghost" size="sm" aria-label="Download attachment" onClick={() => {
                              if (!selectedAddendum) return
                              const text = `ADDENDUM: ${selectedAddendum.title}\n\nDate: ${formatDate(selectedAddendum.createdAt)}\nRFP: ${selectedAddendum.rfpTitle || 'N/A'}\n\n${selectedAddendum.note}\n\n---\nGenerated from RFP Platform`
                              const blob = new Blob([text], { type: 'text/plain' })
                              const url = URL.createObjectURL(blob)
                              const a = document.createElement('a')
                              a.href = url; a.download = `addendum-${selectedAddendum.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.txt`; a.click()
                              URL.revokeObjectURL(url)
                              toast.success('Attachment downloaded')
                            }}>
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
                              <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                              <div>
                                <div className="text-sm font-medium">{ack.vendorName}</div>
                                <div className="text-xs text-muted-foreground">{ack.vendorEmail}</div>
                              </div>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {formatDate(ack.acknowledgedAt)}
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
                    <Button onClick={async () => {
                      try {
                        const res = await fetch(`/api/addenda/${selectedAddendum.id}/remind`, { method: 'POST' })
                        if (res.ok) {
                          toast.success('Reminder sent successfully')
                        } else {
                          toast.error('Failed to send reminder')
                        }
                      } catch (err) { toast.error('Failed to send reminder') }
                    }}>
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