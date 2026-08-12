"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { MainLayout } from "@/components/layout/main-layout"
import { EmptyState } from "@/components/shared/empty-state"
import { LoadingCards } from "@/components/shared/loading-table"
import { getStatusColor, getScoreColor } from "@/lib/status-utils"
import { formatDateTime } from "@/lib/utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import {
  FileText,
  User,
  Clock,
  AlertCircle,
  CheckCircle,
  PenTool,
  Paperclip,
  Shield,
  Star,
  Eye,
  EyeOff,
} from "lucide-react"

interface SubmissionAnswer {
  id: string
  valueText?: string | null
  valueNumber?: number | null
  valueOption?: string | null
  fileRef?: string | null
  question: {
    id: string
    prompt: string
    type: string
    required: boolean
    constraints?: unknown
  }
}

interface SubmissionScore {
  id: string
  scoreValue: number
  notes?: string | null
  criterion: {
    id: string
    label: string
    weight: number
    scaleMin?: number | null
    scaleMax?: number | null
    guidance?: string | null
  }
  evaluator: {
    id: string
    name?: string | null
    email?: string | null
  }
}

interface ConsensusScore {
  id: string
  scoreValue: number
  standardDeviation: number
  agreementLevel: number
  notes?: string | null
  criterion: {
    id: string
    label: string
    weight: number
    scaleMin?: number | null
    scaleMax?: number | null
    guidance?: string | null
  }
}

interface ElectronicSignature {
  id: string
  signerName: string
  signerEmail: string
  signerTitle: string
  status: string
  termsAccepted: boolean
  createdAt: string
}

interface Submission {
  id: string
  rfpId: string
  vendorId: string
  version: number
  submittedAt: string | null
  status: string
  checksum: string | null
  createdAt: string
  updatedAt: string
  totalScore: number
  maxPossibleScore: number
  averageScore: number
  scorePercentage: number
  vendor: { id: string; name: string }
  rfp: {
    id: string
    title: string
    status: string
    closeAt: string | null
    isBlindEvaluation?: boolean
  }
  answers: SubmissionAnswer[]
  scores: SubmissionScore[]
  consensus: ConsensusScore[]
  electronicSignatures: ElectronicSignature[]
}

