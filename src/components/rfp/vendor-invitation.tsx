"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { Mail, Search, Clock, Send, Trash2, UserPlus, Download, Upload } from "lucide-react"
import { toast } from "sonner"
import { formatDate } from "@/lib/utils"

interface Vendor {
  id: string
  name: string
  email?: string
  contactInfo?: {
    email?: string
    phone?: string
    address?: string
    website?: string
  }
  categories?: string[]
  certifications?: string[]
  diversityAttrs?: {
    isMinorityOwned?: boolean
    isWomenOwned?: boolean
    isVeteranOwned?: boolean
    isDisabilityOwned?: boolean
    certifications?: string[]
  }
  isActive: boolean
}

interface Invitation {
  id: string
  vendorId?: string
  email: string
  status: "pending" | "accepted" | "declined" | "expired"
  expiresAt?: string
  token: string
}

interface VendorInvitationProps {
  invitations: Invitation[]
  onInvitationsChange: (invitations: Invitation[]) => void
  rfpDeadline?: string
}

const invitationSchema = z.object({
  vendorIds: z.array(z.string()).optional(),
  emails: z.array(z.string().email()).optional(),
  invitationMethod: z.enum(["existing", "email", "both"]),
  message: z.string().optional(),
  expiresAt: z.string().optional(),
})

type InvitationFormData = z.infer<typeof invitationSchema>

