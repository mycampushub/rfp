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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Slider } from "@/components/ui/slider"
import { 
  Plus, 
  Edit, 
  Trash2, 
  GripVertical, 
  Star,
  Target,
  Scale,
  Settings,
  Copy,
  Eye,
  Percent,
  Info
} from "lucide-react"
import { toast } from "sonner"

interface RubricCriterion {
  id: string
  label: string
  weight: number
  scaleMin: number
  scaleMax: number
  guidance?: string
  sectionId?: string
}

interface ScoringRubricBuilderProps {
  criteria: RubricCriterion[]
  sections: Array<{ id: string; title: string }>
  onCriteriaChange: (criteria: RubricCriterion[]) => void
}

const criterionSchema = z.object({
  label: z.string().min(1, "Criterion label is required"),
  weight: z.number().min(0.1).max(100, "Weight must be between 0.1 and 100"),
  scaleMin: z.number().min(1, "Minimum scale must be at least 1"),
  scaleMax: z.number().min(1, "Maximum scale must be at least 1"),
  guidance: z.string().optional(),
  sectionId: z.string().optional(),
})

type CriterionFormData = z.infer<typeof criterionSchema>

export function ScoringRubricBuilder({ criteria, sections, onCriteriaChange }: ScoringRubricBuilderProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCriterion, setEditingCriterion] = useState<RubricCriterion | null>(null)

  const criterionForm = useForm<CriterionFormData>({
    resolver: zodResolver(criterionSchema),
    defaultValues: {
      weight: 10,
      scaleMin: 1,
      scaleMax: 5,
    },
  })

  const totalWeight = criteria.reduce((sum, criterion) => sum + criterion.weight, 0)

  const addCriterion = (data: CriterionFormData) => {
    const newCriterion: RubricCriterion = {
      id: `criterion-${Date.now()}`,
      label: data.label,
      weight: data.weight,
      scaleMin: data.scaleMin,
      scaleMax: data.scaleMax,
      guidance: data.guidance,
      sectionId: data.sectionId,
    }

    onCriteriaChange([...criteria, newCriterion])
    setIsDialogOpen(false)
    criterionForm.reset({
      weight: 10,
      scaleMin: 1,
      scaleMax: 5,
    })
    toast.success("Criterion added successfully")
  }

  const updateCriterion = (data: CriterionFormData) => {
    if (!editingCriterion) return

    const updatedCriteria = criteria.map(criterion =>
      criterion.id === editingCriterion.id
        ? { ...criterion, ...data }
        : criterion
    )

    onCriteriaChange(updatedCriteria)
    setIsDialogOpen(false)
    setEditingCriterion(null)
    criterionForm.reset({
      weight: 10,
      scaleMin: 1,
      scaleMax: 5,
    })
    toast.success("Criterion updated successfully")
  }

  const deleteCriterion = (criterionId: string) => {
    const criterion = criteria.find(c => c.id === criterionId)
    onCriteriaChange(criteria.filter(c => c.id !== criterionId))
    toast.success(`Criterion "${criterion?.label}" deleted`)
  }

  const moveCriterion = (fromIndex: number, toIndex: number) => {
    const newCriteria = [...criteria]
    const [movedCriterion] = newCriteria.splice(fromIndex, 1)
    newCriteria.splice(toIndex, 0, movedCriterion)
    onCriteriaChange(newCriteria)
  }

  const openEditCriterion = (criterion: RubricCriterion) => {
    setEditingCriterion(criterion)
    criterionForm.reset({
      label: criterion.label,
      weight: criterion.weight,
      scaleMin: criterion.scaleMin,
      scaleMax: criterion.scaleMax,
      guidance: criterion.guidance,
      sectionId: criterion.sectionId,
    })
    setIsDialogOpen(true)
  }

  const getScaleDescription = (min: number, max: number) => {
    if (min === 1 && max === 5) return "1-5 Stars"
    if (min === 1 && max === 10) return "1-10 Scale"
    if (min === 0 && max === 100) return "0-100 Points"
    return `${min}-${max} Scale`
  }

  const getSectionName = (sectionId?: string) => {
    if (!sectionId) return "Global"
    const section = sections.find(s => s.id === sectionId)
    return section?.title || "Unknown"
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Scoring Rubric</h3>
          <p className="text-sm text-muted-foreground">
            Define evaluation criteria and scoring weights
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-sm">
            <span className="font-medium">Total Weight: </span>
            <span className={totalWeight === 100 ? "text-green-600" : "text-orange-600"}>
              {totalWeight.toFixed(1)}%
            </span>
            {totalWeight !== 100 && (
              <span className="text-xs text-muted-foreground ml-1">
                (should be 100%)
              </span>
            )}
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Criterion
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingCriterion ? "Edit Criterion" : "Add New Criterion"}
                </DialogTitle>
                <DialogDescription>
                  Define a scoring criterion for evaluating vendor submissions
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={criterionForm.handleSubmit(editingCriterion ? updateCriterion : addCriterion)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="label">Criterion Label *</Label>
                  <Input
                    id="label"
                    {...criterionForm.register("label")}
                    placeholder="e.g., Technical Approach, Cost Effectiveness, Experience"
                  />
                  {criterionForm.formState.errors.label && (
                    <p className="text-sm text-red-600">{criterionForm.formState.errors.label.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sectionId">Apply to Section (optional)</Label>
                  <Select onValueChange={(value) => criterionForm.setValue("sectionId", value || undefined)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a section or leave global" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Global (applies to entire RFP)</SelectItem>
                      {sections.map((section) => (
                        <SelectItem key={section.id} value={section.id}>
                          {section.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Leave empty to apply this criterion to the entire RFP
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="weight">Weight (%) *</Label>
                  <div className="space-y-3">
                    <Input
                      id="weight"
                      type="number"
                      step="0.1"
                      min="0.1"
                      max="100"
                      {...criterionForm.register("weight", { valueAsNumber: true })}
                      placeholder="10"
                    />
                    <Slider
                      value={[criterionForm.watch("weight") || 10]}
                      onValueChange={(value) => criterionForm.setValue("weight", value[0])}
                      max={100}
                      step={0.1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>0%</span>
                      <span>50%</span>
                      <span>100%</span>
                    </div>
                  </div>
                  {criterionForm.formState.errors.weight && (
                    <p className="text-sm text-red-600">{criterionForm.formState.errors.weight.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="scaleMin">Minimum Score *</Label>
                    <Input
                      id="scaleMin"
                      type="number"
                      min="1"
                      {...criterionForm.register("scaleMin", { valueAsNumber: true })}
                      placeholder="1"
                    />
                    {criterionForm.formState.errors.scaleMin && (
                      <p className="text-sm text-red-600">{criterionForm.formState.errors.scaleMin.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="scaleMax">Maximum Score *</Label>
                    <Input
                      id="scaleMax"
                      type="number"
                      min="1"
                      {...criterionForm.register("scaleMax", { valueAsNumber: true })}
                      placeholder="5"
                    />
                    {criterionForm.formState.errors.scaleMax && (
                      <p className="text-sm text-red-600">{criterionForm.formState.errors.scaleMax.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="guidance">Evaluation Guidance (optional)</Label>
                  <Textarea
                    id="guidance"
                    {...criterionForm.register("guidance")}
                    placeholder="Provide guidance for evaluators on how to score this criterion..."
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground">
                    This will help evaluators understand what to look for when scoring
                  </p>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingCriterion ? "Update Criterion" : "Add Criterion"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Criteria List */}
      {criteria.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Target className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No scoring criteria yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Define how vendors will be evaluated by adding scoring criteria
            </p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add First Criterion
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {criteria.map((criterion, index) => (
            <Card key={criterion.id}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <GripVertical className="h-5 w-5 text-muted-foreground cursor-move" />
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="font-semibold text-lg">{criterion.label}</h4>
                        <Badge variant="outline">
                          <Percent className="h-3 w-3 mr-1" />
                          {criterion.weight}%
                        </Badge>
                        <Badge variant="outline">
                          <Scale className="h-3 w-3 mr-1" />
                          {getScaleDescription(criterion.scaleMin, criterion.scaleMax)}
                        </Badge>
                        <Badge variant="outline">
                          {getSectionName(criterion.sectionId)}
                        </Badge>
                      </div>
                      {criterion.guidance && (
                        <p className="text-sm text-muted-foreground">
                          <Info className="h-3 w-3 inline mr-1" />
                          {criterion.guidance}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditCriterion(criterion)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteCriterion(criterion.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Scoring Preview */}
      {criteria.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Eye className="mr-2 h-5 w-5" />
              Scoring Preview
            </CardTitle>
            <CardDescription>
              How evaluators will see the scoring rubric
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {criteria.map((criterion) => (
                  <div key={criterion.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="font-medium">{criterion.label}</h5>
                      <Badge variant="outline">{criterion.weight}%</Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Scale:</span>
                        <span>{criterion.scaleMin} - {criterion.scaleMax}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Section:</span>
                        <span>{getSectionName(criterion.sectionId)}</span>
                      </div>
                    </div>
                    {criterion.guidance && (
                      <div className="mt-3 p-2 bg-gray-50 rounded text-xs">
                        <strong>Guidance:</strong> {criterion.guidance}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="font-medium">Total Weight</h5>
                    <p className="text-sm text-muted-foreground">
                      Sum of all criterion weights
                    </p>
                  </div>
                  <div className="text-right">
                    <div className={`text-2xl font-bold ${totalWeight === 100 ? 'text-green-600' : 'text-orange-600'}`}>
                      {totalWeight.toFixed(1)}%
                    </div>
                    {totalWeight !== 100 && (
                      <p className="text-xs text-orange-600">
                        Should equal 100%
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}