"use client"

import { useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, Users, Shield, TrendingUp } from "lucide-react"

export default function Home() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "authenticated") {
      router.push("/dashboard")
    }
  }, [status, router])

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  if (status === "authenticated") {
    return null // Will redirect to dashboard
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <FileText className="h-8 w-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">RFP Platform</h1>
          </div>
          <Button asChild>
            <Link href="/auth/signin">
              Sign In
            </Link>
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Enterprise RFP Management
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            A multi-tenant, enterprise-grade platform that lets organizations create, publish, and evaluate Requests for Proposal (RFPs) with ease and security.
          </p>
          <div className="flex justify-center space-x-4">
            <Button size="lg" asChild>
              <Link href="/auth/signup">
                Get Started
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/auth/signin">
                Sign In
              </Link>
            </Button>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <Card className="text-center">
            <CardHeader>
              <FileText className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <CardTitle>RFP Creation</CardTitle>
              <CardDescription>
                Create comprehensive RFPs with rich content, sections, and evaluation criteria
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Users className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <CardTitle>Vendor Management</CardTitle>
              <CardDescription>
                Manage vendor relationships, invitations, and submissions in one place
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Shield className="h-12 w-12 text-purple-600 mx-auto mb-4" />
              <CardTitle>Security & Compliance</CardTitle>
              <CardDescription>
                Enterprise-grade security with role-based access and audit trails
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <TrendingUp className="h-12 w-12 text-orange-600 mx-auto mb-4" />
              <CardTitle>Analytics & Reporting</CardTitle>
              <CardDescription>
                Comprehensive insights and reporting on procurement performance
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="text-center bg-white rounded-lg shadow-lg p-12">
          <h3 className="text-3xl font-bold text-gray-900 mb-4">
            Ready to streamline your procurement process?
          </h3>
          <p className="text-lg text-gray-600 mb-8">
            Join thousands of organizations using our platform to manage their RFP processes efficiently.
          </p>
          <Button size="lg" asChild>
            <Link href="/auth/signup">
              Start Your Free Trial
            </Link>
          </Button>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="container mx-auto px-4 text-center">
          <p>&copy; 2024 RFP Platform. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}