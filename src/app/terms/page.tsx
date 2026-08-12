import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft, FileText } from "lucide-react"

export const metadata: Metadata = {
  title: "Terms of Service | RFP Platform",
  description: "Read the terms and conditions governing the use of the RFP Platform, including user responsibilities, data policies, and service agreements.",
}

export default function TermsPage() {
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
        <article className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold tracking-tight mb-8">Terms and Conditions</h1>
          <p className="text-muted-foreground mb-8">
            Last updated: January 1, 2025
          </p>

          <h2 className="text-2xl font-semibold mt-10 mb-4">1. Acceptance of Terms</h2>
          <p className="text-muted-foreground mb-4">
            By accessing or using RFP Platform, you agree to be bound by these Terms and Conditions.
            If you do not agree to these terms, you may not access or use the platform. We reserve the
            right to update these terms at any time, and continued use of the platform constitutes
            acceptance of any changes.
          </p>

          <h2 className="text-2xl font-semibold mt-10 mb-4">2. Service Description</h2>
          <p className="text-muted-foreground mb-4">
            RFP Platform provides a web-based application for creating, managing, and evaluating
            Requests for Proposals (RFPs). The platform includes tools for RFP creation, vendor
            marketplace, proposal submission, evaluation scoring, and procurement analytics. We
            reserve the right to modify, suspend, or discontinue any part of the service at any time.
          </p>

          <h2 className="text-2xl font-semibold mt-10 mb-4">3. User Accounts</h2>
          <p className="text-muted-foreground mb-4">
            You must provide accurate and complete information when creating an account. You are
            responsible for maintaining the security of your account credentials and for all activities
            that occur under your account. You must notify us immediately of any unauthorized use. We
            reserve the right to suspend or terminate accounts that violate these terms.
          </p>

          <h2 className="text-2xl font-semibold mt-10 mb-4">4. Vendor Responsibilities</h2>
          <p className="text-muted-foreground mb-4">
            Vendors are responsible for the accuracy and completeness of their proposals and profile
            information. Vendors must not submit fraudulent, misleading, or plagiarized content. By
            submitting a proposal, vendors grant the buyer a limited license to review and evaluate the
            proposal contents for the purposes of the specific RFP.
          </p>

          <h2 className="text-2xl font-semibold mt-10 mb-4">5. Intellectual Property</h2>
          <p className="text-muted-foreground mb-4">
            The RFP Platform, including its software, design, logos, and documentation, is owned by
            RFP Platform, Inc. and protected by intellectual property laws. Users retain ownership of
            the content they create and submit. By using the platform, you grant us a limited,
            non-exclusive license to process, store, and display your content solely for the purpose
            of providing the service.
          </p>

          <h2 className="text-2xl font-semibold mt-10 mb-4">6. Limitation of Liability</h2>
          <p className="text-muted-foreground mb-4">
            To the maximum extent permitted by law, RFP Platform, Inc. shall not be liable for any
            indirect, incidental, special, consequential, or punitive damages arising from your use
            of the platform. Our total liability for any claim shall not exceed the amount you paid
            to us in the twelve months preceding the claim. This limitation applies regardless of the
            legal theory on which the claim is based.
          </p>

          <h2 className="text-2xl font-semibold mt-10 mb-4">7. Governing Law</h2>
          <p className="text-muted-foreground mb-4">
            These Terms and Conditions are governed by and construed in accordance with the laws of
            the State of California, without regard to its conflict of law provisions. Any disputes
            arising from these terms or your use of the platform shall be resolved in the state or
            federal courts located in San Francisco County, California.
          </p>
        </article>
      </main>

      <footer className="border-t mt-16">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} RFP Platform. All rights reserved.
        </div>
      </footer>
    </div>
  )
}
