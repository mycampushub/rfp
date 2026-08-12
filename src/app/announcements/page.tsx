"use client"

import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Search, Bell, Plus, Filter, Pin, Clock, Check, Eye, Edit, Send, AlertTriangle, Info, Settings, Shield, Paperclip, Loader2 } from "lucide-react"
import { useState, useEffect, useCallback } from "react"
import { toast } from "sonner"
import { formatDate } from "@/lib/utils"

interface Announcement {
  id: string
  title: string
  content: string
  priority: string
  category: string
  timestamp: string
  author: string
  authorRole: string
  isPinned: boolean
  isRead: boolean
  readCount: number
  attachments: string[]
  expiresAt: string
}

export default function AnnouncementsPage() {
  useEffect(() => { document.title = 'Announcements | RFP Platform' }, [])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [priorityFilter, setPriorityFilter] = useState("all")
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)

  // Create / Edit dialog state
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null)
  const [formSubmitting, setFormSubmitting] = useState(false)
  const [formData, setFormData] = useState({ title: "", message: "", category: "general", priority: "medium" })

  const fetchAnnouncements = useCallback(async () => {
    try {
      const res = await fetch("/api/announcements")
      if (!res.ok) throw new Error("Failed to fetch announcements")
      const data = await res.json()

      const mapped = (data ?? []).map((ann: Record<string, unknown>) => ({
        id: ann.id as string,
        title: ann.title as string,
        content: ann.message as string,
        priority: ((ann.data as Record<string, unknown>)?.priority as string) || "medium",
        category: ((ann.data as Record<string, unknown>)?.category as string) || "general",
        timestamp: ann.createdAt
          ? new Date(ann.createdAt as string).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })
          : "",
        author: (ann.user as Record<string, unknown>)?.name as string || "Unknown",
        authorRole: "",
        isPinned: false,
        isRead: ann.isRead as boolean ?? false,
        readCount: 0,
        attachments: [],
        expiresAt: "",
      }))
      setAnnouncements(mapped)
    } catch (error) {
      console.error("Error fetching announcements:", error)
      toast.error("Failed to load announcements")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAnnouncements()
  }, [fetchAnnouncements])

  const resetForm = () => setFormData({ title: "", message: "", category: "general", priority: "medium" })

  const handleCreate = async () => {
    if (!formData.title.trim() || !formData.message.trim()) {
      toast.error("Title and message are required")
      return
    }
    setFormSubmitting(true)
    try {
      const res = await fetch("/api/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          message: formData.message,
          type: "announcement",
          data: { category: formData.category, priority: formData.priority },
        }),
      })
      if (!res.ok) throw new Error("Failed to create announcement")
      toast.success("Announcement created successfully")
      setCreateDialogOpen(false)
      resetForm()
      fetchAnnouncements()
    } catch (_err) { toast.error("Failed to create announcement") } finally {
      setFormSubmitting(false)
    }
  }

  const handleEdit = async () => {
    if (!selectedAnnouncement || !formData.title.trim() || !formData.message.trim()) {
      toast.error("Title and message are required")
      return
    }
    setFormSubmitting(true)
    try {
      const res = await fetch(`/api/announcements/${selectedAnnouncement.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          message: formData.message,
          data: { category: formData.category, priority: formData.priority },
        }),
      })
      if (!res.ok) throw new Error("Failed to update announcement")
      toast.success("Announcement updated successfully")
      setEditDialogOpen(false)
      setSelectedAnnouncement(null)
      resetForm()
      fetchAnnouncements()
    } catch (_err) { toast.error("Failed to update announcement") } finally {
      setFormSubmitting(false)
    }
  }

  const openEditDialog = (ann: Announcement) => {
    setSelectedAnnouncement(ann)
    setFormData({ title: ann.title, message: ann.content, category: ann.category, priority: ann.priority })
    setEditDialogOpen(true)
  }

  const openViewDialog = (ann: Announcement) => {
    setSelectedAnnouncement(ann)
    setViewDialogOpen(true)
  }

  const categories = [
    { id: "all", name: "All Categories", count: announcements.length },
    { id: "general", name: "General", count: announcements.filter(a => a.category === "general").length },
  ]

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical": return "bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/30"
      case "high": return "bg-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-500/30"
      case "medium": return "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30"
      case "low": return "bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30"
      default: return "bg-muted text-foreground border-border"
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "system": return <AlertTriangle className="h-4 w-4" />
      case "process": return <Settings className="h-4 w-4" />
      case "deadline": return <Clock className="h-4 w-4" />
      case "security": return <Shield className="h-4 w-4" />
      default: return <Info className="h-4 w-4" />
    }
  }

  const filteredAnnouncements = announcements.filter(announcement => {
    const matchesSearch = announcement.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         announcement.content.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "all" || announcement.category === selectedCategory
    const matchesPriority = priorityFilter === "all" || announcement.priority === priorityFilter
    
    return matchesSearch && matchesCategory && matchesPriority
  })

  const pinnedAnnouncements = filteredAnnouncements.filter(a => a.isPinned)
  const regularAnnouncements = filteredAnnouncements.filter(a => !a.isPinned)

  return (
    <MainLayout title="Announcements">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Announcements</h1>
            <p className="text-muted-foreground">
              Stay updated with important system-wide announcements and notifications
            </p>
          </div>
          <Button onClick={() => { resetForm(); setCreateDialogOpen(true) }}>
            <Plus className="mr-2 h-4 w-4" />
            New Announcement
          </Button>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input 
                  placeholder="Search announcements..." 
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  aria-label="Search announcements"
                />
              </div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline">
                    <Filter className="mr-2 h-4 w-4" />
                    Filter{priorityFilter !== "all" && `: ${priorityFilter}`}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-48">
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Priority</p>
                    {["all", "low", "medium", "high", "critical"].map((p) => (
                      <button
                        key={p}
                        className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
                          priorityFilter === p ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                        }`}
                        onClick={() => setPriorityFilter(p)}
                      >
                        {p === "all" ? "All Priorities" : p.charAt(0).toUpperCase() + p.slice(1)}
                      </button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-4">
          {/* Categories Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Categories</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[400px]">
                  <div className="space-y-1 p-2">
                    {loading ? (
                      Array.from({ length: 2 }).map((_, i) => (
                        <Skeleton key={i} className="h-10 w-full rounded-lg" />
                      ))
                    ) : (
                      categories.map((category) => (
                        <button
                          key={category.id}
                          className={`w-full text-left p-3 rounded-lg transition-colors ${
                            selectedCategory === category.id
                              ? 'bg-sky-500/10 text-sky-700 dark:text-sky-300'
                              : 'hover:bg-muted/50'
                          }`}
                          onClick={() => setSelectedCategory(category.id)}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{category.name}</span>
                            <Badge variant="secondary" className="text-xs">
                              {category.count}
                            </Badge>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="all">All Announcements</TabsTrigger>
                <TabsTrigger value="unread">Unread ({announcements.filter(a => !a.isRead).length})</TabsTrigger>
                <TabsTrigger value="pinned">Pinned ({pinnedAnnouncements.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="mt-6">
                {loading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="h-40 w-full rounded-lg" />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Pinned Announcements */}
                    {pinnedAnnouncements.length > 0 && (
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium flex items-center">
                          <Pin className="mr-2 h-5 w-5 text-sky-600 dark:text-sky-400" />
                          Pinned Announcements
                        </h3>
                        {pinnedAnnouncements.map((announcement) => (
                          <AnnouncementCard 
                            key={announcement.id} 
                            announcement={announcement} 
                            getPriorityColor={getPriorityColor}
                            getCategoryIcon={getCategoryIcon}
                            onView={openViewDialog}
                            onEdit={openEditDialog}
                          />
                        ))}
                      </div>
                    )}

                    {/* Regular Announcements */}
                    {regularAnnouncements.length > 0 && (
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium">All Announcements</h3>
                        {regularAnnouncements.map((announcement) => (
                          <AnnouncementCard 
                            key={announcement.id} 
                            announcement={announcement} 
                            getPriorityColor={getPriorityColor}
                            getCategoryIcon={getCategoryIcon}
                            onView={openViewDialog}
                            onEdit={openEditDialog}
                          />
                        ))}
                      </div>
                    )}

                    {filteredAnnouncements.length === 0 && (
                      <Card>
                        <CardContent className="text-center py-12">
                          <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                          <h3 className="text-lg font-medium text-foreground mb-2">No announcements found</h3>
                          <p className="text-muted-foreground/80">Try adjusting your search or filter criteria</p>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="unread" className="mt-6">
                <div className="space-y-4">
                  {loading ? (
                    Array.from({ length: 2 }).map((_, i) => (
                      <Skeleton key={i} className="h-40 w-full rounded-lg" />
                    ))
                  ) : (
                    <>
                      {announcements.filter(a => !a.isRead).map((announcement) => (
                        <AnnouncementCard 
                          key={announcement.id} 
                          announcement={announcement} 
                          getPriorityColor={getPriorityColor}
                          getCategoryIcon={getCategoryIcon}
                          onView={openViewDialog}
                          onEdit={openEditDialog}
                        />
                      ))}
                      {announcements.filter(a => !a.isRead).length === 0 && (
                        <Card>
                          <CardContent className="text-center py-12">
                            <Check className="h-12 w-12 text-emerald-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-foreground mb-2">All caught up!</h3>
                            <p className="text-muted-foreground/80">You've read all announcements</p>
                          </CardContent>
                        </Card>
                      )}
                    </>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="pinned" className="mt-6">
                <div className="space-y-4">
                  {loading ? (
                    Array.from({ length: 2 }).map((_, i) => (
                      <Skeleton key={i} className="h-40 w-full rounded-lg" />
                    ))
                  ) : (
                    <>
                      {pinnedAnnouncements.map((announcement) => (
                        <AnnouncementCard 
                          key={announcement.id} 
                          announcement={announcement} 
                          getPriorityColor={getPriorityColor}
                          getCategoryIcon={getCategoryIcon}
                          onView={openViewDialog}
                          onEdit={openEditDialog}
                        />
                      ))}
                      {pinnedAnnouncements.length === 0 && (
                        <Card>
                          <CardContent className="text-center py-12">
                            <Pin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-foreground mb-2">No pinned announcements</h3>
                            <p className="text-muted-foreground/80">Important announcements will appear here</p>
                          </CardContent>
                        </Card>
                      )}
                    </>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Create Announcement Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={(open) => { setCreateDialogOpen(open); if (!open) resetForm() }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>New Announcement</DialogTitle>
            <DialogDescription>Create a new announcement for your organization.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="create-title">Title *</Label>
              <Input id="create-title" value={formData.title} onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))} placeholder="Announcement title" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-message">Message *</Label>
              <Textarea id="create-message" value={formData.message} onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))} placeholder="Announcement content..." rows={4} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="update">Update</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                    <SelectItem value="compliance">Compliance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select value={formData.priority} onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setCreateDialogOpen(false); resetForm() }}>Cancel</Button>
            <Button onClick={handleCreate} disabled={formSubmitting}>
              {formSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Announcement Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={(open) => { setEditDialogOpen(open); if (!open) { setSelectedAnnouncement(null); resetForm() } }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Announcement</DialogTitle>
            <DialogDescription>Update the announcement details.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Title *</Label>
              <Input id="edit-title" value={formData.title} onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))} placeholder="Announcement title" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-message">Message *</Label>
              <Textarea id="edit-message" value={formData.message} onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))} placeholder="Announcement content..." rows={4} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="update">Update</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                    <SelectItem value="compliance">Compliance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select value={formData.priority} onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setEditDialogOpen(false); setSelectedAnnouncement(null); resetForm() }}>Cancel</Button>
            <Button onClick={handleEdit} disabled={formSubmitting}>
              {formSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Announcement Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={(open) => { setViewDialogOpen(open); if (!open) setSelectedAnnouncement(null) }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedAnnouncement?.title}</DialogTitle>
            <DialogDescription>{selectedAnnouncement?.timestamp}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge className={selectedAnnouncement ? getPriorityColor(selectedAnnouncement.priority) : ""}>
                {selectedAnnouncement?.priority}
              </Badge>
              <Badge variant="outline">
                {selectedAnnouncement?.category}
              </Badge>
              <Badge variant={selectedAnnouncement?.isRead ? "secondary" : "default"}>
                {selectedAnnouncement?.isRead ? "Read" : "Unread"}
              </Badge>
            </div>
            <Separator />
            <div className="prose prose-sm max-w-none">
              <p className="text-foreground/80 whitespace-pre-wrap">{selectedAnnouncement?.content}</p>
            </div>
            <Separator />
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback>
                  {selectedAnnouncement?.author.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">{selectedAnnouncement?.author}</p>
                <p className="text-xs text-muted-foreground">{selectedAnnouncement?.authorRole || "Author"}</p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setViewDialogOpen(false); setSelectedAnnouncement(null) }}>Close</Button>
            {selectedAnnouncement && (
              <Button variant="outline" onClick={() => { setViewDialogOpen(false); openEditDialog(selectedAnnouncement) }}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  )
}

