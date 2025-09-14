"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { MainLayout } from "@/components/layout/main-layout"
import { toast } from "sonner"

const rfpFormSchema = z.object({
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
})

type RFPFormData = z.infer<typeof rfpFormSchema>

const steps = [
  { id: 1, title: "Basics", description: "Basic RFP information" },
  { id: 2, title: "Timeline", description: "Set important dates" },
  { id: 3, title: "Teams & Roles", description: "Assign team members" },
  { id: 4, title: "Sections & Questions", description: "Build RFP content" },
  { id: 5, title: "Scoring Rubric", description: "Define evaluation criteria" },
  { id: 6, title: "Vendors", description: "Invite vendors" },
  { id: 7, title: "Terms", description: "Legal terms and conditions" },
  { id: 8, title: "Review", description: "Review and publish" },
]

export default function CreateRFP() {
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    trigger,
  } = useForm<RFPFormData>({
    resolver: zodResolver(rfpFormSchema),
    defaultValues: {
      confidentiality: "internal",
    },
  })

  const nextStep = async () => {
    const fieldsToValidate = getFieldsForStep(currentStep)
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
      default:
        return []
    }
  }

  const onSubmit = async (data: RFPFormData) => {
    setIsSubmitting(true)
    try {
      // TODO: Implement actual RFP creation logic
      console.log("Creating RFP:", data)
      toast.success("RFP created successfully!")
      router.push("/rfps")
    } catch (error) {
      toast.error("Failed to create RFP")
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
                <p className="text-sm text-red-600">{errors.title.message}</p>
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
                <p className="text-sm text-red-600">
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
          <div className="space-y-4">
            <Alert>
              <AlertDescription>
                Team member assignment will be implemented in a future update. For now, you can assign team members after creating the RFP.
              </AlertDescription>
            </Alert>
          </div>
        )

      case 4:
        return (
          <div className="space-y-4">
            <Alert>
              <AlertDescription>
                Section and question builder will be implemented in a future update. For now, you can add sections and questions after creating the RFP.
              </AlertDescription>
            </Alert>
          </div>
        )

      case 5:
        return (
          <div className="space-y-4">
            <Alert>
              <AlertDescription>
                Scoring rubric configuration will be implemented in a future update. For now, you can set up scoring criteria after creating the RFP.
              </AlertDescription>
            </Alert>
          </div>
        )

      case 6:
        return (
          <div className="space-y-4">
            <Alert>
              <AlertDescription>
                Vendor invitation will be implemented in a future update. For now, you can invite vendors after creating the RFP.
              </AlertDescription>
            </Alert>
          </div>
        )

      case 7:
        return (
          <div className="space-y-4">
            <Alert>
              <AlertDescription>
                Legal terms and conditions configuration will be implemented in a future update. For now, you can add terms after creating the RFP.
              </AlertDescription>
            </Alert>
          </div>
        )

      case 8:
        return (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold">Review Your RFP</h3>
              <div className="mt-4 space-y-3">
                <div>
                  <Label className="text-sm font-medium">Title</Label>
                  <p className="text-sm text-gray-600">{watch("title")}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Category</Label>
                  <p className="text-sm text-gray-600">{watch("category") || "Not specified"}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Budget</Label>
                  <p className="text-sm text-gray-600">{watch("budget") || "Not specified"}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Confidentiality</Label>
                  <Badge variant="outline">{watch("confidentiality")}</Badge>
                </div>
                {watch("timeline.submissionDeadline") && (
                  <div>
                    <Label className="text-sm font-medium">Submission Deadline</Label>
                    <p className="text-sm text-gray-600">{watch("timeline.submissionDeadline")}</p>
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
    <MainLayout title="Create RFP">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Create New RFP</h1>
          <p className="text-gray-600">Follow the steps to create your Request for Proposal</p>
        </div>

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
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {step.id}
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium">{step.title}</p>
                  <p className="text-xs text-gray-500">{step.description}</p>
                </div>
                {index < steps.length - 1 && (
                  <div className="flex-1 h-1 bg-gray-200 mx-4">
                    <div
                      className={`h-full bg-blue-600 transition-all duration-300 ${
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
            <form onSubmit={handleSubmit(onSubmit)}>
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
                    {isSubmitting ? "Creating..." : "Create RFP"}
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
    </MainLayout>
  )
}