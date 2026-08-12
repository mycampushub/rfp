"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { EvaluationDetail } from "./types"

interface MyEvaluationTabProps {
  evaluation: EvaluationDetail
  userScores: Record<string, number>
  userNotes: Record<string, string>
  isSubmitting: boolean
  onScoreChange: (_criterionId: string, _score: number) => void
  onNotesChange: (_criterionId: string, _notes: string) => void
  onSubmit: () => void
  onCancel: () => void
  calculateWeightedScore: (_criterionId: string, _score: number) => number
}

export function MyEvaluationTab({ evaluation, userScores, userNotes, isSubmitting, onScoreChange, onNotesChange, onSubmit, onCancel, calculateWeightedScore }: MyEvaluationTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Submit Your Evaluation</CardTitle>
        <CardDescription>
          Evaluate the submission based on the rubric criteria below
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {evaluation.rubricCriteria.length > 0 ? evaluation.rubricCriteria.map((criterion) => (
          <div key={criterion.id} className="space-y-4 p-4 border rounded-lg">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-medium">{criterion.label}</h4>
                <p className="text-sm text-muted-foreground">
                  Weight: {(criterion.weight * 100).toFixed(0)}% • Scale: {criterion.scaleMin} - {criterion.scaleMax}
                </p>
                {criterion.guidance && (
                  <p className="text-sm text-muted-foreground mt-1">{criterion.guidance}</p>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium">Score:</span>
                <Select
                  value={userScores[criterion.id]?.toString() || ""}
                  onValueChange={(value) => onScoreChange(criterion.id, parseFloat(value))}
                >
                  <SelectTrigger className="w-20">
                    <SelectValue placeholder="Score" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: criterion.scaleMax - criterion.scaleMin + 1 }, (_, i) => {
                      const score = criterion.scaleMin + i
                      return (
                        <SelectItem key={score} value={score.toString()}>
                          {score}
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor={`notes-${criterion.id}`}>Notes (Optional)</Label>
              <Textarea
                id={`notes-${criterion.id}`}
                value={userNotes[criterion.id] || ""}
                onChange={(e) => onNotesChange(criterion.id, e.target.value)}
                placeholder="Provide your rationale for this score..."
                rows={2}
              />
            </div>

            {userScores[criterion.id] && (
              <div className="text-sm text-muted-foreground">
                Weighted Score: {calculateWeightedScore(criterion.id, userScores[criterion.id]).toFixed(2)}
              </div>
            )}
          </div>
        )) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No rubric criteria available for scoring.</p>
          </div>
        )}

        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={isSubmitting || evaluation.rubricCriteria.length === 0}>
            {isSubmitting ? "Submitting..." : "Submit Evaluation"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
