"use client"

import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="p-6">
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <AlertTriangle className="h-12 w-12 text-destructive" />
        <h2 className="text-2xl font-bold">Dashboard Error</h2>
        <p className="text-muted-foreground text-center max-w-md">
          {error.message || "Failed to load dashboard data."}
        </p>
        <Button onClick={reset}>Reload Dashboard</Button>
      </div>
    </div>
  )
}