"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import type { Section, Question, ESignature, DataIntegration, ValidationRule } from "./types"
import { QuestionRenderer } from "./QuestionRenderer"

interface CurrentSectionCardProps {
  section: Section
  currentSection: number
  totalSections: number
  answers: Record<string, any>
  realTimeValidation: Record<string, string>
  signatures: ESignature[]
  dataIntegrations: DataIntegration[]
  fileInputRefs: React.MutableRefObject<Record<string, HTMLInputElement | null>>
  onAnswerChange: (questionId: string, value: any) => void
  onSignatureRequest: (questionId: string) => void
  onDataIntegration: (integrationId: string, questionId?: string) => void
}

export function CurrentSectionCard({ section, currentSection, totalSections, answers, realTimeValidation, signatures, dataIntegrations, fileInputRefs, onAnswerChange, onSignatureRequest, onDataIntegration }: CurrentSectionCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center">
              <span className="mr-2">{currentSection + 1}.</span>
              {section.title}
              {section.isRequired && (
                <Badge variant="destructive" className="ml-2">Required</Badge>
              )}
            </CardTitle>
            {section.description && (
              <CardDescription>{section.description}</CardDescription>
            )}
          </div>
          <div className="text-sm text-muted-foreground">
            {currentSection + 1} of {totalSections} sections
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {section.questions.map((question) => (
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
            <QuestionRenderer
              question={question}
              answer={answers[question.id]}
              validationError={realTimeValidation[question.id]}
              signatures={signatures}
              dataIntegrations={dataIntegrations}
              fileInputRefs={fileInputRefs}
              onAnswerChange={onAnswerChange}
              onSignatureRequest={onSignatureRequest}
              onDataIntegration={onDataIntegration}
            />
            {!question.required && !answers[question.id] && (
              <p className="text-xs text-muted-foreground">Optional</p>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
