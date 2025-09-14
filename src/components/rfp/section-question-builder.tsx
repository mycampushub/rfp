"use client"

import { useState } from "react"
import { useForm, useFieldArray } from "react-hook-form"
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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Plus, 
  Edit, 
  Trash2, 
  GripVertical, 
  FileText,
  Hash,
  List,
  CheckSquare,
  FileImage,
  Calendar,
  Settings,
  Copy,
  Eye,
  Save
} from "lucide-react"
import { toast } from "sonner"

interface Question {
  id: string
  type: "text" | "number" | "multiple_choice" | "checkbox" | "file" | "date"
  prompt: string
  required: boolean
  constraints?: {
    maxLength?: number
    minLength?: number
    minValue?: number
    maxValue?: number
    pattern?: string
  }
  options?: string[]
  order: number
}

interface Section {
  id: string
  title: string
  description?: string
  isRequired: boolean
  order: number
  questions: Question[]
}

const sectionSchema = z.object({
  title: z.string().min(1, "Section title is required"),
  description: z.string().optional(),
  isRequired: z.boolean().default(false),
})

const questionSchema = z.object({
  type: z.enum(["text", "number", "multiple_choice", "checkbox", "file", "date"]),
  prompt: z.string().min(1, "Question prompt is required"),
  required: z.boolean().default(false),
  constraints: z.object({
    maxLength: z.number().optional(),
    minLength: z.number().optional(),
    minValue: z.number().optional(),
    maxValue: z.number().optional(),
    pattern: z.string().optional(),
  }).optional(),
  options: z.array(z.string()).optional(),
})

type SectionFormData = z.infer<typeof sectionSchema>
type QuestionFormData = z.infer<typeof questionSchema>

interface SectionQuestionBuilderProps {
  sections: Section[]
  onSectionsChange: (sections: Section[]) => void
}

