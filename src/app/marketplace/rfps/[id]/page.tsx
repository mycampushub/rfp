"use client"

import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  ArrowLeft, 
  Star, 
  Clock, 
  DollarSign, 
  Building,
  Users,
  Calendar,
  MapPin,
  FileText,
  MessageSquare,
  CheckCircle,
  AlertCircle,
  Download,
  Share2,
  BookmarkPlus,
  BookmarkCheck,
  ExternalLink
} from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import Link from "next/link"
import { useState, useEffect } from "react"
import { toast } from "sonner"
import { use } from "react"
import { getStatusColor } from "@/lib/status-utils"

export default function RFPDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [rfp, setRfp] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submittingBid, setSubmittingBid] = useState(false)
  const [bidAmount, setBidAmount] = useState("")
  const [bidProposal, setBidProposal] = useState("")
  const [showBidForm, setShowBidForm] = useState(false)
  const [activeTab, setActiveTab] = useState("overview")
  const [isSaved, setIsSaved] = useState(false)
  const [showQuestionDialog, setShowQuestionDialog] = useState(false)
  const [questionText, setQuestionText] = useState("")
  const [submittingQuestion, setSubmittingQuestion] = useState(false)

  useEffect(() => {
    async function fetchRFP() {
      try {
        const res = await fetch(`/api/v1/rfps/${id}`)
        if (!res.ok) throw new Error("Failed to fetch")
        const data = await res.json()
        setRfp({
          id: data.id,
          title: data.title,
          organization: data.title,
          description: data.description || "No description available.",
          budget: data.budget ? `$${data.budget.toLocaleString()}` : "Not specified",
          deadline: data.timeline?.submissionDeadline
            ? new Date(data.timeline.submissionDeadline).toISOString().split("T")[0]
            : "TBD",
          category: data.category || "Uncategorized",
          location: "Remote",
          bids: data._count?.submissions ?? 0,
          featured: false,
          postedDate: new Date(data.createdAt).toISOString().split("T")[0],
          complexity: "Medium",
          status: data.status || "active",
          requirements: [],
          deliverables: [],
          timeline: data.timeline ? [
            data.timeline.qnaStart && { phase: "Q&A Period", duration: "Varies", start: new Date(data.timeline.qnaStart).toISOString().split("T")[0] },
            data.timeline.submissionDeadline && { phase: "Submission Deadline", duration: "Varies", start: new Date(data.timeline.submissionDeadline).toISOString().split("T")[0] },
            data.timeline.evaluationStart && { phase: "Evaluation", duration: "Varies", start: new Date(data.timeline.evaluationStart).toISOString().split("T")[0] },
            data.timeline.awardTarget && { phase: "Award Target", duration: "Varies", start: new Date(data.timeline.awardTarget).toISOString().split("T")[0] },
          ].filter(Boolean) : [],
          evaluationCriteria: [],
          attachments: [],
          similarRFPs: [],
          organizationInfo: {
            name: data.title,
            description: "",
            website: "",
          }
        })
      } catch {
        toast.error("Failed to load RFP details")
      } finally {
        setLoading(false)
      }
    }
    fetchRFP()
  }, [id])

  const handleSubmitBid = async () => {
    if (!bidAmount) {
      toast.error("Please enter a bid amount")
      return
    }
    setSubmittingBid(true)
    try {
      const payload: Record<string, unknown> = {
        publicRfpId: id,
        amount: parseFloat(bidAmount),
        proposal: bidProposal,
      }
      const res = await fetch("/api/bids", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Failed to submit bid" }))
        throw new Error(data.error || "Failed to submit bid")
      }
      toast.success("Bid submitted successfully!")
      setShowBidForm(false)
      setBidAmount("")
      setBidProposal("")
    } catch (error: any) {
      toast.error(error.message || "Failed to submit bid")
    } finally {
      setSubmittingBid(false)
    }
  }

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      "IT Services": "bg-sky-500/15 text-sky-700 dark:text-sky-400",
      "Marketing": "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
      "Construction": "bg-orange-500/15 text-orange-700 dark:text-orange-400",
      "Software Development": "bg-violet-500/15 text-violet-700 dark:text-violet-400",
      "Consulting": "bg-indigo-500/15 text-indigo-700 dark:text-indigo-400",
      "Design": "bg-pink-500/15 text-pink-700 dark:text-pink-400"
    }
    return colors[category] || "bg-muted text-muted-foreground"
  }

  const getComplexityColor = (complexity: string) => {
    const colors: Record<string, string> = {
      "Low": "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
      "Medium": "bg-amber-500/15 text-amber-700 dark:text-amber-400",
      "High": "bg-red-500/15 text-red-700 dark:text-red-400"
    }
    return colors[complexity] || "bg-muted text-muted-foreground"
  }

  if (loading) {
    return (
      <MainLayout title="Loading...">
        <div className="space-y-6">
          <div className="flex items-center space-x-4 mb-6">
            <div className="h-9 w-32 bg-muted rounded animate-pulse" />
            <div className="flex-1">
              <div className="h-10 w-80 bg-muted rounded animate-pulse mb-2" />
              <div className="h-5 w-60 bg-muted rounded animate-pulse" />
            </div>
          </div>
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              <Card><CardContent className="p-6"><div className="h-40 bg-muted rounded animate-pulse" /></CardContent></Card>
            </div>
            <div className="space-y-6">
              <Card><CardContent className="p-6"><div className="h-32 bg-muted rounded animate-pulse" /></CardContent></Card>
            </div>
          </div>
        </div>
      </MainLayout>
    )
  }

  if (!rfp) {
    return (
      <MainLayout title="RFP Not Found">
        <div className="space-y-6">
          <Button variant="ghost" asChild>
            <Link href="/marketplace/rfps">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to RFPs
            </Link>
          </Button>
          <Card>
            <CardContent className="text-center py-12">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">RFP Not Found</h3>
              <p className="text-muted-foreground">The RFP you are looking for does not exist or has been removed.</p>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout title={rfp.title}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4 mb-6">
          <Button variant="ghost" asChild>
            <Link href="/marketplace/rfps">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to RFPs
            </Link>
          </Button>
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <h1 className="text-3xl font-bold">{rfp.title}</h1>
              {rfp.featured && (
                <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400">
                  <Star className="mr-1 h-3 w-3" />
                  Featured
                </Badge>
              )}
            </div>
            <div className="flex items-center space-x-4 text-muted-foreground">
              <span className="flex items-center">
                <Building className="mr-1 h-4 w-4" />
                {rfp.organization}
              </span>
              <span className="flex items-center">
                <MapPin className="mr-1 h-4 w-4" />
                {rfp.location}
              </span>
              <span className="flex items-center">
                <Calendar className="mr-1 h-4 w-4" />
                Posted {rfp.postedDate}
              </span>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" onClick={async () => {
              try {
                const res = await fetch('/api/saved-rfps', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ rfpId: id }),
                })
                if (res.ok) {
                  setIsSaved(!isSaved)
                  toast.success(isSaved ? 'RFP removed from bookmarks' : 'RFP saved to bookmarks')
                }
              } catch {
                toast.error('Failed to save RFP')
              }
            }}>
              {isSaved ? <BookmarkCheck className="mr-2 h-4 w-4" /> : <BookmarkPlus className="mr-2 h-4 w-4" />}
              {isSaved ? 'Saved' : 'Save'}
            </Button>
            <Button variant="outline" size="sm" onClick={async () => {
              try {
                await navigator.clipboard.writeText(window.location.href)
                toast.success('Link copied to clipboard')
              } catch {
                toast.error('Failed to copy link')
              }
            }}>
              <Share2 className="mr-2 h-4 w-4" />
              Share
            </Button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Key Info */}
            <Card>
              <CardHeader>
                <CardTitle>Project Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  {rfp.description}
                </p>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Budget:</span>
                      <span className="flex items-center text-emerald-600 dark:text-emerald-400 font-medium">
                        <DollarSign className="mr-1 h-4 w-4" />
                        {rfp.budget}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Deadline:</span>
                      <span className="flex items-center text-red-600 dark:text-red-400 font-medium">
                        <Clock className="mr-1 h-4 w-4" />
                        {rfp.deadline}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Category:</span>
                      <Badge className={getCategoryColor(rfp.category)}>
                        {rfp.category}
                      </Badge>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Complexity:</span>
                      <Badge className={getComplexityColor(rfp.complexity)}>
                        {rfp.complexity}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Bids Received:</span>
                      <span className="flex items-center font-medium">
                        <Users className="mr-1 h-4 w-4" />
                        {rfp.bids}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Status:</span>
                      <Badge className={getStatusColor(rfp.status)}>
                        <CheckCircle className="mr-1 h-3 w-3" />
                        {rfp.status === 'active' ? 'Active' : rfp.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="requirements">Requirements</TabsTrigger>
                <TabsTrigger value="timeline">Timeline</TabsTrigger>
                <TabsTrigger value="evaluation">Evaluation</TabsTrigger>
                <TabsTrigger value="organization">Organization</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Project Description</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      {rfp.description}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Key Deliverables</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {rfp.deliverables && rfp.deliverables.length > 0 ? (
                      <ul className="space-y-2">
                        {rfp.deliverables.map((deliverable: string, index: number) => (
                          <li key={index} className="flex items-start">
                            <CheckCircle className="mr-2 h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                            <span>{deliverable}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-muted-foreground text-sm">No deliverables specified.</p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Attachments</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {rfp.attachments && rfp.attachments.length > 0 ? (
                      <div className="space-y-2">
                        {rfp.attachments.map((attachment: any, index: number) => (
                          <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center space-x-3">
                              <FileText className="h-5 w-5 text-muted-foreground" />
                              <div>
                                <p className="font-medium">{attachment.name}</p>
                                <p className="text-sm text-muted-foreground">{attachment.size} • {attachment.type}</p>
                              </div>
                            </div>
                            <Button variant="outline" size="sm" onClick={() => {
                              if (attachment.url) {
                                const a = document.createElement('a')
                                a.href = attachment.url
                                a.download = attachment.name
                                a.click()
                              } else {
                                toast.info('File URL not available for this attachment')
                              }
                            }}>
                              <Download className="mr-2 h-4 w-4" />
                              Download
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-sm">No attachments available.</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="requirements" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Requirements & Qualifications</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {rfp.requirements && rfp.requirements.length > 0 ? (
                      <ul className="space-y-2">
                        {rfp.requirements.map((requirement: string, index: number) => (
                          <li key={index} className="flex items-start">
                            <AlertCircle className="mr-2 h-4 w-4 text-sky-500 mt-0.5 flex-shrink-0" />
                            <span>{requirement}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-muted-foreground text-sm">No specific requirements listed.</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="timeline" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Project Timeline</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {rfp.timeline && rfp.timeline.length > 0 ? (
                      <div className="space-y-4">
                        {rfp.timeline.map((phase: any, index: number) => (
                          <div key={index} className="flex items-start space-x-4">
                            <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                              {index + 1}
                            </div>
                            <div className="flex-1">
                              <h4 className="font-medium">{phase.phase}</h4>
                              <p className="text-sm text-muted-foreground">{phase.duration}</p>
                              <p className="text-sm text-muted-foreground">Start: {phase.start}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-sm">No timeline specified.</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="evaluation" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Evaluation Criteria</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {rfp.evaluationCriteria && rfp.evaluationCriteria.length > 0 ? (
                      <div className="space-y-4">
                        {rfp.evaluationCriteria.map((criterion: any, index: number) => (
                          <div key={index} className="border rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-medium">{criterion.criterion}</h4>
                              <Badge variant="outline">{criterion.weight}%</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {criterion.description}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-sm">No evaluation criteria specified.</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="organization" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>About {rfp.organizationInfo.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {rfp.organizationInfo.description ? (
                        <p className="text-muted-foreground">{rfp.organizationInfo.description}</p>
                      ) : (
                        <p className="text-muted-foreground">No organization details available.</p>
                      )}
                      {rfp.organizationInfo.website && (
                        <div>
                          <h4 className="font-medium mb-2">Contact</h4>
                          <Button variant="link" className="p-0 h-auto" asChild>
                            <a href={rfp.organizationInfo.website} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="mr-1 h-3 w-3" />
                              Visit Website
                            </a>
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Action Card */}
            <Card>
              <CardHeader>
                <CardTitle>Ready to Bid?</CardTitle>
                <CardDescription>
                  Submit your proposal before the deadline
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {showBidForm ? (
                  <div className="space-y-3">
                    <input
                      type="number"
                      placeholder="Bid amount ($)"
                      value={bidAmount}
                      onChange={(e) => setBidAmount(e.target.value)}
                      className="w-full px-3 py-2 border rounded-md text-sm"
                    />
                    <textarea
                      placeholder="Your proposal..."
                      value={bidProposal}
                      onChange={(e) => setBidProposal(e.target.value)}
                      className="w-full px-3 py-2 border rounded-md text-sm min-h-[80px]"
                    />
                    <div className="flex space-x-2">
                      <Button className="flex-1" size="sm" onClick={handleSubmitBid} disabled={submittingBid}>
                        {submittingBid ? "Submitting..." : "Confirm Bid"}
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setShowBidForm(false)}>Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <Button className="w-full" size="lg" onClick={() => setShowBidForm(true)}>
                    Submit Bid
                  </Button>
                )}
                <Button variant="outline" className="w-full" onClick={() => setShowQuestionDialog(true)}>
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Ask Question
                </Button>
                <div className="text-center text-sm text-muted-foreground">
                  <p>Deadline: {rfp.deadline}</p>
                  <p>{rfp.bids} vendors have bid</p>
                </div>
              </CardContent>
            </Card>

        <Dialog open={showQuestionDialog} onOpenChange={setShowQuestionDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ask a Question</DialogTitle>
            </DialogHeader>
            <Textarea
              placeholder="Type your question here..."
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              rows={4}
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowQuestionDialog(false)}>Cancel</Button>
              <Button disabled={!questionText.trim() || submittingQuestion} onClick={async () => {
                setSubmittingQuestion(true)
                try {
                  const res = await fetch('/api/qna', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ rfpId: id, questionText: questionText.trim(), isPublic: true }),
                  })
                  if (res.ok) {
                    toast.success('Question submitted successfully')
                    setShowQuestionDialog(false)
                    setQuestionText('')
                  } else {
                    toast.error('Failed to submit question')
                  }
                } catch {
                  toast.error('Failed to submit question')
                } finally {
                  setSubmittingQuestion(false)
                }
              }}>{submittingQuestion ? 'Submitting...' : 'Submit Question'}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

            {/* Similar RFPs */}
            <Card>
              <CardHeader>
                <CardTitle>Similar Opportunities</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {rfp.similarRFPs && rfp.similarRFPs.length > 0 ? (
                  rfp.similarRFPs.map((similar: any) => (
                    <div key={similar.id} className="border rounded-lg p-3 hover:shadow-md transition-shadow">
                      <h4 className="font-medium text-sm mb-1">{similar.title}</h4>
                      <p className="text-xs text-muted-foreground mb-2">{similar.organization}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">{similar.budget}</span>
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/marketplace/rfps/${similar.id}`}>
                            View
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">No similar RFPs found.</p>
                )}
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Bids</span>
                  <span className="font-medium">{rfp.bids}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Status</span>
                  <Badge className={getStatusColor(rfp.status)}>Active</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}