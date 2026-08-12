"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { EmptyState } from "@/components/shared/empty-state"
import {
  ArrowLeft,
  FileText,
  MessageSquare,
  Clock,
  DollarSign,
  User,
  Send,
  AlertCircle,
} from "lucide-react"
import { toast } from "sonner"

interface TimelineEntry {
  status: string
  date: string
  label: string
}

interface BidData {
  id: string
  status: string
  amount: number | null
  currency: string
  duration: string | null
  proposal: string | null
  coverLetter: string | null
  createdAt: string
  updatedAt: string
  threadId: string | null
  publicRfp: { id: string; title: string } | null
  vendorProfile: { id: string; businessName: string } | null
  messages?: Array<{
    id: string
    content: string
    createdAt: string
    sender: { id: string; name: string }
  }>
}

export default function BidDetailPage() {
  const params = useParams()
  const router = useRouter()
  const bidId = params.id as string

  const [bid, setBid] = useState<BidData | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [messages, setMessages] = useState<BidData["messages"]>([])
  const [replyText, setReplyText] = useState("")
  const [sendingReply, setSendingReply] = useState(false)

  useEffect(() => {
    async function fetchBid() {
      try {
        const res = await fetch(`/api/bids/${bidId}`)
        if (res.status === 404) {
          setNotFound(true)
          return
        }
        if (!res.ok) throw new Error("Failed to fetch bid")
        const data = await res.json()
        setBid(data)
        // If bid has embedded messages, use those; otherwise fetch from thread
        if (data.messages && data.messages.length > 0) {
          setMessages(data.messages)
        } else if (data.threadId) {
          try {
            const msgRes = await fetch(`/api/messages/threads/${data.threadId}/messages`)
            if (msgRes.ok) {
              const msgData = await msgRes.json()
              setMessages(Array.isArray(msgData) ? msgData : [])
            }
          } catch {
            // Silently fail – messages section will show empty state
          }
        }
      } catch {
        toast.error("Failed to load bid details")
      } finally {
        setLoading(false)
      }
    }
    fetchBid()
  }, [bidId])

  const handleSendReply = async () => {
    if (!replyText.trim() || !bid?.threadId) return
    setSendingReply(true)
    try {
      const res = await fetch(`/api/messages/threads/${bid.threadId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: replyText.trim() }),
      })
      if (!res.ok) throw new Error("Failed to send message")
      const newMsg = await res.json()
      setMessages((prev) => [...prev, newMsg])
      setReplyText("")
    } catch {
      toast.error("Failed to send message")
    } finally {
      setSendingReply(false)
    }
  }

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "accepted": return "default" as const
      case "rejected": return "destructive" as const
      case "submitted": return "secondary" as const
      case "under_review": return "outline" as const
      case "draft": return "outline" as const
      default: return "secondary" as const
    }
  }

  const formatStatus = (status: string) => {
    return status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getMockTimeline = (bidData: BidData): TimelineEntry[] => {
    const entries: TimelineEntry[] = [
      { status: "draft", date: bidData.createdAt, label: "Bid created as draft" },
      { status: "submitted", date: bidData.updatedAt, label: "Bid submitted" },
    ]
    if (bidData.status === "under_review") {
      entries.push({ status: "under_review", date: bidData.updatedAt, label: "Bid under review" })
    }
    if (bidData.status === "accepted") {
      entries.push({ status: "under_review", date: bidData.updatedAt, label: "Bid under review" })
      entries.push({ status: "accepted", date: bidData.updatedAt, label: "Bid accepted" })
    }
    if (bidData.status === "rejected") {
      entries.push({ status: "under_review", date: bidData.updatedAt, label: "Bid under review" })
      entries.push({ status: "rejected", date: bidData.updatedAt, label: "Bid rejected" })
    }
    return entries
  }

  // Loading skeleton
  if (loading) {
    return (
      <MainLayout title="Bid Details">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 bg-muted rounded animate-pulse" />
            <div className="h-7 w-48 bg-muted rounded animate-pulse" />
          </div>
          <Card>
            <CardHeader>
              <div className="h-6 w-64 bg-muted rounded animate-pulse" />
              <div className="h-4 w-40 bg-muted rounded animate-pulse mt-2" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="h-20 bg-muted rounded animate-pulse" />
              <div className="h-20 bg-muted rounded animate-pulse" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader><div className="h-6 w-40 bg-muted rounded animate-pulse" /></CardHeader>
            <CardContent><div className="h-32 bg-muted rounded animate-pulse" /></CardContent>
          </Card>
        </div>
      </MainLayout>
    )
  }

  // Not found
  if (notFound || !bid) {
    return (
      <MainLayout title="Bid Not Found">
        <div className="max-w-4xl mx-auto">
          <EmptyState
            icon={AlertCircle}
            title="Bid Not Found"
            description="The bid you're looking for doesn't exist or you don't have access to it."
            action={{ label: "Back to My Activity", onClick: () => router.push("/marketplace/my-activity") }}
          />
        </div>
      </MainLayout>
    )
  }

  const timeline = getMockTimeline(bid)

  return (
    <MainLayout title="Bid Details">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header with back button */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" aria-label="Go back" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Bid Details</h1>
            <p className="text-sm text-muted-foreground">Review your bid information and communication</p>
          </div>
        </div>

        {/* Bid Details Card */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <CardTitle className="text-xl flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  {bid.publicRfp?.title || "Untitled RFP"}
                </CardTitle>
                <CardDescription>Bid submitted for this RFP</CardDescription>
              </div>
              <Badge variant={getStatusVariant(bid.status)}>
                {formatStatus(bid.status)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Vendor</p>
                  <p className="font-medium">{bid.vendorProfile?.businessName || "Unknown Vendor"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Submitted</p>
                  <p className="font-medium">{formatDate(bid.createdAt)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Amount</p>
                  <p className="font-medium">
                    {bid.amount ? `$${bid.amount.toLocaleString()} ${bid.currency || ""}` : "Not specified"}
                  </p>
                </div>
              </div>
              {bid.duration && (
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Duration</p>
                    <p className="font-medium">{bid.duration}</p>
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* Cover Letter / Proposal */}
            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Cover Letter
              </h3>
              <div className="rounded-lg border bg-muted/30 p-4">
                <p className="text-sm whitespace-pre-wrap">
                  {bid.coverLetter || bid.proposal || "No cover letter provided."}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Timeline Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Status Timeline
            </CardTitle>
            <CardDescription>Track the progress of this bid</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative pl-6 space-y-6">
              {/* Vertical line */}
              <div className="absolute left-[9px] top-2 bottom-2 w-0.5 bg-border" />
              {timeline.map((entry, index) => (
                <div key={index} className="relative flex items-start gap-3">
                  <div className="absolute -left-6 top-1.5 h-4 w-4 rounded-full border-2 border-primary bg-background" />
                  <div>
                    <p className="font-medium text-sm">{entry.label}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(entry.date)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Messages Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Messages
            </CardTitle>
            <CardDescription>Communication related to this bid</CardDescription>
          </CardHeader>
          <CardContent>
            {messages.length === 0 ? (
              <EmptyState
                icon={MessageSquare}
                title="No messages yet"
                description="There are no messages associated with this bid. Start a conversation by sending a message below."
              />
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto mb-4">
                {messages.map((msg) => (
                  <div key={msg.id} className="flex gap-3">
                    <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-baseline gap-2">
                        <span className="text-sm font-medium">{msg.sender?.name || "Unknown"}</span>
                        <span className="text-xs text-muted-foreground">{formatDate(msg.createdAt)}</span>
                      </div>
                      <p className="text-sm mt-1 whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Reply input */}
            {bid.threadId && (
              <div className="flex gap-2 pt-4 border-t">
                <Input
                  placeholder="Type your message..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault()
                      handleSendReply()
                    }
                  }}
                  disabled={sendingReply}
                />
                <Button
                  onClick={handleSendReply}
                  disabled={!replyText.trim() || sendingReply}
                  size="icon"
                  aria-label="Send message"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}
