import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft, FileText } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

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
            href="/auth/signup"
            className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Sign Up
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <article className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold tracking-tight mb-2">Terms and Conditions</h1>
          <p className="text-muted-foreground mb-8">Last updated: July 2025</p>

          <Card>
            <CardContent className="pt-6 space-y-8">
              <section>
                <h2 className="text-xl font-semibold mb-3">1. Acceptance of Terms</h2>
                <p className="text-muted-foreground leading-relaxed">
                  By accessing or using the RFP Platform, you acknowledge that you have read, understood,
                  and agree to be bound by these Terms and Conditions. If you do not agree with any part
                  of these terms, you must discontinue use of the platform immediately. Your continued use
                  of the service following any changes constitutes acceptance of those changes.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">2. Description of Service</h2>
                <p className="text-muted-foreground leading-relaxed">
                  The RFP Platform provides a comprehensive web-based solution for creating, managing, and
                  evaluating Requests for Proposals. The service includes tools for RFP authoring, vendor
                  marketplace management, proposal submission and scoring, and procurement analytics. We
                  reserve the right to modify or discontinue any feature of the service with reasonable
                  notice to our users.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">3. User Accounts</h2>
                <p className="text-muted-foreground leading-relaxed">
                  To access the full functionality of the platform, you must create an account using
                  accurate and complete information. You are solely responsible for safeguarding your
                  login credentials and for all activities that occur under your account. You must
                  promptly notify us of any unauthorized access or use of your account.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">4. User Content</h2>
                <p className="text-muted-foreground leading-relaxed">
                  You retain ownership of all content you submit to the platform, including RFPs,
                  proposals, and evaluation scores. By submitting content, you grant us a limited,
                  non-exclusive license to process, store, and display that content solely for the
                  purpose of providing the service. You represent that your content does not infringe
                  upon the rights of any third party.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">5. Intellectual Property</h2>
                <p className="text-muted-foreground leading-relaxed">
                  The RFP Platform, including its software, design, logos, and documentation, is the
                  exclusive property of RFP Platform, Inc. and is protected by applicable intellectual
                  property laws. You may not reproduce, distribute, or create derivative works from any
                  part of the platform without our prior written consent.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">6. Limitation of Liability</h2>
                <p className="text-muted-foreground leading-relaxed">
                  To the maximum extent permitted by applicable law, RFP Platform, Inc. shall not be
                  liable for any indirect, incidental, special, consequential, or punitive damages
                  arising from your use of or inability to use the platform. Our total aggregate
                  liability for any claims shall not exceed the fees you paid to us in the twelve months
                  preceding the event giving rise to the claim.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">7. Privacy</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Your privacy is important to us. Our collection and use of personal information is
                  governed by our{" "}
                  <Link href="/privacy" className="text-sky-600 dark:text-sky-400 hover:underline">
                    Privacy Policy
                  </Link>
                  , which is incorporated into these Terms by reference. By using the platform, you
                  consent to the data practices described in the Privacy Policy.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">8. Changes to Terms</h2>
                <p className="text-muted-foreground leading-relaxed">
                  We reserve the right to update or modify these Terms at any time at our sole
                  discretion. We will notify registered users of material changes by posting the updated
                  terms on this page and, where appropriate, by sending an email notification. Your
                  continued use of the platform after any such changes constitutes your acceptance of
                  the revised Terms.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">9. Contact</h2>
                <p className="text-muted-foreground leading-relaxed">
                  If you have any questions or concerns about these Terms and Conditions, please contact
                  us at legal@rfpplatform.com or write to us at RFP Platform, Inc., 100 Market Street,
                  Suite 400, San Francisco, CA 94105.
                </p>
              </section>
            </CardContent>
          </Card>
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
