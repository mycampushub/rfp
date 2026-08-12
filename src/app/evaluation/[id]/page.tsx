"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { MainLayout } from "@/components/layout/main-layout"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/shared/empty-state"
import { SearchX } from "lucide-react"
import { toast } from "sonner"
import type { EvaluationDetail, RubricCriterion, EvaluatorScore, ConsensusScore } from "./components/types"
import { EvaluationHeader } from "./components/EvaluationHeader"
import { StatsCards } from "./components/StatsCards"
import { OverviewTab } from "./components/OverviewTab"
import { MyEvaluationTab } from "./components/MyEvaluationTab"
import { ConsensusTab } from "./components/ConsensusTab"
import { ComparisonTab } from "./components/ComparisonTab"

export default function EvaluationDetailPage() {
  const params = useParams()
  useEffect(() => { document.title = 'Evaluation Details | RFP Platform' }, [])
  const router = useRouter()
  const [evaluation, setEvaluation] = useState<EvaluationDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")
  const [showVendorInfo, setShowVendorInfo] = useState(false)
  const [userScores, setUserScores] = useState<Record<string, number>>({})
  const [userNotes, setUserNotes] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const fetchEvaluation = async () => {
      try {
        const id = params.id as string
        const res = await fetch(`/api/evaluations/${id}`)
        if (!res.ok) throw new Error('Failed to fetch evaluation')
        const data = await res.json()

        // Extract rubric criteria from sections' rubricCriteria
        const rubricCriteria: RubricCriterion[] = []
        if (data.sections && Array.isArray(data.sections)) {
          for (const section of data.sections) {
            if (section.rubricCriteria && Array.isArray(section.rubricCriteria)) {
              for (const rc of section.rubricCriteria) {
                if (!rubricCriteria.find(c => c.id === rc.id)) {
                  rubricCriteria.push({
                    id: rc.id,
                    label: rc.label || rc.name || 'Criterion',
                    weight: rc.weight || 1,
                    scaleMin: rc.scaleMin || 1,
                    scaleMax: rc.scaleMax || 5,
                    guidance: rc.guidance || undefined,
                  })
                }
              }
            }
          }
        }

        // Build evaluator scores from submissions' scores
        const evaluatorScores: EvaluatorScore[] = []
        if (data.submissions && Array.isArray(data.submissions)) {
          for (const sub of data.submissions) {
            if (sub.scores && Array.isArray(sub.scores)) {
              for (const s of sub.scores) {
                evaluatorScores.push({
                  id: s.id,
                  evaluatorId: s.id,
                  evaluatorName: s.evaluatorName || 'Evaluator',
                  evaluatorRole: s.rubricName || 'Reviewer',
                  score: s.totalScore || 0,
                  notes: s.comments || undefined,
                  submittedAt: sub.submittedAt || '',
                })
              }
            }
          }
        }

        // Pick a vendor name from the first submission if available
        const vendorName = data.submissions?.[0]?.vendorName || 'Unknown Vendor'
        const vendorId = data.submissions?.[0]?.vendorId || ''

        const mapped: EvaluationDetail = {
          id: data.id,
          rfpTitle: data.rfpTitle || 'Untitled RFP',
          vendorName,
          vendorId,
          status: data.status || 'pending',
          isBlind: false,
          rubricCriteria,
          evaluatorScores,
          consensusScores: [],
          overallScore: data.averageScore || 0,
          maxPossibleScore: 5,
          requiredEvaluators: Math.max(evaluatorScores.length, 1),
          deadline: data.deadline || '',
          submittedAt: undefined,
          submissions: data.submissions,
        }

        setEvaluation(mapped)
      } catch (err) {
        console.error(err)
        toast.error('Failed to load evaluation details')
      } finally {
        setLoading(false)
      }
    }
    if (params.id) {
      fetchEvaluation()
    }
  }, [params.id])

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return "text-emerald-600 dark:text-emerald-400"
    if (confidence >= 0.6) return "text-amber-600 dark:text-amber-400"
    return "text-red-600 dark:text-red-400"
  }

  const calculateWeightedScore = (criterionId: string, score: number) => {
    const criterion = evaluation?.rubricCriteria.find(c => c.id === criterionId)
    if (!criterion) return score
    return score * criterion.weight
  }

  const handleScoreChange = (criterionId: string, score: number) => {
    setUserScores(prev => ({ ...prev, [criterionId]: score }))
  }

  const handleNotesChange = (criterionId: string, notes: string) => {
    setUserNotes(prev => ({ ...prev, [criterionId]: notes }))
  }

  const submitEvaluation = async () => {
    if (!evaluation) return

    const missingScores = evaluation.rubricCriteria.filter(c => !userScores[c.id])
    if (missingScores.length > 0) {
      toast.error("Please provide scores for all criteria")
      return
    }

    setIsSubmitting(true)
    try {
      // Submit scores for each criterion
      const submissions = evaluation.submissions || [] as any
      const firstSubmission = submissions[0]?.id
      if (!firstSubmission) {
        toast.error('No submission found to score')
        return
      }

      for (const [criterionId, scoreValue] of Object.entries(userScores)) {
        const res = await fetch('/api/scores', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            submissionId: firstSubmission,
            criterionId,
            scoreValue,
            notes: userNotes[criterionId] || undefined,
          }),
        })
        if (!res.ok) {
          throw new Error('Failed to submit score')
        }
      }

      toast.success("Evaluation submitted successfully!")
      router.push("/evaluation")
    } catch (err) {
      console.error(err)
      toast.error('Failed to submit evaluation')
    } finally {
      setIsSubmitting(false)
    }
  }

  const calculateConsensus = (): ConsensusScore[] => {
    if (!evaluation) return []
    if (evaluation.evaluatorScores.length === 0) return []

    // Use existing evaluator scores to derive consensus
    // Since evaluatorScores are per-evaluator totals, derive per-criterion estimates
    const avgOverall = evaluation.evaluatorScores.reduce((sum, s) => sum + s.score, 0) / evaluation.evaluatorScores.length

    return evaluation.rubricCriteria.map(criterion => {
      // Derive per-criterion scores proportionally from evaluator totals
      const maxTotal = evaluation.rubricCriteria.reduce((sum, c) => sum + c.scaleMax, 0) || 1
      const criterionWeight = criterion.scaleMax / maxTotal
      const scores = evaluation.evaluatorScores.map(score => {
        const derived = (score.score / evaluation.maxPossibleScore) * criterion.scaleMax * criterionWeight * 2
        return Math.max(criterion.scaleMin, Math.min(criterion.scaleMax, derived))
      })

      const average = scores.reduce((sum, score) => sum + score, 0) / scores.length
      const variance = scores.reduce((sum, score) => sum + Math.pow(score - average, 2), 0) / scores.length
      const standardDeviation = Math.sqrt(variance)
      const confidence = Math.max(0, 1 - (standardDeviation / criterion.scaleMax))
      
      const disagreements = scores.filter(score => Math.abs(score - average) > standardDeviation).length

      return {
        criterionId: criterion.id,
        finalScore: Math.round(average * 10) / 10,
        confidence: Math.round(confidence * 100) / 100,
        disagreements
      }
    })
  }

  if (loading) {
    return (
      <MainLayout title="Evaluation Details">
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
          <div className="grid gap-4 md:grid-cols-3">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </MainLayout>
    )
  }

  if (!evaluation) {
    return (
      <MainLayout title="Evaluation Details">
        <EmptyState 
          icon={SearchX}
          title="Evaluation not found"
          description="The evaluation you're looking for doesn't exist or you don't have access."
          action={{ label: "Go to Evaluations", onClick: () => router.push('/evaluation') }}
        />
      </MainLayout>
    )
  }

  const consensusData = calculateConsensus()
  const completionProgress = evaluation.requiredEvaluators > 0 ? (evaluation.evaluatorScores.length / evaluation.requiredEvaluators) * 100 : 0

  return (
    <MainLayout title={`Evaluation: ${evaluation.rfpTitle}`}>
      <h1 className="text-2xl font-bold tracking-tight">Evaluation</h1>
      <div className="space-y-6">
        <EvaluationHeader
          evaluation={evaluation}
          showVendorInfo={showVendorInfo}
          onToggleVendorInfo={() => setShowVendorInfo(!showVendorInfo)}
        />

        <StatsCards
          evaluation={evaluation}
          consensusData={consensusData}
          completionProgress={completionProgress}
        />

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="evaluation">My Evaluation</TabsTrigger>
            <TabsTrigger value="consensus">Consensus</TabsTrigger>
            <TabsTrigger value="comparison">Comparison</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <OverviewTab evaluation={evaluation} />
          </TabsContent>

          <TabsContent value="evaluation" className="space-y-4">
            <MyEvaluationTab
              evaluation={evaluation}
              userScores={userScores}
              userNotes={userNotes}
              isSubmitting={isSubmitting}
              onScoreChange={handleScoreChange}
              onNotesChange={handleNotesChange}
              onSubmit={submitEvaluation}
              onCancel={() => setActiveTab("overview")}
              calculateWeightedScore={calculateWeightedScore}
            />
          </TabsContent>

          <TabsContent value="consensus" className="space-y-4">
            <ConsensusTab
              evaluation={evaluation}
              consensusData={consensusData}
              getConfidenceColor={getConfidenceColor}
            />
          </TabsContent>

          <TabsContent value="comparison" className="space-y-4">
            <ComparisonTab
              evaluation={evaluation}
              consensusData={consensusData}
            />
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  )
}
