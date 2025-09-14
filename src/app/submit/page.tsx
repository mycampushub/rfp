"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { MainLayout } from "@/components/layout/main-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle, 
  AlertCircle, 
  FileText, 
  Upload,
  Eye,
  Save,
  Submit
} from "lucide-react"
import { toast } from "sonner"

interface Question {
  id: string
  type: "text" | "number" | "multiple_choice" | "checkbox" | "file" | "date"
  prompt: string
  required: boolean
  constraints?: any
  options?: string[]
}

interface Section {
  id: string
  title: string
  description?: string
  isRequired: boolean
  order: number
  questions: Question[]
}

interface RFP {
  id: string
  title: string
  description?: string
  category: string
  budget?: string
  confidentiality: string
  sections: Section[]
  timeline?: {
    submissionDeadline?: string
  }
}

export default function SubmissionPage() {
  const params = useParams()
  const router = useRouter()
  const [rfp, setRfp] = useState<RFP | null>(null)
  const [currentSection, setCurrentSection] = useState(0)
  const [answers, setAnswers] = useState<Record<string, any>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Mock RFP data - in real app, this would come from API
    const mockRFP: RFP = {
      id: params.id as string,
      title: "IT Managed Services 2024",
      description: "Comprehensive IT managed services including 24/7 support, infrastructure management, and strategic technology consulting.",
      category: "IT Services",
      budget: "$250,000",
      confidentiality: "internal",
      timeline: {
        submissionDeadline: "2024-12-15T23:59:59Z"
      },
      sections: [
        {
          id: "section-1",
          title: "Company Overview",
          description: "Information about your company and experience",
          isRequired: false,
          order: 0,
          questions: [
            {
              id: "q1",
              type: "text",
              prompt: "Company name",
              required: true
            },
            {
              id: "q2",
              type: "text", 
              prompt: "Brief company description (500 words max)",
              required: true,
              constraints: { maxLength: 500 }
            },
            {
              id: "q3",
              type: "number",
              prompt: "Years in business",
              required: true
            },
            {
              id: "q4",
              type: "multiple_choice",
              prompt: "Company size",
              required: true,
              options: ["1-10 employees", "11-50 employees", "51-200 employees", "200+ employees"]
            }
          ]
        },
        {
          id: "section-2", 
          title: "Technical Approach",
          description: "Detailed technical solution and methodology",
          isRequired: true,
          order: 1,
          questions: [
            {
              id: "q5",
              type: "text",
              prompt: "Describe your technical approach to this project",
              required: true
            },
            {
              id: "q6",
              type: "file",
              prompt: "Upload technical documentation",
              required: false
            },
            {
              id: "q7",
              type: "checkbox",
              prompt: "Select all technologies you specialize in",
              required: true,
              options: ["Cloud Computing", "Cybersecurity", "Data Analytics", "AI/ML", "DevOps"]
            }
          ]
        },
        {
          id: "section-3",
          title: "Pricing and Commercial Terms",
          description: "Cost breakdown and commercial conditions",
          isRequired: true,
          order: 2,
          questions: [
            {
              id: "q8",
              type: "number",
              prompt: "Total project cost (USD)",
              required: true
            },
            {
              id: "q9",
              type: "text",
              prompt: "Payment terms",
              required: true
            },
            {
              id: "q10",
              type: "date",
              prompt: "Proposed start date",
              required: true
            }
          ]
        }
      ]
    }

    setTimeout(() => {
      setRfp(mockRFP)
      setLoading(false)
    }, 1000)
  }, [params.id])

  const handleAnswerChange = (questionId: string, value: any) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }))
  }

  const nextSection = () => {
    if (currentSection < (rfp?.sections.length || 0) - 1) {
      setCurrentSection(currentSection + 1)
    }
  }

  const prevSection = () => {
    if (currentSection > 0) {
      setCurrentSection(currentSection - 1)
    }
  }

  const getProgress = () => {
    if (!rfp) return 0
    const totalQuestions = rfp.sections.reduce((sum, section) => sum + section.questions.length, 0)
    const answeredQuestions = Object.keys(answers).length
    return (answeredQuestions / totalQuestions) * 100
  }

  const validateSection = () => {
    if (!rfp) return true
    const section = rfp.sections[currentSection]
    
    for (const question of section.questions) {
      if (question.required && !answers[question.id]) {
        return false
      }
    }
    return true
  }

  const submitProposal = async () => {
    if (!rfp) return
    
    setIsSubmitting(true)
    try {
      // Validate all required questions are answered
      let isValid = true
      for (const section of rfp.sections) {
        for (const question of section.questions) {
          if (question.required && !answers[question.id]) {
            isValid = false
            break
          }
        }
        if (!isValid) break
      }

      if (!isValid) {
        toast.error("Please answer all required questions")
        return
      }

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      toast.success("Proposal submitted successfully!")
      router.push("/submission/success")
    } catch (error) {
      toast.error("Failed to submit proposal")
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderQuestion = (question: Question) => {
    const answer = answers[question.id]

    switch (question.type) {
      case "text":
        return (
          <div className="space-y-2">
            <Textarea
              value={answer || ""}
              onChange={(e) => handleAnswerChange(question.id, e.target.value)}
              placeholder="Enter your answer..."
              rows={3}
              maxLength={question.constraints?.maxLength}
            />
            {question.constraints?.maxLength && (
              <p className="text-xs text-muted-foreground">
                {answer?.length || 0}/{question.constraints.maxLength} characters
              </p>
            )}
          </div>
        )

      case "number":
        return (
          <Input
            type="number"
            value={answer || ""}
            onChange={(e) => handleAnswerChange(question.id, Number(e.target.value))}
            placeholder="Enter a number"
          />
        )

      case "multiple_choice":
        return (
          <Select value={answer || ""} onValueChange={(value) => handleAnswerChange(question.id, value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select an option" />
            </SelectTrigger>
            <SelectContent>
              {question.options?.map((option, index) => (
                <SelectItem key={index} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )

      case "checkbox":
        return (
          <div className="space-y-2">
            {question.options?.map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <Checkbox
                  id={`${question.id}-${index}`}
                  checked={answer?.includes(option) || false}
                  onCheckedChange={(checked) => {
                    const currentValues = answer || []
                    const newValues = checked
                      ? [...currentValues, option]
                      : currentValues.filter((v: string) => v !== option)
                    handleAnswerChange(question.id, newValues)
                  }}
                />
                <Label htmlFor={`${question.id}-${index}`}>{option}</Label>
              </div>
            ))}
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
            {answer && (
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span className="text-sm">{answer}</span>
                <Button variant="ghost" size="sm">Remove</Button>
              </div>
            )}
          </div>
        )

      case "date":
        return (
          <Input
            type="date"
            value={answer || ""}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
          />
        )

      default:
        return null
    }
  }

  if (loading) {
    return (
      <MainLayout title="Vendor Submission">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading RFP...</div>
        </div>
      </MainLayout>
    )
  }

  if (!rfp) {
    return (
      <MainLayout title="Vendor Submission">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">RFP not found</div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout title={`Submit Proposal: ${rfp.title}`}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-2xl font-bold">{rfp.title}</h1>
              <p className="text-muted-foreground">{rfp.description}</p>
              <div className="flex items-center space-x-4 mt-2">
                <Badge variant="outline">{rfp.category}</Badge>
                {rfp.budget && <Badge variant="outline">{rfp.budget}</Badge>}
                {rfp.timeline?.submissionDeadline && (
                  <Badge variant="destructive">
                    Deadline: {new Date(rfp.timeline.submissionDeadline).toLocaleDateString()}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>{Math.round(getProgress())}% complete</span>
            </div>
            <Progress value={getProgress()} className="h-2" />
          </div>
        </div>

        {/* Section Navigation */}
        <div className="mb-6">
          <div className="flex items-center space-x-2">
            {rfp.sections.map((section, index) => (
              <Button
                key={section.id}
                variant={currentSection === index ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentSection(index)}
              >
                {index + 1}. {section.title}
              </Button>
            ))}
          </div>
        </div>

        {/* Current Section */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="flex items-center">
                  <span className="mr-2">{currentSection + 1}.</span>
                  {rfp.sections[currentSection].title}
                  {rfp.sections[currentSection].isRequired && (
                    <Badge variant="destructive" className="ml-2">Required</Badge>
                  )}
                </CardTitle>
                {rfp.sections[currentSection].description && (
                  <CardDescription>{rfp.sections[currentSection].description}</CardDescription>
                )}
              </div>
              <div className="text-sm text-muted-foreground">
                {currentSection + 1} of {rfp.sections.length} sections
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {rfp.sections[currentSection].questions.map((question) => (
              <div key={question.id} className="space-y-3">
                <div className="flex items-start space-x-2">
                  <Label className="text-sm font-medium flex-1">
                    {question.prompt}
                    {question.required && (
                      <span className="text-red-500 ml-1">*</span>
                    )}
                  </Label>
                  <Badge variant="outline" className="text-xs">
                    {question.type.replace("_", " ")}
                  </Badge>
                </div>
                {renderQuestion(question)}
                {!question.required && !answer && (
                  <p className="text-xs text-muted-foreground">Optional</p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between items-center mt-8">
          <Button
            variant="outline"
            onClick={prevSection}
            disabled={currentSection === 0}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Previous Section
          </Button>

          <div className="flex space-x-2">
            <Button variant="outline">
              <Save className="mr-2 h-4 w-4" />
              Save Draft
            </Button>
            
            {currentSection === rfp.sections.length - 1 ? (
              <Button onClick={submitProposal} disabled={isSubmitting}>
                {isSubmitting ? "Submitting..." : (
                  <>
                    <Submit className="mr-2 h-4 w-4" />
                    Submit Proposal
                  </>
                )}
              </Button>
            ) : (
              <Button onClick={nextSection} disabled={!validateSection()}>
                Next Section
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Validation Alert */}
        {!validateSection() && (
          <Alert className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Please answer all required questions before proceeding.
            </AlertDescription>
          </Alert>
        )}
      </div>
    </MainLayout>
  )
}