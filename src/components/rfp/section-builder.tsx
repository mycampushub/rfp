"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  Plus, 
  Minus, 
  ArrowUp, 
  ArrowDown,
  FileText, 
  MessageSquare, 
  Hash,
  Calendar,
  File,
  X
} from "lucide-react"
import { type RFPQuestion, type RFPSection } from "./types"

type Question = RFPQuestion
type Section = RFPSection

interface SectionBuilderProps {
  sections: Section[]
  onSectionsChange: (sections: Section[]) => void
}

function QuestionItem({ question, onUpdate, onRemove, onMoveUp, onMoveDown, isFirst, isLast }: { 
  question: Question; 
  onUpdate: (question: Question) => void; 
  onRemove: (id: string) => void 
  onMoveUp: () => void
  onMoveDown: () => void
  isFirst: boolean
  isLast: boolean
}) {
  const questionTypes = [
    { value: "text", label: "Text", icon: MessageSquare },
    { value: "number", label: "Number", icon: Hash },
    { value: "multiple_choice", label: "Multiple Choice", icon: FileText },
    { value: "checkbox", label: "Checkbox", icon: FileText },
    { value: "file", label: "File Upload", icon: File },
    { value: "date", label: "Date", icon: Calendar },
  ]

  const getQuestionIcon = (type: string) => {
    const questionType = questionTypes.find(qt => qt.value === type)
    const Icon = questionType?.icon || MessageSquare
    return <Icon className="h-4 w-4" />
  }

  return (
    <div className="border rounded-lg p-4 bg-card">
      <div className="flex items-start space-x-3">
        {/* Reorder buttons */}
        <div className="flex flex-col gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={onMoveUp}
            disabled={isFirst}
            aria-label="Move question up"
          >
            <ArrowUp className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={onMoveDown}
            disabled={isLast}
            aria-label="Move question down"
          >
            <ArrowDown className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex-1 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {getQuestionIcon(question.type)}
              <span className="text-sm font-medium capitalize">
                {question.type.replace("_", " ")}
              </span>
              {question.required && (
                <Badge variant="destructive" className="text-xs">Required</Badge>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRemove(question.id)}
              className="h-6 w-6 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>

          <div className="space-y-2">
            <div>
              <Label className="text-xs">Question Prompt</Label>
              <Textarea
                value={question.prompt}
                onChange={(e) => onUpdate({ ...question, prompt: e.target.value })}
                placeholder="Enter your question..."
                className="min-h-[60px] text-sm"
              />
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id={`required-${question.id}`}
                  checked={question.required}
                  onChange={(e) => onUpdate({ ...question, required: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor={`required-${question.id}`} className="text-xs">
                  Required
                </Label>
              </div>

              <div>
                <Label className="text-xs">Type</Label>
                <Select
                  value={question.type}
                  onValueChange={(value: any) => onUpdate({ 
                    ...question, 
                    type: value,
                    options: value === "multiple_choice" ? ["Option 1", "Option 2"] : undefined
                  })}
                >
                  <SelectTrigger className="w-[140px] h-7 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {questionTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {question.type === "multiple_choice" && question.options && (
              <div className="space-y-1">
                <Label className="text-xs">Options</Label>
                {question.options.map((option, index) => (
                  <Input
                    key={index}
                    value={option}
                    onChange={(e) => {
                      const newOptions = [...question.options!]
                      newOptions[index] = e.target.value
                      onUpdate({ ...question, options: newOptions })
                    }}
                    placeholder={`Option ${index + 1}`}
                    className="text-sm h-7"
                  />
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onUpdate({
                    ...question,
                    options: [...(question.options || []), `Option ${(question.options?.length || 0) + 1}`]
                  })}
                  className="text-xs h-7"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add Option
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export function SectionBuilder({ sections, onSectionsChange }: SectionBuilderProps) {
  const [activeSection, setActiveSection] = useState(0)

  const addSection = () => {
    const newSection: Section = {
      id: `section-${Date.now()}`,
      title: `Section ${sections.length + 1}`,
      description: "",
      isRequired: false,
      order: sections.length,
      questions: []
    }
    onSectionsChange([...sections, newSection])
    setActiveSection(sections.length)
  }

  const updateSection = (index: number, updatedSection: Partial<Section>) => {
    const newSections = [...sections]
    newSections[index] = { ...newSections[index], ...updatedSection }
    onSectionsChange(newSections)
  }

  const removeSection = (index: number) => {
    const newSections = sections.filter((_, i) => i !== index)
    onSectionsChange(newSections)
    if (activeSection >= newSections.length) {
      setActiveSection(Math.max(0, newSections.length - 1))
    }
  }

  const addQuestion = (sectionIndex: number) => {
    const section = sections[sectionIndex]
    const newQuestion: Question = {
      id: `question-${Date.now()}`,
      type: "text",
      prompt: "",
      required: false,
      order: section.questions.length
    }
    
    const updatedSection = {
      ...section,
      questions: [...section.questions, newQuestion]
    }
    
    updateSection(sectionIndex, updatedSection)
  }

  const updateQuestion = (sectionIndex: number, questionIndex: number, updatedQuestion: Partial<Question>) => {
    const section = sections[sectionIndex]
    const newQuestions = [...section.questions]
    newQuestions[questionIndex] = { ...newQuestions[questionIndex], ...updatedQuestion }
    
    updateSection(sectionIndex, { questions: newQuestions })
  }

  const removeQuestion = (sectionIndex: number, questionId: string) => {
    const section = sections[sectionIndex]
    const newQuestions = section.questions.filter(q => q.id !== questionId)
    
    updateSection(sectionIndex, { questions: newQuestions })
  }

  const moveQuestionUp = (sectionIndex: number, questionIndex: number) => {
    if (questionIndex <= 0) return
    const section = sections[sectionIndex]
    const newQuestions = [...section.questions]
    const [moved] = newQuestions.splice(questionIndex, 1)
    newQuestions.splice(questionIndex - 1, 0, moved)
    updateSection(sectionIndex, { questions: newQuestions })
  }

  const moveQuestionDown = (sectionIndex: number, questionIndex: number) => {
    const section = sections[sectionIndex]
    if (questionIndex >= section.questions.length - 1) return
    const newQuestions = [...section.questions]
    const [moved] = newQuestions.splice(questionIndex, 1)
    newQuestions.splice(questionIndex + 1, 0, moved)
    updateSection(sectionIndex, { questions: newQuestions })
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Sections & Questions</h3>
        <Button onClick={addSection}>
          <Plus className="mr-2 h-4 w-4" />
          Add Section
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Section Navigation */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm">Sections</h4>
          {sections.map((section, index) => (
            <Button
              key={section.id}
              variant={activeSection === index ? "default" : "ghost"}
              className="w-full justify-start text-left h-auto p-3"
              onClick={() => setActiveSection(index)}
            >
              <div className="space-y-1">
                <div className="font-medium text-sm">{section.title}</div>
                <div className="text-xs text-muted-foreground">
                  {section.questions.length} questions
                </div>
              </div>
            </Button>
          ))}
        </div>

        {/* Section Editor */}
        <div className="lg:col-span-3">
          {sections.map((section, sectionIndex) => (
            <div key={section.id} className={activeSection === sectionIndex ? "block" : "hidden"}>
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">Section {sectionIndex + 1}</CardTitle>
                      <CardDescription>
                        Configure section details and questions
                      </CardDescription>
                    </div>
                    {sections.length > 1 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeSection(sectionIndex)}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Section Details */}
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor={`section-title-${section.id}`}>Section Title</Label>
                      <Input
                        id={`section-title-${section.id}`}
                        value={section.title}
                        onChange={(e) => updateSection(sectionIndex, { title: e.target.value })}
                        placeholder="Enter section title"
                      />
                    </div>

                    <div>
                      <Label htmlFor={`section-description-${section.id}`}>Description (Optional)</Label>
                      <Textarea
                        id={`section-description-${section.id}`}
                        value={section.description || ""}
                        onChange={(e) => updateSection(sectionIndex, { description: e.target.value })}
                        placeholder="Enter section description"
                        rows={2}
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`section-required-${section.id}`}
                        checked={section.isRequired}
                        onChange={(e) => updateSection(sectionIndex, { isRequired: e.target.checked })}
                        className="rounded"
                      />
                      <Label htmlFor={`section-required-${section.id}`}>
                        This section is required
                      </Label>
                    </div>
                  </div>

                  <Separator />

                  {/* Questions */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium">Questions</h4>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => addQuestion(sectionIndex)}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Question
                      </Button>
                    </div>

                    <div className="space-y-3">
                      {section.questions.map((question, questionIndex) => (
                        <QuestionItem
                          key={question.id}
                          question={question}
                          onUpdate={(updatedQuestion) => updateQuestion(sectionIndex, questionIndex, updatedQuestion)}
                          onRemove={(questionId) => removeQuestion(sectionIndex, questionId)}
                          onMoveUp={() => moveQuestionUp(sectionIndex, questionIndex)}
                          onMoveDown={() => moveQuestionDown(sectionIndex, questionIndex)}
                          isFirst={questionIndex === 0}
                          isLast={questionIndex === section.questions.length - 1}
                        />
                      ))}
                      
                      {section.questions.length === 0 && (
                        <div className="text-center py-8 border-2 border-dashed border-border rounded-lg">
                          <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                          <p className="text-sm text-muted-foreground">No questions yet. Add your first question to get started.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
