"use client"

import { useState } from "react"
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
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  FileText, 
  Award,
  Building,
  Users,
  DollarSign,
  Clock,
  Upload,
  Download
} from "lucide-react"
import { toast } from "sonner"

interface PrequalificationQuestion {
  id: string
  question: string
  type: "text" | "number" | "select" | "multiselect" | "yesno" | "file"
  required: boolean
  weight: number
  options?: string[]
  validation?: {
    min?: number
    max?: number
    pattern?: string
  }
}

interface PrequalificationResponse {
  questionId: string
  value: any
  score?: number
  notes?: string
}

interface VendorPrequalificationProps {
  vendorId: string
  onComplete: (responses: PrequalificationResponse[], score: number) => void
}

const prequalificationQuestions: PrequalificationQuestion[] = [
  {
    id: "years_in_business",
    question: "How many years has your company been in business?",
    type: "number",
    required: true,
    weight: 10,
    validation: { min: 1, max: 100 }
  },
  {
    id: "annual_revenue",
    question: "What is your company's annual revenue (USD)?",
    type: "number",
    required: true,
    weight: 15,
    validation: { min: 0 }
  },
  {
    id: "employee_count",
    question: "How many full-time employees does your company have?",
    type: "number",
    required: true,
    weight: 10,
    validation: { min: 1 }
  },
  {
    id: "company_type",
    question: "What is your company's business structure?",
    type: "select",
    required: true,
    weight: 5,
    options: ["Sole Proprietorship", "Partnership", "LLC", "S-Corporation", "C-Corporation", "Non-Profit"]
  },
  {
    id: "primary_industries",
    question: "What are your primary industries of operation? (Select all that apply)",
    type: "multiselect",
    required: true,
    weight: 10,
    options: [
      "IT Services", "Construction", "Healthcare", "Education", "Finance", 
      "Manufacturing", "Retail", "Consulting", "Real Estate", "Transportation"
    ]
  },
  {
    id: "certifications",
    question: "Do you have any relevant certifications? (Select all that apply)",
    type: "multiselect",
    required: false,
    weight: 15,
    options: [
      "ISO 9001", "ISO 27001", "SOC 2", "CMMI Level 3", "LEED Certified",
      "OSHA Compliant", "GSA Certified", "Women-Owned", "Minority-Owned",
      "Veteran-Owned", "Disability-Owned", "HUBZone Certified"
    ]
  },
  {
    id: "insurance_coverage",
    question: "Do you have general liability insurance coverage?",
    type: "yesno",
    required: true,
    weight: 10
  },
  {
    id: "insurance_amount",
    question: "What is your general liability insurance coverage amount?",
    type: "select",
    required: true,
    weight: 10,
    options: [
      "Less than $1M", "$1M - $2M", "$2M - $5M", "$5M - $10M", "More than $10M"
    ]
  },
  {
    id: "references",
    question: "Can you provide at least 3 client references?",
    type: "yesno",
    required: true,
    weight: 10
  },
  {
    id: "financial_statements",
    question: "Can you provide audited financial statements for the last 3 years?",
    type: "yesno",
    required: true,
    weight: 5
  }
]

const responseSchema = z.object({
  responses: z.array(z.object({
    questionId: z.string(),
    value: z.any(),
    score: z.number().optional(),
    notes: z.string().optional()
  }))
})

type ResponseFormData = z.infer<typeof responseSchema>

