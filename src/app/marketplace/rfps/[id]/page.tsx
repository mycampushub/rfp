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
  ExternalLink
} from "lucide-react"
import Link from "next/link"
import { useState } from "react"

export default function RFPDetail({ params }: { params: { id: string } }) {
  // Mock data for the RFP
  const rfp = {
    id: params.id,
    title: "Enterprise Cloud Migration Services",
    organization: "TechCorp Inc.",
    description: "TechCorp Inc. is seeking an experienced cloud service provider to lead a large-scale migration of our on-premise infrastructure to cloud platforms (AWS/Azure). This project involves migrating 200+ servers, 50+ databases, and critical business applications while ensuring minimal downtime and maintaining security compliance.",
    budget: "$500,000 - $750,000",
    deadline: "2024-12-30",
    category: "IT Services",
    location: "Remote",
    bids: 12,
    featured: true,
    postedDate: "2024-11-15",
    complexity: "High",
    status: "active",
    organizationInfo: {
      name: "TechCorp Inc.",
      size: "1000-5000 employees",
      industry: "Technology",
      founded: "2010",
      description: "Leading technology company specializing in enterprise software solutions and cloud services.",
      website: "https://techcorp.example.com",
      location: "San Francisco, CA"
    },
    requirements: [
      "Minimum 5 years of experience in cloud migration projects",
      "Certified AWS Solutions Architect or Azure Solutions Architect Expert",
      "Experience with enterprise-level migrations (200+ servers)",
      "Strong background in security and compliance",
      "Proven track record of successful cloud migrations",
      "Experience with hybrid cloud environments"
    ],
    deliverables: [
      "Comprehensive migration strategy and roadmap",
      "Detailed risk assessment and mitigation plan",
      "Complete infrastructure migration",
      "Data migration and validation",
      "Application refactoring where necessary",
      "Security implementation and compliance validation",
      "Documentation and knowledge transfer",
      "Post-migration support and optimization"
    ],
    timeline: [
      { phase: "Planning & Assessment", duration: "2-3 weeks", start: "2025-01-15" },
      { phase: "Infrastructure Setup", duration: "3-4 weeks", start: "2025-02-05" },
      { phase: "Data Migration", duration: "4-6 weeks", start: "2025-03-05" },
      { phase: "Application Migration", duration: "6-8 weeks", start: "2025-04-10" },
      { phase: "Testing & Validation", duration: "2-3 weeks", start: "2025-06-05" },
      { phase: "Go-Live & Support", duration: "4 weeks", start: "2025-06-26" }
    ],
    evaluationCriteria: [
      { criterion: "Technical Expertise", weight: 30, description: "Experience with similar projects and technical capabilities" },
      { criterion: "Cost Effectiveness", weight: 25, description: "Value for money and competitive pricing" },
      { criterion: "Project Timeline", weight: 20, description: "Realistic and efficient project schedule" },
      { criterion: "Methodology", weight: 15, description: "Approach and project management methodology" },
      { criterion: "References", weight: 10, description: "Past client references and case studies" }
    ],
    attachments: [
      { name: "Technical_Requirements.pdf", size: "2.4 MB", type: "PDF" },
      { name: "Security_Requirements.docx", size: "1.1 MB", type: "Document" },
      { name: "Company_Profile.pdf", size: "3.2 MB", type: "PDF" }
    ],
    similarRFPs: [
      {
        id: "2",
        title: "Cloud Infrastructure Modernization",
        organization: "Global Finance Corp",
        budget: "$300,000 - $450,000",
        deadline: "2025-01-15",
        category: "IT Services"
      },
      {
        id: "3",
        title: "Azure Migration Project",
        organization: "Healthcare Systems Inc",
        budget: "$400,000 - $600,000",
        deadline: "2025-01-20",
        category: "IT Services"
      }
    ]
  }

  const [activeTab, setActiveTab] = useState("overview")

  const getCategoryColor = (category: string) => {
    const colors = {
      "IT Services": "bg-blue-100 text-blue-800",
      "Marketing": "bg-green-100 text-green-800",
      "Construction": "bg-orange-100 text-orange-800",
      "Software Development": "bg-purple-100 text-purple-800",
      "Consulting": "bg-indigo-100 text-indigo-800",
      "Design": "bg-pink-100 text-pink-800"
    }
    return colors[category as keyof typeof colors] || "bg-gray-100 text-gray-800"
  }

  const getComplexityColor = (complexity: string) => {
    const colors = {
      "Low": "bg-green-100 text-green-800",
      "Medium": "bg-yellow-100 text-yellow-800",
      "High": "bg-red-100 text-red-800"
    }
    return colors[complexity as keyof typeof colors] || "bg-gray-100 text-gray-800"
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
                <Badge className="bg-yellow-100 text-yellow-800">
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
            <Button variant="outline" size="sm">
              <BookmarkPlus className="mr-2 h-4 w-4" />
              Save
            </Button>
            <Button variant="outline" size="sm">
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
                      <span className="flex items-center text-green-600 font-medium">
                        <DollarSign className="mr-1 h-4 w-4" />
                        {rfp.budget}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Deadline:</span>
                      <span className="flex items-center text-red-600 font-medium">
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
                      <Badge className="bg-green-100 text-green-800">
                        <CheckCircle className="mr-1 h-3 w-3" />
                        Active
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
                    <ul className="space-y-2">
                      {rfp.deliverables.map((deliverable, index) => (
                        <li key={index} className="flex items-start">
                          <CheckCircle className="mr-2 h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span>{deliverable}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Attachments</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {rfp.attachments.map((attachment, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center space-x-3">
                            <FileText className="h-5 w-5 text-muted-foreground" />
                            <div>
                              <p className="font-medium">{attachment.name}</p>
                              <p className="text-sm text-muted-foreground">{attachment.size} • {attachment.type}</p>
                            </div>
                          </div>
                          <Button variant="outline" size="sm">
                            <Download className="mr-2 h-4 w-4" />
                            Download
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="requirements" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Requirements & Qualifications</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {rfp.requirements.map((requirement, index) => (
                        <li key={index} className="flex items-start">
                          <AlertCircle className="mr-2 h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                          <span>{requirement}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="timeline" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Project Timeline</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {rfp.timeline.map((phase, index) => (
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
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="evaluation" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Evaluation Criteria</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {rfp.evaluationCriteria.map((criterion, index) => (
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
                      <p className="text-muted-foreground">
                        {rfp.organizationInfo.description}
                      </p>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <h4 className="font-medium mb-2">Company Details</h4>
                          <div className="space-y-1 text-sm">
                            <p><span className="font-medium">Size:</span> {rfp.organizationInfo.size}</p>
                            <p><span className="font-medium">Industry:</span> {rfp.organizationInfo.industry}</p>
                            <p><span className="font-medium">Founded:</span> {rfp.organizationInfo.founded}</p>
                            <p><span className="font-medium">Location:</span> {rfp.organizationInfo.location}</p>
                          </div>
                        </div>
                        <div>
                          <h4 className="font-medium mb-2">Contact</h4>
                          <div className="space-y-1 text-sm">
                            <Button variant="link" className="p-0 h-auto" asChild>
                              <a href={rfp.organizationInfo.website} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="mr-1 h-3 w-3" />
                                Visit Website
                              </a>
                            </Button>
                          </div>
                        </div>
                      </div>
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
                <Button className="w-full" size="lg">
                  Submit Bid
                </Button>
                <Button variant="outline" className="w-full">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Ask Question
                </Button>
                <div className="text-center text-sm text-muted-foreground">
                  <p>Deadline: {rfp.deadline}</p>
                  <p>{rfp.bids} vendors have bid</p>
                </div>
              </CardContent>
            </Card>

            {/* Similar RFPs */}
            <Card>
              <CardHeader>
                <CardTitle>Similar Opportunities</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {rfp.similarRFPs.map((similar) => (
                  <div key={similar.id} className="border rounded-lg p-3 hover:shadow-md transition-shadow">
                    <h4 className="font-medium text-sm mb-1">{similar.title}</h4>
                    <p className="text-xs text-muted-foreground mb-2">{similar.organization}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-green-600">{similar.budget}</span>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/marketplace/rfps/${similar.id}`}>
                          View
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Views</span>
                  <span className="font-medium">1,247</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Bids</span>
                  <span className="font-medium">{rfp.bids}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Questions</span>
                  <span className="font-medium">8</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Days Left</span>
                  <span className="font-medium text-red-600">15</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}