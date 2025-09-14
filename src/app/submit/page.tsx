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
  Send,
  Signature,
  Database,
  Shield,
  Clock,
  Check,
  X,
  Link,
  FileCheck,
  AlertTriangle
} from "lucide-react"
import { toast } from "sonner"

interface Question {
  id: string
  type: "text" | "number" | "multiple_choice" | "checkbox" | "file" | "date" | "signature" | "data_integration"
  prompt: string
  required: boolean
  constraints?: any
  options?: string[]
  dataSource?: string
  validation?: {
    type: string
    pattern?: string
    message?: string
  }
}

interface ESignature {
  id: string
  name: string
  email: string
  title: string
  signature: string
  timestamp: string
  ipAddress: string
  status: "pending" | "signed" | "verified"
}

interface DataIntegration {
  id: string
  source: string
  endpoint: string
  dataType: string
  status: "connected" | "disconnected" | "error"
  lastSync?: string
  data?: any
}

interface ValidationRule {
  id: string
  field: string
  rule: string
  message: string
  severity: "error" | "warning" | "info"
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
  const [signatures, setSignatures] = useState<ESignature[]>([])
  const [dataIntegrations, setDataIntegrations] = useState<DataIntegration[]>([])
  const [validationErrors, setValidationErrors] = useState<ValidationRule[]>([])
  const [showSignatureModal, setShowSignatureModal] = useState(false)
  const [currentSignature, setCurrentSignature] = useState<ESignature | null>(null)
  const [realTimeValidation, setRealTimeValidation] = useState<Record<string, string>>({})

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
              required: true,
              validation: {
                type: "business_name",
                message: "Please enter a valid business name"
              }
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
              required: true,
              validation: {
                type: "range",
                pattern: "1-100",
                message: "Years in business must be between 1 and 100"
              }
            },
            {
              id: "q4",
              type: "multiple_choice",
              prompt: "Company size",
              required: true,
              options: ["1-10 employees", "11-50 employees", "51-200 employees", "200+ employees"]
            },
            {
              id: "q4a",
              type: "data_integration",
              prompt: "Connect to business registration database",
              required: false,
              dataSource: "business_registration_api"
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
            },
            {
              id: "q7a",
              type: "data_integration",
              prompt: "Import certifications from credential database",
              required: false,
              dataSource: "certification_database"
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
              required: true,
              validation: {
                type: "currency",
                pattern: "^\\d+(\\.\\d{2})?$",
                message: "Please enter a valid currency amount"
              }
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
        },
        {
          id: "section-4",
          title: "Legal and Compliance",
          description: "Legal documents and electronic signatures",
          isRequired: true,
          order: 3,
          questions: [
            {
              id: "q11",
              type: "file",
              prompt: "Upload insurance certificates",
              required: true
            },
            {
              id: "q12",
              type: "signature",
              prompt: "Authorized representative signature",
              required: true
            },
            {
              id: "q13",
              type: "signature",
              prompt: "Legal compliance officer signature",
              required: true
            }
          ]
        }
      ]
    }

    // Mock data integrations
    const mockDataIntegrations: DataIntegration[] = [
      {
        id: "di1",
        source: "Business Registration API",
        endpoint: "https://api.business-registry.gov/companies",
        dataType: "Company Information",
        status: "connected",
        lastSync: "2024-12-10T10:00:00Z",
        data: {
          companyName: "Tech Solutions Inc",
          registrationNumber: "123456789",
          status: "Active"
        }
      },
      {
        id: "di2",
        source: "Certification Database",
        endpoint: "https://api.certifications.org/verify",
        dataType: "Professional Certifications",
        status: "disconnected"
      }
    ]

    // Mock validation rules
    const mockValidationRules: ValidationRule[] = [
      {
        id: "vr1",
        field: "q8",
        rule: "budget_limit",
        message: "Proposed cost exceeds budget limit",
        severity: "warning"
      }
    ]

    setTimeout(() => {
      setRfp(mockRFP)
      setDataIntegrations(mockDataIntegrations)
      setValidationErrors(mockValidationRules)
      setLoading(false)
    }, 1000)
  }, [params.id])

  const handleAnswerChange = (questionId: string, value: any) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }))

    // Real-time validation
    if (rfp) {
      const question = rfp.sections
        .flatMap(section => section.questions)
        .find(q => q.id === questionId)
      
      if (question?.validation) {
        validateField(questionId, value, question.validation)
      }
    }
  }

  const validateField = (fieldId: string, value: any, validation: any) => {
    let isValid = true
    let errorMessage = ""

    switch (validation.type) {
      case "business_name":
        isValid = value && value.length >= 2
        errorMessage = validation.message || "Invalid business name"
        break
      case "range":
        const [min, max] = validation.pattern.split('-').map(Number)
        isValid = value >= min && value <= max
        errorMessage = validation.message || `Value must be between ${min} and ${max}`
        break
      case "currency":
        isValid = /^\d+(\.\d{2})?$/.test(value) && parseFloat(value) > 0
        errorMessage = validation.message || "Invalid currency amount"
        break
      case "pattern":
        isValid = new RegExp(validation.pattern).test(value)
        errorMessage = validation.message || "Invalid format"
        break
    }

    if (!isValid) {
      setRealTimeValidation(prev => ({
        ...prev,
        [fieldId]: errorMessage
      }))
    } else {
      setRealTimeValidation(prev => {
        const newValidation = { ...prev }
        delete newValidation[fieldId]
        return newValidation
      })
    }
  }

  const handleSignatureRequest = async (questionId: string) => {
    const signature: ESignature = {
      id: `sig_${Date.now()}`,
      name: "",
      email: "",
      title: "",
      signature: "",
      timestamp: "",
      ipAddress: "192.168.1.100",
      status: "pending"
    }
    setCurrentSignature(signature)
    setShowSignatureModal(true)
  }

  const handleSignatureSubmit = async (signature: ESignature) => {
    try {
      // Show loading state
      toast.info("Processing signature...")

      // Generate signature data (in real implementation, this would come from signature pad)
      const signatureData = signature.signature || "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
      
      // Prepare signature data for API
      const signaturePayload = {
        submissionId: "submission_" + Date.now(), // In real app, this would be the actual submission ID
        signerName: signature.name,
        signerEmail: signature.email,
        signerTitle: signature.title,
        signatureData: signatureData,
        ipAddress: signature.ipAddress,
        userAgent: navigator.userAgent,
        termsAccepted: true,
        documentHash: await generateDocumentHash()
      }

      // Send to e-signature API
      const response = await fetch('/api/esignature', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(signaturePayload),
      })

      if (!response.ok) {
        throw new Error('Failed to process signature')
      }

      const signatureResult = await response.json()
      
      // Update local state with API response
      const completedSignature = {
        ...signature,
        id: signatureResult.id,
        status: signatureResult.status,
        timestamp: signatureResult.createdAt || new Date().toISOString(),
        verificationResult: signatureResult.verificationResult
      }

      setSignatures(prev => [...prev, completedSignature])
      setAnswers(prev => ({
        ...prev,
        [currentSignature?.id || "signature"]: completedSignature
      }))
      setShowSignatureModal(false)
      setCurrentSignature(null)
      
      toast.success(`Signature ${signatureResult.status === "verified" ? "verified and" : ""} added successfully`)
      
      if (signatureResult.verificationResult) {
        toast.info(`Signature confidence score: ${signatureResult.verificationResult.score}%`)
      }

    } catch (error) {
      console.error('Signature processing error:', error)
      toast.error('Failed to process signature. Please try again.')
    }
  }

  const generateDocumentHash = async () => {
    // Generate a hash of the current submission data for document integrity
    const submissionData = {
      answers,
      timestamp: new Date().toISOString(),
      rfpId: params.id
    }
    const crypto = require("crypto")
    return crypto.createHash("sha256").update(JSON.stringify(submissionData)).digest("hex")
  }

  const handleDataIntegration = async (integrationId: string, questionId?: string) => {
    const integration = dataIntegrations.find(di => di.id === integrationId)
    if (integration) {
      try {
        // Show loading state
        toast.info(`Connecting to ${integration.source}...`)
        
        // Simulate API call to external data source
        const response = await fetch(`/api/integrations?type=${integration.source.toLowerCase().replace(/\s+/g, '_')}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        })

        if (!response.ok) {
          throw new Error('Failed to connect to data source')
        }

        const data = await response.json()
        
        // Update integration status
        setDataIntegrations(prev => 
          prev.map(di => 
            di.id === integrationId 
              ? { ...di, status: "connected", lastSync: new Date().toISOString(), data: data.data }
              : di
          )
        )

        // Auto-populate form fields if data is available
        if (data.data && questionId) {
          const integratedData = Array.isArray(data.data) ? data.data[0] : data.data
          
          if (integratedData.companyName) {
            handleAnswerChange("q1", integratedData.companyName)
          }
          if (integratedData.registrationNumber) {
            // Could populate a registration number field
          }
          if (integratedData.certifications) {
            // Could populate certifications data
          }
        }

        toast.success(`Successfully connected to ${integration.source}`)
        
        // Show data enrichment insights
        if (data.data && data.data.length > 0) {
          toast.info(`Data enriched with ${data.data.length} records from ${integration.source}`)
        }

      } catch (error) {
        console.error('Data integration error:', error)
        toast.error(`Failed to connect to ${integration.source}`)
        
        // Update integration status to error
        setDataIntegrations(prev => 
          prev.map(di => 
            di.id === integrationId 
              ? { ...di, status: "error" }
              : di
          )
        )
      }
    }
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
    const validationError = realTimeValidation[question.id]

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
            {validationError && (
              <p className="text-sm text-red-600">{validationError}</p>
            )}
            {question.constraints?.maxLength && (
              <p className="text-xs text-muted-foreground">
                {answer?.length || 0}/{question.constraints.maxLength} characters
              </p>
            )}
          </div>
        )

      case "number":
        return (
          <div className="space-y-2">
            <Input
              type="number"
              value={answer || ""}
              onChange={(e) => handleAnswerChange(question.id, Number(e.target.value))}
              placeholder="Enter a number"
            />
            {validationError && (
              <p className="text-sm text-red-600">{validationError}</p>
            )}
          </div>
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
                <div className="flex items-center space-x-2">
                  <FileCheck className="h-4 w-4 text-green-600" />
                  <span className="text-sm">{answer}</span>
                </div>
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

      case "signature":
        const signature = signatures.find(s => s.id === answer?.id)
        return (
          <div className="space-y-3">
            {signature ? (
              <div className="border rounded-lg p-4 bg-green-50">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="font-medium text-sm">Signature Completed</span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => handleSignatureRequest(question.id)}>
                    <Edit className="h-3 w-3" />
                  </Button>
                </div>
                <div className="text-sm text-gray-600">
                  <p><strong>Name:</strong> {signature.name}</p>
                  <p><strong>Title:</strong> {signature.title}</p>
                  <p><strong>Email:</strong> {signature.email}</p>
                  <p><strong>Date:</strong> {new Date(signature.timestamp).toLocaleString()}</p>
                </div>
              </div>
            ) : (
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => handleSignatureRequest(question.id)}
              >
                <Signature className="mr-2 h-4 w-4" />
                Add Electronic Signature
              </Button>
            )}
          </div>
        )

      case "data_integration":
        const integration = dataIntegrations.find(di => di.dataSource === question.dataSource)
        return (
          <div className="space-y-3">
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <Database className="h-4 w-4" />
                  <span className="font-medium text-sm">{integration?.source || question.dataSource}</span>
                </div>
                <div className="flex items-center space-x-2">
                  {integration?.status === "connected" ? (
                    <Badge className="bg-green-100 text-green-800">
                      <Check className="h-3 w-3 mr-1" />
                      Connected
                    </Badge>
                  ) : (
                    <Button 
                      size="sm" 
                      onClick={() => handleDataIntegration(integration?.id || question.dataSource, question.id)}
                    >
                      <Link className="h-3 w-3 mr-1" />
                      Connect
                    </Button>
                  )}
                </div>
              </div>
              
              {integration?.status === "connected" && (
                <div className="text-xs text-gray-600 space-y-1">
                  <p><strong>Last Sync:</strong> {new Date(integration.lastSync!).toLocaleString()}</p>
                  {integration.data && (
                    <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                      <p><strong>Data Retrieved:</strong></p>
                      <pre className="text-xs overflow-x-auto">
                        {JSON.stringify(integration.data, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
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
                    <Send className="mr-2 h-4 w-4" />
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

        {/* Real-time Validation Errors */}
        {Object.keys(realTimeValidation).length > 0 && (
          <Alert className="mt-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-1">
                <strong>Please review the following issues:</strong>
                {Object.entries(realTimeValidation).map(([field, error]) => (
                  <p key={field} className="text-sm">• {error}</p>
                ))}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* System Validation Errors */}
        {validationErrors.length > 0 && (
          <Alert className="mt-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-1">
                <strong>System warnings:</strong>
                {validationErrors.map((error) => (
                  <p key={error.id} className="text-sm">• {error.message}</p>
                ))}
              </div>
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Signature Modal */}
      {showSignatureModal && currentSignature && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Signature className="mr-2 h-5 w-5" />
                Electronic Signature
              </CardTitle>
              <CardDescription>
                Please provide your electronic signature for this document
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div>
                  <Label htmlFor="sig-name">Full Name</Label>
                  <Input
                    id="sig-name"
                    value={currentSignature.name}
                    onChange={(e) => setCurrentSignature(prev => prev ? {...prev, name: e.target.value} : null)}
                    placeholder="Enter your full name"
                  />
                </div>
                <div>
                  <Label htmlFor="sig-email">Email Address</Label>
                  <Input
                    id="sig-email"
                    type="email"
                    value={currentSignature.email}
                    onChange={(e) => setCurrentSignature(prev => prev ? {...prev, email: e.target.value} : null)}
                    placeholder="Enter your email address"
                  />
                </div>
                <div>
                  <Label htmlFor="sig-title">Title/Position</Label>
                  <Input
                    id="sig-title"
                    value={currentSignature.title}
                    onChange={(e) => setCurrentSignature(prev => prev ? {...prev, title: e.target.value} : null)}
                    placeholder="Enter your title or position"
                  />
                </div>
                <div>
                  <Label>Signature</Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center bg-gray-50">
                    <p className="text-sm text-gray-600 mb-2">Click to sign</p>
                    <div className="text-2xl font-signature text-gray-400">
                      {currentSignature.name ? currentSignature.name.split(' ').map(n => n[0]).join('') : 'Signature'}
                    </div>
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  <p>By signing, you agree to the following:</p>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    <li>This electronic signature is legally binding</li>
                    <li>You have the authority to sign this document</li>
                    <li>All provided information is accurate and complete</li>
                  </ul>
                </div>
              </div>
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowSignatureModal(false)
                    setCurrentSignature(null)
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={() => {
                    if (currentSignature) {
                      const completedSignature = {
                        ...currentSignature,
                        signature: "electronic_signature_hash",
                        timestamp: new Date().toISOString(),
                        status: "signed" as const
                      }
                      handleSignatureSubmit(completedSignature)
                    }
                  }}
                  disabled={!currentSignature.name || !currentSignature.email || !currentSignature.title}
                  className="flex-1"
                >
                  Sign Document
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </MainLayout>
  )
}