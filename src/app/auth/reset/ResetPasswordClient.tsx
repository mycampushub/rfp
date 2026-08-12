"use client"

import { Suspense, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, FileText, KeyRound } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"

export default function ResetPasswordClient() {
  return (
    <Suspense>
      <ResetPasswordContent />
    </Suspense>
  )
}

function ResetPasswordContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")

  const [email, setEmail] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) { toast.error("Email is required"); return }
    setLoading(true)
    try {
      const res = await fetch("/api/auth/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      if (res.ok) {
        setSent(true)
        toast.success("Reset link sent to your email")
      } else {
        const data = await res.json()
        toast.error(data.error || "Failed to send reset email")
      }
    } catch {
      toast.error("Failed to send reset email")
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPassword || !confirmPassword) { toast.error("All fields are required"); return }
    if (newPassword.length < 8) { toast.error("Password must be at least 8 characters"); return }
    if (newPassword !== confirmPassword) { toast.error("Passwords do not match"); return }
    if (!token) { toast.error("Invalid reset link"); return }
    setLoading(true)
    try {
      const res = await fetch("/api/auth/reset", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      })
      if (res.ok) {
        toast.success("Password reset successfully")
        router.push("/auth/signin")
      } else {
        const data = await res.json()
        toast.error(data.error || "Failed to reset password")
      }
    } catch {
      toast.error("Failed to reset password")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" />
            <span className="font-semibold">RFP Platform</span>
          </div>
          <Link
            href="/"
            className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Home
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto mb-2">
                <KeyRound className="h-10 w-10 text-primary" />
              </div>
              <CardTitle>{token ? "Set New Password" : "Reset Password"}</CardTitle>
              <CardDescription>
                {token
                  ? "Enter your new password below."
                  : sent
                    ? "Check your email for a reset link."
                    : "Enter your email and we'll send you a reset link."
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!token && !sent && (
                <form onSubmit={handleRequestReset} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@company.com"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Sending..." : "Send Reset Link"}
                  </Button>
                </form>
              )}

              {token && (
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-password">New Password</Label>
                    <Input
                      id="new-password"
                      type="password"
                      placeholder="Min 8 characters"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm Password</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      placeholder="Confirm new password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Resetting..." : "Reset Password"}
                  </Button>
                </form>
              )}

              {sent && !token && (
                <div className="text-center space-y-4">
                  <p className="text-sm text-muted-foreground">
                    If an account exists with <strong>{email}</strong>, you will receive a password reset link shortly.
                  </p>
                  <Button variant="outline" onClick={() => setSent(false)}>
                    Try a different email
                  </Button>
                </div>
              )}
            </CardContent>
            <CardFooter className="justify-center">
              <Link href="/auth/signin" className="text-sm text-primary hover:underline">
                Back to sign in
              </Link>
            </CardFooter>
          </Card>
        </div>
      </main>
    </div>
  )
}