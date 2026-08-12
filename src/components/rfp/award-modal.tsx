"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "sonner"
import { Trophy, CheckCircle2, Loader2, AlertTriangle } from "lucide-react"

interface SubmissionOption {
  id: string
  vendorId: string
  vendorName: string
  totalScore: number
  scorePercentage: number
  averageScore: number
}

interface AwardModalProps {
  rfpId: string
  rfpTitle: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

type Step = "select" | "details" | "confirm"

export function AwardModal({ rfpId, rfpTitle, open, onOpenChange }: AwardModalProps) {
  const router = useRouter()
  const [step, setStep] = useState<Step>("select")
  const [submissions, setSubmissions] = useState<SubmissionOption[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string>("")
  const [contractStartDate, setContractStartDate] = useState("")
  const [contractEndDate, setContractEndDate] = useState("")
  const [contractValue, setContractValue] = useState("")
  const [notes, setNotes] = useState("")

  useEffect(() => {
    if (open && rfpId) {
      fetchSubmissions()
    }
    // Reset state when modal opens
    setStep("select")
    setSelectedSubmissionId("")
    setContractStartDate("")
    setContractEndDate("")
    setContractValue("")
    setNotes("")
  }, [open, rfpId])

  const fetchSubmissions = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/submissions?rfpId=${rfpId}&status=submitted,reviewed,awarded&limit=100`)
      if (!res.ok) throw new Error("Failed to fetch submissions")
      const data = await res.json()

      // Filter out already awarded, sort by score descending
      const options: SubmissionOption[] = (data.data || [])
        .filter((s: any) => s.status !== "awarded")
        .map((s: any) => ({
          id: s.id,
          vendorId: s.vendor?.id || s.vendorId,
          vendorName: s.vendor?.name || "Unknown Vendor",
          totalScore: s.totalScore || 0,
          scorePercentage: s.scorePercentage || 0,
          averageScore: s.averageScore || 0,
        }))
        .sort((a: SubmissionOption, b: SubmissionOption) => b.scorePercentage - a.scorePercentage)

      setSubmissions(options)
    } catch (err) {
      console.error(err)
      toast.error("Failed to load submissions")
    } finally {
      setLoading(false)
    }
  }

  const selectedSubmission = submissions.find((s) => s.id === selectedSubmissionId)

  const handleSelectVendor = () => {
    if (!selectedSubmissionId) {
      toast.error("Please select a vendor to award")
      return
    }
    setStep("details")
  }

  const handleReview = () => {
    if (!contractStartDate || !contractEndDate) {
      toast.error("Please provide contract start and end dates")
      return
    }
    if (new Date(contractEndDate) <= new Date(contractStartDate)) {
      toast.error("End date must be after start date")
      return
    }
    setStep("confirm")
  }

  const handleConfirmAward = async () => {
    setSubmitting(true)
    try {
      const res = await fetch(`/api/rfps/${rfpId}/award`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submissionId: selectedSubmissionId,
          contractStartDate,
          contractEndDate,
          contractValue: contractValue ? parseFloat(contractValue) : undefined,
          notes: notes || undefined,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to award vendor")
      }

      toast.success("Vendor awarded successfully! Contract has been created.")
      onOpenChange(false)
      router.refresh()
    } catch (err) {
      console.error(err)
      toast.error(err instanceof Error ? err.message : "Failed to award vendor")
    } finally {
      setSubmitting(false)
    }
  }

  const getScoreBadgeColor = (percentage: number) => {
    if (percentage >= 80) return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400"
    if (percentage >= 60) return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
    return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-500" />
            Award Vendor
          </DialogTitle>
          <DialogDescription>
            {step === "select" && "Select the winning submission for this RFP."}
            {step === "details" && "Enter the contract details for the award."}
            {step === "confirm" && "Review and confirm the award details."}
          </DialogDescription>
        </DialogHeader>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-4">
          {(["select", "details", "confirm"] as Step[]).map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-medium ${
                  step === s
                    ? "bg-primary text-primary-foreground"
                    : i < ["select", "details", "confirm"].indexOf(step)
                    ? "bg-primary/20 text-primary"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {i + 1}
              </div>
              <span className="text-xs font-medium hidden sm:inline">
                {s === "select" ? "Select" : s === "details" ? "Details" : "Confirm"}
              </span>
              {i < 2 && <div className="w-8 h-px bg-border" />}
            </div>
          ))}
        </div>

        {/* Step 1: Select Vendor */}
        {step === "select" && (
          <div className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                <span className="ml-2 text-muted-foreground">Loading submissions...</span>
              </div>
            ) : submissions.length === 0 ? (
              <div className="text-center py-8">
                <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto mb-2" />
                <p className="text-muted-foreground">No eligible submissions found for this RFP.</p>
              </div>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">
                  {submissions.length} submission{submissions.length !== 1 ? "s" : ""} ranked by score
                </p>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {submissions.map((sub, index) => (
                    <Card
                      key={sub.id}
                      className={`cursor-pointer transition-colors ${
                        selectedSubmissionId === sub.id
                          ? "border-primary ring-2 ring-primary/20"
                          : "hover:border-primary/50"
                      }`}
                      onClick={() => setSelectedSubmissionId(sub.id)}
                    >
                      <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted text-sm font-bold">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{sub.vendorName}</p>
                            <p className="text-xs text-muted-foreground">
                              Avg: {sub.averageScore.toFixed(1)} · Total: {sub.totalScore.toFixed(1)}
                            </p>
                          </div>
                        </div>
                        <Badge className={getScoreBadgeColor(sub.scorePercentage)}>
                          {sub.scorePercentage.toFixed(1)}%
                        </Badge>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleSelectVendor} disabled={!selectedSubmissionId || submissions.length === 0}>
                Continue
              </Button>
            </DialogFooter>
          </div>
        )}

        {/* Step 2: Contract Details */}
        {step === "details" && (
          <div className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-4 mb-2">
              <p className="text-sm">
                <span className="font-medium">Awarding:</span>{" "}
                {selectedSubmission?.vendorName}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {selectedSubmission && `Score: ${selectedSubmission.scorePercentage.toFixed(1)}%`}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Contract Start Date *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={contractStartDate}
                  onChange={(e) => setContractStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">Contract End Date *</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={contractEndDate}
                  onChange={(e) => setContractEndDate(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="value">Contract Value ($)</Label>
              <Input
                id="value"
                type="number"
                step="0.01"
                min="0"
                placeholder="e.g., 50000"
                value={contractValue}
                onChange={(e) => setContractValue(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Optional notes about this award decision..."
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setStep("select")}>
                Back
              </Button>
              <Button onClick={handleReview}>Review Award</Button>
            </DialogFooter>
          </div>
        )}

        {/* Step 3: Confirm */}
        {step === "confirm" && (
          <div className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                <h3 className="font-semibold">Award Summary</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground">RFP</p>
                  <p className="font-medium">{rfpTitle}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Awarded Vendor</p>
                  <p className="font-medium">{selectedSubmission?.vendorName}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Vendor Score</p>
                  <p className="font-medium">{selectedSubmission?.scorePercentage.toFixed(1)}%</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Contract Value</p>
                  <p className="font-medium">
                    {contractValue
                      ? `$${parseFloat(contractValue).toLocaleString("en-US", { minimumFractionDigits: 2 })}`
                      : "Not specified"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Start Date</p>
                  <p className="font-medium">
                    {contractStartDate
                      ? new Date(contractStartDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
                      : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">End Date</p>
                  <p className="font-medium">
                    {contractEndDate
                      ? new Date(contractEndDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
                      : "—"}
                  </p>
                </div>
              </div>

              {notes && (
                <div className="mt-2 pt-2 border-t">
                  <p className="text-muted-foreground text-sm">Notes</p>
                  <p className="text-sm mt-1">{notes}</p>
                </div>
              )}
            </div>

            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 text-sm text-amber-800 dark:text-amber-200">
              <strong>Important:</strong> This action will set the RFP status to &quot;awarded&quot; and create a contract record. This cannot be easily reversed.
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setStep("details")} disabled={submitting}>
                Back
              </Button>
              <Button onClick={handleConfirmAward} disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Awarding...
                  </>
                ) : (
                  <>
                    <Trophy className="mr-2 h-4 w-4" />
                    Confirm Award
                  </>
                )}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
