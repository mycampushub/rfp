"use client"

import { useEffect, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { MainLayout } from "@/components/layout/main-layout"
import { RfpFormWizard, WizardSubmitData } from "@/components/rfp/rfp-form-wizard"
import { TemplateSelector, TemplateData } from "@/components/rfp/template-selector"
import { toast } from "sonner"
import { Loader2, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import type { Section, RubricCriterion } from "@/components/rfp/rfp-form-wizard"
import type { QuestionType } from "@/components/rfp/types"

export default function CreateRFP() {
  useEffect(() => { document.title = 'Create RFP | RFP Platform' }, [])
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateData | null | undefined>(undefined)
  // undefined = choosing phase (show selector), null = scratch, TemplateData = selected template

  const handleTemplateSelect = (template: TemplateData | null) => {
    setSelectedTemplate(template)
  }

  const handleBackToSelector = () => {
    setSelectedTemplate(undefined)
  }

  // Pre-populated sections from template
  const defaultSections: Section[] = useMemo(() => {
    if (!selectedTemplate) return []
    try {
      const parsed = JSON.parse(selectedTemplate.sections)
      return (Array.isArray(parsed) ? parsed : []).map((s: Record<string, unknown>, idx: number) => ({
        id: `tpl-${idx}-${Date.now()}`,
        title: (s.title as string) || "",
        description: (s.description as string) || undefined,
        isRequired: true,
        order: idx,
        questions: Array.isArray(s.questions)
          ? (s.questions as Record<string, unknown>[]).map((q, qIdx) => ({
              id: `tpl-q-${idx}-${qIdx}-${Date.now()}`,
              type: ((q.type as string) || "text") as QuestionType,
              prompt: (q.prompt as string) || "",
              required: (q.required as boolean) ?? false,
              constraints: undefined,
              options: undefined,
              order: qIdx,
            }))
          : [],
      }))
    } catch {
      return []
    }
  }, [selectedTemplate])

  // Pre-populated criteria from template
  const defaultCriteria: RubricCriterion[] = useMemo(() => {
    if (!selectedTemplate) return []
    try {
      const parsed = JSON.parse(selectedTemplate.scoringCriteria)
      return (Array.isArray(parsed) ? parsed : []).map((c: Record<string, unknown>, idx: number) => ({
        id: `tpl-c-${idx}-${Date.now()}`,
        label: (c.label as string) || "",
        weight: (c.weight as number) || 0,
        scaleMin: (c.scaleMin as number) ?? 1,
        scaleMax: (c.scaleMax as number) ?? 10,
        guidance: (c.guidance as string) || undefined,
        sectionId: undefined,
      }))
    } catch {
      return []
    }
  }, [selectedTemplate])

  const handleSubmit = async (data: WizardSubmitData) => {
    setSubmitting(true)
    let _createdRfpId: string | null = null

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
        templateId: selectedTemplate?.id || undefined,
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
      _createdRfpId = newRfp.id

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
          .map((r) => (r.status === 'rejected' ? r.reason?.message : null))
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
      <MainLayout title="Creating RFP..." hideBreadcrumbs>
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
    <MainLayout title="Create RFP" hideBreadcrumbs>
      {/* Template Selection Phase */}
      {selectedTemplate === undefined && (
        <div className="mb-8">
          <Breadcrumb className="mb-4">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/">Home</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href="/rfps">RFPs</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Create New RFP</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <h1 className="text-2xl font-bold mb-1">Create New RFP</h1>
          <p className="text-muted-foreground/80">
            Choose a starting point for your Request for Proposal
          </p>
          <div className="mt-6">
            <TemplateSelector onSelect={handleTemplateSelect} />
          </div>
        </div>
      )}

      {/* Wizard Phase */}
      {selectedTemplate !== undefined && (
        <div>
          <div className="mb-6">
            <Breadcrumb className="mb-4">
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/">Home</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink href="/rfps">RFPs</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Create New RFP</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBackToSelector}
              className="mb-3 -ml-2 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to templates
            </Button>
            <h1 className="text-2xl font-bold mb-1">Create New RFP</h1>
            <p className="text-muted-foreground/80">
              {selectedTemplate
                ? `Using "${selectedTemplate.name}" template — you can customize all sections and criteria.`
                : "Follow the steps to create your Request for Proposal"
              }
            </p>
          </div>
          <RfpFormWizard
            defaultSections={defaultSections}
            defaultCriteria={defaultCriteria}
            onSubmit={handleSubmit}
            submitLabel="Create RFP"
            submittingLabel="Creating..."
          />
        </div>
      )}
    </MainLayout>
  )
}
