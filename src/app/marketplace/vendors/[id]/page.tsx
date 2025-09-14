"use client"

import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  ArrowLeft, 
  Star, 
  MapPin, 
  Users, 
  Building,
  Globe,
  Phone,
  Mail,
  CheckCircle,
  Award,
  Briefcase,
  Calendar,
  MessageSquare,
  ExternalLink,
  Download,
  FileText,
  BarChart3,
  Clock,
  DollarSign
} from "lucide-react"
import Link from "next/link"
import { useState } from "react"

export default function VendorProfile({ params }: { params: { id: string } }) {
  // Mock data for the vendor
  const vendor = {
    id: params.id,
    name: "TechSolutions Pro",
    description: "TechSolutions Pro is a leading cloud services and software development company with over 10 years of experience delivering enterprise-grade solutions. We specialize in cloud migration, custom software development, and IT consulting services for businesses of all sizes.",
    rating: 4.9,
    reviews: 127,
    projects: 156,
    employees: "50-200",
    founded: 2014,
    location: "San Francisco, CA",
    website: "https://techsolutions.example.com",
    email: "contact@techsolutions.example.com",
    phone: "+1 (555) 123-4567",
    verified: true,
    featured: true,
    hourlyRate: "$150-200",
    responseTime: "2 hours",
    specialties: [
      { name: "Cloud Services", level: "Expert", years: 8, projects: 45 },
      { name: "Software Development", level: "Expert", years: 10, projects: 67 },
      { name: "DevOps", level: "Advanced", years: 6, projects: 34 },
      { name: "Cybersecurity", level: "Advanced", years: 5, projects: 23 },
      { name: "Data Analytics", level: "Intermediate", years: 4, projects: 18 },
      { name: "AI/ML", level: "Intermediate", years: 3, projects: 12 }
    ],
    certifications: [
      { name: "AWS Certified Solutions Architect", issuer: "Amazon Web Services", year: 2020 },
      { name: "Microsoft Azure Solutions Architect", issuer: "Microsoft", year: 2021 },
      { name: "ISO 27001 Information Security", issuer: "ISO", year: 2019 },
      { name: "CMMI Level 3", issuer: "CMMI Institute", year: 2022 }
    ],
    portfolio: [
      {
        id: "1",
        title: "Enterprise Cloud Migration",
        description: "Complete migration of 200+ servers and 50+ databases to AWS for Fortune 500 company",
        category: "Cloud Services",
        budget: "$750,000",
        duration: "6 months",
        year: 2023,
        image: "/api/placeholder/400/200"
      },
      {
        id: "2",
        title: "Custom ERP System",
        description: "Development of comprehensive ERP system for manufacturing company",
        category: "Software Development",
        budget: "$500,000",
        duration: "8 months",
        year: 2023,
        image: "/api/placeholder/400/200"
      },
      {
        id: "3",
        title: "Security Overhaul",
        description: "Complete security infrastructure redesign and implementation",
        category: "Cybersecurity",
        budget: "$300,000",
        duration: "4 months",
        year: 2022,
        image: "/api/placeholder/400/200"
      }
    ],
    team: [
      {
        name: "John Smith",
        position: "CEO & Founder",
        experience: "15+ years",
        photo: "/api/placeholder/100/100",
        bio: "Former AWS architect with extensive experience in cloud solutions"
      },
      {
        name: "Sarah Johnson",
        position: "CTO",
        experience: "12+ years",
        photo: "/api/placeholder/100/100",
        bio: "Expert in software architecture and team leadership"
      },
      {
        name: "Mike Chen",
        position: "Lead Developer",
        experience: "10+ years",
        photo: "/api/placeholder/100/100",
        bio: "Full-stack developer specializing in enterprise applications"
      }
    ],
    reviews: [
      {
        id: "1",
        author: "Global Finance Corp",
        rating: 5,
        title: "Exceptional cloud migration services",
        comment: "TechSolutions Pro delivered an outstanding cloud migration project. Their team was professional, knowledgeable, and completed the project ahead of schedule.",
        date: "2024-01-15",
        project: "Cloud Infrastructure Migration"
      },
      {
        id: "2",
        author: "Healthcare Systems Inc",
        rating: 4,
        title: "Great development team",
        comment: "Very satisfied with the custom software development. The only minor issue was some delays in the timeline, but the quality was excellent.",
        date: "2023-11-20",
        project: "Patient Management System"
      },
      {
        id: "3",
        author: "Retail Chain Co",
        rating: 5,
        title: "Excellent security implementation",
        comment: "Their security team helped us completely overhaul our IT security. Professional, thorough, and always available when needed.",
        date: "2023-09-10",
        project: "Security Infrastructure"
      }
    ],
    stats: {
      completionRate: 98,
      onTimeDelivery: 95,
      clientRetention: 92,
      repeatBusiness: 78
    }
  }

  const [activeTab, setActiveTab] = useState("overview")

  const getSpecialtyColor = (level: string) => {
    const colors = {
      "Expert": "bg-purple-100 text-purple-800",
      "Advanced": "bg-blue-100 text-blue-800",
      "Intermediate": "bg-green-100 text-green-800",
      "Beginner": "bg-yellow-100 text-yellow-800"
    }
    return colors[level as keyof typeof colors] || "bg-gray-100 text-gray-800"
  }

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= Math.floor(rating) 
                ? "text-yellow-500 fill-current" 
                : star === Math.ceil(rating) && rating % 1 !== 0 
                ? "text-yellow-500 fill-current" 
                : "text-gray-300"
            }`}
          />
        ))}
        <span className="ml-2 text-sm font-medium">{rating}</span>
      </div>
    )
  }

  return (
    <MainLayout title={vendor.name}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4 mb-6">
          <Button variant="ghost" asChild>
            <Link href="/marketplace/vendors">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Vendors
            </Link>
          </Button>
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <h1 className="text-3xl font-bold">{vendor.name}</h1>
              {vendor.verified && (
                <Badge className="bg-blue-100 text-blue-800">
                  <CheckCircle className="mr-1 h-3 w-3" />
                  Verified
                </Badge>
              )}
              {vendor.featured && (
                <Badge className="bg-yellow-100 text-yellow-800">
                  <Star className="mr-1 h-3 w-3" />
                  Featured
                </Badge>
              )}
            </div>
            <div className="flex items-center space-x-4 text-muted-foreground">
              <span className="flex items-center">
                <MapPin className="mr-1 h-4 w-4" />
                {vendor.location}
              </span>
              <span className="flex items-center">
                <Users className="mr-1 h-4 w-4" />
                {vendor.employees}
              </span>
              <span className="flex items-center">
                <Building className="mr-1 h-4 w-4" />
                Since {vendor.founded}
              </span>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Download Profile
            </Button>
            <Button variant="outline" size="sm">
              <MessageSquare className="mr-2 h-4 w-4" />
              Contact
            </Button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Overview */}
            <Card>
              <CardHeader>
                <CardTitle>Company Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  {vendor.description}
                </p>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Hourly Rate:</span>
                      <span className="flex items-center text-green-600 font-medium">
                        <DollarSign className="mr-1 h-4 w-4" />
                        {vendor.hourlyRate}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Response Time:</span>
                      <span className="flex items-center font-medium">
                        <Clock className="mr-1 h-4 w-4" />
                        {vendor.responseTime}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Projects Completed:</span>
                      <span className="font-medium">{vendor.projects}</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Email:</span>
                      <a href={`mailto:${vendor.email}`} className="text-blue-600 hover:underline">
                        {vendor.email}
                      </a>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Phone:</span>
                      <span>{vendor.phone}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Website:</span>
                      <a href={vendor.website} target="_blank" rel="noopener noreferrer" 
                         className="text-blue-600 hover:underline flex items-center">
                        Visit Site <ExternalLink className="ml-1 h-3 w-3" />
                      </a>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="specialties">Specialties</TabsTrigger>
                <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
                <TabsTrigger value="team">Team</TabsTrigger>
                <TabsTrigger value="reviews">Reviews</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                {/* Stats */}
                <Card>
                  <CardHeader>
                    <CardTitle>Performance Metrics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{vendor.stats.completionRate}%</div>
                        <div className="text-sm text-muted-foreground">Completion Rate</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{vendor.stats.onTimeDelivery}%</div>
                        <div className="text-sm text-muted-foreground">On-Time Delivery</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">{vendor.stats.clientRetention}%</div>
                        <div className="text-sm text-muted-foreground">Client Retention</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600">{vendor.stats.repeatBusiness}%</div>
                        <div className="text-sm text-muted-foreground">Repeat Business</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Certifications */}
                <Card>
                  <CardHeader>
                    <CardTitle>Certifications</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-2">
                      {vendor.certifications.map((cert, index) => (
                        <div key={index} className="border rounded-lg p-4">
                          <div className="flex items-center space-x-2 mb-2">
                            <Award className="h-5 w-5 text-yellow-500" />
                            <h4 className="font-medium">{cert.name}</h4>
                          </div>
                          <p className="text-sm text-muted-foreground">{cert.issuer}</p>
                          <p className="text-sm text-muted-foreground">Earned {cert.year}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="specialties" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Areas of Expertise</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {vendor.specialties.map((specialty, index) => (
                        <div key={index} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium">{specialty.name}</h4>
                            <Badge className={getSpecialtyColor(specialty.level)}>
                              {specialty.level}
                            </Badge>
                          </div>
                          <div className="grid gap-2 md:grid-cols-2 text-sm text-muted-foreground">
                            <div className="flex items-center">
                              <Calendar className="mr-1 h-3 w-3" />
                              {specialty.years} years experience
                            </div>
                            <div className="flex items-center">
                              <Briefcase className="mr-1 h-3 w-3" />
                              {specialty.projects} projects completed
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="portfolio" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Project Portfolio</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                      {vendor.portfolio.map((project, index) => (
                        <div key={index} className="border rounded-lg overflow-hidden">
                          <div className="h-40 bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                            <FileText className="h-12 w-12 text-white" />
                          </div>
                          <div className="p-4">
                            <h4 className="font-medium mb-2">{project.title}</h4>
                            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                              {project.description}
                            </p>
                            <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                              <Badge variant="outline">{project.category}</Badge>
                              <span>{project.year}</span>
                            </div>
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <span>{project.budget}</span>
                              <span>{project.duration}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="team" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Leadership Team</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                      {vendor.team.map((member, index) => (
                        <div key={index} className="text-center">
                          <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                            <Users className="h-10 w-10 text-white" />
                          </div>
                          <h4 className="font-medium mb-1">{member.name}</h4>
                          <p className="text-sm text-muted-foreground mb-1">{member.position}</p>
                          <p className="text-xs text-muted-foreground mb-2">{member.experience}</p>
                          <p className="text-xs text-muted-foreground">{member.bio}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="reviews" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Client Reviews</span>
                      <div className="flex items-center space-x-2">
                        {renderStars(vendor.rating)}
                        <span className="text-sm text-muted-foreground">({vendor.reviews} reviews)</span>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {vendor.reviews.map((review, index) => (
                        <div key={index} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <h4 className="font-medium">{review.author}</h4>
                              <p className="text-sm text-muted-foreground">{review.project}</p>
                            </div>
                            <div className="text-right">
                              {renderStars(review.rating)}
                              <p className="text-xs text-muted-foreground">{review.date}</p>
                            </div>
                          </div>
                          <h5 className="font-medium mb-2">{review.title}</h5>
                          <p className="text-sm text-muted-foreground">{review.comment}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Card */}
            <Card id="contact">
              <CardHeader>
                <CardTitle>Get in Touch</CardTitle>
                <CardDescription>
                  Ready to start your project?
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Send Message
                </Button>
                <Button variant="outline" className="w-full">
                  <Phone className="mr-2 h-4 w-4" />
                  Call Now
                </Button>
                <Button variant="outline" className="w-full">
                  <Mail className="mr-2 h-4 w-4" />
                  Email Us
                </Button>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Profile Views</span>
                  <span className="font-medium">2,847</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Contact Requests</span>
                  <span className="font-medium">156</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Active Bids</span>
                  <span className="font-medium">23</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Response Rate</span>
                  <span className="font-medium text-green-600">98%</span>
                </div>
              </CardContent>
            </Card>

            {/* Availability */}
            <Card>
              <CardHeader>
                <CardTitle>Availability</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Current Status</span>
                    <Badge className="bg-green-100 text-green-800">Available</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Next Available</span>
                    <span className="text-sm font-medium">Immediately</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Project Queue</span>
                    <span className="text-sm font-medium">3 projects</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}