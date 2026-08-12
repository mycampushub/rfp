"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { MainLayout } from "@/components/layout/main-layout"
import { useCsvExport } from "@/hooks/use-csv-export"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/shared/empty-state"
import { SearchX, Download, Loader2, EyeOff } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
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
  const { exportCsv, exporting } = useCsvExport()
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

        // Anonymize vendor names if blind evaluation is active
        const isBlindEval = data.isBlindEvaluation === true

        // Anonymize vendor names in submissions when blind mode is on
        const processedSubmissions = isBlindEval && Array.isArray(data.submissions)
          ? data.submissions.map((sub: any, index: number) => ({
              ...sub,
              vendorName: `Vendor ${String.fromCharCode(65 + index)}`, // Vendor A, Vendor B, ...
              vendorId: sub.vendorId || '', // Keep ID for data operations
            }))
          : data.submissions

        const mapped: EvaluationDetail = {
          id: data.id,
          rfpTitle: data.rfpTitle || 'Untitled RFP',
          vendorName: isBlindEval
            ? (processedSubmissions?.[0]?.vendorName || 'Vendor A')
            : (data.submissions?.[0]?.vendorName || 'Unknown Vendor'),
          vendorId: data.submissions?.[0]?.vendorId || '',
          status: data.status || 'pending',
          isBlind: isBlindEval,
          rubricCriteria,
          evaluatorScores,
          consensusScores: [],
          overallScore: data.averageScore || 0,
          maxPossibleScore: 5,
          requiredEvaluators: Math.max(evaluatorScores.length, 1),
          deadline: data.deadline || '',
          submittedAt: undefined,
          submissions: processedSubmissions,
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

    return evaluation.rubricCriteria.map(criterion => {
      // Derive per-criterion scores proportionally from evaluator totals
      const maxTotal = evaluation.rubricCriteria.reduce((sum, c) => sum + c.scaleMax, 0) || 1
      const criterionWeight = criterion.scaleMax / maxTotal
      const derivedScores = evaluation.evaluatorScores.map(score => {
        const derived = (score.score / evaluation.maxPossibleScore) * criterion.scaleMax * criterionWeight * 2
        return Math.max(criterion.scaleMin, Math.min(criterion.scaleMax, derived))
      })

      // Calculate mean
      const mean = derivedScores.reduce((sum, s) => sum + s, 0) / derivedScores.length

      // Calculate standard deviation
      const variance = derivedScores.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) / derivedScores.length
      const stdDev = Math.sqrt(variance)

      // Agreement level: 1 - (std_dev / max_possible_std_dev), clamped 0-1
      // Max possible std dev is half the scoring range
      const maxPossibleStdDev = (criterion.scaleMax - criterion.scaleMin) / 2
      const agreement = maxPossibleStdDev > 0
        ? Math.max(0, Math.min(1, 1 - (stdDev / maxPossibleStdDev)))
        : 1
      // Single evaluator = 100% agreement
      const confidence = derivedScores.length === 1 ? 1 : agreement

      // Count disagreements (scores more than 1 std dev from mean)
      const disagreements = derivedScores.length > 1
        ? derivedScores.filter(s => Math.abs(s - mean) > stdDev).length
        : 0

      return {
        criterionId: criterion.id,
        finalScore: Math.round(mean * 10) / 10,
        confidence: Math.round(confidence * 100) / 100,
        disagreements,
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
      <div className="flex justify-between items-start">
        <h1 className="text-2xl font-bold tracking-tight">Evaluation</h1>
        <Button
          variant="outline"
          disabled={exporting}
          onClick={() => {
            const date = new Date().toISOString().slice(0, 10)
            exportCsv(`/api/export/evaluations/${params.id}?format=csv`, `evaluation-scores-${date}.csv`)
          }}
        >
          {exporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
          Export Scores
        </Button>
      </div>
      <div className="space-y-6">
        <EvaluationHeader
          evaluation={evaluation}
          showVendorInfo={showVendorInfo}
          onToggleVendorInfo={() => setShowVendorInfo(!showVendorInfo)}
        />

        {evaluation.isBlind && !showVendorInfo && (
          <Alert className="border-amber-500/50 bg-amber-500/10 dark:bg-amber-500/20">
            <EyeOff className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <AlertDescription className="text-amber-700 dark:text-amber-300">
              <strong>Blind Evaluation Active</strong> — Vendor identities are hidden to prevent bias. Click &quot;Show Vendor&quot; in the header to reveal names when evaluation is complete.
            </AlertDescription>
          </Alert>
        )}

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
