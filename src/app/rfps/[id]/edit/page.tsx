"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { MainLayout } from "@/components/layout/main-layout"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/shared/empty-state"
import {
  RfpFormWizard,
  RFPFormData,
  WizardSubmitData,
  TeamMember,
  Section,
  Invitation,
} from "@/components/rfp/rfp-form-wizard"
import { toast } from "sonner"
import { FileText, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

interface RFPRawData {
  id: string
  title: string
  category: string | null
  budget: number | null
  confidentiality: "internal" | "confidential" | "restricted"
  description: string | null
  status: string
  timeline?: {
    qnaStart?: string | null
    qnaEnd?: string | null
    submissionDeadline?: string | null
    evaluationStart?: string | null
    awardTarget?: string | null
  } | null
  settings?: any
  sections?: any[]
  teams?: any[]
  invitations?: any[]
}

export default function EditRFPPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [rfpData, setRfpData] = useState<RFPRawData | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchRFP() {
      try {
        const res = await fetch(`/api/rfps/${params.id}`)
        if (res.status === 404) {
          setNotFound(true)
          return
        }
        if (!res.ok) {
          const errData = await res.json().catch(() => null)
          setError(errData?.error || `Failed to fetch RFP (${res.status})`)
          return
        }
        const data = await res.json()
        setRfpData(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch RFP")
      } finally {
        setLoading(false)
      }
    }
    fetchRFP()
  }, [params.id])

  const buildDefaultValues = (data: RFPRawData): Partial<RFPFormData> => {
    const tl = data.timeline
    return {
      title: data.title || "",
      category: data.category || "",
      budget: data.budget != null ? String(data.budget) : "",
      confidentiality: data.confidentiality || "internal",
      description: data.description || "",
      timeline: tl
        ? {
            qnaStart: tl.qnaStart || "",
            qnaEnd: tl.qnaEnd || "",
            submissionDeadline: tl.submissionDeadline || "",
            evaluationStart: tl.evaluationStart || "",
            awardTarget: tl.awardTarget || "",
          }
        : undefined,
    }
  }

  const buildDefaultTeamMembers = (data: RFPRawData): TeamMember[] => {
    if (!data.teams || data.teams.length === 0) return []
    return data.teams.map((t: any) => ({
      id: t.id,
      name: t.user?.name || "Unknown",
      email: t.user?.email || "",
      role: t.role || "viewer",
    }))
  }

  const buildDefaultSections = (data: RFPRawData): Section[] => {
    if (!data.sections || data.sections.length === 0) return []
    return data.sections.map((s: any) => ({
      id: s.id,
      title: s.title || "",
      description: s.description || "",
      isRequired: s.isRequired ?? false,
      order: s.order ?? 0,
      questions: (s.questions || []).map((q: any, idx: number) => ({
        id: q.id,
        type: q.type || "text",
        prompt: q.prompt || q.title || "",
        title: q.prompt || q.title || "",
        required: q.required ?? false,
        constraints: q.constraints || undefined,
        order: q.order ?? idx,
      })),
    }))
  }

  const buildDefaultInvitations = (data: RFPRawData): Invitation[] => {
    if (!data.invitations || data.invitations.length === 0) return []
    return data.invitations.map((inv: any) => ({
      id: inv.id,
      vendorId: inv.vendorId || undefined,
      email: inv.email || inv.vendor?.email || "",
      status: inv.status || "pending",
      expiresAt: inv.expiresAt || undefined,
      token: inv.token || "",
    }))
  }

  const handleSubmit = async (submitData: WizardSubmitData) => {
    const { formData, teamMembers, sections, invitations } = submitData

    // 1. Update basic RFP fields + timeline
    const payload: Record<string, unknown> = {
      title: formData.title,
      category: formData.category || undefined,
      budget: formData.budget
        ? parseFloat(formData.budget.replace(/[^0-9.-]+/g, ""))
        : undefined,
      confidentiality: formData.confidentiality,
      description: formData.description || undefined,
    }

    if (formData.timeline) {
      const hasAnyTimelineField = Object.values(formData.timeline).some(
        (v) => v && v.trim() !== ""
      )
      if (hasAnyTimelineField) {
        payload.timeline = {
          qnaStart: formData.timeline.qnaStart || undefined,
          qnaEnd: formData.timeline.qnaEnd || undefined,
          submissionDeadline: formData.timeline.submissionDeadline || undefined,
          evaluationStart: formData.timeline.evaluationStart || undefined,
          awardTarget: formData.timeline.awardTarget || undefined,
        }
      }
    }

    const res = await fetch(`/api/rfps/${params.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      const errData = await res.json().catch(() => null)
      throw new Error(errData?.error || `Failed to update RFP (${res.status})`)
    }

    // 2. Sync sections (parallel with team & invitations)
    const sectionsPromise = (async () => {
      try {
        const secRes = await fetch(`/api/rfps/${params.id}/sections`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sections }),
        })
        if (!secRes.ok) {
          console.error("Failed to sync sections:", secRes.status)
        }
      } catch (err) {
        console.error("Error syncing sections:", err)
      }
    })()

    // 3. Sync team members
    const teamPromise = (async () => {
      if (teamMembers.length > 0) {
        try {
          const teamRes = await fetch(`/api/rfps/${params.id}/team`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              members: teamMembers.map((m) => ({
                name: m.name,
                email: m.email,
                role: m.role,
              })),
            }),
          })
          if (!teamRes.ok) {
            console.error("Failed to sync team:", teamRes.status)
          }
        } catch (err) {
          console.error("Error syncing team:", err)
        }
      }
    })()

    // 4. Sync invitations
    const invitationsPromise = (async () => {
      if (invitations.length > 0) {
        try {
          const invRes = await fetch(`/api/rfps/${params.id}/invitations`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              invitations: invitations.map((inv) => ({
                vendorId: inv.vendorId,
                email: inv.email,
                status: inv.status,
                expiresAt: inv.expiresAt,
              })),
            }),
          })
          if (!invRes.ok) {
            console.error("Failed to sync invitations:", invRes.status)
          }
        } catch (err) {
          console.error("Error syncing invitations:", err)
        }
      }
    })()

    // Wait for all secondary updates to complete
    await Promise.all([sectionsPromise, teamPromise, invitationsPromise])

    toast.success("RFP updated successfully!")
    router.push(`/rfps/${params.id}`)
  }

  if (loading) {
    return (
      <MainLayout title="Edit RFP">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-80" />
          </div>
          <div className="flex items-center gap-2 mb-8">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center gap-2 flex-1">
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
          <div className="rounded-lg border p-6">
            <Skeleton className="h-6 w-32 mb-4" />
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          </div>
        </div>
      </MainLayout>
    )
  }

  if (notFound || error) {
    return (
      <MainLayout title="Edit RFP">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/rfps")}
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to RFPs
            </Button>
          </div>
          <EmptyState
            icon={FileText}
            title={notFound ? "RFP Not Found" : "Error Loading RFP"}
            description={
              notFound
                ? "The RFP you are looking for does not exist or has been removed."
                : error || "An unexpected error occurred."
            }
            action={{
              label: "View All RFPs",
              onClick: () => router.push("/rfps"),
            }}
          />
        </div>
      </MainLayout>
    )
  }

  if (!rfpData) return null

  return (
    <MainLayout title="Edit RFP">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Edit RFP</h1>
        <p className="text-muted-foreground/80">Update your Request for Proposal details</p>
      </div>
      <RfpFormWizard
        key={rfpData.id}
        defaultValues={buildDefaultValues(rfpData)}
        defaultTeamMembers={buildDefaultTeamMembers(rfpData)}
        defaultSections={buildDefaultSections(rfpData)}
        defaultInvitations={buildDefaultInvitations(rfpData)}
        onSubmit={handleSubmit}
        submitLabel="Save Changes"
        submittingLabel="Saving..."
      />
    </MainLayout>
  )
}
