"use client"

import { useState, useEffect } from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { EmptyState } from "@/components/shared/empty-state"
import { LoadingTable } from "@/components/shared/loading-table"
import { getStatusColor } from "@/lib/status-utils"
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
import { MessageSquare, Plus, Reply, Eye, CheckCircle, Clock, Filter, Search, User, Globe, Lock, HelpCircle } from "lucide-react"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { formatDate } from "@/lib/utils"

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
  useEffect(() => { document.title = 'Q&A Management | RFP Platform' }, [])
  const [qaItems, setQaItems] = useState<QnAItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [publicFilter, setPublicFilter] = useState<string>("all")
  const [newQuestion, setNewQuestion] = useState("")
  const [newAnswer, setNewAnswer] = useState("")
  const [selectedQa, setSelectedQa] = useState<QnAItem | null>(null)
  const [newQuestionRfpId, setNewQuestionRfpId] = useState("")
  const [activeQaTab, setActiveQaTab] = useState("manage")

  useEffect(() => {
    const fetchQaItems = async () => {
      try {
        const res = await fetch('/api/qna')
        if (!res.ok) throw new Error('Failed to fetch Q&A items')
        const data = await res.json()
        const mapped: QnAItem[] = (Array.isArray(data) ? data : []).map((item: any) => ({
          id: item.id,
          rfpId: item.rfpId || '',
          rfpTitle: item.rfp?.title || 'Unknown RFP',
          question: item.questionText || '',
          answer: item.answerText || undefined,
          isPublic: item.isPublic ?? true,
          status: item.status || 'pending',
          vendorName: item.vendor?.name || undefined,
          vendorEmail: undefined,
          createdAt: item.createdAt || '',
          answeredAt: item.updatedAt || undefined,
        }))
        setQaItems(mapped)
      } catch (err) {
        console.error(err)
        toast.error('Failed to load Q&A items')
      } finally {
        setLoading(false)
      }
    }
    fetchQaItems()
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

  const handleAnswer = async (qaId: string) => {
    if (!newAnswer.trim()) return
    try {
      const res = await fetch(`/api/qna/${qaId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answerText: newAnswer, status: 'answered' }),
      })
      if (!res.ok) throw new Error('Failed to answer question')
      setQaItems(prev => prev.map(item => 
        item.id === qaId 
          ? { 
              ...item, 
              answer: newAnswer,
              status: "answered" as const,
              answeredAt: new Date().toISOString()
            }
          : item
      ))
      setNewAnswer("")
      setSelectedQa(null)
      toast.success('Answer submitted successfully')
    } catch (err) {
      console.error(err)
      toast.error('Failed to submit answer')
    }
  }

  const handlePublish = async (qaId: string) => {
    try {
      const res = await fetch(`/api/qna/${qaId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'published' }),
      })
      if (!res.ok) throw new Error('Failed to publish question')
      setQaItems(prev => prev.map(item => 
        item.id === qaId 
          ? { ...item, status: "published" as const }
          : item
      ))
      toast.success('Question published successfully')
    } catch (err) {
      console.error(err)
      toast.error('Failed to publish question')
    }
  }

  const handleAddQuestion = async () => {
    if (!newQuestion.trim()) {
      toast.error('Please fill in all required fields')
      return
    }
    
    try {
      const res = await fetch('/api/qna', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          rfpId: newQuestionRfpId || qaItems[0]?.rfpId || '', 
          questionText: newQuestion,
          isPublic: true,
        }),
      })
      if (!res.ok) throw new Error('Failed to add question')
      const created = await res.json()
      const mapped: QnAItem = {
        id: created.id,
        rfpId: created.rfpId || '',
        rfpTitle: created.rfp?.title || qaItems[0]?.rfpTitle || 'Unknown RFP',
        question: created.questionText || newQuestion,
        isPublic: created.isPublic ?? true,
        status: 'pending',
        createdAt: created.createdAt || new Date().toISOString(),
      }
      setQaItems(prev => [mapped, ...prev])
      setNewQuestion("")
      toast.success('Question added successfully')
    } catch (err) {
      console.error(err)
      toast.error('Failed to add question')
    }
  }

  if (loading) {
    return (
      <MainLayout title="Q&A Management">
        <LoadingTable rows={5} columns={6} />
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
            <Button variant="outline" onClick={() => setActiveQaTab('add')}>
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
                    aria-label="Search questions"
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
        <Tabs value={activeQaTab} onValueChange={setActiveQaTab} className="space-y-4">
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
                <div className="overflow-x-auto">
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
                              <Globe className="h-3 w-3 text-sky-600 dark:text-sky-400" />
                            ) : (
                              <Lock className="h-3 w-3 text-muted-foreground/80" />
                            )}
                            <span className="text-xs">
                              {qa.isPublic ? "Public" : "Private"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {formatDate(qa.createdAt)}
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
                </div>
                
                {filteredQaItems.length === 0 && (
                  <EmptyState icon={HelpCircle} title="No questions found" description="Start by asking a question about an RFP." action={{ label: "Add Question", onClick: () => setActiveQaTab('add') }} />
                )}
              </CardContent>
            </Card>

            {/* Answer Modal */}
            {selectedQa && (
              <Card className="border-2 border-sky-500/30">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Reply className="mr-2 h-4 w-4" />
                    Answer Question
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Question</Label>
                    <p className="text-foreground/80">{selectedQa.question}</p>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <span>From: {selectedQa.vendorName || "Anonymous"}</span>
                      <span>RFP: {selectedQa.rfpTitle}</span>
                      <span>{formatDate(selectedQa.createdAt)}</span>
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
                    <Button variant="outline" onClick={() => { setSelectedQa(null); setNewAnswer("") }}>
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
                  <Label htmlFor="rfp-select">RFP (optional)</Label>
                  <Select value={newQuestionRfpId} onValueChange={setNewQuestionRfpId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select RFP" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from(new Set(qaItems.map(q => ({ id: q.rfpId, title: q.rfpTitle })))).map(rfp => (
                        <SelectItem key={rfp.id} value={rfp.id}>{rfp.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
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