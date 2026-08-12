"use client"

import { Button } from "@/components/ui/button"
import { ArrowLeft, ArrowRight, Save, Send } from "lucide-react"

interface SubmissionNavigationProps {
  currentSection: number
  totalSections: number
  isFirstSection: boolean
  isLastSection: boolean
  isSubmitting: boolean
  isSectionValid: boolean
  onPrev: () => void
  onNext: () => void
  onSaveDraft: () => void
  onSubmit: () => void
}

export function SubmissionNavigation({ isFirstSection, isLastSection, isSubmitting, isSectionValid, onPrev, onNext, onSaveDraft, onSubmit }: SubmissionNavigationProps) {
  return (
    <div className="flex justify-between items-center mt-8">
      <Button
        variant="outline"
        onClick={onPrev}
        disabled={isFirstSection}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Previous Section
      </Button>

      <div className="flex space-x-2">
        <Button variant="outline" onClick={onSaveDraft}>
          <Save className="mr-2 h-4 w-4" />
          Save Draft
        </Button>
        
        {isLastSection ? (
          <Button onClick={onSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Submit Proposal
              </>
            )}
          </Button>
        ) : (
          <Button onClick={onNext} disabled={!isSectionValid}>
            Next Section
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )
}