export default function SubmissionDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [submission, setSubmission] = useState<Submission | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showVendorName, setShowVendorName] = useState(true)

  useEffect(() => {
    document.title = `Submission Details | RFP Platform`
  }, [])

  useEffect(() => {
    async function fetchSubmission() {
      try {
        const res = await fetch(`/api/submissions/${id}`)
        if (!res.ok) {
          if (res.status === 404) setError("Submission not found")
          else throw new Error("Failed to fetch submission")
          return
        }
        const data = await res.json()
        setSubmission(data)
        // Determine if this is a blind evaluation
        if (data.rfp?.isBlindEvaluation) {
          setShowVendorName(false)
        }
      } catch {
        setError("Failed to load submission details")
      } finally {
        setLoading(false)
      }
    }
    if (id) fetchSubmission()
  }, [id])

  if (loading) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <div className="h-6 w-64 animate-pulse rounded bg-muted" />
          <LoadingCards count={3} />
          <div className="rounded-lg border p-6 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-4 animate-pulse rounded bg-muted" style={{ width: `${50 + Math.random() * 50}%` }} />
            ))}
          </div>
        </div>
      </MainLayout>
    )
  }

  if (error || !submission) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center py-20">
          <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Error</h2>
          <p className="text-muted-foreground mb-4">{error || "Submission not found"}</p>
          <Button variant="outline" onClick={() => router.push("/rfps")}>
            Back to RFPs
          </Button>
        </div>
      </MainLayout>
    )
  }

  const hasAnswers = submission.answers.length > 0
  const hasScores = submission.scores.length > 0 || submission.consensus.length > 0
  const hasSignatures = submission.electronicSignatures.length > 0
  const hasFileAttachments = submission.answers.some(a => a.fileRef)

  // Group answers by section (using question ID prefix pattern)
  const groupedAnswers: Record<string, SubmissionAnswer[]> = {}
  submission.answers.forEach(answer => {
    const sectionName = "Section"
    if (!groupedAnswers[sectionName]) groupedAnswers[sectionName] = []
    groupedAnswers[sectionName].push(answer)
  })

  return (
    <MainLayout hideBreadcrumbs>
      <div className="space-y-6">
        {/* Breadcrumb */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/rfps">RFPs</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href={`/rfps/${submission.rfpId}`}>{submission.rfp.title}</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Submission</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold">Submission Details</h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FileText className="h-4 w-4" />
              <span>{submission.rfp.title}</span>
              <span className="text-muted">|</span>
              <span>Version {submission.version}</span>
            </div>
          </div>
          <Badge variant="secondary" className={getStatusColor(submission.status)}>
            {submission.status}
          </Badge>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
                  <User className="h-5 w-5 text-amber-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-muted-foreground">Vendor</p>
                  <div className="flex items-center gap-1">
                    <p className="text-sm font-medium truncate">
                      {showVendorName ? submission.vendor.name : "Anonymous"}
                    </p>
                    {!showVendorName && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 shrink-0"
                        onClick={() => setShowVendorName(true)}
                        title="Reveal vendor name"
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                    )}
                    {showVendorName && submission.rfp?.isBlindEvaluation && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 shrink-0"
                        onClick={() => setShowVendorName(false)}
                        title="Hide vendor name (blind evaluation)"
                      >
                        <EyeOff className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-500/10">
                  <Clock className="h-5 w-5 text-sky-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Submitted</p>
                  <p className="text-sm font-medium">{formatDateTime(submission.submittedAt)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                  <Star className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Score</p>
                  <p className={`text-lg font-bold ${hasScores ? getScoreColor(submission.scorePercentage) : "text-muted-foreground"}`}>
                    {hasScores
                      ? `${submission.totalScore.toFixed(1)} / ${submission.maxPossibleScore.toFixed(1)}`
                      : "Not scored"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/10">
                  <Shield className="h-5 w-5 text-violet-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Signature</p>
                  <div className="flex items-center gap-1">
                    {hasSignatures ? (
                      <>
                        <CheckCircle className="h-4 w-4 text-emerald-600" />
                        <span className="text-sm font-medium">Signed</span>
                      </>
                    ) : (
                      <>
                        <PenTool className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Not signed</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* File Attachments */}
        {hasFileAttachments && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Paperclip className="h-4 w-4" /> Attached Files
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {submission.answers
                  .filter(a => a.fileRef)
                  .map(answer => (
                    <div key={answer.id} className="flex items-center gap-3 p-3 rounded-lg border">
                      <Paperclip className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{answer.fileRef}</p>
                        <p className="text-xs text-muted-foreground">{answer.question.prompt}</p>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Submission Sections / Answers */}
        {hasAnswers ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4" /> Submission Answers
              </CardTitle>
              <CardDescription>{submission.answers.length} question{submission.answers.length !== 1 ? "s" : ""} answered</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {Object.entries(groupedAnswers).map(([sectionName, answers]) => (
                <div key={sectionName}>
                  {Object.keys(groupedAnswers).length > 1 && (
                    <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">{sectionName}</h3>
                  )}
                  <div className="space-y-4">
                    {answers.map((answer) => (
                      <div key={answer.id} className="space-y-1.5">
                        <div className="flex items-start gap-2">
                          <p className="text-sm font-medium">{answer.question.prompt}</p>
                          {answer.question.required && (
                            <span className="text-red-500 text-xs mt-0.5">*</span>
                          )}
                        </div>
                        {answer.valueText ? (
                          <p className="text-sm text-muted-foreground whitespace-pre-wrap pl-1">{answer.valueText}</p>
                        ) : answer.valueOption ? (
                          <Badge variant="secondary" className="ml-1">{answer.valueOption}</Badge>
                        ) : answer.valueNumber != null ? (
                          <p className="text-sm text-muted-foreground pl-1">{answer.valueNumber}</p>
                        ) : answer.fileRef ? (
                          <div className="flex items-center gap-1.5 pl-1">
                            <Paperclip className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-sm text-primary">{answer.fileRef}</span>
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground italic pl-1">No answer provided</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="pt-6">
              <EmptyState
                icon={FileText}
                title="No answers submitted yet"
                description="This submission does not contain any answered questions."
              />
            </CardContent>
          </Card>
        )}

        {/* Scoring Details */}
        {hasScores ? (
          <>
            {/* Individual Scores */}
            {submission.scores.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <PenTool className="h-4 w-4" /> Individual Evaluator Scores
                  </CardTitle>
                  <CardDescription>Scores from individual evaluators</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="max-h-96 overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Criterion</TableHead>
                          <TableHead>Evaluator</TableHead>
                          <TableHead>Score</TableHead>
                          <TableHead>Notes</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {submission.scores.map((score) => (
                          <TableRow key={score.id}>
                            <TableCell className="font-medium">{score.criterion.label}</TableCell>
                            <TableCell>
                              <div>
                                <p className="text-sm">{score.evaluator.name || score.evaluator.email}</p>
                                <p className="text-xs text-muted-foreground">Weight: {score.criterion.weight}x</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className={`font-semibold ${getScoreColor(score.scoreValue)}`}>
                                {score.scoreValue.toFixed(1)}
                              </span>
                            </TableCell>
                            <TableCell className="max-w-[200px]">
                              <p className="text-sm text-muted-foreground truncate">
                                {score.notes || "—"}
                              </p>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Consensus Scores */}
            {submission.consensus.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Star className="h-4 w-4" /> Consensus Scores
                  </CardTitle>
                  <CardDescription>
                    Final consensus scores — Total: {submission.scorePercentage.toFixed(1)}%
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Criterion</TableHead>
                        <TableHead>Weight</TableHead>
                        <TableHead>Score</TableHead>
                        <TableHead>Weighted</TableHead>
                        <TableHead>Agreement</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {submission.consensus.map((consensus) => {
                        const weighted = consensus.scoreValue * (consensus.criterion.weight || 1)
                        return (
                          <TableRow key={consensus.id}>
                            <TableCell className="font-medium">{consensus.criterion.label}</TableCell>
                            <TableCell>{consensus.criterion.weight}x</TableCell>
                            <TableCell>
                              <span className={`font-semibold ${getScoreColor(consensus.scoreValue)}`}>
                                {consensus.scoreValue.toFixed(1)}
                              </span>
                            </TableCell>
                            <TableCell className="font-medium">{weighted.toFixed(1)}</TableCell>
                            <TableCell>
                              <Badge
                                variant="secondary"
                                className={
                                  consensus.agreementLevel >= 0.8
                                    ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                                    : consensus.agreementLevel >= 0.5
                                    ? "bg-amber-500/15 text-amber-700 dark:text-amber-400"
                                    : "bg-red-500/15 text-red-700 dark:text-red-400"
                                }
                              >
                                {(consensus.agreementLevel * 100).toFixed(0)}%
                              </Badge>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                      <TableRow className="bg-muted/50 font-bold">
                        <TableCell colSpan={3}>Total</TableCell>
                        <TableCell>{submission.totalScore.toFixed(1)} / {submission.maxPossibleScore.toFixed(1)}</TableCell>
                        <TableCell>{submission.scorePercentage.toFixed(1)}%</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </>
        ) : (
          <Card>
            <CardContent className="pt-6">
              <EmptyState
                icon={PenTool}
                title="No evaluation scores yet"
                description="Scores will appear once evaluators have reviewed this submission."
              />
            </CardContent>
          </Card>
        )}

        {/* Electronic Signatures */}
        {hasSignatures && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="h-4 w-4" /> Electronic Signatures
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {submission.electronicSignatures.map((sig) => (
                <div key={sig.id} className="flex items-start gap-4 p-4 rounded-lg border">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full shrink-0 ${
                    sig.status === "verified"
                      ? "bg-emerald-500/10"
                      : sig.status === "pending"
                      ? "bg-amber-500/10"
                      : "bg-red-500/10"
                  }`}>
                    <CheckCircle className={`h-5 w-5 ${
                      sig.status === "verified"
                        ? "text-emerald-600"
                        : sig.status === "pending"
                        ? "text-amber-600"
                        : "text-red-600"
                    }`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium">{sig.signerName}</p>
                      <Badge
                        variant="secondary"
                        className={
                          sig.status === "verified"
                            ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                            : sig.status === "pending"
                            ? "bg-amber-500/15 text-amber-700 dark:text-amber-400"
                            : "bg-red-500/15 text-red-700 dark:text-red-400"
                        }
                      >
                        {sig.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{sig.signerTitle} &middot; {sig.signerEmail}</p>
                    <p className="text-xs text-muted-foreground mt-1">Signed on {formatDateTime(sig.createdAt)}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Metadata */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Submission Metadata</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-sm">
              <div>
                <p className="text-muted-foreground">Submission ID</p>
                <p className="font-mono text-xs mt-0.5 break-all">{submission.id}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Created</p>
                <p className="mt-0.5">{formatDateTime(submission.createdAt)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Last Updated</p>
                <p className="mt-0.5">{formatDateTime(submission.updatedAt)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Checksum</p>
                <p className="font-mono text-xs mt-0.5 break-all">
                  {submission.checksum ? `${submission.checksum.substring(0, 16)}...` : "N/A"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}
