"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Target, Users, FileText, ThumbsUp } from "lucide-react"
import { getScoreColor } from "@/lib/status-utils"
import type { EvaluationDetail, ConsensusScore } from "./types"

interface StatsCardsProps {
  evaluation: EvaluationDetail
  consensusData: ConsensusScore[]
  completionProgress: number
}

export function StatsCards({ evaluation, consensusData, completionProgress }: StatsCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Overall Score</CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${getScoreColor(evaluation.maxPossibleScore > 0 ? (evaluation.overallScore / evaluation.maxPossibleScore) * 100 : 0)}`}>
            {evaluation.overallScore.toFixed(1)}/{evaluation.maxPossibleScore}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Evaluator Progress</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {evaluation.evaluatorScores.length}/{evaluation.requiredEvaluators}
          </div>
          <Progress value={completionProgress} className="mt-2" />
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Criteria</CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {evaluation.rubricCriteria.length}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Consensus</CardTitle>
          <ThumbsUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {consensusData.length > 0 ? Math.round(consensusData.reduce((sum, c) => sum + c.confidence, 0) / consensusData.length * 100) : 0}%
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
