"use client"

import { useState, useEffect } from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Settings, Globe } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { LoadingCards, LoadingTable } from "@/components/shared/loading-table"
import { Skeleton } from "@/components/ui/skeleton"
import { NotificationBell } from "@/components/marketplace/notifications/notification-bell"

import type { VendorProfile, VendorUser, Invitation, Bid, MarketplaceOpportunity } from "./types"
import { StatsCards } from "./components/stats-cards"
import { OverviewTab } from "./components/overview-tab"
import { InvitationsTab } from "./components/invitations-tab"
import { BidsTab } from "./components/bids-tab"
import { MarketplaceTab } from "./components/marketplace-tab"
import { TeamTab } from "./components/team-tab"
import { AnalyticsTab } from "./components/analytics-tab"
import { NotificationModal } from "./components/notification-modal"

export default function VendorDashboard() {
  useEffect(() => { document.title = 'Vendor Dashboard | RFP Platform' }, [])
  const [vendorProfile, setVendorProfile] = useState<VendorProfile | null>(null)
  const [vendorUsers, _setVendorUsers] = useState<VendorUser[]>([])
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [bids, setBids] = useState<Bid[]>([])
  const [opportunities, setOpportunities] = useState<MarketplaceOpportunity[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [showNotificationSettings, setShowNotificationSettings] = useState(false)
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    notificationTypes: {
      new_rfp: true, bid_accepted: true, bid_rejected: true,
      question_answered: true, review_received: true,
      deadline_reminder: true, vendor_update: false, system: true
    },
    quietHours: { enabled: false, start: "22:00", end: "08:00" },
    frequency: "instant" as "instant" | "daily" | "weekly"
  })

  const saveNotificationSettings = async (settings: typeof notificationSettings) => {
    try {
      const res = await fetch('/api/notifications/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })
      if (res.ok) { toast.success('Notification settings saved') }
      else { toast.error('Failed to save notification settings') }
    } catch { toast.error('Failed to save notification settings') }
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [vendorRes, invitationsRes, bidsRes] = await Promise.all([
          fetch('/api/vendors').then(r => r.ok ? r.json() : []),
          fetch('/api/invitations').then(r => r.ok ? r.json() : []),
          fetch('/api/bids').then(r => r.ok ? r.json() : []),
        ])

        const vendors = Array.isArray(vendorRes) ? vendorRes : []
        if (vendors.length > 0) {
          const v = vendors[0]
          const contact = v.contactInfo || {}
          setVendorProfile({
            id: v.id, businessName: v.name || 'Unknown', description: v.description || '',
            website: contact.website || '',
            contactInfo: { email: contact.email || '', phone: contact.phone || '', address: contact.address || '', city: '', state: '', country: '' },
            businessId: v.id, categories: Array.isArray(v.categories) ? v.categories : [],
            specialties: [], certifications: Array.isArray(v.certifications) ? v.certifications : [],
            isVerified: v.verified || false, rating: 0,
            completedProjects: v._count?.submissions || 0, memberSince: v.createdAt || '',
          })
        }

        const invs = Array.isArray(invitationsRes) ? invitationsRes : []
        setInvitations(invs.map((inv: Record<string, unknown>) => ({
          id: String(inv.id), rfpTitle: String((inv.rfp as Record<string, unknown>)?.title || 'Unknown RFP'),
          organization: String((inv.vendor as Record<string, unknown>)?.name || ''), budget: '', deadline: '',
          status: (String(inv.status || 'pending')) as Invitation['status'], isPublic: false, receivedAt: String(inv.createdAt || ''),
        })))

        const bidsData = Array.isArray(bidsRes) ? bidsRes : []
        setBids(bidsData.map((b: Record<string, unknown>) => ({
          id: String(b.id), rfpTitle: String((b.publicRfp as Record<string, unknown>)?.title || 'Unknown RFP'),
          organization: '', amount: b.amount ? `$${Number(b.amount).toLocaleString()}` : '',
          status: (String(b.status || 'draft')) as Bid['status'], submittedAt: String(b.createdAt || ''), deadline: '',
        })))

        try {
          const rfpsRes = await fetch('/api/v1/rfps?limit=10')
          if (rfpsRes.ok) {
            const rfps = await rfpsRes.json()
            const rfpList = Array.isArray(rfps) ? rfps : []
            setOpportunities(rfpList.map((r: Record<string, unknown>) => ({
              id: String(r.id), title: String(r.title || 'Untitled'), organization: '',
              budget: r.budget ? `$${Number(r.budget).toLocaleString()}` : '',
              category: String(r.category || ''), deadline: String((r.timeline as Record<string, unknown>)?.submissionDeadline || ''),
              bids: Number((r._count as Record<string, unknown>)?.submissions) || 0, matchScore: 0, isFeatured: false,
            })))
          }
        } catch { /* Opportunities fetch failed, keep empty */ }
      } catch { toast.error('Failed to load vendor dashboard data') }
      finally { setLoading(false) }
    }
    fetchData()
  }, [])

  if (loading) {
    return (
      <MainLayout title="Vendor Dashboard">
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
            <div><Skeleton className="h-10 w-64 mb-2" /><Skeleton className="h-4 w-80" /></div>
            <div className="flex items-center space-x-2"><Skeleton className="h-10 w-28" /><Skeleton className="h-10 w-40" /></div>
          </div>
          <LoadingCards count={4} />
          <LoadingTable rows={4} columns={6} />
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout title="Vendor Dashboard">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
          <div>
            <h1 className="text-3xl font-bold">Vendor Dashboard</h1>
            <p className="text-muted-foreground mt-1">Welcome back! Manage your vendor activities and opportunities.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <NotificationBell onOpenSettings={() => setShowNotificationSettings(true)} />
            <Button variant="outline"><Settings className="mr-2 h-4 w-4" />Settings</Button>
            <Button asChild><Link href="/marketplace/rfps"><Globe className="mr-2 h-4 w-4" />Browse Marketplace</Link></Button>
          </div>
        </div>

        <StatsCards vendorProfile={vendorProfile} invitations={invitations} bids={bids} />

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3 sm:grid-cols-6 overflow-x-auto">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="invitations">Invitations</TabsTrigger>
            <TabsTrigger value="bids">My Bids</TabsTrigger>
            <TabsTrigger value="marketplace">Marketplace</TabsTrigger>
            <TabsTrigger value="team">Team</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview"><OverviewTab vendorProfile={vendorProfile} /></TabsContent>
          <TabsContent value="invitations"><InvitationsTab invitations={invitations} searchTerm={searchTerm} statusFilter={statusFilter} onSearchChange={setSearchTerm} onStatusChange={setStatusFilter} /></TabsContent>
          <TabsContent value="bids"><BidsTab bids={bids} /></TabsContent>
          <TabsContent value="marketplace"><MarketplaceTab vendorProfile={vendorProfile} opportunities={opportunities} /></TabsContent>
          <TabsContent value="team"><TeamTab vendorUsers={vendorUsers} /></TabsContent>
          <TabsContent value="analytics"><AnalyticsTab vendorProfile={vendorProfile} /></TabsContent>
        </Tabs>
      </div>

      <NotificationModal
        show={showNotificationSettings}
        onClose={() => setShowNotificationSettings(false)}
        settings={notificationSettings}
        onSettingsChange={async (settings) => { setNotificationSettings(settings); saveNotificationSettings(settings) }}
        onSave={async () => { await saveNotificationSettings(notificationSettings); setShowNotificationSettings(false) }}
      />
    </MainLayout>
  )
}