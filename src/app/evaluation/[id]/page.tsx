"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { 
  Star,
  Users,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Target,
  Award,
  Eye,
  EyeOff,
  MessageSquare,
  Calculator,
  ThumbsUp,
  ThumbsDown,
  AlertTriangle
} from "lucide-react"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface RubricCriterion {
  id: string
  label: string
  weight: number
  scaleMin: number
  scaleMax: number
  guidance?: string
}

interface EvaluatorScore {
  id: string
  evaluatorId: string
  evaluatorName: string
  evaluatorRole: string
  score: number
  notes?: string
  submittedAt: string
}

interface ConsensusScore {
  criterionId: string
  finalScore: number
  notes?: string
  confidence: number
  disagreements: number
}

interface EvaluationDetail {
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
}

export default function EvaluationDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [evaluation, setEvaluation] = useState<EvaluationDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")
  const [showVendorInfo, setShowVendorInfo] = useState(false)
  const [userScores, setUserScores] = useState<Record<string, number>>({})
  const [userNotes, setUserNotes] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Mock data for demonstration
  const mockEvaluation: EvaluationDetail = {
    id: params.id as string,
    rfpTitle: "IT Managed Services 2024",
    vendorName: "Tech Solutions Inc",
    vendorId: "vendor-1",
    status: "in_progress",
    isBlind: true,
    rubricCriteria: [
      {
        id: "1",
        label: "Technical Expertise",
        weight: 0.3,
        scaleMin: 1,
        scaleMax: 5,
        guidance: "Evaluate the vendor's technical capabilities and expertise in the required domain."
      },
      {
        id: "2",
        label: "Cost Effectiveness",
        weight: 0.25,
        scaleMin: 1,
        scaleMax: 5,
        guidance: "Assess the value for money and overall cost competitiveness."
      },
      {
        id: "3",
        label: "Project Management",
        weight: 0.2,
        scaleMin: 1,
        scaleMax: 5,
        guidance: "Evaluate the vendor's approach to project management and delivery."
      },
      {
        id: "4",
        label: "Innovation & Creativity",
        weight: 0.15,
        scaleMin: 1,
        scaleMax: 5,
        guidance: "Assess the innovative aspects and creative solutions proposed."
      },
      {
        id: "5",
        label: "Risk Management",
        weight: 0.1,
        scaleMin: 1,
        scaleMax: 5,
        guidance: "Evaluate the vendor's approach to identifying and mitigating risks."
      }
    ],
    evaluatorScores: [
      {
        id: "1",
        evaluatorId: "eval-1",
        evaluatorName: "John Doe",
        evaluatorRole: "Technical Lead",
        score: 4.2,
        notes: "Strong technical proposal with good innovation",
        submittedAt: "2024-11-15T10:00:00Z"
      },
      {
        id: "2",
        evaluatorId: "eval-2",
        evaluatorName: "Jane Smith",
        evaluatorRole: "Project Manager",
        score: 3.8,
        notes: "Good approach but concerns about timeline",
        submittedAt: "2024-11-15T14:30:00Z"
      }
    ],
    consensusScores: [
      {
        criterionId: "1",
        finalScore: 4.0,
        notes: "Consensus on strong technical capabilities",
        confidence: 0.85,
        disagreements: 1
      },
      {
        criterionId: "2",
        finalScore: 3.5,
        notes: "Moderate cost effectiveness",
        confidence: 0.90,
        disagreements: 0
      }
    ],
    overallScore: 3.8,
    maxPossibleScore: 5.0,
    requiredEvaluators: 3,
    deadline: "2024-12-20",
    submittedAt: undefined
  }

  useEffect(() => {
    setTimeout(() => {
      setEvaluation(mockEvaluation)
      setLoading(false)
    }, 1000)
  }, [params.id])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800"
      case "in_progress":
        return "bg-blue-100 text-blue-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "finalized":
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getScoreColor = (score: number, maxScore: number) => {
    const percentage = (score / maxScore) * 100
    if (percentage >= 80) return "text-green-600"
    if (percentage >= 60) return "text-yellow-600"
    return "text-red-600"
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return "text-green-600"
    if (confidence >= 0.6) return "text-yellow-600"
    return "text-red-600"
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
      alert("Please provide scores for all criteria")
      return
    }

    setIsSubmitting(true)
    
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false)
      alert("Evaluation submitted successfully!")
      router.push("/evaluation")
    }, 1500)
  }

  const calculateConsensus = () => {
    if (!evaluation) return []

    return evaluation.rubricCriteria.map(criterion => {
      const scores = evaluation.evaluatorScores.map(score => {
        // In a real implementation, this would be mapped to criterion scores
        return Math.random() * 4 + 1 // Mock score for demonstration
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
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading evaluation details...</div>
        </div>
      </MainLayout>
    )
  }

  if (!evaluation) {
    return (
      <MainLayout title="Evaluation Details">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Evaluation not found</div>
        </div>
      </MainLayout>
    )
  }

  const consensusData = calculateConsensus()
  const completionProgress = (evaluation.evaluatorScores.length / evaluation.requiredEvaluators) * 100

  return (
    <MainLayout title={`Evaluation: ${evaluation.rfpTitle}`}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold">{evaluation.rfpTitle}</h1>
            <div className="flex items-center space-x-4 mt-2">
              <div className="flex items-center space-x-2">
                {evaluation.isBlind && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowVendorInfo(!showVendorInfo)}
                  >
                    {showVendorInfo ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    {showVendorInfo ? "Hide Vendor" : "Show Vendor"}
                  </Button>
                )}
                {showVendorInfo && (
                  <span className="text-lg font-semibold">{evaluation.vendorName}</span>
                )}
              </div>
              <Badge className={getStatusColor(evaluation.status)}>
                {evaluation.status.replace("_", " ")}
              </Badge>
              {evaluation.isBlind && (
                <Badge variant="outline">
                  Blind Evaluation
                </Badge>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-muted-foreground">Deadline</div>
            <div className="font-medium">
              {new Date(evaluation.deadline).toLocaleDateString()}
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overall Score</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getScoreColor(evaluation.overallScore, evaluation.maxPossibleScore)}`}>
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

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="evaluation">My Evaluation</TabsTrigger>
            <TabsTrigger value="consensus">Consensus</TabsTrigger>
            <TabsTrigger value="comparison">Comparison</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
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
                    {evaluation.rubricCriteria.map((criterion) => (
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
                    ))}
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
                          <span className={`font-medium ${getScoreColor(score.score, evaluation.maxPossibleScore)}`}>
                            {score.score.toFixed(1)}
                          </span>
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        </div>
                      </div>
                    ))}
                    {Array.from({ length: evaluation.requiredEvaluators - evaluation.evaluatorScores.length }).map((_, index) => (
                      <div key={index} className="flex justify-between items-center p-2 border rounded bg-gray-50">
                        <div>
                          <span className="font-medium text-muted-foreground">Pending Evaluator</span>
                        </div>
                        <Clock className="h-4 w-4 text-yellow-600" />
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="evaluation" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Submit Your Evaluation</CardTitle>
                <CardDescription>
                  Evaluate the submission based on the rubric criteria below
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {evaluation.rubricCriteria.map((criterion) => (
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
                          onValueChange={(value) => handleScoreChange(criterion.id, parseFloat(value))}
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
                        onChange={(e) => handleNotesChange(criterion.id, e.target.value)}
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
                ))}

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setActiveTab("overview")}>
                    Cancel
                  </Button>
                  <Button onClick={submitEvaluation} disabled={isSubmitting}>
                    {isSubmitting ? "Submitting..." : "Submit Evaluation"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="consensus" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Consensus Analysis</CardTitle>
                <CardDescription>
                  Analysis of evaluator consensus and disagreements
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Criterion</TableHead>
                      <TableHead>Final Score</TableHead>
                      <TableHead>Confidence</TableHead>
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
                            <span className={`font-medium ${getScoreColor(consensus.finalScore, criterion?.scaleMax || 5)}`}>
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
                                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {consensus.confidence >= 0.8 ? (
                              <Badge className="bg-green-100 text-green-800">
                                High Confidence
                              </Badge>
                            ) : consensus.confidence >= 0.6 ? (
                              <Badge className="bg-yellow-100 text-yellow-800">
                                Moderate Confidence
                              </Badge>
                            ) : (
                              <Badge className="bg-red-100 text-red-800">
                                Low Confidence
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>

                {consensusData.some(c => c.disagreements > 0) && (
                  <Card className="border-yellow-200 bg-yellow-50">
                    <CardHeader>
                      <CardTitle className="flex items-center text-yellow-800">
                        <AlertTriangle className="mr-2 h-4 w-4" />
                        Disagreements Detected
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-yellow-700">
                        Some criteria show significant disagreement among evaluators. Consider facilitating a discussion to reach consensus.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="comparison" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Evaluator Comparison</CardTitle>
                <CardDescription>
                  Side-by-side comparison of all evaluator scores
                </CardDescription>
              </CardHeader>
              <CardContent>
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
                      const evaluatorScoresForCriterion = evaluation.evaluatorScores.map(() => 
                        Math.random() * 4 + 1 // Mock scores for demonstration
                      )
                      const average = evaluatorScoresForCriterion.reduce((sum, score) => sum + score, 0) / evaluatorScoresForCriterion.length

                      return (
                        <TableRow key={criterion.id}>
                          <TableCell className="font-medium">{criterion.label}</TableCell>
                          {evaluatorScoresForCriterion.map((score, index) => (
                            <TableCell key={index}>
                              <span className={`font-medium ${getScoreColor(score, criterion.scaleMax)}`}>
                                {score.toFixed(1)}
                              </span>
                            </TableCell>
                          ))}
                          <TableCell>
                            <span className={`font-medium ${getScoreColor(average, criterion.scaleMax)}`}>
                              {average.toFixed(1)}
                            </span>
                          </TableCell>
                          <TableCell>
                            {consensus && (
                              <span className={`font-medium ${getScoreColor(consensus.finalScore, criterion.scaleMax)}`}>
                                {consensus.finalScore.toFixed(1)}
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  )
}