export interface RubricCriterion {
  id: string
  label: string
  weight: number
  scaleMin: number
  scaleMax: number
  guidance?: string
}

export interface EvaluatorScore {
  id: string
  evaluatorId: string
  evaluatorName: string
  evaluatorRole: string
  score: number
  notes?: string
  submittedAt: string
}

export interface ConsensusScore {
  criterionId: string
  finalScore: number
  notes?: string
  confidence: number
  disagreements: number
  agreementLevel?: number
}

export interface EvaluationDetail {
  id: string
  rfpTitle: string
  vendorName: string
  vendorId: string
  status: "pending" | "in_progress" | "completed" | "finalized"
  isBlind: boolean
  rubricCriteria: RubricCriterion[]
  evaluatorScores: EvaluatorScore[]
  consensusScores: ConsensusScore[]
  overallScore: number
  maxPossibleScore: number
  requiredEvaluators: number
  deadline: string
  submittedAt?: string
  submissions?: any[]
}
