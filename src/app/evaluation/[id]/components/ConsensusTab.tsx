"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle } from "lucide-react"
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

interface ConsensusTabProps {
  evaluation: EvaluationDetail
  consensusData: ConsensusScore[]
  getConfidenceColor: (_confidence: number) => string
}

export function ConsensusTab({ evaluation, consensusData, getConfidenceColor }: ConsensusTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Consensus Analysis</CardTitle>
        <CardDescription>
          Analysis of evaluator consensus and disagreements
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Criterion</TableHead>
              <TableHead>Final Score</TableHead>
              <TableHead>Agreement</TableHead>
              <TableHead>Disagreements</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {consensusData.map((consensus) => {
              const criterion = evaluation.rubricCriteria.find(c => c.id === consensus.criterionId)
              return (
                <TableRow key={consensus.criterionId}>
                  <TableCell className="font-medium">{criterion?.label}</TableCell>
                  <TableCell>
                    <span className={`font-medium ${getScoreColor((criterion?.scaleMax || 5) > 0 ? (consensus.finalScore / (criterion?.scaleMax || 5)) * 100 : 0)}`}>
                      {consensus.finalScore.toFixed(1)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={`font-medium ${getConfidenceColor(consensus.confidence)}`}>
                      {(consensus.confidence * 100).toFixed(0)}%
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <span>{consensus.disagreements}</span>
                      {consensus.disagreements > 0 && (
                        <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {consensus.confidence >= 0.8 ? (
                      <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                        High Confidence
                      </Badge>
                    ) : consensus.confidence >= 0.6 ? (
                      <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300">
                        Moderate Confidence
                      </Badge>
                    ) : (
                      <Badge className="bg-red-500/15 text-red-700 dark:text-red-300">
                        Low Confidence
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
        </div>

        {consensusData.some(c => c.disagreements > 0) && (
          <Card className="border-amber-500/30 dark:border-amber-500/40 bg-amber-500/10 dark:bg-amber-500/20">
            <CardHeader>
              <CardTitle className="flex items-center text-amber-700 dark:text-amber-300">
                <AlertTriangle className="mr-2 h-4 w-4" />
                Disagreements Detected
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-amber-700 dark:text-amber-300">
                Some criteria show significant disagreement among evaluators. Consider facilitating a discussion to reach consensus.
              </p>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  )
}
