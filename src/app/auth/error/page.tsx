"use client"

import Link from "next/link"
import { AlertCircle, ArrowLeft } from "lucide-react"
import { useSearchParams } from "next/navigation"
import { Suspense } from "react"

function AuthErrorContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get("error") || "Unknown error"
  
  const errorMessages: Record<string, string> = {
    Configuration: "There is a problem with the server configuration.",
    AccessDenied: "You do not have permission to access this resource.",
    Verification: "The verification token has expired or been used.",
    Default: "An unexpected error occurred during authentication.",
  }
  
  const message = errorMessages[error] || errorMessages.Default
  
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="rounded-full bg-destructive/10 p-4 w-fit mx-auto">
          <AlertCircle className="h-8 w-8 text-destructive" />
        </div>
        <h1 className="text-2xl font-bold">Authentication Error</h1>
        <p className="text-muted-foreground">{message}</p>
        <p className="text-sm text-muted-foreground">Error code: {error}</p>
        <Link href="/auth/signin" className="inline-flex items-center gap-2 text-sm text-primary hover:underline">
          <ArrowLeft className="h-4 w-4" /> Back to Sign In
        </Link>
      </div>
    </div>
  )
}

export default function AuthErrorPage() {
  return (
    <Suspense>
      <AuthErrorContent />
    </Suspense>
  )
}