export function VendorInvitation({ invitations, onInvitationsChange, rfpDeadline }: VendorInvitationProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedVendors, setSelectedVendors] = useState<string[]>([])
  const [customEmails, setCustomEmails] = useState<string[]>([])
  const [availableVendors, setAvailableVendors] = useState<Vendor[]>([])
  const [invitationMethod, setInvitationMethod] = useState<"existing" | "email" | "both">("existing")
  const [activeTab, setActiveTab] = useState("existing")

  const invitationForm = useForm<InvitationFormData>({
    resolver: zodResolver(invitationSchema),
    defaultValues: {
      invitationMethod: "existing",
    },
  })

  // Fetch available vendors from API
  useEffect(() => {
    async function fetchVendors() {
      try {
        const res = await fetch('/api/vendors')
        if (res.ok) {
          const data = await res.json()
          setAvailableVendors(data)
        }
      } catch (err) { console.error("Failed to load vendors:", err) }
    }
    fetchVendors()
  }, [])

  const filteredVendors = availableVendors.filter(vendor =>
    vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vendor.contactInfo?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vendor.categories?.some(cat => cat.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case "accepted":
        return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
      case "declined":
        return "bg-red-500/15 text-red-700 dark:text-red-400"
      case "expired":
        return "bg-muted text-muted-foreground"
      case "pending":
        return "bg-amber-500/15 text-amber-700 dark:text-amber-400"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  const getDiversityBadges = (diversityAttrs?: Vendor["diversityAttrs"]) => {
    const badges = []
    if (diversityAttrs?.isMinorityOwned) badges.push({ label: "MBE", color: "bg-violet-500/15 text-violet-700 dark:text-violet-400" })
    if (diversityAttrs?.isWomenOwned) badges.push({ label: "WBE", color: "bg-pink-500/15 text-pink-700 dark:text-pink-400" })
    if (diversityAttrs?.isVeteranOwned) badges.push({ label: "VOSB", color: "bg-sky-500/15 text-sky-700 dark:text-sky-400" })
    if (diversityAttrs?.isDisabilityOwned) badges.push({ label: "DBE", color: "bg-orange-500/15 text-orange-700 dark:text-orange-400" })
    return badges
  }

  const addCustomEmail = (email: string) => {
    if (email && !customEmails.includes(email)) {
      setCustomEmails([...customEmails, email])
    }
  }

  const removeCustomEmail = (email: string) => {
    setCustomEmails(customEmails.filter(e => e !== email))
  }

  const sendInvitations = (data: InvitationFormData) => {
    const newInvitations: Invitation[] = []

    // Add invitations for selected vendors
    if (data.vendorIds && data.vendorIds.length > 0) {
      data.vendorIds.forEach(vendorId => {
        const vendor = availableVendors.find(v => v.id === vendorId)
        if (vendor) {
          newInvitations.push({
            id: `invitation-${Date.now()}-${Math.random()}`,
            vendorId,
            email: vendor.contactInfo?.email || "",
            status: "pending",
            expiresAt: data.expiresAt,
            token: `token-${Math.random().toString(36).substr(2, 9)}`
          })
        }
      })
    }

    // Add invitations for custom emails
    if (data.emails && data.emails.length > 0) {
      data.emails.forEach(email => {
        newInvitations.push({
          id: `invitation-${Date.now()}-${Math.random()}`,
          email,
          status: "pending",
          expiresAt: data.expiresAt,
          token: `token-${Math.random().toString(36).substr(2, 9)}`
        })
      })
    }

    onInvitationsChange([...invitations, ...newInvitations])
    setIsDialogOpen(false)
    setSelectedVendors([])
    setCustomEmails([])
    invitationForm.reset()
    toast.success(`${newInvitations.length} invitation(s) sent successfully`)
  }

  const resendInvitation = (invitationId: string) => {
    toast.success("Invitation resent successfully")
  }

  const deleteInvitation = (invitationId: string) => {
    onInvitationsChange(invitations.filter(inv => inv.id !== invitationId))
    toast.success("Invitation deleted")
  }

  const getVendorById = (vendorId?: string) => {
    return availableVendors.find(v => v.id === vendorId)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Vendor Invitations</h3>
          <p className="text-sm text-muted-foreground">
            Invite vendors to submit proposals for this RFP
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-sm">
            <span className="font-medium">Invited: </span>
            <span className="text-sky-600 dark:text-sky-400">{invitations.length}</span>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="mr-2 h-4 w-4" />
                Invite Vendors
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Invite Vendors</DialogTitle>
                <DialogDescription>
                  Select vendors to invite or enter custom email addresses
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={invitationForm.handleSubmit(sendInvitations)} className="space-y-6">
                <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="existing">Existing Vendors</TabsTrigger>
                    <TabsTrigger value="email">Email Invitations</TabsTrigger>
                    <TabsTrigger value="both">Both Methods</TabsTrigger>
                  </TabsList>

                  <TabsContent value="existing" className="space-y-4">
                    <div className="space-y-2">
                      <Label>Search Vendors</Label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search by name, email, or category..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Select Vendors</Label>
                      <div className="max-h-60 overflow-y-auto border rounded-md">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-12">Select</TableHead>
                              <TableHead>Vendor</TableHead>
                              <TableHead>Categories</TableHead>
                              <TableHead>Diversity</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredVendors.map((vendor) => (
                              <TableRow key={vendor.id}>
                                <TableCell>
                                  <Checkbox
                                    checked={selectedVendors.includes(vendor.id)}
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        setSelectedVendors([...selectedVendors, vendor.id])
                                      } else {
                                        setSelectedVendors(selectedVendors.filter(id => id !== vendor.id))
                                      }
                                    }}
                                  />
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center space-x-3">
                                    <Avatar className="h-8 w-8">
                                      <AvatarImage src="" alt={vendor.name} />
                                      <AvatarFallback>{vendor.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <div className="font-medium">{vendor.name}</div>
                                      <div className="text-sm text-muted-foreground">
                                        {vendor.contactInfo?.email}
                                      </div>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex flex-wrap gap-1">
                                    {vendor.categories?.slice(0, 2).map((category) => (
                                      <Badge key={category} variant="outline" className="text-xs">
                                        {category}
                                      </Badge>
                                    ))}
                                    {vendor.categories && vendor.categories.length > 2 && (
                                      <Badge variant="outline" className="text-xs">
                                        +{vendor.categories.length - 2}
                                      </Badge>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex flex-wrap gap-1">
                                    {getDiversityBadges(vendor.diversityAttrs).map((badge) => (
                                      <Badge key={badge.label} className={badge.color + " text-xs"}>
                                        {badge.label}
                                      </Badge>
                                    ))}
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {selectedVendors.length} vendor(s) selected
                      </p>
                    </div>
                  </TabsContent>

                  <TabsContent value="email" className="space-y-4">
                    <div className="space-y-2">
                      <Label>Email Addresses</Label>
                      <div className="space-y-2">
                        {customEmails.map((email, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <Input value={email} readOnly className="flex-1" />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeCustomEmail(email)}
                              className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                        <div className="flex space-x-2">
                          <Input
                            placeholder="Enter email address..."
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                addCustomEmail((e.target as HTMLInputElement).value)
                                ;(e.target as HTMLInputElement).value = ''
                              }
                            }}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              const input = document.querySelector('input[placeholder="Enter email address..."]') as HTMLInputElement
                              addCustomEmail(input.value)
                              input.value = ''
                            }}
                          >
                            Add
                          </Button>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="both" className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      You can select both existing vendors and add custom email addresses
                    </p>
                    {/* Include both existing vendors and email input */}
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Search Vendors</Label>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Search by name, email, or category..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Select Vendors</Label>
                        <div className="max-h-40 overflow-y-auto border rounded-md p-2">
                          {filteredVendors.map((vendor) => (
                            <div key={vendor.id} className="flex items-center space-x-2 p-2">
                              <Checkbox
                                checked={selectedVendors.includes(vendor.id)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setSelectedVendors([...selectedVendors, vendor.id])
                                  } else {
                                    setSelectedVendors(selectedVendors.filter(id => id !== vendor.id))
                                  }
                                }}
                              />
                              <span className="text-sm">{vendor.name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Additional Email Addresses</Label>
                        <div className="space-y-2">
                          {customEmails.map((email, index) => (
                            <div key={index} className="flex items-center space-x-2">
                              <Input value={email} readOnly className="flex-1" />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeCustomEmail(email)}
                                className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                          <div className="flex space-x-2">
                            <Input
                              placeholder="Enter additional email addresses..."
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  addCustomEmail((e.target as HTMLInputElement).value)
                                  ;(e.target as HTMLInputElement).value = ''
                                }
                              }}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                const input = document.querySelector('input[placeholder="Enter additional email addresses..."]') as HTMLInputElement
                                addCustomEmail(input.value)
                                input.value = ''
                              }}
                            >
                              Add
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>

                <div className="space-y-2">
                  <Label htmlFor="expiresAt">Expiration Date (optional)</Label>
                  <Input
                    id="expiresAt"
                    type="datetime-local"
                    {...invitationForm.register("expiresAt")}
                    min={new Date().toISOString().slice(0, 16)}
                  />
                  <p className="text-xs text-muted-foreground">
                    If not set, invitation will expire with the RFP deadline
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Custom Message (optional)</Label>
                  <Textarea
                    id="message"
                    {...invitationForm.register("message")}
                    placeholder="Add a custom message to your invitation..."
                    rows={3}
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    <Send className="mr-2 h-4 w-4" />
                    Send Invitations ({(selectedVendors.length + customEmails.length) || 0})
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Current Invitations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Mail className="mr-2 h-5 w-5" />
            Current Invitations ({invitations.length})
          </CardTitle>
          <CardDescription>
            Track the status of vendor invitations
          </CardDescription>
        </CardHeader>
        <CardContent>
          {invitations.length === 0 ? (
            <div className="text-center py-8">
              <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No invitations sent yet.</p>
              <p className="text-sm text-muted-foreground">Click "Invite Vendors" to get started.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {invitations.map((invitation) => {
                const vendor = getVendorById(invitation.vendorId)
                return (
                  <div key={invitation.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-3">
                        {vendor ? (
                          <Avatar className="h-10 w-10">
                            <AvatarImage src="" alt={vendor.name} />
                            <AvatarFallback>{vendor.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                        ) : (
                          <div className="h-10 w-10 bg-muted rounded-full flex items-center justify-center">
                            <Mail className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                        <div>
                          <div className="font-medium">
                            {vendor?.name || invitation.email}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {vendor?.contactInfo?.email || invitation.email}
                          </div>
                          {invitation.expiresAt && (
                            <div className="text-xs text-muted-foreground flex items-center space-x-1">
                              <Clock className="h-3 w-3" />
                              <span>Expires: {formatDate(invitation.expiresAt)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Badge className={getStatusColor(invitation.status)}>
                        {invitation.status.charAt(0).toUpperCase() + invitation.status.slice(1)}
                      </Badge>
                      <div className="flex space-x-1">
                        {invitation.status === "pending" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => resendInvitation(invitation.id)}
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteInvitation(invitation.id)}
                          className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Import/Export Options */}
      <Card>
        <CardHeader>
          <CardTitle>Additional Options</CardTitle>
          <CardDescription>
            Import vendor lists or export invitation data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Import Vendor List</Label>
              <div className="flex space-x-2">
                <Button variant="outline" className="flex-1">
                  <Upload className="mr-2 h-4 w-4" />
                  Import from CSV
                </Button>
                <Button variant="outline" className="flex-1">
                  <Upload className="mr-2 h-4 w-4" />
                  Import from Excel
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Export Data</Label>
              <div className="flex space-x-2">
                <Button variant="outline" className="flex-1">
                  <Download className="mr-2 h-4 w-4" />
                  Export Invitations
                </Button>
                <Button variant="outline" className="flex-1">
                  <Download className="mr-2 h-4 w-4" />
                  Export Vendor List
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}