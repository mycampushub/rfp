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
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { 
  MessageSquare, 
  Plus, 
  Reply, 
  Eye, 
  CheckCircle, 
  Clock,
  AlertCircle,
  Filter,
  Search,
  User,
  Calendar,
  Globe,
  Lock
} from "lucide-react"
import { Label } from "@/components/ui/label"

interface QnAItem {
  id: string
  rfpId: string
  rfpTitle: string
  question: string
  answer?: string
  isPublic: boolean
  status: "pending" | "answered" | "published"
  vendorName?: string
  vendorEmail?: string
  createdAt: string
  answeredAt?: string
}

export default function QnAPage() {
  const [qaItems, setQaItems] = useState<QnAItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [publicFilter, setPublicFilter] = useState<string>("all")
  const [newQuestion, setNewQuestion] = useState("")
  const [newAnswer, setNewAnswer] = useState("")
  const [selectedQa, setSelectedQa] = useState<QnAItem | null>(null)

  // Mock data for demonstration
  const mockQaItems: QnAItem[] = [
    {
      id: "1",
      rfpId: "1",
      rfpTitle: "IT Managed Services 2024",
      question: "What is the expected timeline for implementation?",
      answer: "The implementation timeline is expected to be 3-6 months depending on the scope.",
      isPublic: true,
      status: "published",
      vendorName: "Tech Solutions Inc",
      vendorEmail: "contact@techsolutions.com",
      createdAt: "2024-11-05T10:30:00Z",
      answeredAt: "2024-11-05T14:15:00Z"
    },
    {
      id: "2",
      rfpId: "1",
      rfpTitle: "IT Managed Services 2024",
      question: "Are there any specific certifications required?",
      answer: "ISO 27001 and SOC 2 certifications are required for this engagement.",
      isPublic: true,
      status: "published",
      vendorName: "Global IT Services",
      vendorEmail: "info@globalit.com",
      createdAt: "2024-11-06T14:15:00Z",
      answeredAt: "2024-11-06T16:30:00Z"
    },
    {
      id: "3",
      rfpId: "2",
      rfpTitle: "Marketing Campaign Services",
      question: "Can you provide more details about the target audience?",
      answer: "",
      isPublic: false,
      status: "pending",
      vendorName: "Creative Agency Pro",
      vendorEmail: "hello@creativeagency.com",
      createdAt: "2024-11-07T09:00:00Z"
    },
    {
      id: "4",
      rfpId: "1",
      rfpTitle: "IT Managed Services 2024",
      question: "What are the backup and disaster recovery requirements?",
      answer: "We require 99.9% uptime with automated daily backups and a disaster recovery site with RTO of 4 hours.",
      isPublic: true,
      status: "published",
      vendorName: "Digital Dynamics",
      vendorEmail: "contact@digitaldynamics.com",
      createdAt: "2024-11-08T11:20:00Z",
      answeredAt: "2024-11-08T15:45:00Z"
    },
    {
      id: "5",
      rfpId: "3",
      rfpTitle: "Office Equipment Procurement",
      question: "Are there any specific brand preferences for the equipment?",
      answer: "",
      isPublic: true,
      status: "pending",
      vendorName: "Office Supplies Co",
      vendorEmail: "sales@officesupplies.com",
      createdAt: "2024-11-09T08:45:00Z"
    }
  ]

  useEffect(() => {
    setTimeout(() => {
      setQaItems(mockQaItems)
      setLoading(false)
    }, 1000)
  }, [])

  const filteredQaItems = qaItems.filter(item => {
    const matchesSearch = item.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (item.answer && item.answer.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (item.rfpTitle && item.rfpTitle.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (item.vendorName && item.vendorName.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesStatus = statusFilter === "all" || item.status === statusFilter
    const matchesPublic = publicFilter === "all" || 
                         (publicFilter === "public" && item.isPublic) ||
                         (publicFilter === "private" && !item.isPublic)
    
    return matchesSearch && matchesStatus && matchesPublic
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "published":
        return "bg-green-100 text-green-800"
      case "answered":
        return "bg-blue-100 text-blue-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const handleAnswer = (qaId: string) => {
    if (!newAnswer.trim()) return
    
    setQaItems(prev => prev.map(item => 
      item.id === qaId 
        ? { 
            ...item, 
            answer: newAnswer,
            status: "answered",
            answeredAt: new Date().toISOString()
          }
        : item
    ))
    setNewAnswer("")
    setSelectedQa(null)
  }

  const handlePublish = (qaId: string) => {
    setQaItems(prev => prev.map(item => 
      item.id === qaId 
        ? { ...item, status: "published" }
        : item
    ))
  }

  const handleAddQuestion = () => {
    if (!newQuestion.trim()) return
    
    const newQaItem: QnAItem = {
      id: `qa-${Date.now()}`,
      rfpId: "1", // This should come from context
      rfpTitle: "IT Managed Services 2024",
      question: newQuestion,
      isPublic: true,
      status: "pending",
      createdAt: new Date().toISOString()
    }
    
    setQaItems(prev => [newQaItem, ...prev])
    setNewQuestion("")
  }

  if (loading) {
    return (
      <MainLayout title="Q&A Management">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading Q&A items...</div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout title="Q&A Management">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Questions & Answers</h1>
            <p className="text-muted-foreground">
              Manage vendor questions and provide official responses
            </p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              Add Question
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Questions</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{qaItems.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {qaItems.filter(q => q.status === "pending").length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Answered</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {qaItems.filter(q => q.status === "answered" || q.status === "published").length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Public</CardTitle>
              <Globe className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {qaItems.filter(q => q.isPublic).length}
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
                    placeholder="Search questions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="answered">Answered</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                </SelectContent>
              </Select>
              <Select value={publicFilter} onValueChange={setPublicFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by visibility" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="public">Public</SelectItem>
                  <SelectItem value="private">Private</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Q&A Management */}
        <Tabs defaultValue="manage" className="space-y-4">
          <TabsList>
            <TabsTrigger value="manage">Manage Q&A</TabsTrigger>
            <TabsTrigger value="add">Add Question</TabsTrigger>
          </TabsList>

          <TabsContent value="manage" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Q&A Items</CardTitle>
                <CardDescription>
                  {filteredQaItems.length} question{filteredQaItems.length !== 1 ? 's' : ''} found
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Question</TableHead>
                      <TableHead>RFP</TableHead>
                      <TableHead>Vendor</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Visibility</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredQaItems.map((qa) => (
                      <TableRow key={qa.id}>
                        <TableCell>
                          <div className="max-w-xs">
                            <div className="font-medium truncate">{qa.question}</div>
                            {qa.answer && (
                              <div className="text-sm text-muted-foreground truncate">
                                {qa.answer}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{qa.rfpTitle}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <User className="h-3 w-3" />
                            <span className="text-sm">{qa.vendorName || "Anonymous"}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(qa.status)}>
                            {qa.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            {qa.isPublic ? (
                              <Globe className="h-3 w-3 text-blue-600" />
                            ) : (
                              <Lock className="h-3 w-3 text-gray-600" />
                            )}
                            <span className="text-xs">
                              {qa.isPublic ? "Public" : "Private"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {new Date(qa.createdAt).toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedQa(qa)}
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                            {qa.status === "pending" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedQa(qa)}
                              >
                                <Reply className="h-3 w-3" />
                              </Button>
                            )}
                            {qa.status === "answered" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handlePublish(qa.id)}
                              >
                                <CheckCircle className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                
                {filteredQaItems.length === 0 && (
                  <div className="text-center py-8">
                    <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No questions found matching your filters.</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Answer Modal */}
            {selectedQa && (
              <Card className="border-2 border-blue-200">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Reply className="mr-2 h-4 w-4" />
                    Answer Question
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Question</Label>
                    <p className="text-gray-700">{selectedQa.question}</p>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <span>From: {selectedQa.vendorName || "Anonymous"}</span>
                      <span>RFP: {selectedQa.rfpTitle}</span>
                      <span>{new Date(selectedQa.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="answer">Your Answer</Label>
                    <Textarea
                      id="answer"
                      value={newAnswer}
                      onChange={(e) => setNewAnswer(e.target.value)}
                      placeholder="Type your official response here..."
                      rows={4}
                    />
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setSelectedQa(null)}>
                      Cancel
                    </Button>
                    <Button onClick={() => handleAnswer(selectedQa.id)}>
                      {selectedQa.status === "pending" ? "Answer" : "Update"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="add" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Add New Question</CardTitle>
                <CardDescription>
                  Add a question as if you were a vendor
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new-question">Question</Label>
                  <Textarea
                    id="new-question"
                    value={newQuestion}
                    onChange={(e) => setNewQuestion(e.target.value)}
                    placeholder="Type your question here..."
                    rows={3}
                  />
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleAddQuestion}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Question
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  )
}