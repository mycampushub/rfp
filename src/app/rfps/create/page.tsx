"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { MainLayout } from "@/components/layout/main-layout"
import { RfpFormWizard, WizardSubmitData } from "@/components/rfp/rfp-form-wizard"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

export default function CreateRFP() {
  useEffect(() => { document.title = 'Create RFP | RFP Platform' }, [])
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (data: WizardSubmitData) => {
    setSubmitting(true)
    let createdRfpId: string | null = null
    const createdSectionIds: string[] = []

    try {
      const { formData, sections } = data

      // Prepare RFP creation payload matching API schema
      const rfpPayload = {
        title: formData.title,
        category: formData.category,
        budget: formData.budget ? parseFloat(formData.budget.replace(/[^0-9.-]+/g, "")) : undefined,
        confidentiality: formData.confidentiality,
        description: formData.description,
        timeline: formData.timeline?.qnaStart || formData.timeline?.submissionDeadline
          ? {
              qnaStart: formData.timeline?.qnaStart || undefined,
              qnaEnd: formData.timeline?.qnaEnd || undefined,
              submissionDeadline: formData.timeline?.submissionDeadline || undefined,
              evaluationStart: formData.timeline?.evaluationStart || undefined,
              awardTarget: formData.timeline?.awardTarget || undefined,
            }
          : undefined,
      }

      // Step 1: Create the RFP
      const rfpRes = await fetch("/api/rfps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(rfpPayload),
      })
      if (!rfpRes.ok) {
        const errData = await rfpRes.json().catch(() => null)
        throw new Error(errData?.error || `Failed to create RFP (${rfpRes.status})`)
      }
      const newRfp = await rfpRes.json()
      createdRfpId = newRfp.id

      // Step 2: Create sections and questions (with error handling and rollback)
      if (sections.length > 0) {
        const sectionResults = await Promise.allSettled(
          sections.map(async (section) => {
            const sectionRes = await fetch("/api/sections", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                rfpId: newRfp.id,
                order: section.order,
                title: section.title,
                description: section.description,
                isRequired: section.isRequired,
              }),
            })
            if (!sectionRes.ok) {
              const errData = await sectionRes.json().catch(() => null)
              throw new Error(errData?.error || `Failed to create section "${section.title}" (${sectionRes.status})`)
            }
            const createdSection = await sectionRes.json()
            return { createdSection, questions: section.questions }
          })
        )

        // Check for any failed section creations
        const sectionErrors = sectionResults
          .map((r, i) => (r.status === 'rejected' ? `Section ${i + 1}: ${r.reason?.message || 'Unknown error'}` : null))
          .filter(Boolean)

        if (sectionErrors.length > 0) {
          // Rollback: delete the RFP (cascades to sections/questions)
          try {
            await fetch(`/api/rfps/${newRfp.id}`, { method: 'DELETE' })
          } catch {
            // Best-effort rollback
          }
          throw new Error(`Section creation failed. Rolled back RFP. ${sectionErrors.join('; ')}`)
        }

        // Create questions for each successfully created section
        const questionResults = await Promise.allSettled(
          sectionResults
            .filter((r): r is PromiseFulfilledResult<{ createdSection: any; questions: any[] }> => r.status === 'fulfilled')
            .flatMap(({ value }) =>
              value.questions.map((q, qIdx) =>
                fetch("/api/questions", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    sectionId: value.createdSection.id,
                    type: q.type || "text",
                    prompt: q.prompt || q.title || "",
                    required: q.required ?? false,
                    constraints: q.constraints || undefined,
                    order: qIdx,
                  }),
                }).then(async (res) => {
                  if (!res.ok) throw new Error(`Failed to create question "${q.prompt || q.title}" (${res.status})`)
                  return res.json()
                })
              )
            )
        )

        const questionErrors = questionResults
          .map((r, i) => (r.status === 'rejected' ? r.reason?.message : null))
          .filter(Boolean)

        if (questionErrors.length > 0) {
          // Rollback: delete the RFP
          try {
            await fetch(`/api/rfps/${newRfp.id}`, { method: 'DELETE' })
          } catch {
            // Best-effort rollback
          }
          throw new Error(`Question creation failed. Rolled back RFP. ${questionErrors.join('; ')}`)
        }
      }

      toast.success("RFP created successfully!")
      router.push(`/rfps/${newRfp.id}`)
    } catch (error) {
      const message = error instanceof Error ? error.message : "An unexpected error occurred while creating the RFP"
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  if (submitting) {
    return (
      <MainLayout title="Creating RFP...">
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-1">Creating your RFP</h2>
            <p className="text-muted-foreground">Setting up sections, questions, and team assignments...</p>
          </div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout title="Create RFP">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Create New RFP</h1>
        <p className="text-muted-foreground/80">Follow the steps to create your Request for Proposal</p>
      </div>
      <RfpFormWizard
        onSubmit={handleSubmit}
        submitLabel="Create RFP"
        submittingLabel="Creating..."
      />
    </MainLayout>
  )
}
