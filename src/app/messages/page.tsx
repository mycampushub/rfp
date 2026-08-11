"use client"

import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { Search, Send, Paperclip, MoreVertical, Check, CheckCheck, Bell, BellOff, Archive, Trash2, MessageSquare } from "lucide-react"
import { useState, useEffect, useRef } from "react"
import { toast } from "sonner"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface Conversation {
  id: string
  name: string
  lastMessage: string
  time: string
  unread: number
  status: string
}

interface Message {
  id: string
  senderId: string
  content: string
  timestamp: string
  status: string
}

interface Announcement {
  id: string
  title: string
  content: string
  priority: string
  timestamp: string
  author: string
}

export default function MessagesPage() {
  useEffect(() => { document.title = 'Messages | RFP Platform' }, [])
  const [selectedMessage, setSelectedMessage] = useState<string | null>(null)
  const [newMessage, setNewMessage] = useState("")
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [announcementsLoading, setAnnouncementsLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [muteNotifications, setMuteNotifications] = useState<Record<string, boolean>>({})
  const [archivedThreadIds, setArchivedThreadIds] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Fetch threads (conversations)
  useEffect(() => {
    async function fetchThreads() {
      try {
        const res = await fetch("/api/messages/threads")
        if (!res.ok) throw new Error("Failed to fetch threads")
        const data = await res.json()

        const mapped = (data ?? []).map((thread: Record<string, unknown>) => ({
          id: thread.id as string,
          name: (thread.subject as string) || "Untitled",
          lastMessage: (thread.messages as Array<Record<string, unknown>>)?.[0]?.content as string || "No messages yet",
          time: thread.lastMessageAt
            ? new Date(thread.lastMessageAt as string).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
            : "",
          unread: (thread.messages as Array<Record<string, unknown>>)?.[0]?.isRead ? 0 : 1,
          status: "offline",
        }))
        setConversations(mapped)
      } catch (error) {
        console.error("Error fetching threads:", error)
        toast.error("Failed to load conversations")
      } finally {
        setLoading(false)
      }
    }

    fetchThreads()
  }, [])

  // Fetch messages for selected thread
  useEffect(() => {
    if (!selectedMessage) {
      setMessages([])
      return
    }

    async function fetchMessages() {
      setMessagesLoading(true)
      try {
        const res = await fetch(`/api/messages/threads/${selectedMessage}/messages`)
        if (!res.ok) throw new Error("Failed to fetch messages")
        const data = await res.json()

        const mapped = (data ?? []).map((msg: Record<string, unknown>) => ({
          id: msg.id as string,
          senderId: (msg.sender as Record<string, unknown>)?.id as string || "",
          content: msg.content as string,
          timestamp: new Date(msg.createdAt as string).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
          status: msg.isRead ? "read" : "delivered",
        }))
        setMessages(mapped)
      } catch (error) {
        console.error("Error fetching messages:", error)
        toast.error("Failed to load messages")
      } finally {
        setMessagesLoading(false)
      }
    }

    fetchMessages()
  }, [selectedMessage])

  // Fetch announcements for announcements tab
  useEffect(() => {
    async function fetchAnnouncements() {
      try {
        const res = await fetch("/api/announcements")
        if (!res.ok) throw new Error("Failed to fetch announcements")
        const data = await res.json()

        const mapped = (data ?? []).map((ann: Record<string, unknown>) => ({
          id: ann.id as string,
          title: ann.title as string,
          content: ann.message as string,
          priority: "medium",
          timestamp: ann.createdAt
            ? new Date(ann.createdAt as string).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
            : "",
          author: (ann.user as Record<string, unknown>)?.name as string || "Unknown",
        }))
        setAnnouncements(mapped)
      } catch (error) {
        console.error("Error fetching announcements:", error)
      } finally {
        setAnnouncementsLoading(false)
      }
    }

    fetchAnnouncements()
  }, [])

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedMessage || sending) return

    setSending(true)
    try {
      const res = await fetch(`/api/messages/threads/${selectedMessage}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newMessage.trim() }),
      })
      if (!res.ok) throw new Error("Failed to send message")
      const newMsg = await res.json()

      setMessages(prev => [...prev, {
        id: newMsg.id,
        senderId: newMsg.sender?.id || "",
        content: newMsg.content,
        timestamp: new Date(newMsg.createdAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
        status: "delivered",
      }])

      // Update last message in conversation list
      setConversations(prev => prev.map(c =>
        c.id === selectedMessage ? { ...c, lastMessage: newMessage.trim(), time: "Just now" } : c
      ))

      setNewMessage("")
    } catch (error) {
      console.error("Error sending message:", error)
      toast.error("Failed to send message")
    } finally {
      setSending(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online": return "bg-emerald-500"
      case "away": return "bg-amber-500"
      case "offline": return "bg-muted-foreground"
      default: return "bg-muted-foreground"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/30"
      case "medium": return "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30"
      case "low": return "bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30"
      default: return "bg-muted text-foreground border-border"
    }
  }

  const selectedConversation = conversations.find(c => c.id === selectedMessage)

  return (
    <MainLayout title="Messages">
      <h1 className="text-2xl font-bold tracking-tight">Messages</h1>
      <div className="h-[calc(100vh-8rem)] flex gap-6">
        {/* Left Sidebar - Conversations */}
        <div className="w-full md:w-80 flex flex-col">
          <Card className="flex-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Messages</CardTitle>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input 
                  placeholder="Search conversations..." 
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  aria-label="Search conversations"
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[calc(100vh-16rem)]">
                {loading ? (
                  <div className="space-y-2 p-2">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full rounded-lg" />
                    ))}
                  </div>
                ) : (conversations.filter(c => !archivedThreadIds.includes(c.id)).length > 0 || searchQuery ? (
                  <div className="space-y-1 p-2">
                    {conversations
                      .filter(c => !archivedThreadIds.includes(c.id))
                      .filter(c => !searchQuery ||
                        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        c.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
                      )
                      .map((conversation) => (
                      <div
                        key={conversation.id}
                        className={`p-3 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors ${
                          selectedMessage === conversation.id ? 'bg-sky-500/10 dark:bg-sky-500/20' : ''
                        }`}
                        onClick={() => setSelectedMessage(conversation.id)}
                      >
                        <div className="flex items-start space-x-3">
                          <div className="relative">
                            <Avatar className="h-10 w-10">
                              <AvatarFallback>
                                {conversation.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium text-sm truncate">{conversation.name}</h4>
                              <span className="text-xs text-muted-foreground">{conversation.time}</span>
                            </div>
                            <div className="flex items-center justify-between mt-1">
                              <p className="text-sm text-foreground/80 truncate">{conversation.lastMessage}</p>
                              {conversation.unread > 0 && (
                                <Badge className="h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                                  {conversation.unread}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 p-2">
                    <div className="rounded-full bg-muted p-3 mb-3 inline-block">
                      <MessageSquare className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold mb-1">No messages</h3>
                    <p className="text-sm text-muted-foreground">Start a conversation to get going</p>
                  </div>
                ))}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0 flex flex-col">
          <Tabs defaultValue="chat" className="flex-1">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="chat">Chat</TabsTrigger>
              <TabsTrigger value="announcements">Announcements</TabsTrigger>
              <TabsTrigger value="archive">Archive</TabsTrigger>
            </TabsList>

            <TabsContent value="chat" className="flex-1 flex flex-col mt-4">
              {selectedMessage ? (
                <>
                  {/* Chat Header */}
                  <Card className="mb-4">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback>
                              {selectedConversation?.name.split(' ').map(n => n[0]).join('').slice(0, 2) || "???"}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-medium">{selectedConversation?.name || "Conversation"}</h3>
                            <p className="text-sm text-muted-foreground/80">• Online</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button variant="ghost" size="sm" onClick={async () => {
                            if (!selectedMessage) return
                            const newMuted = !muteNotifications[selectedMessage]
                            setMuteNotifications(prev => ({ ...prev, [selectedMessage]: newMuted }))
                            try {
                              const res = await fetch(`/api/messages/threads/${selectedMessage}`, {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ isMuted: newMuted }),
                              })
                              if (!res.ok) throw new Error()
                              toast.success(newMuted ? 'Notifications muted' : 'Notifications enabled')
                            } catch {
                              toast.error('Failed to update notification settings')
                            }
                          }}>
                            {muteNotifications[selectedMessage] ? <BellOff className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={async () => {
                                if (!selectedMessage) return
                                try {
                                  const res = await fetch(`/api/messages/threads/${selectedMessage}`, {
                                    method: 'PATCH',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ isArchived: true }),
                                  })
                                  if (!res.ok) throw new Error()
                                  setArchivedThreadIds(prev => [...prev, selectedMessage])
                                  setSelectedMessage(null)
                                  toast.success('Conversation archived')
                                } catch {
                                  toast.error('Failed to archive conversation')
                                }
                              }}>
                                <Archive className="mr-2 h-4 w-4" />
                                Archive
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={async () => {
                                if (!selectedMessage) return
                                try {
                                  const res = await fetch(`/api/messages/threads/${selectedMessage}`, { method: 'DELETE' })
                                  if (!res.ok) throw new Error()
                                  setConversations(prev => prev.filter(c => c.id !== selectedMessage))
                                  setSelectedMessage(null)
                                  toast.success('Conversation deleted')
                                } catch {
                                  toast.error('Failed to delete conversation')
                                }
                              }}>
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={async () => {
                                if (!selectedMessage) return
                                try {
                                  const res = await fetch(`/api/messages/threads/${selectedMessage}`, {
                                    method: 'PATCH',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ isRead: false }),
                                  })
                                  if (!res.ok) throw new Error()
                                  setConversations(prev => prev.map(c =>
                                    c.id === selectedMessage ? { ...c, unread: 1 } : c
                                  ))
                                  toast.success('Marked as unread')
                                } catch {
                                  toast.error('Failed to mark as unread')
                                }
                              }}>
                                <MessageSquare className="mr-2 h-4 w-4" />
                                Mark as Unread
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Messages Area */}
                  <Card className="flex-1 flex flex-col">
                    <CardContent className="flex-1 p-4" ref={scrollRef}>
                      <ScrollArea className="h-[calc(100vh-20rem)]">
                        {messagesLoading ? (
                          <div className="space-y-4 p-4">
                            {Array.from({ length: 3 }).map((_, i) => (
                              <Skeleton key={i} className={`h-10 w-48 rounded-lg ${i % 2 === 0 ? 'ml-auto' : ''}`} />
                            ))}
                          </div>
                        ) : messages.length > 0 ? (
                          <div className="space-y-4">
                            {messages.map((message) => (
                              <div
                                key={message.id}
                                className={`flex ${message.senderId === 'me' || message.senderId === '' ? 'justify-end' : 'justify-start'}`}
                              >
                                <div
                                  className={`max-w-[70%] rounded-lg px-4 py-2 ${
                                    message.senderId === 'me' || message.senderId === ''
                                      ? 'bg-primary text-white'
                                      : 'bg-muted text-foreground'
                                  }`}
                                >
                                  <p className="text-sm">{message.content}</p>
                                  <div className="flex items-center justify-between mt-1">
                                    <span className="text-xs opacity-70">{message.timestamp}</span>
                                    {(message.senderId === 'me' || message.senderId === '') && (
                                      <div className="ml-2">
                                        {message.status === 'read' ? (
                                          <CheckCheck className="h-3 w-3" />
                                        ) : (
                                          <Check className="h-3 w-3" />
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <div className="rounded-full bg-muted p-3 mb-3 inline-block">
                              <MessageSquare className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <h3 className="text-lg font-semibold mb-1">No messages yet</h3>
                            <p className="text-sm text-muted-foreground">No messages in this conversation yet</p>
                          </div>
                        )}
                      </ScrollArea>
                    </CardContent>

                    {/* Message Input */}
                    <div className="border-t p-4">
                      <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            setNewMessage(prev => prev ? `${prev}\n📎 Attached: ${file.name}` : `📎 Attached: ${file.name}`)
                          }
                          e.target.value = ''
                        }}
                      />
                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="sm" onClick={() => fileInputRef.current?.click()} aria-label="Attach file">
                          <Paperclip className="h-4 w-4" />
                        </Button>
                        <Input
                          placeholder="Type a message..."
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault()
                              handleSendMessage()
                            }
                          }}
                          className="flex-1"
                          disabled={sending}
                          aria-label="Message input"
                        />
                        <Button size="sm" onClick={handleSendMessage} disabled={sending || !newMessage.trim()} aria-label="Send message">
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                </>
              ) : (
                <Card className="flex-1 flex items-center justify-center">
                  <CardContent className="text-center">
                    <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-2">Select a conversation</h3>
                    <p className="text-muted-foreground/80">Choose a conversation from the list to start messaging</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="announcements" className="flex-1 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Bell className="mr-2 h-5 w-5" />
                    Announcements
                  </CardTitle>
                  <CardDescription>
                    Important system-wide announcements and updates
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[calc(100vh-16rem)]">
                    {announcementsLoading ? (
                      <div className="space-y-4 p-4">
                        {Array.from({ length: 2 }).map((_, i) => (
                          <Skeleton key={i} className="h-24 w-full rounded-lg" />
                        ))}
                      </div>
                    ) : announcements.length > 0 ? (
                      <div className="space-y-4">
                        {announcements.map((announcement) => (
                          <div key={announcement.id} className="border rounded-lg p-4">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                <Badge className={getPriorityColor(announcement.priority)}>
                                  {announcement.priority}
                                </Badge>
                                <h4 className="font-medium">{announcement.title}</h4>
                              </div>
                              <span className="text-sm text-muted-foreground">{announcement.timestamp}</span>
                            </div>
                            <p className="text-sm text-foreground/80 mb-2">{announcement.content}</p>
                            <p className="text-xs text-muted-foreground">By {announcement.author}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <div className="rounded-full bg-muted p-3 mb-3 inline-block">
                          <Bell className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-semibold mb-1">No announcements</h3>
                        <p className="text-sm text-muted-foreground">Announcements will appear here</p>
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="archive" className="flex-1 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Archive className="mr-2 h-5 w-5" />
                    Archived Messages
                  </CardTitle>
                  <CardDescription>
                    Your archived conversations and messages
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {conversations.filter(c => archivedThreadIds.includes(c.id)).length > 0 ? (
                      conversations.filter(c => archivedThreadIds.includes(c.id)).map(conversation => (
                        <div key={conversation.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center space-x-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback>{conversation.name.split(' ').map(n => n[0]).join('').slice(0, 2)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <h4 className="text-sm font-medium">{conversation.name}</h4>
                              <p className="text-xs text-muted-foreground">{conversation.lastMessage}</p>
                            </div>
                          </div>
                          <Button variant="ghost" size="sm" onClick={async () => {
                            try {
                              const res = await fetch(`/api/messages/threads/${conversation.id}`, {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ isArchived: false }),
                              })
                              if (!res.ok) throw new Error()
                              setArchivedThreadIds(prev => prev.filter(id => id !== conversation.id))
                              toast.success('Conversation unarchived')
                            } catch {
                              toast.error('Failed to unarchive')
                            }
                          }}>Unarchive</Button>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-12">
                        <div className="rounded-full bg-muted p-3 mb-3 inline-block">
                          <Archive className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-semibold mb-1">No archived messages</h3>
                        <p className="text-sm text-muted-foreground">Your archived conversations will appear here</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </MainLayout>
  )
}
