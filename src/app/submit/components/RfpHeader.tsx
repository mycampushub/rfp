"use client"

import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { formatDate } from "@/lib/utils"
import type { RFP } from "./types"

interface RfpHeaderProps {
  rfp: RFP
  getProgress: () => number
}

export function RfpHeader({ rfp, getProgress }: RfpHeaderProps) {
  return (
    <div className="mb-8">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h1 className="text-2xl font-bold">{rfp.title}</h1>
          <p className="text-muted-foreground">{rfp.description}</p>
          <div className="flex items-center space-x-4 mt-2">
            <Badge variant="outline">{rfp.category}</Badge>
            {rfp.budget && <Badge variant="outline">{rfp.budget}</Badge>}
            {rfp.timeline?.submissionDeadline && (
              <Badge variant="destructive">
                Deadline: {formatDate(rfp.timeline.submissionDeadline)}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Progress</span>
          <span>{Math.round(getProgress())}% complete</span>
        </div>
        <Progress value={getProgress()} className="h-2" />
      </div>
    </div>
  )
}
