"use client"

import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Upload, CheckCircle, Signature, Edit, Check, FileCheck, Database, Link } from "lucide-react"
import { toast } from "sonner"
import type { Question, ESignature, DataIntegration } from "./types"

interface QuestionRendererProps {
  question: Question
  answer: any
  validationError?: string
  signatures: ESignature[]
  dataIntegrations: DataIntegration[]
  fileInputRefs: React.MutableRefObject<Record<string, HTMLInputElement | null>>
  onAnswerChange: (questionId: string, value: any) => void
  onSignatureRequest: (questionId: string) => void
  onDataIntegration: (integrationId: string, questionId?: string) => void
}

export function QuestionRenderer({ question, answer, validationError, signatures, dataIntegrations, fileInputRefs, onAnswerChange, onSignatureRequest, onDataIntegration }: QuestionRendererProps) {
  switch (question.type) {
    case "text":
      return (
        <div className="space-y-2">
          <Textarea
            value={answer || ""}
            onChange={(e) => onAnswerChange(question.id, e.target.value)}
            placeholder="Enter your answer..."
            rows={3}
            maxLength={question.constraints?.maxLength}
          />
          {validationError && (
            <p className="text-sm text-red-600 dark:text-red-400">{validationError}</p>
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
            onChange={(e) => onAnswerChange(question.id, Number(e.target.value))}
            placeholder="Enter a number"
          />
          {validationError && (
            <p className="text-sm text-red-600 dark:text-red-400">{validationError}</p>
          )}
        </div>
      )

    case "multiple_choice":
      return (
        <Select value={answer || ""} onValueChange={(value) => onAnswerChange(question.id, value)}>
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
                  onAnswerChange(question.id, newValues)
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
          <input
            type="file"
            ref={(el) => { fileInputRefs.current[question.id] = el }}
            className="hidden"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.txt"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) {
                if (file.size > 10 * 1024 * 1024) {
                  toast.error('File size must be under 10MB')
                  e.target.value = ''
                  return
                }
                onAnswerChange(question.id, file.name)
                toast.success(`File selected: ${file.name}`)
              }
              e.target.value = ''
            }}
          />
          <div
            className="border-2 border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:border-muted-foreground hover:bg-muted/50 transition-colors"
            onClick={() => fileInputRefs.current[question.id]?.click()}
            onDragOver={(e) => { e.preventDefault(); e.stopPropagation() }}
            onDrop={(e) => {
              e.preventDefault(); e.stopPropagation()
              const file = e.dataTransfer.files?.[0]
              if (file) {
                if (file.size > 10 * 1024 * 1024) {
                  toast.error('File size must be under 10MB')
                  return
                }
                onAnswerChange(question.id, file.name)
                toast.success(`File selected: ${file.name}`)
              }
            }}
          >
            <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground/80">Click to upload or drag and drop</p>
            <p className="text-xs text-muted-foreground">PDF, DOC, DOCX up to 10MB</p>
          </div>
          {answer && (
            <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
              <div className="flex items-center space-x-2">
                <FileCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <span className="text-sm">{answer}</span>
              </div>
              <Button variant="ghost" size="sm" onClick={() => {
                onAnswerChange(question.id, null)
                toast.info('File removed')
              }}>Remove</Button>
            </div>
          )}
        </div>
      )

    case "date":
      return (
        <Input
          type="date"
          value={answer || ""}
          onChange={(e) => onAnswerChange(question.id, e.target.value)}
        />
      )

    case "signature": {
      const signature = signatures.find(s => s.id === answer?.id)
      return (
        <div className="space-y-3">
          {signature ? (
            <div className="border rounded-lg p-4 bg-emerald-500/10 dark:bg-emerald-500/20">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="font-medium text-sm">Signature Completed</span>
                </div>
                <Button variant="ghost" size="sm" aria-label="Edit signature" onClick={() => onSignatureRequest(question.id)}>
                  <Edit className="h-3 w-3" />
                </Button>
              </div>
              <div className="text-sm text-muted-foreground/80">
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
              onClick={() => onSignatureRequest(question.id)}
            >
              <Signature className="mr-2 h-4 w-4" />
              Add Electronic Signature
            </Button>
          )}
        </div>
      )
    }

    case "data_integration": {
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
                  <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                    <Check className="h-3 w-3 mr-1" />
                    Connected
                  </Badge>
                ) : (
                  <Button 
                    size="sm" 
                    onClick={() => onDataIntegration(integration?.id || question.dataSource, question.id)}
                  >
                    <Link className="h-3 w-3 mr-1" />
                    Connect
                  </Button>
                )}
              </div>
            </div>
            
            {integration?.status === "connected" && (
              <div className="text-xs text-muted-foreground/80 space-y-1">
                <p><strong>Last Sync:</strong> {new Date(integration.lastSync!).toLocaleString()}</p>
                {integration.data && (
                  <div className="mt-2 p-2 bg-muted/50 rounded text-xs">
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
    }

    default:
      return null
  }
}
