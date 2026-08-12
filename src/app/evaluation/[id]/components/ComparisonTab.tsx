"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users } from "lucide-react"
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { getScoreColor } from "@/lib/status-utils"
import type { EvaluationDetail, ConsensusScore } from "./types"

interface ComparisonTabProps {
  evaluation: EvaluationDetail
  consensusData: ConsensusScore[]
}

export function ComparisonTab({ evaluation, consensusData }: ComparisonTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Evaluator Comparison</CardTitle>
        <CardDescription>
          Side-by-side comparison of all evaluator scores
        </CardDescription>
      </CardHeader>
      <CardContent>
        {evaluation.evaluatorScores.length > 1 ? (
        <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Criterion</TableHead>
              {evaluation.evaluatorScores.map((score) => (
                <TableHead key={score.id}>{score.evaluatorName}</TableHead>
              ))}
              <TableHead>Average</TableHead>
              <TableHead>Consensus</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {evaluation.rubricCriteria.map((criterion) => {
              const consensus = consensusData.find(c => c.criterionId === criterion.id)
              const maxTotal = evaluation.rubricCriteria.reduce((sum, c) => sum + c.scaleMax, 0) || 1
              const criterionWeight = criterion.scaleMax / maxTotal
              const evaluatorScoresForCriterion = evaluation.evaluatorScores.map(score => {
                const derived = (score.score / evaluation.maxPossibleScore) * criterion.scaleMax * criterionWeight * 2
                return Math.max(criterion.scaleMin, Math.min(criterion.scaleMax, derived))
              })
              const average = evaluatorScoresForCriterion.reduce((sum, score) => sum + score, 0) / evaluatorScoresForCriterion.length

              return (
                <TableRow key={criterion.id}>
                  <TableCell className="font-medium">{criterion.label}</TableCell>
                  {evaluatorScoresForCriterion.map((score, index) => (
                    <TableCell key={index}>
                      <span className={`font-medium ${getScoreColor(criterion.scaleMax > 0 ? (score / criterion.scaleMax) * 100 : 0)}`}>
                        {score.toFixed(1)}
                      </span>
                    </TableCell>
                  ))}
                  <TableCell>
                    <span className={`font-medium ${getScoreColor(criterion.scaleMax > 0 ? (average / criterion.scaleMax) * 100 : 0)}`}>
                      {average.toFixed(1)}
                    </span>
                  </TableCell>
                  <TableCell>
                    {consensus && (
                      <span className={`font-medium ${getScoreColor(criterion.scaleMax > 0 ? (consensus.finalScore / criterion.scaleMax) * 100 : 0)}`}>
                        {consensus.finalScore.toFixed(1)}
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              )})}
            </TableBody>
        </Table>
        </div>
        ) : (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No comparison data available</h3>
            <p className="text-muted-foreground/80">Evaluator comparison data will be available once multiple evaluators have scored this submission.</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