export function VendorPrequalification({ vendorId, onComplete }: VendorPrequalificationProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [responses, setResponses] = useState<PrequalificationResponse[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, string[]>>({})

  const questionsPerStep = 3
  const totalSteps = Math.ceil(prequalificationQuestions.length / questionsPerStep)
  const currentQuestions = prequalificationQuestions.slice(
    currentStep * questionsPerStep,
    (currentStep + 1) * questionsPerStep
  )

  const calculateScore = (question: PrequalificationQuestion, value: any): number => {
    if (!question.required && !value) return 0

    switch (question.type) {
      case "number":
        if (question.id === "years_in_business") {
          if (value >= 10) return question.weight
          if (value >= 5) return question.weight * 0.7
          if (value >= 3) return question.weight * 0.5
          return question.weight * 0.3
        }
        if (question.id === "annual_revenue") {
          if (value >= 10000000) return question.weight
          if (value >= 5000000) return question.weight * 0.8
          if (value >= 1000000) return question.weight * 0.6
          return question.weight * 0.4
        }
        if (question.id === "employee_count") {
          if (value >= 100) return question.weight
          if (value >= 50) return question.weight * 0.8
          if (value >= 20) return question.weight * 0.6
          return question.weight * 0.4
        }
        return value ? question.weight : 0

      case "yesno":
        return value === "yes" || value === true ? question.weight : 0

      case "select":
      case "multiselect":
        if (question.id === "insurance_amount") {
          const scoreMap = {
            "Less than $1M": 0.2,
            "$1M - $2M": 0.4,
            "$2M - $5M": 0.6,
            "$5M - $10M": 0.8,
            "More than $10M": 1.0
          }
          return question.weight * (scoreMap[value as keyof typeof scoreMap] || 0)
        }
        return value ? question.weight : 0

      default:
        return value ? question.weight : 0
    }
  }

  const getResponseValue = (questionId: string) => {
    const response = responses.find(r => r.questionId === questionId)
    return response?.value
  }

  const updateResponse = (questionId: string, value: any) => {
    const question = prequalificationQuestions.find(q => q.id === questionId)
    if (!question) return

    const score = calculateScore(question, value)
    
    setResponses(prev => {
      const existing = prev.find(r => r.questionId === questionId)
      if (existing) {
        return prev.map(r => 
          r.questionId === questionId 
            ? { ...r, value, score }
            : r
        )
      } else {
        return [...prev, { questionId, value, score }]
      }
    })
  }

  const nextStep = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const isStepComplete = () => {
    return currentQuestions.every(question => {
      if (!question.required) return true
      const value = getResponseValue(question.id)
      return value !== undefined && value !== null && value !== ""
    })
  }

  const calculateTotalScore = () => {
    const totalPossible = prequalificationQuestions.reduce((sum, q) => sum + q.weight, 0)
    const totalScore = responses.reduce((sum, r) => sum + (r.score || 0), 0)
    return Math.round((totalScore / totalPossible) * 100)
  }

  const submitPrequalification = async () => {
    setIsSubmitting(true)
    try {
      const totalScore = calculateTotalScore()
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      onComplete(responses, totalScore)
      toast.success("Prequalification submitted successfully!")
    } catch (error) {
      toast.error("Failed to submit prequalification")
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderQuestion = (question: PrequalificationQuestion) => {
    const value = getResponseValue(question.id)

    switch (question.type) {
      case "text":
        return (
          <Textarea
            value={value || ""}
            onChange={(e) => updateResponse(question.id, e.target.value)}
            placeholder="Enter your response..."
            rows={3}
          />
        )

      case "number":
        return (
          <Input
            type="number"
            value={value || ""}
            onChange={(e) => updateResponse(question.id, Number(e.target.value))}
            placeholder="Enter a number"
            min={question.validation?.min}
            max={question.validation?.max}
          />
        )

      case "select":
        return (
          <Select value={value || ""} onValueChange={(v) => updateResponse(question.id, v)}>
            <SelectTrigger>
              <SelectValue placeholder="Select an option" />
            </SelectTrigger>
            <SelectContent>
              {question.options?.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )

      case "multiselect":
        return (
          <div className="space-y-2">
            {question.options?.map((option) => (
              <div key={option} className="flex items-center space-x-2">
                <Checkbox
                  id={`${question.id}-${option}`}
                  checked={(value || []).includes(option)}
                  onCheckedChange={(checked) => {
                    const currentValues = (value || []) as string[]
                    const newValues = checked
                      ? [...currentValues, option]
                      : currentValues.filter((v: string) => v !== option)
                    updateResponse(question.id, newValues)
                  }}
                />
                <Label htmlFor={`${question.id}-${option}`}>{option}</Label>
              </div>
            ))}
          </div>
        )

      case "yesno":
        return (
          <div className="flex space-x-4">
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                name={question.id}
                checked={value === "yes"}
                onChange={() => updateResponse(question.id, "yes")}
                className="h-4 w-4"
              />
              <span>Yes</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                name={question.id}
                checked={value === "no"}
                onChange={() => updateResponse(question.id, "no")}
                className="h-4 w-4"
              />
              <span>No</span>
            </label>
          </div>
        )

      case "file":
        return (
          <div className="space-y-2">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
              <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Click to upload or drag and drop</p>
              <p className="text-xs text-gray-500">PDF, DOC, DOCX up to 10MB</p>
            </div>
            {uploadedFiles[question.id]?.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span className="text-sm">{file}</span>
                <Button variant="ghost" size="sm">Remove</Button>
              </div>
            ))}
          </div>
        )

      default:
        return null
    }
  }

  const currentScore = calculateTotalScore()
  const progress = ((currentStep + 1) / totalSteps) * 100

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Vendor Prequalification</h2>
        <p className="text-muted-foreground">
          Please complete this prequalification questionnaire to be considered for future RFP opportunities
        </p>
      </div>

      {/* Progress */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Step {currentStep + 1} of {totalSteps}</span>
              <span>{Math.round(progress)}% Complete</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Current Score */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Current Score</h3>
              <p className="text-sm text-muted-foreground">
                Based on your responses so far
              </p>
            </div>
            <div className="text-right">
              <div className={`text-3xl font-bold ${
                currentScore >= 80 ? 'text-green-600' :
                currentScore >= 60 ? 'text-yellow-600' :
                'text-red-600'
              }`}>
                {currentScore}%
              </div>
              <div className="text-sm text-muted-foreground">
                {currentScore >= 80 ? 'Excellent' :
                 currentScore >= 60 ? 'Good' :
                 currentScore >= 40 ? 'Fair' : 'Needs Improvement'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Questions */}
      <Card>
        <CardHeader>
          <CardTitle>
            Question {currentStep * questionsPerStep + 1} - {Math.min((currentStep + 1) * questionsPerStep, prequalificationQuestions.length)} of {prequalificationQuestions.length}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {currentQuestions.map((question) => (
            <div key={question.id} className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <Label className="text-base font-medium">
                    {question.question}
                    {question.required && (
                      <span className="text-red-500 ml-1">*</span>
                    )}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Weight: {question.weight} points
                  </p>
                </div>
                {getResponseValue(question.id) && (
                  <Badge variant="outline">
                    {calculateScore(question, getResponseValue(question.id))}/{question.weight} pts
                  </Badge>
                )}
              </div>
              {renderQuestion(question)}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={prevStep}
          disabled={currentStep === 0}
        >
          Previous
        </Button>

        {currentStep === totalSteps - 1 ? (
          <Button onClick={submitPrequalification} disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Submit Prequalification"}
          </Button>
        ) : (
          <Button onClick={nextStep} disabled={!isStepComplete()}>
            Next
          </Button>
        )}
      </div>

      {/* Scoring Information */}
      <Card>
        <CardHeader>
          <CardTitle>Scoring Criteria</CardTitle>
          <CardDescription>
            How your prequalification will be evaluated
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="font-medium">Excellent (80-100%)</span>
              </div>
              <p className="text-sm text-muted-foreground ml-7">
                Well-established company with strong financials and certifications
              </p>
            </div>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
                <span className="font-medium">Good (60-79%)</span>
              </div>
              <p className="text-sm text-muted-foreground ml-7">
                Solid company meeting most requirements
              </p>
            </div>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-orange-600" />
                <span className="font-medium">Fair (40-59%)</span>
              </div>
              <p className="text-sm text-muted-foreground ml-7">
                Meets basic requirements but may have limitations
              </p>
            </div>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <XCircle className="h-5 w-5 text-red-600" />
                <span className="font-medium">Needs Improvement (&lt;40%)</span>
              </div>
              <p className="text-sm text-muted-foreground ml-7">
                Does not meet minimum prequalification criteria
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}