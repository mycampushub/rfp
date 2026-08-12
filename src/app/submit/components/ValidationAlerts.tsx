"use client"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, AlertTriangle } from "lucide-react"
import type { ValidationRule } from "./types"

interface ValidationAlertsProps {
  isSectionValid: boolean
  realTimeValidation: Record<string, string>
  validationErrors: ValidationRule[]
}

export function ValidationAlerts({ isSectionValid, realTimeValidation, validationErrors }: ValidationAlertsProps) {
  return (
    <>
      {!isSectionValid && (
        <Alert className="mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Please answer all required questions before proceeding.
          </AlertDescription>
        </Alert>
      )}

      {Object.keys(realTimeValidation).length > 0 && (
        <Alert className="mt-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1">
              <strong>Please review the following issues:</strong>
              {Object.entries(realTimeValidation).map(([field, error]) => (
                <p key={field} className="text-sm">• {error}</p>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {validationErrors.length > 0 && (
        <Alert className="mt-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1">
              <strong>System warnings:</strong>
              {validationErrors.map((error) => (
                <p key={error.id} className="text-sm">• {error.message}</p>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}
    </>
  )
}
