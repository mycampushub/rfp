"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  MessageSquare, 
  Send, 
  Paperclip, 
  Download,
  Clock,
  CheckCircle,
  AlertCircle,
  User,
  FileText,
  Plus,
  X
} from "lucide-react"

interface BidMessage {
  id: string
  senderId: string
  senderName: string
  senderRole: string
  message: string
  attachments: { name: string; size: string; type: string }[]
  isPublic: boolean
  timestamp: string
}

interface BidMessagingProps {
  bidId: string
  vendorName: string
  organizationName: string
  bidStatus: string
  messages: BidMessage[]
  onSendMessage: (message: string, isPublic: boolean, attachments: File[]) => void
  currentUser: {
    id: string
    name: string
    role: string
    isVendor: boolean
  }
}

export function BidMessaging({ 
  bidId, 
  vendorName, 
  organizationName, 
  bidStatus, 
  messages, 
  onSendMessage, 
  currentUser 
}: BidMessagingProps) {
  const [newMessage, setNewMessage] = useState("")
  const [isPublic, setIsPublic] = useState(false)
  const [attachments, setAttachments] = useState<File[]>([])
  const [activeTab, setActiveTab] = useState("all")

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setAttachments(prev => [...prev, ...files])
  }

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index))
  }

  const handleSendMessage = () => {
    if (newMessage.trim() || attachments.length > 0) {
      onSendMessage(newMessage, isPublic, attachments)
      setNewMessage("")
      setAttachments([])
      setIsPublic(false)
    }
  }

  const filteredMessages = messages.filter(message => {
    if (activeTab === "all") return true
    if (activeTab === "public") return message.isPublic
    if (activeTab === "private") return !message.isPublic
    return true
  })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const getStatusColor = (status: string) => {
    const colors = {
      draft: "bg-gray-100 text-gray-800",
      submitted: "bg-blue-100 text-blue-800",
      reviewed: "bg-yellow-100 text-yellow-800",
      accepted: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
      withdrawn: "bg-purple-100 text-purple-800"
    }
    return colors[status as keyof typeof colors] || "bg-gray-100 text-gray-800"
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center">
                <MessageSquare className="mr-2 h-5 w-5" />
                Bid Communication
              </CardTitle>
              <CardDescription>
                {vendorName} ↔ {organizationName}
              </CardDescription>
            </div>
            <Badge className={getStatusColor(bidStatus)}>
              {bidStatus.charAt(0).toUpperCase() + bidStatus.slice(1)}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Messages */}
        <div className="lg:col-span-3 space-y-4">
          {/* Message Filters */}
          <Card>
            <CardContent className="pt-6">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                  <TabsTrigger value="all">All Messages</TabsTrigger>
                  <TabsTrigger value="public">Public</TabsTrigger>
                  <TabsTrigger value="private">Private</TabsTrigger>
                </TabsList>
              </Tabs>
            </CardContent>
          </Card>

          {/* Message List */}
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {filteredMessages.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No messages yet</h3>
                  <p className="text-muted-foreground">
                    Start the conversation by sending a message below.
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredMessages.map((message) => (
                <Card key={message.id} className={`${
                  message.senderId === currentUser.id ? 'ml-8' : 'mr-8'
                }`}>
                  <CardContent className="pt-4">
                    <div className="space-y-3">
                      {/* Message Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="flex items-center space-x-2">
                            <User className="h-4 w-4" />
                            <span className="font-medium">{message.senderName}</span>
                            <Badge variant="outline" className="text-xs">
                              {message.senderRole}
                            </Badge>
                          </div>
                          {message.isPublic && (
                            <Badge className="bg-blue-100 text-blue-800 text-xs">
                              Public
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>{formatDate(message.timestamp)}</span>
                        </div>
                      </div>

                      {/* Message Content */}
                      {message.message && (
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-sm">{message.message}</p>
                        </div>
                      )}

                      {/* Attachments */}
                      {message.attachments.length > 0 && (
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Attachments</Label>
                          <div className="space-y-1">
                            {message.attachments.map((attachment, index) => (
                              <div key={index} className="flex items-center justify-between p-2 border rounded">
                                <div className="flex items-center space-x-2">
                                  <FileText className="h-4 w-4" />
                                  <div>
                                    <p className="text-sm font-medium">{attachment.name}</p>
                                    <p className="text-xs text-muted-foreground">{attachment.size}</p>
                                  </div>
                                </div>
                                <Button variant="ghost" size="sm">
                                  <Download className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Message Input */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {/* Message Type Toggle */}
                <div className="flex items-center space-x-2">
                  <Label className="text-sm font-medium">Message Type:</Label>
                  <div className="flex space-x-2">
                    <Button
                      variant={!isPublic ? "default" : "outline"}
                      size="sm"
                      onClick={() => setIsPublic(false)}
                    >
                      Private Message
                    </Button>
                    <Button
                      variant={isPublic ? "default" : "outline"}
                      size="sm"
                      onClick={() => setIsPublic(true)}
                    >
                      Public Comment
                    </Button>
                  </div>
                </div>

                {isPublic && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-start space-x-2">
                      <CheckCircle className="h-4 w-4 text-blue-500 mt-0.5" />
                      <div className="text-sm text-blue-800">
                        <p className="font-medium">Public Comment</p>
                        <p>This message will be visible to all marketplace participants and will be part of the public Q&A.</p>
                      </div>
                    </div>
                  </div>
                )}

                {!isPublic && (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                    <div className="flex items-start space-x-2">
                      <AlertCircle className="h-4 w-4 text-gray-500 mt-0.5" />
                      <div className="text-sm text-gray-700">
                        <p className="font-medium">Private Message</p>
                        <p>This message will only be visible to you and the other party involved in this bid.</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Text Input */}
                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message here..."
                    rows={4}
                  />
                </div>

                {/* File Attachments */}
                <div className="space-y-2">
                  <Label>Attachments</Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                    <Paperclip className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm text-gray-600 mb-2">
                      Attach files to your message
                    </p>
                    <Input
                      type="file"
                      multiple
                      onChange={handleFileUpload}
                      className="hidden"
                      id="file-attachment"
                    />
                    <Button type="button" variant="outline" onClick={() => document.getElementById("file-attachment")?.click()}>
                      <Plus className="mr-2 h-4 w-4" />
                      Choose Files
                    </Button>
                  </div>

                  {attachments.length > 0 && (
                    <div className="space-y-2">
                      <Label>Selected Files</Label>
                      <div className="space-y-1">
                        {attachments.map((file, index) => (
                          <div key={index} className="flex items-center justify-between p-2 border rounded">
                            <div className="flex items-center space-x-2">
                              <FileText className="h-4 w-4" />
                              <div>
                                <p className="text-sm font-medium">{file.name}</p>
                                <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeAttachment(index)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Send Button */}
                <Button 
                  onClick={handleSendMessage} 
                  className="w-full"
                  disabled={!newMessage.trim() && attachments.length === 0}
                >
                  <Send className="mr-2 h-4 w-4" />
                  Send {isPublic ? "Public Comment" : "Private Message"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Communication Guidelines */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Guidelines</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-start space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                <p>Be professional and respectful in all communications</p>
              </div>
              <div className="flex items-start space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                <p>Keep messages relevant to the bid and project</p>
              </div>
              <div className="flex items-start space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                <p>Use public comments for general questions</p>
              </div>
              <div className="flex items-start space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                <p>Use private messages for sensitive information</p>
              </div>
            </CardContent>
          </Card>

          {/* Bid Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Bid Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Current Status:</span>
                <Badge className={getStatusColor(bidStatus)}>
                  {bidStatus.charAt(0).toUpperCase() + bidStatus.slice(1)}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Total Messages:</span>
                <span className="text-sm">{messages.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Public Messages:</span>
                <span className="text-sm">{messages.filter(m => m.isPublic).length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Private Messages:</span>
                <span className="text-sm">{messages.filter(m => !m.isPublic).length}</span>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Export Conversation
              </Button>
              <Button variant="outline" className="w-full" size="sm">
                <FileText className="mr-2 h-4 w-4" />
                View Bid Details
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}