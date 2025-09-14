"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Calendar, 
  DollarSign, 
  Users, 
  FileText, 
  MessageSquare, 
  Star, 
  CheckSquare,
  Settings,
  Clock,
  User,
  Mail,
  Phone,
  Building,
  AlertCircle
} from "lucide-react"

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

export default function RFPDetailPage() {
  const params = useParams()
  const [rfp, setRfp] = useState<RFP | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Mock data for demonstration
    const mockRfp: RFP = {
      id: params.id as string,
      title: "IT Managed Services 2024",
      status: "published",
      category: "IT Services",
      budget: "$250,000",
      confidentiality: "internal",
      description: "Comprehensive IT managed services including 24/7 support, infrastructure management, and strategic technology consulting.",
      publishAt: "2024-11-01T00:00:00Z",
      closeAt: "2024-12-15T23:59:59Z",
      createdAt: "2024-10-15T10:00:00Z",
      updatedAt: "2024-11-01T09:00:00Z",
      timeline: {
        qnaStart: "2024-11-01T00:00:00Z",
        qnaEnd: "2024-11-15T23:59:59Z",
        submissionDeadline: "2024-12-15T23:59:59Z",
        evaluationStart: "2024-12-16T00:00:00Z",
        awardTarget: "2024-12-31T23:59:59Z"
      },
      team: [
        {
          id: "1",
          name: "John Smith",
          email: "john.smith@company.com",
          role: "RFP Owner"
        },
        {
          id: "2", 
          name: "Sarah Johnson",
          email: "sarah.johnson@company.com",
          role: "Evaluator"
        },
        {
          id: "3",
          name: "Mike Chen",
          email: "mike.chen@company.com", 
          role: "Editor"
        }
      ],
      vendors: [
        {
          id: "1",
          name: "Tech Solutions Inc",
          email: "contact@techsolutions.com",
          status: "invited"
        },
        {
          id: "2",
          name: "Global IT Services",
          email: "info@globalit.com",
          status: "accepted"
        },
        {
          id: "3",
          name: "Digital Dynamics",
          email: "hello@digitaldynamics.com",
          status: "submitted"
        }
      ],
      sections: [
        {
          id: "1",
          title: "Company Overview",
          description: "Information about your company and experience",
          questionCount: 5
        },
        {
          id: "2",
          title: "Technical Approach",
          description: "Detailed technical solution and methodology",
          questionCount: 8
        },
        {
          id: "3",
          title: "Pricing and Commercial Terms",
          description: "Cost breakdown and commercial conditions",
          questionCount: 6
        }
      ],
      qa: [
        {
          id: "1",
          question: "What is the expected timeline for implementation?",
          answer: "The implementation timeline is expected to be 3-6 months depending on the scope.",
          isPublic: true,
          vendor: "Tech Solutions Inc",
          createdAt: "2024-11-05T10:30:00Z"
        },
        {
          id: "2",
          question: "Are there any specific certifications required?",
          answer: "ISO 27001 and SOC 2 certifications are required for this engagement.",
          isPublic: true,
          vendor: "Global IT Services",
          createdAt: "2024-11-06T14:15:00Z"
        }
      ]
    }

    setTimeout(() => {
      setRfp(mockRfp)
      setLoading(false)
    }, 1000)
  }, [params.id])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "published":
        return "bg-green-100 text-green-800"
      case "draft":
        return "bg-gray-100 text-gray-800"
      case "evaluation":
        return "bg-blue-100 text-blue-800"
      case "closed":
        return "bg-red-100 text-red-800"
      case "awarded":
        return "bg-purple-100 text-purple-800"
      case "archived":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (loading) {
    return (
      <MainLayout title="RFP Details">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading RFP details...</div>
        </div>
      </MainLayout>
    )
  }

  if (!rfp) {
    return (
      <MainLayout title="RFP Details">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">RFP not found</div>
        </div>
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
              <span>Created: {new Date(rfp.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline">Edit RFP</Button>
            <Button>Publish</Button>
          </div>
        </div>

        {/* Description */}
        {rfp.description && (
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">{rfp.description}</p>
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-8">
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
                      {rfp.publishAt ? new Date(rfp.publishAt).toLocaleDateString() : "Not published"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Submission Deadline:</span>
                    <span className="text-sm text-red-600">
                      {rfp.closeAt ? new Date(rfp.closeAt).toLocaleDateString() : "Not set"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Q&A Period:</span>
                    <span className="text-sm">
                      {rfp.timeline?.qnaStart && rfp.timeline.qnaEnd 
                        ? `${new Date(rfp.timeline.qnaStart).toLocaleDateString()} - ${new Date(rfp.timeline.qnaEnd).toLocaleDateString()}`
                        : "Not set"
                      }
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Award Target:</span>
                    <span className="text-sm">
                      {rfp.timeline?.awardTarget ? new Date(rfp.timeline.awardTarget).toLocaleDateString() : "Not set"}
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
                <div className="space-y-4">
                  {rfp.timeline && Object.entries(rfp.timeline).map(([key, value]) => {
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
                <div className="space-y-4">
                  {rfp.team.map((member) => (
                    <div key={member.id} className="flex items-center space-x-4 p-3 border rounded-lg">
                      <div className="flex items-center space-x-3 flex-1">
                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
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
                          {new Date(qa.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="mb-3">
                        <p className="text-sm font-medium">Q: {qa.question}</p>
                      </div>
                      {qa.answer && (
                        <div className="bg-gray-50 p-3 rounded">
                          <p className="text-sm"><strong>A:</strong> {qa.answer}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
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
                <div className="text-center py-8">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No submissions yet. Submissions will appear here when vendors submit their proposals.</p>
                </div>
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