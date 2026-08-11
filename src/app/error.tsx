"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("[GlobalErrorBoundary]", error)
  }, [error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-4">
      <div className="rounded-full bg-destructive/10 p-6">
        <AlertTriangle className="h-10 w-10 text-destructive" />
      </div>
      <div className="text-center max-w-md">
        <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
        <p className="text-sm text-muted-foreground mb-6">
          {error.message || "An unexpected error occurred. Please try again."}
        </p>
        <div className="flex gap-3 justify-center">
          <Button variant="outline" onClick={() => (window.location.href = "/")}>
            Go Home
          </Button>
          <Button onClick={reset}>Try Again</Button>
        </div>
      </div>
    </div>
  )
}
