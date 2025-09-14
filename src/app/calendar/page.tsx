"use client"

import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  Plus,
  ChevronLeft,
  ChevronRight,
  Video,
  Phone,
  MessageSquare,
  FileText,
  AlertCircle
} from "lucide-react"
import { useState } from "react"

export default function CalendarPage() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [view, setView] = useState("month")

  // Mock data for calendar events
  const events = [
    {
      id: "1",
      title: "IT Services RFP Review",
      date: "2024-12-15",
      time: "10:00 AM",
      endTime: "11:30 AM",
      type: "meeting",
      description: "Review technical requirements and vendor proposals",
      location: "Conference Room A",
      attendees: ["Sarah Johnson", "Mike Chen", "Emily Davis"],
      priority: "high",
      status: "confirmed"
    },
    {
      id: "2",
      title: "Vendor Presentation - Cloud Solutions",
      date: "2024-12-15",
      time: "2:00 PM",
      endTime: "3:30 PM",
      type: "presentation",
      description: "Cloud vendor presentation and Q&A session",
      location: "Virtual Meeting",
      attendees: ["Sarah Johnson", "Mike Chen", "David Wilson"],
      priority: "medium",
      status: "confirmed"
    },
    {
      id: "3",
      title: "RFP Deadline - Marketing Services",
      date: "2024-12-20",
      time: "5:00 PM",
      endTime: "",
      type: "deadline",
      description: "Final deadline for marketing services RFP submissions",
      location: "",
      attendees: ["Procurement Team"],
      priority: "high",
      status: "upcoming"
    },
    {
      id: "4",
      title: "Contract Review Meeting",
      date: "2024-12-18",
      time: "9:00 AM",
      endTime: "10:00 AM",
      type: "meeting",
      description: "Legal review of vendor contracts",
      location: "Conference Room B",
      attendees: ["Emily Davis", "Sarah Johnson"],
      priority: "medium",
      status: "confirmed"
    },
    {
      id: "5",
      title: "Budget Planning Session",
      date: "2024-12-22",
      time: "1:00 PM",
      endTime: "3:00 PM",
      type: "meeting",
      description: "Q1 budget planning for procurement activities",
      location: "Conference Room A",
      attendees: ["Management Team", "Sarah Johnson"],
      priority: "low",
      status: "tentative"
    }
  ]

  const getEventsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0]
    return events.filter(event => event.date === dateStr)
  }

  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case "meeting": return <Users className="h-4 w-4" />
      case "presentation": return <Video className="h-4 w-4" />
      case "deadline": return <AlertCircle className="h-4 w-4" />
      default: return <Calendar className="h-4 w-4" />
    }
  }

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case "meeting": return "bg-blue-100 text-blue-800 border-blue-200"
      case "presentation": return "bg-green-100 text-green-800 border-green-200"
      case "deadline": return "bg-red-100 text-red-800 border-red-200"
      default: return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "border-l-red-500"
      case "medium": return "border-l-yellow-500"
      case "low": return "border-l-green-500"
      default: return "border-l-gray-500"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed": return "bg-green-100 text-green-800"
      case "tentative": return "bg-yellow-100 text-yellow-800"
      case "upcoming": return "bg-blue-100 text-blue-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }

  const selectedDateEvents = selectedDate ? getEventsForDate(selectedDate) : []

  return (
    <MainLayout title="Calendar">
      <div className="h-[calc(100vh-8rem)] flex gap-6">
        {/* Calendar View */}
        <div className="flex-1">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Calendar</CardTitle>
                  <CardDescription>
                    Schedule and manage your RFP-related events and deadlines
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm">
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm font-medium">December 2024</span>
                  <Button variant="outline" size="sm">
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    New Event
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <CalendarComponent
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    className="rounded-md border"
                  />
                </div>
                <div>
                  <h3 className="text-lg font-medium mb-4">
                    {selectedDate ? formatDate(selectedDate) : "Select a date"}
                  </h3>
                  <ScrollArea className="h-[400px]">
                    {selectedDateEvents.length > 0 ? (
                      <div className="space-y-3">
                        {selectedDateEvents.map((event) => (
                          <div
                            key={event.id}
                            className={`border rounded-lg p-4 ${getPriorityColor(event.priority)} border-l-4`}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                {getEventTypeIcon(event.type)}
                                <h4 className="font-medium">{event.title}</h4>
                                <Badge className={getEventTypeColor(event.type)}>
                                  {event.type}
                                </Badge>
                              </div>
                              <Badge className={getStatusColor(event.status)}>
                                {event.status}
                              </Badge>
                            </div>
                            
                            <div className="space-y-2 text-sm text-gray-600">
                              <div className="flex items-center space-x-2">
                                <Clock className="h-4 w-4" />
                                <span>
                                  {event.time}
                                  {event.endTime && ` - ${event.endTime}`}
                                </span>
                              </div>
                              
                              {event.location && (
                                <div className="flex items-center space-x-2">
                                  <MapPin className="h-4 w-4" />
                                  <span>{event.location}</span>
                                </div>
                              )}
                              
                              <p className="text-gray-700">{event.description}</p>
                              
                              <div className="flex items-center space-x-2">
                                <Users className="h-4 w-4" />
                                <span>{event.attendees.join(", ")}</span>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-2 mt-3">
                              <Button variant="outline" size="sm">
                                <MessageSquare className="h-4 w-4 mr-1" />
                                Chat
                              </Button>
                              <Button variant="outline" size="sm">
                                <Video className="h-4 w-4 mr-1" />
                                Join
                              </Button>
                              <Button variant="outline" size="sm">
                                <FileText className="h-4 w-4 mr-1" />
                                Details
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No events scheduled</h3>
                        <p className="text-gray-600">No events for this date</p>
                      </div>
                    )}
                  </ScrollArea>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="w-80">
          <Tabs defaultValue="upcoming" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
            </TabsList>

            <TabsContent value="upcoming" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Upcoming Events</CardTitle>
                  <CardDescription>
                    Your next scheduled events and deadlines
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[calc(100vh-20rem)]">
                    <div className="space-y-3">
                      {events
                        .filter(event => event.status === "confirmed" || event.status === "upcoming")
                        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                        .slice(0, 5)
                        .map((event) => (
                          <div key={event.id} className="border rounded-lg p-3">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                {getEventTypeIcon(event.type)}
                                <h4 className="font-medium text-sm">{event.title}</h4>
                              </div>
                              <Badge className={getPriorityColor(event.priority)} variant="outline">
                                {event.priority}
                              </Badge>
                            </div>
                            <div className="text-xs text-gray-600 space-y-1">
                              <div className="flex items-center space-x-1">
                                <Calendar className="h-3 w-3" />
                                <span>{new Date(event.date).toLocaleDateString()}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Clock className="h-3 w-3" />
                                <span>{event.time}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="pending" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Pending Actions</CardTitle>
                  <CardDescription>
                    Events requiring your attention
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[calc(100vh-20rem)]">
                    <div className="space-y-3">
                      {events
                        .filter(event => event.status === "tentative")
                        .map((event) => (
                          <div key={event.id} className="border rounded-lg p-3 border-yellow-200 bg-yellow-50">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                <AlertCircle className="h-4 w-4 text-yellow-600" />
                                <h4 className="font-medium text-sm">{event.title}</h4>
                              </div>
                              <Badge className="bg-yellow-100 text-yellow-800">
                                Tentative
                              </Badge>
                            </div>
                            <div className="text-xs text-gray-600 space-y-1">
                              <div className="flex items-center space-x-1">
                                <Calendar className="h-3 w-3" />
                                <span>{new Date(event.date).toLocaleDateString()}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Clock className="h-3 w-3" />
                                <span>{event.time}</span>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2 mt-2">
                              <Button size="sm" className="text-xs">
                                Accept
                              </Button>
                              <Button variant="outline" size="sm" className="text-xs">
                                Decline
                              </Button>
                            </div>
                          </div>
                        ))}
                      
                      {events.filter(event => event.status === "tentative").length === 0 && (
                        <div className="text-center py-8">
                          <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-4" />
                          <h3 className="text-lg font-medium text-gray-900 mb-2">All caught up!</h3>
                          <p className="text-gray-600">No pending actions</p>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </MainLayout>
  )
}