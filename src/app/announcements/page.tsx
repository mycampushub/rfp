"use client"

import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Search, 
  Bell, 
  Plus, 
  Filter,
  Pin,
  Clock,
  Check,
  Eye,
  Edit,
  Trash2,
  Send,
  Calendar,
  AlertTriangle,
  Info,
  Settings,
  Shield,
  Paperclip
} from "lucide-react"
import { useState } from "react"

export default function AnnouncementsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")

  // Mock data for announcements
  const announcements = [
    {
      id: "1",
      title: "Critical System Maintenance Tonight",
      content: "The RFP platform will undergo critical system maintenance tonight from 10 PM to 2 AM. All services will be unavailable during this time. Please save your work and log out before the maintenance window begins.",
      priority: "critical",
      category: "system",
      timestamp: "2 hours ago",
      author: "System Administrator",
      authorRole: "IT Department",
      isPinned: true,
      isRead: false,
      readCount: 245,
      attachments: ["maintenance_schedule.pdf", "impact_analysis.docx"],
      expiresAt: "2024-12-16"
    },
    {
      id: "2",
      title: "New Vendor Onboarding Process Implemented",
      content: "We've successfully implemented a streamlined vendor onboarding process. The new process reduces onboarding time by 40% and includes automated compliance checks. All procurement teams should review the updated guidelines.",
      priority: "high",
      category: "process",
      timestamp: "5 hours ago",
      author: "Operations Team",
      authorRole: "Procurement",
      isPinned: true,
      isRead: true,
      readCount: 189,
      attachments: ["new_onboarding_guide.pdf"],
      expiresAt: "2024-12-30"
    },
    {
      id: "3",
      title: "Q4 Procurement Goals Deadline Approaching",
      content: "Reminder: Q4 procurement goals and evaluations are due next Friday. Please ensure all RFP evaluations are completed and submitted through the platform. Late submissions will not be accepted.",
      priority: "medium",
      category: "deadline",
      timestamp: "1 day ago",
      author: "Management",
      authorRole: "Executive",
      isPinned: false,
      isRead: true,
      readCount: 156,
      attachments: [],
      expiresAt: "2024-12-20"
    },
    {
      id: "4",
      title: "Security Update: Two-Factor Authentication Now Required",
      content: "For enhanced security, two-factor authentication is now mandatory for all users. Please enable 2FA in your account settings by the end of this week. Accounts without 2FA will be temporarily suspended.",
      priority: "high",
      category: "security",
      timestamp: "2 days ago",
      author: "Security Team",
      authorRole: "IT Security",
      isPinned: true,
      isRead: false,
      readCount: 298,
      attachments: ["2fa_setup_guide.pdf"],
      expiresAt: "2024-12-25"
    },
    {
      id: "5",
      title: "Holiday Schedule: Office Closure Dates",
      content: "Please note the upcoming holiday schedule: Office will be closed from December 24th through January 1st. Limited support will be available for critical RFP deadlines. Plan your activities accordingly.",
      priority: "low",
      category: "general",
      timestamp: "3 days ago",
      author: "HR Department",
      authorRole: "Human Resources",
      isPinned: false,
      isRead: true,
      readCount: 342,
      attachments: ["holiday_schedule_2024.pdf"],
      expiresAt: "2025-01-05"
    }
  ]

  const categories = [
    { id: "all", name: "All Categories", count: announcements.length },
    { id: "system", name: "System", count: 1 },
    { id: "process", name: "Process", count: 1 },
    { id: "deadline", name: "Deadline", count: 1 },
    { id: "security", name: "Security", count: 1 },
    { id: "general", name: "General", count: 1 }
  ]

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical": return "bg-red-100 text-red-800 border-red-200"
      case "high": return "bg-orange-100 text-orange-800 border-orange-200"
      case "medium": return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "low": return "bg-blue-100 text-blue-800 border-blue-200"
      default: return "bg-gray-100 text-gray-800 border-gray-200"
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
    
    return matchesSearch && matchesCategory
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
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Announcement
          </Button>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input 
                  placeholder="Search announcements..." 
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button variant="outline">
                <Filter className="mr-2 h-4 w-4" />
                Filter
              </Button>
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
                    {categories.map((category) => (
                      <button
                        key={category.id}
                        className={`w-full text-left p-3 rounded-lg transition-colors ${
                          selectedCategory === category.id
                            ? 'bg-blue-50 text-blue-700'
                            : 'hover:bg-gray-50'
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
                    ))}
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
                <div className="space-y-4">
                  {/* Pinned Announcements */}
                  {pinnedAnnouncements.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium flex items-center">
                        <Pin className="mr-2 h-5 w-5 text-blue-600" />
                        Pinned Announcements
                      </h3>
                      {pinnedAnnouncements.map((announcement) => (
                        <AnnouncementCard 
                          key={announcement.id} 
                          announcement={announcement} 
                          getPriorityColor={getPriorityColor}
                          getCategoryIcon={getCategoryIcon}
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
                        />
                      ))}
                    </div>
                  )}

                  {filteredAnnouncements.length === 0 && (
                    <Card>
                      <CardContent className="text-center py-12">
                        <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No announcements found</h3>
                        <p className="text-gray-600">Try adjusting your search or filter criteria</p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="unread" className="mt-6">
                <div className="space-y-4">
                  {announcements.filter(a => !a.isRead).map((announcement) => (
                    <AnnouncementCard 
                      key={announcement.id} 
                      announcement={announcement} 
                      getPriorityColor={getPriorityColor}
                      getCategoryIcon={getCategoryIcon}
                    />
                  ))}
                  {announcements.filter(a => !a.isRead).length === 0 && (
                    <Card>
                      <CardContent className="text-center py-12">
                        <Check className="h-12 w-12 text-green-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">All caught up!</h3>
                        <p className="text-gray-600">You've read all announcements</p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="pinned" className="mt-6">
                <div className="space-y-4">
                  {pinnedAnnouncements.map((announcement) => (
                    <AnnouncementCard 
                      key={announcement.id} 
                      announcement={announcement} 
                      getPriorityColor={getPriorityColor}
                      getCategoryIcon={getCategoryIcon}
                    />
                  ))}
                  {pinnedAnnouncements.length === 0 && (
                    <Card>
                      <CardContent className="text-center py-12">
                        <Pin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No pinned announcements</h3>
                        <p className="text-gray-600">Important announcements will appear here</p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}

// Announcement Card Component
function AnnouncementCard({ announcement, getPriorityColor, getCategoryIcon }: any) {
  return (
    <Card className={`transition-all hover:shadow-md ${!announcement.isRead ? 'border-blue-200 bg-blue-50/30' : ''}`}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start space-x-3">
            <div className="flex items-center space-x-2">
              {getCategoryIcon(announcement.category)}
              <Badge className={getPriorityColor(announcement.priority)}>
                {announcement.priority}
              </Badge>
              {announcement.isPinned && (
                <Pin className="h-4 w-4 text-blue-600" />
              )}
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-medium mb-2">{announcement.title}</h3>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <span>{announcement.timestamp}</span>
                <span>•</span>
                <span>{announcement.readCount} views</span>
                {announcement.expiresAt && (
                  <>
                    <span>•</span>
                    <span>Expires {new Date(announcement.expiresAt).toLocaleDateString()}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {!announcement.isRead && (
              <div className="h-2 w-2 bg-blue-600 rounded-full"></div>
            )}
            <Button variant="ghost" size="sm">
              <Eye className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Edit className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <p className="text-gray-700 mb-4">{announcement.content}</p>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src="/placeholder-avatar.jpg" />
              <AvatarFallback>
                {announcement.author.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">{announcement.author}</p>
              <p className="text-xs text-gray-600">{announcement.authorRole}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {announcement.attachments.length > 0 && (
              <Button variant="outline" size="sm">
                <Paperclip className="h-4 w-4 mr-1" />
                {announcement.attachments.length}
              </Button>
            )}
            <Button variant="outline" size="sm">
              <Send className="h-4 w-4 mr-1" />
              Share
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}