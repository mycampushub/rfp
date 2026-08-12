"use client"

import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Star, MapPin, Users, Phone, Mail, CheckCircle, Award, MessageSquare, ExternalLink, Download, FileText } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { toast } from "sonner"
import { use } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export default function VendorProfile({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [vendor, setVendor] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")
  const [showMessageDialog, setShowMessageDialog] = useState(false)
  const [messageName, setMessageName] = useState("")
  const [messageText, setMessageText] = useState("")
  const [sendingMessage, setSendingMessage] = useState(false)

  useEffect(() => {
    async function fetchVendor() {
      try {
        const res = await fetch(`/api/v1/vendors/${id}`)
        if (!res.ok) throw new Error("Failed to fetch")
        const data = await res.json()
        setVendor({
          id: data.id,
          name: data.name,
          description: data.contactInfo?.address || "No description available.",
          rating: 0,
          reviews: data._count?.qna ?? 0,
          projects: data._count?.submissions ?? 0,
          employees: "",
          founded: "",
          location: data.contactInfo?.address || "N/A",
          website: data.contactInfo?.website || "",
          email: data.contactInfo?.email || "",
          phone: data.contactInfo?.phone || "",
          verified: data.isActive ?? false,
          featured: false,
          hourlyRate: "",
          responseTime: "",
          categories: data.categories || [],
          certifications: data.certifications || [],
          specialties: [],
          portfolio: [],
          team: [],
          stats: {
            completionRate: null,
            onTimeDelivery: null,
            clientRetention: null,
            repeatBusiness: null
          }
        })
      } catch {
        toast.error("Failed to load vendor profile")
      } finally {
        setLoading(false)
      }
    }
    fetchVendor()
  }, [id])

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
                : "text-muted-foreground/50"
            }`}
          />
        ))}
        <span className="ml-2 text-sm font-medium">{rating}</span>
      </div>
    )
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

  if (!vendor) {
    return (
      <MainLayout title="Vendor Not Found">
        <div className="space-y-6">
          <Button variant="ghost" asChild>
            <Link href="/marketplace/vendors">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Vendors
            </Link>
          </Button>
          <Card>
            <CardContent className="text-center py-12">
              <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Vendor Not Found</h3>
              <p className="text-muted-foreground">The vendor you are looking for does not exist.</p>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
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
                <Badge className="bg-sky-500/15 text-sky-700 dark:text-sky-400">
                  <CheckCircle className="mr-1 h-3 w-3" />
                  Verified
                </Badge>
              )}
              {vendor.featured && (
                <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400">
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
              {vendor.employees && (
                <span className="flex items-center">
                  <Users className="mr-1 h-4 w-4" />
                  {vendor.employees}
                </span>
              )}
            </div>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" onClick={() => {
              if (!vendor) return
              const jsonStr = JSON.stringify(vendor, null, 2)
              const blob = new Blob([jsonStr], { type: 'application/json' })
              const url = URL.createObjectURL(blob)
              const link = document.createElement('a')
              link.href = url
              link.download = 'vendor-profile.json'
              link.click()
              URL.revokeObjectURL(url)
              toast.success('Profile downloaded')
            }}>
              <Download className="mr-2 h-4 w-4" />
              Download Profile
            </Button>
            <Button variant="outline" size="sm" onClick={() => {
              document.getElementById('contact-section')?.scrollIntoView({ behavior: 'smooth' })
            }}>
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
                    {vendor.email && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Email:</span>
                        <a href={`mailto:${vendor.email}`} className="text-sky-600 dark:text-sky-400 hover:underline">
                          {vendor.email}
                        </a>
                      </div>
                    )}
                    {vendor.phone && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Phone:</span>
                        <span>{vendor.phone}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Projects:</span>
                      <span className="font-medium">{vendor.projects}</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {vendor.website ? (
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Website:</span>
                        <a href={vendor.website} target="_blank" rel="noopener noreferrer" 
                           className="text-sky-600 dark:text-sky-400 hover:underline flex items-center">
                          Visit Site <ExternalLink className="ml-1 h-3 w-3" />
                        </a>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Website:</span>
                        <span className="text-muted-foreground">Not provided</span>
                      </div>
                    )}
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
                        <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                          {vendor.stats.completionRate !== null ? `${vendor.stats.completionRate}%` : 'N/A'}
                        </div>
                        <div className="text-sm text-muted-foreground">Completion Rate</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-sky-600 dark:text-sky-400">
                          {vendor.stats.onTimeDelivery !== null ? `${vendor.stats.onTimeDelivery}%` : 'N/A'}
                        </div>
                        <div className="text-sm text-muted-foreground">On-Time Delivery</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-violet-600 dark:text-violet-400">
                          {vendor.stats.clientRetention !== null ? `${vendor.stats.clientRetention}%` : 'N/A'}
                        </div>
                        <div className="text-sm text-muted-foreground">Client Retention</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                          {vendor.stats.repeatBusiness !== null ? `${vendor.stats.repeatBusiness}%` : 'N/A'}
                        </div>
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
                    {vendor.certifications && vendor.certifications.length > 0 ? (
                      <div className="grid gap-4 md:grid-cols-2">
                        {vendor.certifications.map((cert: string, index: number) => (
                          <div key={index} className="border rounded-lg p-4">
                            <div className="flex items-center space-x-2 mb-2">
                              <Award className="h-5 w-5 text-yellow-500" />
                              <h4 className="font-medium">{cert}</h4>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-sm">No certifications listed.</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="specialties" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Areas of Expertise</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {vendor.specialties && vendor.specialties.length > 0 ? (
                      <div className="space-y-4">
                        {vendor.specialties.map((specialty: any, index: number) => (
                          <div key={index} className="border rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-medium">{specialty.name || specialty}</h4>
                              <Badge variant="outline">{specialty.level || "N/A"}</Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : vendor.categories && vendor.categories.length > 0 ? (
                      <div className="space-y-4">
                        {vendor.categories.map((category: string, index: number) => (
                          <div key={index} className="border rounded-lg p-4">
                            <h4 className="font-medium">{category}</h4>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-sm">No specialties listed.</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="portfolio" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Project Portfolio</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {vendor.portfolio && vendor.portfolio.length > 0 ? (
                      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {vendor.portfolio.map((project: any, index: number) => (
                          <div key={index} className="border rounded-lg overflow-hidden">
                            <div className="h-40 bg-gradient-to-r from-sky-500 to-violet-500 flex items-center justify-center">
                              <FileText className="h-12 w-12 text-white dark:text-white" />
                            </div>
                            <div className="p-4">
                              <h4 className="font-medium mb-2">{project.title}</h4>
                              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                                {project.description}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-sm">No portfolio items available.</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="team" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Leadership Team</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {vendor.team && vendor.team.length > 0 ? (
                      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {vendor.team.map((member: any, index: number) => (
                          <div key={index} className="text-center">
                            <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-r from-sky-500 to-violet-500 rounded-full flex items-center justify-center">
                              <Users className="h-10 w-10 text-white dark:text-white" />
                            </div>
                            <h4 className="font-medium mb-1">{member.name}</h4>
                            <p className="text-sm text-muted-foreground mb-1">{member.position}</p>
                            <p className="text-xs text-muted-foreground">{member.bio}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-sm">No team information available.</p>
                    )}
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
                    <p className="text-muted-foreground text-sm">No reviews available yet.</p>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Card */}
            <Card id="contact-section">
              <CardHeader>
                <CardTitle>Get in Touch</CardTitle>
                <CardDescription>
                  Ready to start your project?
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full" onClick={() => setShowMessageDialog(true)}>
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Send Message
                </Button>
                {vendor.phone && (
                  <Button variant="outline" className="w-full" onClick={() => {
                    window.location.href = 'tel:' + vendor.phone
                  }}>
                    <Phone className="mr-2 h-4 w-4" />
                    Call Now
                  </Button>
                )}
                {vendor.email && (
                  <Button variant="outline" className="w-full" onClick={() => {
                    window.location.href = 'mailto:' + vendor.email
                  }}>
                    <Mail className="mr-2 h-4 w-4" />
                    Email Us
                  </Button>
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
                  <span className="text-sm">Projects</span>
                  <span className="font-medium">{vendor.projects}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Certifications</span>
                  <span className="font-medium">{vendor.certifications?.length || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Categories</span>
                  <span className="font-medium">{vendor.categories?.length || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Status</span>
                  <Badge className={vendor.verified ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400" : "bg-muted text-muted-foreground"}>
                    {vendor.verified ? "Active" : "Inactive"}
                  </Badge>
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
                    <Badge className={vendor.verified ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400" : "bg-muted text-muted-foreground"}> 
                      {vendor.verified ? "Available" : "Unavailable"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <Dialog open={showMessageDialog} onOpenChange={setShowMessageDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Message to {vendor?.name || 'Vendor'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Your Name</Label>
              <Input
                placeholder="Enter your name"
                value={messageName}
                onChange={(e) => setMessageName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Message</Label>
              <Textarea
                placeholder="Type your message here..."
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMessageDialog(false)}>Cancel</Button>
            <Button disabled={!messageName.trim() || !messageText.trim() || sendingMessage} onClick={async () => {
              setSendingMessage(true)
              try {
                const threadRes = await fetch('/api/messages/threads', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ subject: 'Message to ' + (vendor?.name || 'Vendor') }),
                })
                if (threadRes.ok) {
                  const thread = await threadRes.json()
                  const msgRes = await fetch('/api/messages/threads/' + thread.id + '/messages', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ content: messageText.trim() }),
                  })
                  if (msgRes.ok) {
                    toast.success('Message sent successfully')
                    setShowMessageDialog(false)
                    setMessageName('')
                    setMessageText('')
                  } else {
                    toast.error('Failed to send message')
                  }
                } else {
                  toast.error('Failed to create conversation')
                }
              } catch {
                toast.error('Failed to send message')
              } finally {
                setSendingMessage(false)
              }
            }}>{sendingMessage ? 'Sending...' : 'Send Message'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  )
}