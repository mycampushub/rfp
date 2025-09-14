"use client"

import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Search, 
  Send, 
  Paperclip, 
  MoreVertical, 
  Clock,
  Check,
  CheckCheck,
  Bell,
  Users,
  Archive,
  MessageSquare
} from "lucide-react"
import { useState } from "react"

export default function MessagesPage() {
  const [selectedMessage, setSelectedMessage] = useState<string | null>(null)
  const [newMessage, setNewMessage] = useState("")

  // Mock data for messages
  const conversations = [
    {
      id: "1",
      name: "Sarah Johnson",
      role: "Procurement Manager",
      avatar: "/placeholder-avatar.jpg",
      lastMessage: "Can you review the IT services RFP?",
      timestamp: "2 min ago",
      unread: 2,
      status: "online"
    },
    {
      id: "2",
      name: "Mike Chen",
      role: "Vendor Coordinator",
      avatar: "/placeholder-avatar.jpg",
      lastMessage: "Vendor responses are looking good",
      timestamp: "1 hour ago",
      unread: 0,
      status: "away"
    },
    {
      id: "3",
      name: "Emily Davis",
      role: "Legal Counsel",
      avatar: "/placeholder-avatar.jpg",
      lastMessage: "Contract terms need review",
      timestamp: "3 hours ago",
      unread: 1,
      status: "offline"
    },
    {
      id: "4",
      name: "Team Procurement",
      role: "Group Chat",
      avatar: "/placeholder-avatar.jpg",
      lastMessage: "Sarah: Meeting scheduled for tomorrow",
      timestamp: "5 hours ago",
      unread: 5,
      status: "group"
    }
  ]

  const messages = [
    {
      id: "1",
      senderId: "other",
      content: "Hi! Can you review the IT services RFP when you get a chance?",
      timestamp: "2:30 PM",
      status: "read"
    },
    {
      id: "2",
      senderId: "me",
      content: "Sure, I'll take a look at it this afternoon. Is there anything specific you want me to focus on?",
      timestamp: "2:32 PM",
      status: "read"
    },
    {
      id: "3",
      senderId: "other",
      content: "Mainly the technical requirements and budget sections. The vendor responses came in higher than expected.",
      timestamp: "2:35 PM",
      status: "read"
    },
    {
      id: "4",
      senderId: "me",
      content: "Got it. I'll review those sections and we can discuss tomorrow's meeting.",
      timestamp: "2:36 PM",
      status: "delivered"
    }
  ]

  const announcements = [
    {
      id: "1",
      title: "System Maintenance Tonight",
      content: "The RFP platform will undergo scheduled maintenance from 10 PM to 2 AM. Some features may be unavailable during this time.",
      priority: "high",
      timestamp: "1 hour ago",
      author: "System Admin"
    },
    {
      id: "2",
      title: "New Vendor Onboarding Process",
      content: "We've streamlined the vendor onboarding process. Please review the updated guidelines in the documentation.",
      priority: "medium",
      timestamp: "3 hours ago",
      author: "Operations Team"
    },
    {
      id: "3",
      title: "Q4 Procurement Goals",
      content: "Reminder: Q4 procurement goals are due next Friday. Please ensure all RFP evaluations are completed.",
      priority: "low",
      timestamp: "1 day ago",
      author: "Management"
    }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online": return "bg-green-500"
      case "away": return "bg-yellow-500"
      case "offline": return "bg-gray-500"
      default: return "bg-gray-500"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-100 text-red-800 border-red-200"
      case "medium": return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "low": return "bg-blue-100 text-blue-800 border-blue-200"
      default: return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  return (
    <MainLayout title="Messages">
      <div className="h-[calc(100vh-8rem)] flex gap-6">
        {/* Left Sidebar - Conversations */}
        <div className="w-80 flex flex-col">
          <Card className="flex-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Messages</CardTitle>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input 
                  placeholder="Search conversations..." 
                  className="pl-10"
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[calc(100vh-16rem)]">
                <div className="space-y-1 p-2">
                  {conversations.map((conversation) => (
                    <div
                      key={conversation.id}
                      className={`p-3 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${
                        selectedMessage === conversation.id ? 'bg-blue-50' : ''
                      }`}
                      onClick={() => setSelectedMessage(conversation.id)}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="relative">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={conversation.avatar} />
                            <AvatarFallback>
                              {conversation.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          {conversation.status !== 'group' && (
                            <div className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white ${getStatusColor(conversation.status)}`} />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium text-sm truncate">{conversation.name}</h4>
                            <span className="text-xs text-gray-500">{conversation.timestamp}</span>
                          </div>
                          <p className="text-xs text-gray-600 truncate">{conversation.role}</p>
                          <div className="flex items-center justify-between mt-1">
                            <p className="text-sm text-gray-700 truncate">{conversation.lastMessage}</p>
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
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
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
                            <AvatarImage src="/placeholder-avatar.jpg" />
                            <AvatarFallback>SJ</AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-medium">Sarah Johnson</h3>
                            <p className="text-sm text-gray-600">Procurement Manager • Online</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button variant="ghost" size="sm">
                            <Bell className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Messages Area */}
                  <Card className="flex-1 flex flex-col">
                    <CardContent className="flex-1 p-4">
                      <ScrollArea className="h-[calc(100vh-20rem)]">
                        <div className="space-y-4">
                          {messages.map((message) => (
                            <div
                              key={message.id}
                              className={`flex ${message.senderId === 'me' ? 'justify-end' : 'justify-start'}`}
                            >
                              <div
                                className={`max-w-[70%] rounded-lg px-4 py-2 ${
                                  message.senderId === 'me'
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-gray-100 text-gray-900'
                                }`}
                              >
                                <p className="text-sm">{message.content}</p>
                                <div className="flex items-center justify-between mt-1">
                                  <span className="text-xs opacity-70">{message.timestamp}</span>
                                  {message.senderId === 'me' && (
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
                      </ScrollArea>
                    </CardContent>

                    {/* Message Input */}
                    <div className="border-t p-4">
                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="sm">
                          <Paperclip className="h-4 w-4" />
                        </Button>
                        <Input
                          placeholder="Type a message..."
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          className="flex-1"
                        />
                        <Button size="sm">
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                </>
              ) : (
                <Card className="flex-1 flex items-center justify-center">
                  <CardContent className="text-center">
                    <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Select a conversation</h3>
                    <p className="text-gray-600">Choose a conversation from the list to start messaging</p>
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
                            <span className="text-sm text-gray-500">{announcement.timestamp}</span>
                          </div>
                          <p className="text-sm text-gray-700 mb-2">{announcement.content}</p>
                          <p className="text-xs text-gray-500">By {announcement.author}</p>
                        </div>
                      ))}
                    </div>
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
                  <div className="text-center py-12">
                    <Archive className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No archived messages</h3>
                    <p className="text-gray-600">Your archived conversations will appear here</p>
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