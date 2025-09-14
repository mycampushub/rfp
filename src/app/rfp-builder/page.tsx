"use client"

import { useState } from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { SectionBuilder } from "@/components/rfp/section-builder"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, ArrowRight, Save, Eye, FileText } from "lucide-react"

interface Section {
  id: string
  title: string
  description?: string
  isRequired: boolean
  order: number
  questions: Array<{
    id: string
    type: "text" | "number" | "multiple_choice" | "checkbox" | "file" | "date"
    prompt: string
    required: boolean
    constraints?: any
    order: number
    options?: string[]
  }>
}

interface RFPData {
  title: string
  category: string
  budget: string
  confidentiality: "internal" | "confidential" | "restricted"
  description: string
  sections: Section[]
}

export default function RFPBuilderPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [rfpData, setRfpData] = useState<RFPData>({
    title: "",
    category: "",
    budget: "",
    confidentiality: "internal",
    description: "",
    sections: [
      {
        id: "section-1",
        title: "Company Overview",
        description: "Information about your company and experience",
        isRequired: false,
        order: 0,
        questions: [
          {
            id: "question-1",
            type: "text",
            prompt: "Company name",
            required: true,
            order: 0
          },
          {
            id: "question-2", 
            type: "text",
            prompt: "Brief company description",
            required: true,
            order: 1
          }
        ]
      }
    ]
  })

  const steps = [
    { id: 1, title: "Basic Info", description: "RFP title and details" },
    { id: 2, title: "Content Builder", description: "Sections and questions" },
    { id: 3, title: "Review", description: "Preview and finalize" },
  ]

  const updateRfpData = (updates: Partial<RFPData>) => {
    setRfpData(prev => ({ ...prev, ...updates }))
  }

  const updateSections = (sections: Section[]) => {
    setRfpData(prev => ({ ...prev, sections }))
  }

  const nextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const saveRFP = () => {
    // TODO: Implement save functionality
    console.log("Saving RFP:", rfpData)
    alert("RFP saved successfully!")
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                Enter the fundamental details of your RFP
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">RFP Title *</Label>
                <Input
                  id="title"
                  value={rfpData.title}
                  onChange={(e) => updateRfpData({ title: e.target.value })}
                  placeholder="Enter RFP title"
                />
              </div>
              
              <div>
                <Label htmlFor="category">Category</Label>
                <Select value={rfpData.category} onValueChange={(value) => updateRfpData({ category: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="it">IT Services</SelectItem>
                    <SelectItem value="marketing">Marketing</SelectItem>
                    <SelectItem value="consulting">Consulting</SelectItem>
                    <SelectItem value="construction">Construction</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="budget">Budget</Label>
                <Input
                  id="budget"
                  value={rfpData.budget}
                  onChange={(e) => updateRfpData({ budget: e.target.value })}
                  placeholder="e.g., $100,000"
                />
              </div>

              <div>
                <Label htmlFor="confidentiality">Confidentiality Level</Label>
                <Select value={rfpData.confidentiality} onValueChange={(value: any) => updateRfpData({ confidentiality: value })}>
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
                  value={rfpData.description}
                  onChange={(e) => updateRfpData({ description: e.target.value })}
                  placeholder="Brief description of the RFP"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        )

      case 2:
        return (
          <Card>
            <CardHeader>
              <CardTitle>Build Your RFP Content</CardTitle>
              <CardDescription>
                Create sections and add questions for vendors to answer
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SectionBuilder 
                sections={rfpData.sections} 
                onSectionsChange={updateSections}
              />
            </CardContent>
          </Card>
        )

      case 3:
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>RFP Preview</CardTitle>
                <CardDescription>
                  Review your RFP before publishing
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold">{rfpData.title}</h3>
                  <div className="flex items-center space-x-4 mt-2">
                    <Badge variant="outline">{rfpData.category}</Badge>
                    <Badge variant="outline">{rfpData.confidentiality}</Badge>
                    {rfpData.budget && <Badge variant="outline">{rfpData.budget}</Badge>}
                  </div>
                  {rfpData.description && (
                    <p className="mt-3 text-gray-700">{rfpData.description}</p>
                  )}
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-medium">Sections ({rfpData.sections.length})</h4>
                  {rfpData.sections.map((section, index) => (
                    <div key={section.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-medium">
                          {index + 1}. {section.title}
                        </h5>
                        {section.isRequired && (
                          <Badge variant="destructive" className="text-xs">Required</Badge>
                        )}
                      </div>
                      {section.description && (
                        <p className="text-sm text-gray-600 mb-3">{section.description}</p>
                      )}
                      <div className="space-y-2">
                        <h6 className="text-sm font-medium">Questions ({section.questions.length})</h6>
                        {section.questions.map((question, qIndex) => (
                          <div key={question.id} className="text-sm text-gray-700 ml-4">
                            {qIndex + 1}. {question.prompt}
                            {question.required && (
                              <span className="text-red-500 ml-1">*</span>
                            )}
                            <span className="text-gray-500 ml-2">
                              ({question.type.replace("_", " ")})
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <MainLayout title="RFP Builder">
      <div className="max-w-6xl mx-auto">
        {/* Progress Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold">Build Your RFP</h1>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={saveRFP}>
                <Save className="mr-2 h-4 w-4" />
                Save Draft
              </Button>
              <Button onClick={nextStep} disabled={currentStep === steps.length}>
                {currentStep === steps.length ? "Publish" : "Next"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* Progress Steps */}
          <div className="flex items-center space-x-2">
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

        {/* Current Step Content */}
        {renderStepContent()}

        {/* Navigation */}
        <div className="flex justify-between mt-8">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 1}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Previous
          </Button>
          
          <div className="flex space-x-2">
            <Button variant="outline" onClick={saveRFP}>
              <Save className="mr-2 h-4 w-4" />
              Save Draft
            </Button>
            <Button onClick={nextStep} disabled={currentStep === steps.length}>
              {currentStep === steps.length ? (
                <>
                  <Eye className="mr-2 h-4 w-4" />
                  Publish RFP
                </>
              ) : (
                <>
                  Next
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}