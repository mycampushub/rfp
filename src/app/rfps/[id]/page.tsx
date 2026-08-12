"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { Calendar, Users, FileText, MessageSquare, Settings, Clock, User, Building, Building2, FileX, AlertCircle, Eye } from "lucide-react"
import { toast } from "sonner"
import { EmptyState } from "@/components/shared/empty-state"
import { getStatusColor } from "@/lib/status-utils"
import { formatDate } from "@/lib/utils"

interface RFP {
  id: string
  title: string
  status: "draft" | "published" | "closed" | "awarded" | "archived"
  category?: string
  budget?: string
  confidentiality: "internal" | "confidential" | "restricted"
  description?: string
  publishAt?: string
  closeAt?: string
  createdAt: string
  updatedAt: string
  timeline?: {
    qnaStart?: string
    qnaEnd?: string
    submissionDeadline?: string
    evaluationStart?: string
    awardTarget?: string
  }
  team: Array<{
    id: string
    name: string
    email: string
    role: string
  }>
  vendors: Array<{
    id: string
    name: string
    email: string
    status: string
  }>
  sections: Array<{
    id: string
    title: string
    description?: string
    questionCount: number
  }>
  qa: Array<{
    id: string
    question: string
    answer?: string
    isPublic: boolean
    vendor?: string
    createdAt: string
  }>
}

interface SubmissionItem {
  id: string
  status: string
  submittedAt: string | null
  createdAt: string
  vendor: { id: string; name: string } | null
  _count?: { answers: number; scores: number }
}

