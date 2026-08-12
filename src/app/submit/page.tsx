"use client"

import { useState, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent } from "@/components/ui/card"
import { FileText } from "lucide-react"
import { toast } from "sonner"
import type { RFP, ESignature, DataIntegration, ValidationRule } from "./components/types"
import { RfpHeader } from "./components/RfpHeader"
import { SectionNavigation } from "./components/SectionNavigation"
import { CurrentSectionCard } from "./components/CurrentSectionCard"
import { SubmissionNavigation } from "./components/SubmissionNavigation"
import { ValidationAlerts } from "./components/ValidationAlerts"
import { SignatureModal } from "./components/SignatureModal"

export default function SubmissionPage() {
  useEffect(() => { document.title = 'Submit Proposal | RFP Platform' }, [])
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
  const [draftSubmissionId, setDraftSubmissionId] = useState<string | null>(null)
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({})

  useEffect(() => {
    const fetchRfpData = async () => {
      const id = params.id as string
      if (!id) {
        setLoading(false)
        return
      }
      try {
        const [rfpRes, sectionsRes] = await Promise.all([
          fetch(`/api/rfps/${id}`),
          fetch(`/api/sections?rfpId=${id}`),
        ])

        if (!rfpRes.ok) throw new Error('Failed to fetch RFP')
        const rfpData = await rfpRes.json()

        // If the RFP response includes sections with questions, use them
        let sections: any[] = []
        if (rfpData.sections && rfpData.sections.length > 0) {
          sections = rfpData.sections.map((s: any, idx: number) => ({
            id: s.id,
            title: s.title || `Section ${idx + 1}`,
            description: s.description || undefined,
            isRequired: s.isRequired ?? false,
            order: s.order ?? idx,
            questions: (s.questions || []).map((q: any) => ({
              id: q.id,
              type: q.type || 'text',
              prompt: q.prompt || q.text || '',
              required: q.required ?? false,
              constraints: q.constraints || undefined,
              options: q.options || undefined,
              dataSource: q.dataSource || undefined,
              validation: q.validation || undefined,
            })),
          }))
        } else if (sectionsRes.ok) {
          const sectionsData = await sectionsRes.json()
          sections = (Array.isArray(sectionsData) ? sectionsData : []).map((s: any, idx: number) => ({
            id: s.id,
            title: s.title || `Section ${idx + 1}`,
            description: s.description || undefined,
            isRequired: s.isRequired ?? false,
            order: s.order ?? idx,
            questions: (s.questions || []).map((q: any) => ({
              id: q.id,
              type: q.type || 'text',
              prompt: q.prompt || q.text || '',
              required: q.required ?? false,
              constraints: q.constraints || undefined,
              options: q.options || undefined,
              dataSource: q.dataSource || undefined,
              validation: q.validation || undefined,
            })),
          }))
        }

        const mapped: RFP = {
          id: rfpData.id,
          title: rfpData.title || 'Untitled RFP',
          description: rfpData.description || undefined,
          category: rfpData.category || 'General',
          budget: rfpData.budget ? `$${rfpData.budget.toLocaleString()}` : undefined,
          confidentiality: rfpData.confidentiality || 'internal',
          sections,
          timeline: rfpData.timeline ? {
            submissionDeadline: rfpData.timeline.submissionEnd || rfpData.closeAt || undefined,
          } : undefined,
        }

        setRfp(mapped)
      } catch (err) {
        console.error(err)
        toast.error('Failed to load RFP data')
      } finally {
        setLoading(false)
      }
    }
    fetchRfpData()
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
      toast.info("Processing signature...")

      const signatureData = signature.signature || "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
      
      const signaturePayload = {
        submissionId: "submission_" + Date.now(),
        signerName: signature.name,
        signerEmail: signature.email,
        signerTitle: signature.title,
        signatureData: signatureData,
        ipAddress: signature.ipAddress,
        userAgent: navigator.userAgent,
        termsAccepted: true,
        documentHash: await generateDocumentHash()
      }

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
      
      const completedSignature = {
        ...signature,
        id: signatureResult.id || signature.id,
        status: (signatureResult.status || "signed") as ESignature["status"],
        timestamp: signatureResult.createdAt || new Date().toISOString(),
      }

      setSignatures(prev => [...prev, completedSignature])
      setAnswers(prev => ({
        ...prev,
        [currentSignature?.id || "signature"]: completedSignature
      }))
      setShowSignatureModal(false)
      setCurrentSignature(null)
      
      toast.success(`Signature added successfully`)

    } catch (error) {
      console.error('Signature processing error:', error)
      toast.error('Failed to process signature. Please try again.')
    }
  }

  const generateDocumentHash = async () => {
    const submissionData = {
      answers,
      timestamp: new Date().toISOString(),
      rfpId: params.id
    }
    const encoder = new TextEncoder()
    const data = encoder.encode(JSON.stringify(submissionData))
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
    return hashHex
  }

  const handleDataIntegration = async (integrationId: string, questionId?: string) => {
    const integration = dataIntegrations.find(di => di.id === integrationId)
    if (integration) {
      try {
        toast.info(`Connecting to ${integration.source}...`)
        
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
        
        setDataIntegrations(prev => 
          prev.map(di => 
            di.id === integrationId 
              ? { ...di, status: "connected", lastSync: new Date().toISOString(), data: data.data }
              : di
          )
        )

        if (data.data && questionId) {
          const integratedData = Array.isArray(data.data) ? data.data[0] : data.data
          
          if (integratedData.companyName) {
            handleAnswerChange("q1", integratedData.companyName)
          }
        }

        toast.success(`Successfully connected to ${integration.source}`)
        
        if (data.data && data.data.length > 0) {
          toast.info(`Data enriched with ${data.data.length} records from ${integration.source}`)
        }

      } catch (error) {
        console.error('Data integration error:', error)
        toast.error(`Failed to connect to ${integration.source}`)
        
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
    return totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0
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

      // Resolve vendor ID from session
      const sessionRes = await fetch('/api/auth/session')
      const sessionData = await sessionRes.json()
      const userId = sessionData?.user?.id

      if (!userId) {
        toast.error('Unable to identify your account')
        return
      }

      // Look up vendor for this user
      let vendorId = userId
      try {
        const vendorRes = await fetch('/api/vendors')
        if (vendorRes.ok) {
          const vendors = await vendorRes.json()
          const userVendor = vendors?.find?.((v: Record<string, unknown>) => v.userId === userId || v.contactInfo?.email === sessionData?.user?.email)
          if (userVendor?.id) vendorId = userVendor.id
        }
      } catch { /* vendor lookup is best-effort */ }

      const res = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rfpId: rfp.id,
          vendorId,
        }),
      })

      if (!res.ok) {
        throw new Error('Failed to submit proposal')
      }

      toast.success('Proposal submitted successfully!')
      router.push('/rfps')
    } catch (error) {
      toast.error("Failed to submit proposal")
    } finally {
      setIsSubmitting(false)
    }
  }

  const saveDraft = async () => {
    if (!rfp) return
    try {
      const body: any = {
        rfpId: rfp.id,
        status: 'draft',
        answers,
      }
      const url = draftSubmissionId ? `/api/submissions/${draftSubmissionId}` : '/api/submissions'
      const method = draftSubmissionId ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        const data = await res.json()
        if (!draftSubmissionId && data.id) setDraftSubmissionId(data.id)
        toast.success('Draft saved')
      } else {
        toast.error('Failed to save draft')
      }
    } catch {
      toast.error('Failed to save draft')
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

  const isSectionValid = validateSection()

  return (
    <MainLayout title={`Submit Proposal: ${rfp.title}`}>
      <h1 className="text-2xl font-bold tracking-tight">Submit Proposal</h1>
      <div className="max-w-4xl mx-auto">
        <RfpHeader rfp={rfp} getProgress={getProgress} />

        <SectionNavigation
          sections={rfp.sections}
          currentSection={currentSection}
          setCurrentSection={setCurrentSection}
        />

        {rfp.sections.length > 0 ? (
          <>
            <CurrentSectionCard
              section={rfp.sections[currentSection]}
              currentSection={currentSection}
              totalSections={rfp.sections.length}
              answers={answers}
              realTimeValidation={realTimeValidation}
              signatures={signatures}
              dataIntegrations={dataIntegrations}
              fileInputRefs={fileInputRefs}
              onAnswerChange={handleAnswerChange}
              onSignatureRequest={handleSignatureRequest}
              onDataIntegration={handleDataIntegration}
            />

            <SubmissionNavigation
              currentSection={currentSection}
              totalSections={rfp.sections.length}
              isFirstSection={currentSection === 0}
              isLastSection={currentSection === rfp.sections.length - 1}
              isSubmitting={isSubmitting}
              isSectionValid={isSectionValid}
              onPrev={prevSection}
              onNext={nextSection}
              onSaveDraft={saveDraft}
              onSubmit={submitProposal}
            />

            <ValidationAlerts
              isSectionValid={isSectionValid}
              realTimeValidation={realTimeValidation}
              validationErrors={validationErrors}
            />
          </>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Sections Available</h3>
              <p className="text-muted-foreground">This RFP does not have any sections defined yet.</p>
            </CardContent>
          </Card>
        )}
      </div>

      {showSignatureModal && currentSignature && (
        <SignatureModal
          currentSignature={currentSignature}
          onSignatureChange={setCurrentSignature}
          onClose={() => {
            setShowSignatureModal(false)
            setCurrentSignature(null)
          }}
          onSubmit={handleSignatureSubmit}
        />
      )}
    </MainLayout>
  )
}
