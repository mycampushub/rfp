"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Eye, EyeOff } from "lucide-react"
import { getStatusColor } from "@/lib/status-utils"
import type { EvaluationDetail } from "./types"
import { formatDate } from "@/lib/utils"

interface EvaluationHeaderProps {
  evaluation: EvaluationDetail
  showVendorInfo: boolean
  onToggleVendorInfo: () => void
}

export function EvaluationHeader({ evaluation, showVendorInfo, onToggleVendorInfo }: EvaluationHeaderProps) {
  return (
    <div className="flex justify-between items-start">
      <div>
        <h1 className="text-2xl font-bold">{evaluation.rfpTitle}</h1>
        <div className="flex items-center space-x-4 mt-2">
          <div className="flex items-center space-x-2">
            {evaluation.isBlind && (
              <Button
                variant="outline"
                size="sm"
                onClick={onToggleVendorInfo}
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
          {evaluation.deadline ? formatDate(evaluation.deadline) : 'N/A'}
        </div>
      </div>
    </div>
  )
}
