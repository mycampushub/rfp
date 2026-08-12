"use client"

import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { Calendar, Clock, MapPin, Users, Plus, ChevronLeft, ChevronRight, Video, MessageSquare, FileText, AlertCircle, CheckCircle } from "lucide-react"
import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { formatDate as formatDateDisplay } from "@/lib/utils"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface CalendarEvent {
  id: string
  title: string
  description?: string | null
  startDate: string
  endDate?: string | null
  type: string
  status: string
  location?: string | null
  meetingUrl?: string | null
}

export default function CalendarPage() {
  useEffect(() => { document.title = 'Calendar | RFP Platform' }, [])
  const router = useRouter()
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [currentDate, setCurrentDate] = useState<Date>(new Date())
  const [view, setView] = useState("month")
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateEventDialog, setShowCreateEventDialog] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)

  // New event form state
  const [newEventTitle, setNewEventTitle] = useState("")
  const [newEventDescription, setNewEventDescription] = useState("")
  const [newEventStartDate, setNewEventStartDate] = useState("")
  const [newEventEndDate, setNewEventEndDate] = useState("")
  const [newEventType, setNewEventType] = useState("meeting")
  const [newEventLocation, setNewEventLocation] = useState("")
  const [newEventMeetingUrl, setNewEventMeetingUrl] = useState("")
  const [creatingEvent, setCreatingEvent] = useState(false)

  const toDateStr = (date: string) => {
    return new Date(date).toISOString().split('T')[0]
  }

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  }

  const getEventsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0]
    return events.filter(event => toDateStr(event.startDate) === dateStr)
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
      case "meeting": return "bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30"
      case "presentation": return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
      case "deadline": return "bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/30"
      default: return "bg-muted text-foreground border-border"
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
      case "confirmed": return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
      case "tentative": return "bg-amber-500/15 text-amber-700 dark:text-amber-300"
      case "upcoming": return "bg-sky-500/15 text-sky-700 dark:text-sky-300"
      default: return "bg-muted text-foreground"
    }
  }

  const formatDisplayDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }

  const fetchEvents = useCallback(async () => {
    try {
      const res = await fetch("/api/calendar-events")
      if (!res.ok) throw new Error("Failed to fetch events")
      const data = await res.json()
      setEvents(data ?? [])
    } catch (error) {
      console.error("Error fetching calendar events:", error)
      toast.error("Failed to load calendar events")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  const resetCreateEventForm = () => {
    setNewEventTitle("")
    setNewEventDescription("")
    setNewEventStartDate("")
    setNewEventEndDate("")
    setNewEventType("meeting")
    setNewEventLocation("")
    setNewEventMeetingUrl("")
  }

  const handleCreateEvent = async () => {
    if (!newEventTitle.trim() || !newEventStartDate) {
      toast.error("Title and start date are required")
      return
    }
    if (newEventEndDate && new Date(newEventEndDate) < new Date(newEventStartDate)) {
      toast.error("End date cannot be before start date")
      return
    }
    setCreatingEvent(true)
    try {
      const payload: Record<string, string> = {
        title: newEventTitle.trim(),
        startDate: new Date(newEventStartDate).toISOString(),
        type: newEventType,
        status: "upcoming",
      }
      if (newEventDescription.trim()) payload.description = newEventDescription.trim()
      if (newEventEndDate) payload.endDate = new Date(newEventEndDate).toISOString()
      if (newEventLocation.trim()) payload.location = newEventLocation.trim()
      if (newEventMeetingUrl.trim()) payload.meetingUrl = newEventMeetingUrl.trim()

      const res = await fetch("/api/calendar-events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error("Failed to create event")
      const newEvent = await res.json()
      setEvents(prev => [...prev, newEvent])
      toast.success("Event created successfully")
      setShowCreateEventDialog(false)
      resetCreateEventForm()
    } catch (error) {
      console.error("Error creating event:", error)
      toast.error("Failed to create event")
    } finally {
      setCreatingEvent(false)
    }
  }

  const handleUpdateEventStatus = async (eventId: string, status: string) => {
    try {
      const res = await fetch(`/api/calendar-events/${eventId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error("Failed to update event")
      setEvents(prev =>
        prev.map(ev => (ev.id === eventId ? { ...ev, status } : ev))
      )
      toast.success(`Event ${status === "confirmed" ? "accepted" : "declined"}`)
    } catch (error) {
      console.error("Error updating event:", error)
      toast.error("Failed to update event")
    }
  }

  const selectedDateEvents = selectedDate ? getEventsForDate(selectedDate) : []

  return (
    <MainLayout title="Calendar">
      <h1 className="text-2xl font-bold tracking-tight">Calendar</h1>
      <div className="h-auto md:h-[calc(100vh-8rem)] flex flex-col md:flex-row gap-6">
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
                  <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))} aria-label="Previous month">
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm font-medium">{currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                  <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))} aria-label="Next month">
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button size="sm" onClick={() => setShowCreateEventDialog(true)}>
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
                    {selectedDate ? formatDisplayDate(selectedDate) : "Select a date"}
                  </h3>
                  <ScrollArea className="h-[400px]">
                    {loading ? (
                      <div className="space-y-3">
                        {Array.from({ length: 3 }).map((_, i) => (
                          <Skeleton key={i} className="h-32 w-full rounded-lg" />
                        ))}
                      </div>
                    ) : selectedDateEvents.length > 0 ? (
                      <div className="space-y-3">
                        {selectedDateEvents.map((event) => (
                          <div
                            key={event.id}
                            className={`border rounded-lg p-4 ${getPriorityColor("medium")} border-l-4`}
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
                            
                            <div className="space-y-2 text-sm text-muted-foreground/80">
                              <div className="flex items-center space-x-2">
                                <Clock className="h-4 w-4" />
                                <span>
                                  {formatTime(event.startDate)}
                                  {event.endDate && ` - ${formatTime(event.endDate)}`}
                                </span>
                              </div>
                              
                              {event.location && (
                                <div className="flex items-center space-x-2">
                                  <MapPin className="h-4 w-4" />
                                  <span>{event.location}</span>
                                </div>
                              )}
                              
                              {event.description && <p className="text-foreground/80">{event.description}</p>}
                            </div>
                            
                            <div className="flex items-center space-x-2 mt-3">
                              <Button variant="outline" size="sm" onClick={() => router.push("/messages")}>
                                <MessageSquare className="h-4 w-4 mr-1" />
                                Chat
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => {
                                if (event.meetingUrl) {
                                  window.open(event.meetingUrl, "_blank")
                                } else {
                                  toast.info("No meeting URL available")
                                }
                              }}>
                                <Video className="h-4 w-4 mr-1" />
                                Join
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => setSelectedEvent(event)}>
                                <FileText className="h-4 w-4 mr-1" />
                                Details
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-foreground mb-2">No events scheduled</h3>
                        <p className="text-muted-foreground/80">No events for this date</p>
                      </div>
                    )}
                  </ScrollArea>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="w-full md:w-80 shrink-0">
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
                    {loading ? (
                      <div className="space-y-3">
                        {Array.from({ length: 3 }).map((_, i) => (
                          <Skeleton key={i} className="h-20 w-full rounded-lg" />
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {events
                          .filter(event => event.status === "confirmed" || event.status === "upcoming")
                          .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
                          .slice(0, 5)
                          .map((event) => (
                            <div key={event.id} className="border rounded-lg p-3">
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center space-x-2">
                                  {getEventTypeIcon(event.type)}
                                  <h4 className="font-medium text-sm">{event.title}</h4>
                                </div>
                                <Badge className={getPriorityColor("medium")} variant="outline">
                                  medium
                                </Badge>
                              </div>
                              <div className="text-xs text-muted-foreground/80 space-y-1">
                                <div className="flex items-center space-x-1">
                                  <Calendar className="h-3 w-3" />
                                  <span>{formatDateDisplay(event.startDate)}</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <Clock className="h-3 w-3" />
                                  <span>{formatTime(event.startDate)}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        {events.filter(event => event.status === "confirmed" || event.status === "upcoming").length === 0 && (
                          <div className="text-center py-8">
                            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-foreground mb-2">No upcoming events</h3>
                            <p className="text-muted-foreground/80">Create a new event to get started</p>
                          </div>
                        )}
                      </div>
                    )}
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
                      {loading ? (
                        Array.from({ length: 2 }).map((_, i) => (
                          <Skeleton key={i} className="h-24 w-full rounded-lg" />
                        ))
                      ) : (
                        <>
                          {events
                            .filter(event => event.status === "tentative")
                            .map((event) => (
                              <div key={event.id} className="border rounded-lg p-3 border-amber-500/30 dark:border-amber-500/40 bg-amber-500/10 dark:bg-amber-500/20">
                                <div className="flex items-start justify-between mb-2">
                                  <div className="flex items-center space-x-2">
                                    <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                                    <h4 className="font-medium text-sm">{event.title}</h4>
                                  </div>
                                  <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300">
                                    Tentative
                                  </Badge>
                                </div>
                                <div className="text-xs text-muted-foreground/80 space-y-1">
                                  <div className="flex items-center space-x-1">
                                    <Calendar className="h-3 w-3" />
                                    <span>{formatDateDisplay(event.startDate)}</span>
                                  </div>
                                  <div className="flex items-center space-x-1">
                                    <Clock className="h-3 w-3" />
                                    <span>{formatTime(event.startDate)}</span>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2 mt-2">
                                  <Button size="sm" className="text-xs" onClick={() => handleUpdateEventStatus(event.id, "confirmed")}>
                                    Accept
                                  </Button>
                                  <Button variant="outline" size="sm" className="text-xs" onClick={() => handleUpdateEventStatus(event.id, "declined")}>
                                    Decline
                                  </Button>
                                </div>
                              </div>
                            ))}
                          
                          {events.filter(event => event.status === "tentative").length === 0 && (
                            <div className="text-center py-8">
                              <CheckCircle className="h-12 w-12 text-emerald-400 mx-auto mb-4" />
                              <h3 className="text-lg font-medium text-foreground mb-2">All caught up!</h3>
                              <p className="text-muted-foreground/80">No pending actions</p>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Create Event Dialog */}
      <Dialog open={showCreateEventDialog} onOpenChange={(open) => {
        setShowCreateEventDialog(open)
        if (!open) resetCreateEventForm()
      }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create New Event</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="event-title">Title *</Label>
              <Input
                id="event-title"
                value={newEventTitle}
                onChange={(e) => setNewEventTitle(e.target.value)}
                placeholder="Event title"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="event-description">Description</Label>
              <Textarea
                id="event-description"
                value={newEventDescription}
                onChange={(e) => setNewEventDescription(e.target.value)}
                placeholder="Optional description"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="event-start">Start Date *</Label>
                <Input
                  id="event-start"
                  type="datetime-local"
                  value={newEventStartDate}
                  onChange={(e) => setNewEventStartDate(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="event-end">End Date</Label>
                <Input
                  id="event-end"
                  type="datetime-local"
                  value={newEventEndDate}
                  onChange={(e) => setNewEventEndDate(e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="event-type">Type</Label>
                <Select value={newEventType} onValueChange={setNewEventType}>
                  <SelectTrigger id="event-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="meeting">Meeting</SelectItem>
                    <SelectItem value="deadline">Deadline</SelectItem>
                    <SelectItem value="reminder">Reminder</SelectItem>
                    <SelectItem value="review">Review</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="event-location">Location</Label>
                <Input
                  id="event-location"
                  value={newEventLocation}
                  onChange={(e) => setNewEventLocation(e.target.value)}
                  placeholder="Optional location"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="event-meeting-url">Meeting URL</Label>
              <Input
                id="event-meeting-url"
                value={newEventMeetingUrl}
                onChange={(e) => setNewEventMeetingUrl(e.target.value)}
                placeholder="https://zoom.us/..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowCreateEventDialog(false); resetCreateEventForm() }}>Cancel</Button>
            <Button onClick={handleCreateEvent} disabled={creatingEvent}>
              {creatingEvent ? "Creating..." : "Create Event"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Event Details Dialog */}
      <Dialog open={!!selectedEvent} onOpenChange={(open) => { if (!open) setSelectedEvent(null) }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{selectedEvent?.title}</DialogTitle>
          </DialogHeader>
          {selectedEvent && (
            <div className="grid gap-4 py-4">
              <div className="flex items-center gap-2">
                <Badge className={getEventTypeColor(selectedEvent.type)}>{selectedEvent.type}</Badge>
                <Badge className={getStatusColor(selectedEvent.status)}>{selectedEvent.status}</Badge>
              </div>
              {selectedEvent.description && (
                <div>
                  <p className="text-sm font-medium mb-1">Description</p>
                  <p className="text-sm text-muted-foreground">{selectedEvent.description}</p>
                </div>
              )}
              <Separator />
              <div className="grid gap-3">
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{formatTime(selectedEvent.startDate)}</span>
                  {selectedEvent.endDate && <span>- {formatTime(selectedEvent.endDate)}</span>}
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{formatDateDisplay(selectedEvent.startDate)}</span>
                </div>
                {selectedEvent.location && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedEvent.location}</span>
                  </div>
                )}
                {selectedEvent.meetingUrl && (
                  <div className="flex items-center gap-2 text-sm">
                    <Video className="h-4 w-4 text-muted-foreground" />
                    <a href={selectedEvent.meetingUrl} target="_blank" rel="noopener noreferrer" className="text-primary underline">
                      {selectedEvent.meetingUrl}
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedEvent(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  )
}
