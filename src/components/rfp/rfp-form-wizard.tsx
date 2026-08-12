"use client"

import { useState, useEffect, useCallback } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TeamAssignment } from "@/components/rfp/team-assignment"
import { SectionQuestionBuilder } from "@/components/rfp/section-question-builder"
import { ScoringRubricBuilder } from "@/components/rfp/scoring-rubric-builder"
import { VendorInvitation } from "@/components/rfp/vendor-invitation"
import { type RFPSection } from "./types"
import { toast } from "sonner"

export const rfpFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  category: z.string().optional(),
  budget: z.string().optional(),
  confidentiality: z.enum(["internal", "confidential", "restricted"]),
  description: z.string().optional(),
  timeline: z.object({
    qnaStart: z.string().optional(),
    qnaEnd: z.string().optional(),
    submissionDeadline: z.string().optional(),
    evaluationStart: z.string().optional(),
    awardTarget: z.string().optional(),
  }).optional(),
  terms: z.object({
    ndaRequired: z.boolean().default(false),
    paymentTerms: z.string().optional(),
    deliveryTerms: z.string().optional(),
    specialConditions: z.string().optional(),
  }).optional(),
})

export type RFPFormData = z.infer<typeof rfpFormSchema>

export interface TeamMember {
  id: string
  name: string
  email: string
  role: "owner" | "editor" | "evaluator" | "approver" | "viewer"
  avatar?: string
}

export type Section = RFPSection

export interface RubricCriterion {
  id: string
  label: string
  weight: number
  scaleMin: number
  scaleMax: number
  guidance?: string
  sectionId?: string
}

export interface Invitation {
  id: string
  vendorId?: string
  email: string
  status: "pending" | "accepted" | "declined" | "expired"
  expiresAt?: string
  token: string
}

export interface WizardSubmitData {
  formData: RFPFormData
  teamMembers: TeamMember[]
  sections: Section[]
  criteria: RubricCriterion[]
  invitations: Invitation[]
}

export const steps = [
  { id: 1, title: "Basics", description: "Basic RFP information" },
  { id: 2, title: "Timeline", description: "Set important dates" },
  { id: 3, title: "Teams & Roles", description: "Assign team members" },
  { id: 4, title: "Sections & Questions", description: "Build RFP content" },
  { id: 5, title: "Scoring Rubric", description: "Define evaluation criteria" },
  { id: 6, title: "Vendors", description: "Invite vendors" },
  { id: 7, title: "Terms", description: "Legal terms and conditions" },
  { id: 8, title: "Review", description: "Review and publish" },
]

interface RfpFormWizardProps {
  defaultValues?: Partial<RFPFormData>
  defaultTeamMembers?: TeamMember[]
  defaultSections?: Section[]
  defaultCriteria?: RubricCriterion[]
  defaultInvitations?: Invitation[]
  onSubmit: (data: WizardSubmitData) => Promise<void>
  submitLabel: string
  submittingLabel: string
}