// Announcement Card Component
function AnnouncementCard({ announcement, getPriorityColor, getCategoryIcon, onView, onEdit }: {
  announcement: Announcement
  getPriorityColor: (_priority: string) => string
  getCategoryIcon: (_category: string) => React.ReactNode
  onView: (_ann: Announcement) => void
  onEdit: (_ann: Announcement) => void
}) {
  const handleAttachment = (filename?: string) => {
    if (!filename) {
      toast.error("No attachment available")
      return
    }
    const url = `/uploads/${filename}`
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    toast.success('Attachment downloaded')
  }

  const handleShare = async () => {
    try {
      const text = `${announcement.title}\n${announcement.content.slice(0, 100)}${announcement.content.length > 100 ? "..." : ""}`
      await navigator.clipboard.writeText(text)
      toast.success("Announcement copied to clipboard")
    } catch (_err) { toast.error("Failed to copy to clipboard") }
  }

  return (
    <Card className={`transition-all hover:shadow-md ${!announcement.isRead ? 'border-sky-500/30 dark:border-sky-500/40 bg-sky-500/10 dark:bg-sky-500/20' : ''}`}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start space-x-3">
            <div className="flex items-center space-x-2">
              {getCategoryIcon(announcement.category)}
              <Badge className={getPriorityColor(announcement.priority)}>
                {announcement.priority}
              </Badge>
              {announcement.isPinned && (
                <Pin className="h-4 w-4 text-sky-600 dark:text-sky-400" />
              )}
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-medium mb-2">{announcement.title}</h3>
              <div className="flex items-center space-x-4 text-sm text-muted-foreground/80">
                <span>{announcement.timestamp}</span>
                {announcement.expiresAt && (
                  <>
                    <span>•</span>
                    <span>Expires {formatDate(announcement.expiresAt)}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {!announcement.isRead && (
              <div className="h-2 w-2 bg-sky-500 rounded-full"></div>
            )}
            <Button variant="ghost" size="sm" onClick={() => onView(announcement)}>
              <Eye className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onEdit(announcement)}>
              <Edit className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <p className="text-foreground/80 mb-4">{announcement.content}</p>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback>
                {announcement.author.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">{announcement.author}</p>
              {announcement.authorRole && <p className="text-xs text-muted-foreground/80">{announcement.authorRole}</p>}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {announcement.attachments.length > 0 && (
              <Button variant="outline" size="sm" onClick={() => handleAttachment(announcement.attachments[0])}>
                <Paperclip className="h-4 w-4 mr-1" />
                {announcement.attachments.length}
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={handleShare}>
              <Send className="h-4 w-4 mr-1" />
              Share
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
