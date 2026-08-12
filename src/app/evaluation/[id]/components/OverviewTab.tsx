"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Clock, CheckCircle } from "lucide-react"
import { getScoreColor } from "@/lib/status-utils"
import type { EvaluationDetail } from "./types"

interface OverviewTabProps {
  evaluation: EvaluationDetail
}

export function OverviewTab({ evaluation }: OverviewTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Evaluation Overview</CardTitle>
        <CardDescription>
          Summary of the evaluation process and current status
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="font-medium mb-2">Rubric Criteria</h4>
          <div className="space-y-2">
            {evaluation.rubricCriteria.length > 0 ? evaluation.rubricCriteria.map((criterion) => (
              <div key={criterion.id} className="flex justify-between items-center p-2 border rounded">
                <div>
                  <span className="font-medium">{criterion.label}</span>
                  <span className="text-sm text-muted-foreground ml-2">
                    (Weight: {(criterion.weight * 100).toFixed(0)}%)
                  </span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {criterion.scaleMin} - {criterion.scaleMax}
                </div>
              </div>
            )) : (
              <p className="text-muted-foreground text-sm">No rubric criteria defined for this evaluation.</p>
            )}
          </div>
        </div>

        <div>
          <h4 className="font-medium mb-2">Evaluator Progress</h4>
          <div className="space-y-2">
            {evaluation.evaluatorScores.map((score) => (
              <div key={score.id} className="flex justify-between items-center p-2 border rounded">
                <div>
                  <span className="font-medium">{score.evaluatorName}</span>
                  <span className="text-sm text-muted-foreground ml-2">
                    ({score.evaluatorRole})
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`font-medium ${getScoreColor(evaluation.maxPossibleScore > 0 ? (score.score / evaluation.maxPossibleScore) * 100 : 0)}`}>
                    {score.score.toFixed(1)}
                  </span>
                  <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                </div>
              </div>
            ))}
            {Array.from({ length: Math.max(0, evaluation.requiredEvaluators - evaluation.evaluatorScores.length) }).map((_, index) => (
              <div key={index} className="flex justify-between items-center p-2 border rounded bg-muted/50">
                <div>
                  <span className="font-medium text-muted-foreground">Pending Evaluator</span>
                </div>
                <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