export default function RFPDetailPage() {
  const params = useParams()
  useEffect(() => { document.title = 'RFP Details | RFP Platform' }, [])
  const router = useRouter()
  const [rfp, setRfp] = useState<RFP | null>(null)
  const [loading, setLoading] = useState(true)
  const [publishing, setPublishing] = useState(false)
  const [submissions, setSubmissions] = useState<SubmissionItem[]>([])
  const [submissionsLoading, setSubmissionsLoading] = useState(false)

  useEffect(() => {
    async function fetchRfp() {
      try {
        setLoading(true)
        const res = await fetch(`/api/rfps/${params.id}`)
        if (!res.ok) {
          if (res.status === 404) {
            setRfp(null)
            return
          }
          throw new Error(`Failed to fetch RFP (${res.status})`)
        }
        const data = await res.json()

        // Map API response to UI shape
        const mapped: RFP = {
          id: data.id,
          title: data.title,
          status: data.status,
          category: data.category || undefined,
          budget: data.budget != null ? `$${data.budget.toLocaleString()}` : undefined,
          confidentiality: data.confidentiality || "internal",
          description: data.description || undefined,
          publishAt: data.publishAt || undefined,
          closeAt: data.timeline?.submissionDeadline || data.closeAt || undefined,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
          timeline: data.timeline
            ? {
                qnaStart: data.timeline.qnaStart || undefined,
                qnaEnd: data.timeline.qnaEnd || undefined,
                submissionDeadline: data.timeline.submissionDeadline || undefined,
                evaluationStart: data.timeline.evaluationStart || undefined,
                awardTarget: data.timeline.awardTarget || undefined,
              }
            : undefined,
          team: (data.teams || []).map((t: { id: string; user?: { id?: string; name?: string; email?: string }; role?: string }) => ({
            id: t.id,
            name: t.user?.name || "Unknown",
            email: t.user?.email || "",
            role: t.role || "member",
          })),
          vendors: (data.invitations || []).map((inv: { id: string; vendor?: { id?: string; name?: string; email?: string }; email?: string; status?: string }) => ({
            id: inv.vendor?.id || inv.id,
            name: inv.vendor?.name || inv.email || "Unknown Vendor",
            email: inv.vendor?.email || inv.email || "",
            status: inv.status || "pending",
          })),
          sections: (data.sections || []).map((s: { id: string; title?: string; description?: string; questions?: unknown[] }) => ({
            id: s.id,
            title: s.title || "Untitled",
            description: s.description || undefined,
            questionCount: s.questions?.length || 0,
          })),
          qa: (data.qna || []).map((q: { id: string; questionText?: string; answerText?: string; isPublic?: boolean; vendor?: { name?: string }; createdAt?: string }) => ({
            id: q.id,
            question: q.questionText || "",
            answer: q.answerText || undefined,
            isPublic: q.isPublic ?? true,
            vendor: q.vendor?.name || undefined,
            createdAt: q.createdAt || "",
          })),
        }

        setRfp(mapped)
        fetchSubmissions()
      } catch (error) {
        console.error("Error fetching RFP:", error)
        toast.error("Failed to load RFP details")
        setRfp(null)
      } finally {
        setLoading(false)
      }
    }
    fetchRfp()
  }, [params.id])

  const handlePublish = async () => {
    if (!rfp) return
    try {
      setPublishing(true)
      const res = await fetch(`/api/rfps/${rfp.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "published" }),
      })
      if (!res.ok) throw new Error(`Failed to publish RFP (${res.status})`)
      toast.success("RFP published successfully!")
      setRfp({ ...rfp, status: "published" })
    } catch (error) {
      console.error("Error publishing RFP:", error)
      toast.error("Failed to publish RFP")
    } finally {
      setPublishing(false)
    }
  }

  const fetchSubmissions = async () => {
    try {
      setSubmissionsLoading(true)
      const res = await fetch(`/api/v1/submissions?rfpId=${params.id}&limit=50`)
      if (res.ok) {
        const json = await res.json()
        setSubmissions(json.data || [])
      }
    } catch (err) {
      console.error("Error fetching submissions:", err)
      toast.error('Failed to load submissions')
    } finally {
      setSubmissionsLoading(false)
    }
  }

  const handleEdit = () => {
    router.push('/rfps/' + rfp.id + '/edit')
  }

  if (loading) {
    return (
      <MainLayout title="RFP Details">
        <div className="space-y-6">
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <div className="flex items-center space-x-3">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-6 w-24" />
              </div>
              <Skeleton className="h-4 w-96" />
            </div>
            <div className="flex space-x-2">
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-10 w-24" />
            </div>
          </div>
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-12 w-full" />
          <div className="grid gap-4 md:grid-cols-2">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        </div>
      </MainLayout>
    )
  }

  if (!rfp) {
    return (
      <MainLayout title="RFP Details">
        <EmptyState 
          icon={FileX}
          title="RFP not found"
          description="The RFP you're looking for doesn't exist or has been removed."
          action={{ label: "Back to RFPs", onClick: () => router.push('/rfps') }}
        />
      </MainLayout>
    )
  }

  return (
    <MainLayout title={rfp.title}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <h1 className="text-2xl font-bold">{rfp.title}</h1>
              <Badge className={getStatusColor(rfp.status)}>
                {rfp.status}
              </Badge>
            </div>
            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              <span>Category: {rfp.category || "Uncategorized"}</span>
              <span>•</span>
              <span>Budget: {rfp.budget || "Not specified"}</span>
              <span>•</span>
              <span>Created: {formatDate(rfp.createdAt)}</span>
            </div>
          </div>
          <div className="flex space-x-2">
            {(rfp.status === "draft" || rfp.status === "published") && (
              <Button variant="outline" onClick={handleEdit}>Edit RFP</Button>
            )}
            {rfp.status === "draft" && (
              <Button onClick={handlePublish} disabled={publishing}>
                {publishing ? "Publishing..." : "Publish"}
              </Button>
            )}
          </div>
        </div>

        {/* Description */}
        {rfp.description && (
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-foreground/80">{rfp.description}</p>
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="flex flex-wrap gap-1">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="teams">Teams</TabsTrigger>
            <TabsTrigger value="sections">Sections</TabsTrigger>
            <TabsTrigger value="vendors">Vendors</TabsTrigger>
            <TabsTrigger value="qa">Q&A</TabsTrigger>
            <TabsTrigger value="submissions">Submissions</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Calendar className="mr-2 h-4 w-4" />
                    Key Dates
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Published:</span>
                    <span className="text-sm">
                      {rfp.publishAt ? formatDate(rfp.publishAt) : "Not published"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Submission Deadline:</span>
                    <span className="text-sm text-red-600 dark:text-red-400">
                      {rfp.closeAt ? formatDate(rfp.closeAt) : "Not set"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Q&A Period:</span>
                    <span className="text-sm">
                      {rfp.timeline?.qnaStart && rfp.timeline.qnaEnd 
                        ? `${formatDate(rfp.timeline.qnaStart)} - ${formatDate(rfp.timeline.qnaEnd)}`
                        : "Not set"
                      }
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Award Target:</span>
                    <span className="text-sm">
                      {rfp.timeline?.awardTarget ? formatDate(rfp.timeline.awardTarget) : "Not set"}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Users className="mr-2 h-4 w-4" />
                    Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Team Members:</span>
                    <span className="text-sm">{rfp.team.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Invited Vendors:</span>
                    <span className="text-sm">{rfp.vendors.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Sections:</span>
                    <span className="text-sm">{rfp.sections.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Q&A Items:</span>
                    <span className="text-sm">{rfp.qa.length}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="timeline" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Project Timeline</CardTitle>
                <CardDescription>Important dates and milestones for this RFP</CardDescription>
              </CardHeader>
              <CardContent>
                {rfp.timeline ? (
                  <div className="space-y-4">
                    {Object.entries(rfp.timeline).map(([key, value]) => {
                      if (!value) return null
                      
                      const labels: Record<string, string> = {
                        qnaStart: "Q&A Start",
                        qnaEnd: "Q&A End", 
                        submissionDeadline: "Submission Deadline",
                        evaluationStart: "Evaluation Start",
                        awardTarget: "Award Target"
                      }
                      
                      return (
                        <div key={key} className="flex items-center space-x-3">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <div className="flex-1">
                            <div className="font-medium">{labels[key]}</div>
                            <div className="text-sm text-muted-foreground">
                              {new Date(value).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <EmptyState icon={Clock} title="No timeline events" />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="teams" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Team Members</CardTitle>
                <CardDescription>People involved in this RFP process</CardDescription>
              </CardHeader>
              <CardContent>
                {rfp.team.length > 0 ? (
                  <div className="space-y-4">
                    {rfp.team.map((member) => (
                      <div key={member.id} className="flex items-center space-x-4 p-3 border rounded-lg">
                        <div className="flex items-center space-x-3 flex-1">
                          <div className="w-8 h-8 bg-muted-foreground/20 rounded-full flex items-center justify-center">
                            <User className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="font-medium">{member.name}</div>
                            <div className="text-sm text-muted-foreground">{member.email}</div>
                          </div>
                        </div>
                        <Badge variant="outline">{member.role}</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState icon={Users} title="No team members" />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sections" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>RFP Sections</CardTitle>
                <CardDescription>Content sections and requirements</CardDescription>
              </CardHeader>
              <CardContent>
                {rfp.sections.length > 0 ? (
                  <div className="space-y-3">
                    {rfp.sections.map((section) => (
                      <div key={section.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <div className="font-medium">{section.title}</div>
                          {section.description && (
                            <div className="text-sm text-muted-foreground">{section.description}</div>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {section.questionCount} questions
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState icon={FileText} title="No sections" />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="vendors" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Invited Vendors</CardTitle>
                <CardDescription>Vendors invited to participate in this RFP</CardDescription>
              </CardHeader>
              <CardContent>
                {rfp.vendors.length > 0 ? (
                  <div className="space-y-4">
                    {rfp.vendors.map((vendor) => (
                      <div key={vendor.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Building className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="font-medium">{vendor.name}</div>
                            <div className="text-sm text-muted-foreground">{vendor.email}</div>
                          </div>
                        </div>
                        <Badge className={getStatusColor(vendor.status)}>
                          {vendor.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState icon={Building2} title="No vendors" />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="qa" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Questions & Answers</CardTitle>
                <CardDescription>Vendor questions and official responses</CardDescription>
              </CardHeader>
              <CardContent>
                {rfp.qa.length > 0 ? (
                  <div className="space-y-4">
                    {rfp.qa.map((qa) => (
                      <div key={qa.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <MessageSquare className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">{qa.vendor || "Anonymous"}</span>
                            <Badge variant={qa.isPublic ? "default" : "secondary"}>
                              {qa.isPublic ? "Public" : "Private"}
                            </Badge>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(qa.createdAt)}
                          </span>
                        </div>
                        <div className="mb-3">
                          <p className="text-sm font-medium">Q: {qa.question}</p>
                        </div>
                        {qa.answer && (
                          <div className="bg-muted/50 p-3 rounded">
                            <p className="text-sm"><strong>A:</strong> {qa.answer}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState icon={MessageSquare} title="No questions" />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="submissions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Vendor Submissions</CardTitle>
                <CardDescription>Track and evaluate vendor proposals</CardDescription>
              </CardHeader>
              <CardContent>
                {submissionsLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="space-y-2 flex-1">
                          <Skeleton className="h-4 w-40" />
                          <Skeleton className="h-3 w-28" />
                        </div>
                        <Skeleton className="h-6 w-20" />
                      </div>
                    ))}
                  </div>
                ) : submissions.length === 0 ? (
                  <div className="text-center py-8">
                    <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No submissions yet. Submissions will appear here when vendors submit their proposals.</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {submissions.map((sub) => (
                      <div key={sub.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                          <Building className="h-4 w-4 text-muted-foreground shrink-0" />
                          <div className="min-w-0">
                            <div className="font-medium truncate">{sub.vendor?.name || "Unknown Vendor"}</div>
                            <div className="text-sm text-muted-foreground">
                              {sub.submittedAt
                                ? formatDate(sub.submittedAt)
                                : formatDate(sub.createdAt)}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 shrink-0">
                          <Badge className={getStatusColor(sub.status)}>{sub.status}</Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push(`/submissions/${sub.id}`)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>RFP Settings</CardTitle>
                <CardDescription>Configure RFP properties and options</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Confidentiality Level</div>
                      <div className="text-sm text-muted-foreground">Access control for this RFP</div>
                    </div>
                    <Badge>{rfp.confidentiality}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Status</div>
                      <div className="text-sm text-muted-foreground">Current RFP status</div>
                    </div>
                    <Badge className={getStatusColor(rfp.status)}>{rfp.status}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  )
}