export function SectionQuestionBuilder({ sections, onSectionsChange }: SectionQuestionBuilderProps) {
  const [isSectionDialogOpen, setIsSectionDialogOpen] = useState(false)
  const [isQuestionDialogOpen, setIsQuestionDialogOpen] = useState(false)
  const [editingSection, setEditingSection] = useState<Section | null>(null)
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null)
  const [currentSectionId, setCurrentSectionId] = useState<string | null>(null)

  const sectionForm = useForm<SectionFormData>({
    resolver: zodResolver(sectionSchema),
    defaultValues: {
      isRequired: false,
    },
  })

  const questionForm = useForm<QuestionFormData>({
    resolver: zodResolver(questionSchema),
    defaultValues: {
      type: "text",
      required: false,
    },
  })

  const questionType = questionForm.watch("type")

  const getQuestionTypeIcon = (type: string) => {
    switch (type) {
      case "text":
        return <FileText className="h-4 w-4" />
      case "number":
        return <Hash className="h-4 w-4" />
      case "multiple_choice":
        return <List className="h-4 w-4" />
      case "checkbox":
        return <CheckSquare className="h-4 w-4" />
      case "file":
        return <FileImage className="h-4 w-4" />
      case "date":
        return <Calendar className="h-4 w-4" />
      default:
        return <Settings className="h-4 w-4" />
    }
  }

  const addSection = (data: SectionFormData) => {
    const newSection: Section = {
      id: `section-${Date.now()}`,
      title: data.title,
      description: data.description,
      isRequired: data.isRequired,
      order: sections.length,
      questions: [],
    }

    onSectionsChange([...sections, newSection])
    setIsSectionDialogOpen(false)
    sectionForm.reset()
    toast.success("Section added successfully")
  }

  const updateSection = (data: SectionFormData) => {
    if (!editingSection) return

    const updatedSections = sections.map(section =>
      section.id === editingSection.id
        ? { ...section, ...data }
        : section
    )

    onSectionsChange(updatedSections)
    setIsSectionDialogOpen(false)
    setEditingSection(null)
    sectionForm.reset()
    toast.success("Section updated successfully")
  }

  const deleteSection = (sectionId: string) => {
    const section = sections.find(s => s.id === sectionId)
    onSectionsChange(sections.filter(s => s.id !== sectionId))
    toast.success(`Section "${section?.title}" deleted`)
  }

  const addQuestion = (data: QuestionFormData) => {
    if (!currentSectionId) return

    const section = sections.find(s => s.id === currentSectionId)
    if (!section) return

    const newQuestion: Question = {
      id: `question-${Date.now()}`,
      type: data.type,
      prompt: data.prompt,
      required: data.required,
      constraints: data.constraints,
      options: data.options,
      order: section.questions.length,
    }

    const updatedSections = sections.map(s =>
      s.id === currentSectionId
        ? { ...s, questions: [...s.questions, newQuestion] }
        : s
    )

    onSectionsChange(updatedSections)
    setIsQuestionDialogOpen(false)
    setEditingQuestion(null)
    setCurrentSectionId(null)
    questionForm.reset()
    toast.success("Question added successfully")
  }

  const updateQuestion = (data: QuestionFormData) => {
    if (!editingQuestion || !currentSectionId) return

    const updatedSections = sections.map(section => {
      if (section.id === currentSectionId) {
        return {
          ...section,
          questions: section.questions.map(q =>
            q.id === editingQuestion.id
              ? { ...q, ...data }
              : q
          )
        }
      }
      return section
    })

    onSectionsChange(updatedSections)
    setIsQuestionDialogOpen(false)
    setEditingQuestion(null)
    setCurrentSectionId(null)
    questionForm.reset()
    toast.success("Question updated successfully")
  }

  const deleteQuestion = (sectionId: string, questionId: string) => {
    const updatedSections = sections.map(section =>
      section.id === sectionId
        ? { ...section, questions: section.questions.filter(q => q.id !== questionId) }
        : section
    )

    onSectionsChange(updatedSections)
    toast.success("Question deleted")
  }

  const moveSection = (fromIndex: number, toIndex: number) => {
    const newSections = [...sections]
    const [movedSection] = newSections.splice(fromIndex, 1)
    newSections.splice(toIndex, 0, movedSection)
    
    // Update order
    const updatedSections = newSections.map((section, index) => ({
      ...section,
      order: index
    }))

    onSectionsChange(updatedSections)
  }

  const moveQuestion = (sectionId: string, fromIndex: number, toIndex: number) => {
    const updatedSections = sections.map(section => {
      if (section.id === sectionId) {
        const newQuestions = [...section.questions]
        const [movedQuestion] = newQuestions.splice(fromIndex, 1)
        newQuestions.splice(toIndex, 0, movedQuestion)
        
        return {
          ...section,
          questions: newQuestions.map((q, index) => ({ ...q, order: index }))
        }
      }
      return section
    })

    onSectionsChange(updatedSections)
  }

  const openEditSection = (section: Section) => {
    setEditingSection(section)
    sectionForm.reset({
      title: section.title,
      description: section.description,
      isRequired: section.isRequired,
    })
    setIsSectionDialogOpen(true)
  }

  const openAddQuestion = (sectionId: string) => {
    setCurrentSectionId(sectionId)
    setEditingQuestion(null)
    questionForm.reset({
      type: "text",
      required: false,
    })
    setIsQuestionDialogOpen(true)
  }

  const openEditQuestion = (sectionId: string, question: Question) => {
    setCurrentSectionId(sectionId)
    setEditingQuestion(question)
    questionForm.reset({
      type: question.type,
      prompt: question.prompt,
      required: question.required,
      constraints: question.constraints,
      options: question.options,
    })
    setIsQuestionDialogOpen(true)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Sections & Questions</h3>
          <p className="text-sm text-muted-foreground">
            Build your RFP content with sections and questions
          </p>
        </div>
        <Dialog open={isSectionDialogOpen} onOpenChange={setIsSectionDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Section
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingSection ? "Edit Section" : "Add New Section"}
              </DialogTitle>
              <DialogDescription>
                Create a new section to organize your RFP content
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={sectionForm.handleSubmit(editingSection ? updateSection : addSection)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Section Title *</Label>
                <Input
                  id="title"
                  {...sectionForm.register("title")}
                  placeholder="e.g., Company Overview, Technical Approach"
                />
                {sectionForm.formState.errors.title && (
                  <p className="text-sm text-red-600">{sectionForm.formState.errors.title.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  {...sectionForm.register("description")}
                  placeholder="Brief description of this section"
                  rows={3}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isRequired"
                  {...sectionForm.register("isRequired")}
                  onCheckedChange={(checked) => sectionForm.setValue("isRequired", checked as boolean)}
                />
                <Label htmlFor="isRequired">This section is required</Label>
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsSectionDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingSection ? "Update Section" : "Add Section"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Sections List */}
      {sections.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No sections yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Start building your RFP by adding sections to organize your content
            </p>
            <Button onClick={() => setIsSectionDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add First Section
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {sections.map((section, sectionIndex) => (
            <Card key={section.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <GripVertical className="h-5 w-5 text-muted-foreground cursor-move" />
                    <div>
                      <CardTitle className="flex items-center space-x-2">
                        <span>{section.title}</span>
                        {section.isRequired && (
                          <Badge variant="destructive">Required</Badge>
                        )}
                      </CardTitle>
                      {section.description && (
                        <CardDescription>{section.description}</CardDescription>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openAddQuestion(section.id)}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Question
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditSection(section)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteSection(section.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {section.questions.length === 0 ? (
                  <div className="text-center py-6 border-2 border-dashed border-gray-200 rounded-lg">
                    <p className="text-muted-foreground mb-2">No questions in this section</p>
                    <Button variant="outline" size="sm" onClick={() => openAddQuestion(section.id)}>
                      <Plus className="h-4 w-4 mr-1" />
                      Add Question
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {section.questions.map((question, questionIndex) => (
                      <div key={question.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                          <div className="flex items-center space-x-2">
                            {getQuestionTypeIcon(question.type)}
                            <div>
                              <div className="font-medium">
                                {question.prompt}
                                {question.required && (
                                  <span className="text-red-500 ml-1">*</span>
                                )}
                              </div>
                              <div className="flex items-center space-x-2 mt-1">
                                <Badge variant="outline" className="text-xs">
                                  {question.type.replace("_", " ")}
                                </Badge>
                                {question.options && question.options.length > 0 && (
                                  <Badge variant="outline" className="text-xs">
                                    {question.options.length} options
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditQuestion(section.id, question)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteQuestion(section.id, question.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Question Dialog */}
      <Dialog open={isQuestionDialogOpen} onOpenChange={setIsQuestionDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingQuestion ? "Edit Question" : "Add New Question"}
            </DialogTitle>
            <DialogDescription>
              Create a question for vendors to respond to
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={questionForm.handleSubmit(editingQuestion ? updateQuestion : addQuestion)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="prompt">Question Prompt *</Label>
              <Textarea
                id="prompt"
                {...questionForm.register("prompt")}
                placeholder="Enter your question here..."
                rows={3}
              />
              {questionForm.formState.errors.prompt && (
                <p className="text-sm text-red-600">{questionForm.formState.errors.prompt.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Question Type *</Label>
              <Select onValueChange={(value) => questionForm.setValue("type", value as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select question type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">
                    <div className="flex items-center space-x-2">
                      <FileText className="h-4 w-4" />
                      <span>Text</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="number">
                    <div className="flex items-center space-x-2">
                      <Hash className="h-4 w-4" />
                      <span>Number</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="multiple_choice">
                    <div className="flex items-center space-x-2">
                      <List className="h-4 w-4" />
                      <span>Multiple Choice</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="checkbox">
                    <div className="flex items-center space-x-2">
                      <CheckSquare className="h-4 w-4" />
                      <span>Checkbox</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="file">
                    <div className="flex items-center space-x-2">
                      <FileImage className="h-4 w-4" />
                      <span>File Upload</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="date">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4" />
                      <span>Date</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Conditional fields based on question type */}
            {(questionType === "multiple_choice" || questionType === "checkbox") && (
              <div className="space-y-2">
                <Label>Options (one per line)</Label>
                <Textarea
                  {...questionForm.register("options")}
                  placeholder="Option 1&#10;Option 2&#10;Option 3"
                  rows={4}
                  onChange={(e) => {
                    const options = e.target.value.split('\n').filter(opt => opt.trim() !== '')
                    questionForm.setValue("options", options)
                  }}
                />
                <p className="text-xs text-muted-foreground">
                  Enter each option on a new line
                </p>
              </div>
            )}

            {questionType === "text" && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Min Length (optional)</Label>
                  <Input
                    type="number"
                    {...questionForm.register("constraints.minLength")}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Max Length (optional)</Label>
                  <Input
                    type="number"
                    {...questionForm.register("constraints.maxLength")}
                    placeholder="1000"
                  />
                </div>
              </div>
            )}

            {questionType === "number" && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Min Value (optional)</Label>
                  <Input
                    type="number"
                    {...questionForm.register("constraints.minValue")}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Max Value (optional)</Label>
                  <Input
                    type="number"
                    {...questionForm.register("constraints.maxValue")}
                    placeholder="100"
                  />
                </div>
              </div>
            )}

            <div className="flex items-center space-x-2">
              <Checkbox
                id="required"
                {...questionForm.register("required")}
                onCheckedChange={(checked) => questionForm.setValue("required", checked as boolean)}
              />
              <Label htmlFor="required">This question is required</Label>
            </div>

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setIsQuestionDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {editingQuestion ? "Update Question" : "Add Question"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}