export function RfpFormWizard({
  defaultValues,
  defaultTeamMembers = [],
  defaultSections = [],
  defaultCriteria = [],
  defaultInvitations = [],
  onSubmit,
  submitLabel,
  submittingLabel,
}: RfpFormWizardProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  // Clear submit error when the user changes team/sections/criteria
  useEffect(() => {
    setSubmitError(null)
  }, [teamMembers.length, sections.length, criteria.length])

  // State for wizard steps
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(defaultTeamMembers)
  const [sections, setSections] = useState<Section[]>(defaultSections)
  const [criteria, setCriteria] = useState<RubricCriterion[]>(defaultCriteria)
  const [invitations, setInvitations] = useState<Invitation[]>(defaultInvitations)

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    trigger,
  } = useForm<RFPFormData>({
    resolver: zodResolver(rfpFormSchema) as any,
    defaultValues: {
      confidentiality: "internal",
      terms: {
        ndaRequired: false,
      },
      ...defaultValues,
    },
  })

  const nextStep = async () => {
    const fieldsToValidate = getFieldsForStep(currentStep) as any[]
    const isValid = await trigger(fieldsToValidate)
    if (isValid) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    setCurrentStep(currentStep - 1)
  }

  const getFieldsForStep = (step: number) => {
    switch (step) {
      case 1:
        return ["title", "category", "budget", "confidentiality", "description"]
      case 2:
        return ["timeline.qnaStart", "timeline.qnaEnd", "timeline.submissionDeadline"]
      case 3:
        return []
      case 4:
        return []
      case 5:
        return []
      case 6:
        return []
      case 7:
        return ["terms.ndaRequired", "terms.paymentTerms", "terms.deliveryTerms"]
      case 8:
        return []
      default:
        return []
    }
  }

  const canSubmit = useCallback(() => {
    return teamMembers.length > 0 && sections.length > 0 && criteria.length > 0
  }, [teamMembers.length, sections.length, criteria.length])

  const handleFormSubmit = async (data: RFPFormData) => {
    // Validate required components before starting submission
    if (teamMembers.length === 0) {
      setSubmitError("Please assign at least one team member")
      toast.error("Please assign at least one team member")
      return
    }

    if (sections.length === 0) {
      setSubmitError("Please add at least one section with questions")
      toast.error("Please add at least one section with questions")
      return
    }

    if (criteria.length === 0) {
      setSubmitError("Please add at least one scoring criterion")
      toast.error("Please add at least one scoring criterion")
      return
    }

    setIsSubmitting(true)
    setSubmitError(null)
    try {
      await onSubmit({
        formData: data,
        teamMembers,
        sections,
        criteria,
        invitations,
      })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save RFP")
      console.error("RFP save error:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">RFP Title *</Label>
              <Input
                id="title"
                {...register("title")}
                placeholder="Enter RFP title"
              />
              {errors.title && (
                <p className="text-sm text-red-600 dark:text-red-400">{errors.title.message}</p>
              )}
            </div>
            
            <div>
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                {...register("category")}
                placeholder="e.g., IT Services, Marketing, Construction"
              />
            </div>

            <div>
              <Label htmlFor="budget">Budget</Label>
              <Input
                id="budget"
                {...register("budget")}
                placeholder="e.g., $100,000"
              />
            </div>

            <div>
              <Label htmlFor="confidentiality">Confidentiality Level</Label>
              <Select onValueChange={(value) => setValue("confidentiality", value as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select confidentiality level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="internal">Internal</SelectItem>
                  <SelectItem value="confidential">Confidential</SelectItem>
                  <SelectItem value="restricted">Restricted</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                {...register("description")}
                placeholder="Brief description of the RFP"
                rows={3}
              />
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="qnaStart">Q&A Start Date</Label>
              <Input
                id="qnaStart"
                type="datetime-local"
                {...register("timeline.qnaStart")}
              />
            </div>

            <div>
              <Label htmlFor="qnaEnd">Q&A End Date</Label>
              <Input
                id="qnaEnd"
                type="datetime-local"
                {...register("timeline.qnaEnd")}
              />
            </div>

            <div>
              <Label htmlFor="submissionDeadline">Submission Deadline *</Label>
              <Input
                id="submissionDeadline"
                type="datetime-local"
                {...register("timeline.submissionDeadline")}
              />
              {errors.timeline?.submissionDeadline && (
                <p className="text-sm text-red-600 dark:text-red-400">
                  {errors.timeline.submissionDeadline.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="evaluationStart">Evaluation Start Date</Label>
              <Input
                id="evaluationStart"
                type="datetime-local"
                {...register("timeline.evaluationStart")}
              />
            </div>

            <div>
              <Label htmlFor="awardTarget">Target Award Date</Label>
              <Input
                id="awardTarget"
                type="datetime-local"
                {...register("timeline.awardTarget")}
              />
            </div>
          </div>
        )

      case 3:
        return (
          <TeamAssignment
            teamMembers={teamMembers}
            onTeamMembersChange={setTeamMembers}
          />
        )

      case 4:
        return (
          <SectionQuestionBuilder
            sections={sections}
            onSectionsChange={setSections}
          />
        )

      case 5:
        return (
          <ScoringRubricBuilder
            criteria={criteria}
            sections={sections}
            onCriteriaChange={setCriteria}
          />
        )

      case 6:
        return (
          <VendorInvitation
            invitations={invitations}
            onInvitationsChange={setInvitations}
            rfpDeadline={watch("timeline.submissionDeadline")}
          />
        )

      case 7:
        return (
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="ndaRequired"
                {...register("terms.ndaRequired")}
                onChange={(e) => setValue("terms.ndaRequired", e.target.checked)}
              />
              <Label htmlFor="ndaRequired">NDA Required</Label>
            </div>

            <div>
              <Label htmlFor="paymentTerms">Payment Terms</Label>
              <Textarea
                id="paymentTerms"
                {...register("terms.paymentTerms")}
                placeholder="e.g., Net 30 days, 50% upfront, 50% on completion"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="deliveryTerms">Delivery Terms</Label>
              <Textarea
                id="deliveryTerms"
                {...register("terms.deliveryTerms")}
                placeholder="e.g., Delivery within 90 days of contract signing"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="specialConditions">Special Conditions</Label>
              <Textarea
                id="specialConditions"
                {...register("terms.specialConditions")}
                placeholder="Any special conditions or requirements"
                rows={3}
              />
            </div>
          </div>
        )

      case 8:
        return (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold">Review Your RFP</h3>
              <div className="mt-4 space-y-6">
                {/* Basic Information */}
                <div>
                  <h4 className="font-medium mb-3">Basic Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Title</Label>
                      <p className="text-sm text-muted-foreground/80">{watch("title")}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Category</Label>
                      <p className="text-sm text-muted-foreground/80">{watch("category") || "Not specified"}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Budget</Label>
                      <p className="text-sm text-muted-foreground/80">{watch("budget") || "Not specified"}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Confidentiality</Label>
                      <Badge variant="outline">{watch("confidentiality")}</Badge>
                    </div>
                  </div>
                </div>

                {/* Timeline */}
                {watch("timeline.submissionDeadline") && (
                  <div>
                    <h4 className="font-medium mb-3">Timeline</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium">Q&A Start</Label>
                        <p className="text-sm text-muted-foreground/80">{watch("timeline.qnaStart") || "Not set"}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Q&A End</Label>
                        <p className="text-sm text-muted-foreground/80">{watch("timeline.qnaEnd") || "Not set"}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Submission Deadline</Label>
                        <p className="text-sm text-muted-foreground/80">{watch("timeline.submissionDeadline")}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Evaluation Start</Label>
                        <p className="text-sm text-muted-foreground/80">{watch("timeline.evaluationStart") || "Not set"}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Team Members */}
                <div>
                  <h4 className="font-medium mb-3">Team Members ({teamMembers.length})</h4>
                  <div className="space-y-2">
                    {teamMembers.map((member) => (
                      <div key={member.id} className="flex items-center justify-between p-2 border rounded">
                        <div>
                          <span className="font-medium">{member.name}</span>
                          <span className="text-sm text-muted-foreground/80 ml-2">({member.email})</span>
                        </div>
                        <Badge variant="outline">{member.role}</Badge>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Sections */}
                <div>
                  <h4 className="font-medium mb-3">Sections ({sections.length})</h4>
                  <div className="space-y-2">
                    {sections.map((section) => (
                      <div key={section.id} className="flex items-center justify-between p-2 border rounded">
                        <div>
                          <span className="font-medium">{section.title}</span>
                          <span className="text-sm text-muted-foreground/80 ml-2">
                            ({section.questions.length} questions)
                          </span>
                        </div>
                        {section.isRequired && <Badge variant="destructive">Required</Badge>}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Scoring Criteria */}
                <div>
                  <h4 className="font-medium mb-3">Scoring Criteria ({criteria.length})</h4>
                  <div className="space-y-2">
                    {criteria.map((criterion) => (
                      <div key={criterion.id} className="flex items-center justify-between p-2 border rounded">
                        <div>
                          <span className="font-medium">{criterion.label}</span>
                          <span className="text-sm text-muted-foreground/80 ml-2">
                            ({criterion.scaleMin}-{criterion.scaleMax} scale)
                          </span>
                        </div>
                        <Badge variant="outline">{criterion.weight}%</Badge>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Vendor Invitations */}
                <div>
                  <h4 className="font-medium mb-3">Vendor Invitations ({invitations.length})</h4>
                  <div className="space-y-2">
                    {invitations.map((invitation) => (
                      <div key={invitation.id} className="flex items-center justify-between p-2 border rounded">
                        <span className="font-medium">{invitation.email}</span>
                        <Badge variant="outline">{invitation.status}</Badge>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Terms */}
                {watch("terms.ndaRequired") && (
                  <div>
                    <h4 className="font-medium mb-3">Terms & Conditions</h4>
                    <div className="space-y-2">
                      <div>
                        <Label className="text-sm font-medium">NDA Required</Label>
                        <Badge variant="destructive" className="ml-2">Yes</Badge>
                      </div>
                      {watch("terms.paymentTerms") && (
                        <div>
                          <Label className="text-sm font-medium">Payment Terms</Label>
                          <p className="text-sm text-muted-foreground/80">{watch("terms.paymentTerms")}</p>
                        </div>
                      )}
                      {watch("terms.deliveryTerms") && (
                        <div>
                          <Label className="text-sm font-medium">Delivery Terms</Label>
                          <p className="text-sm text-muted-foreground/80">{watch("terms.deliveryTerms")}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={`flex items-center ${index < steps.length - 1 ? "flex-1" : ""}`}
            >
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                  currentStep >= step.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted-foreground/20 text-muted-foreground/80"
                }`}
              >
                {step.id}
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium">{step.title}</p>
                <p className="text-xs text-muted-foreground">{step.description}</p>
              </div>
              {index < steps.length - 1 && (
                <div className="flex-1 h-1 bg-muted-foreground/20 mx-4">
                  <div
                    className={`h-full bg-primary transition-all duration-300 ${
                      currentStep > step.id ? "w-full" : "w-0"
                    }`}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Form Content */}
      <Card>
        <CardHeader>
          <CardTitle>{steps[currentStep - 1]?.title}</CardTitle>
          <CardDescription>{steps[currentStep - 1]?.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(handleFormSubmit)}>
            {renderStepContent()}

            <div className="flex justify-between mt-8">
              <Button
                type="button"
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 1}
              >
                Previous
              </Button>
              
              {currentStep === steps.length ? (
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? submittingLabel : submitLabel}
                </Button>
              ) : (
                <Button type="button" onClick={nextStep}>
                  Next
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
