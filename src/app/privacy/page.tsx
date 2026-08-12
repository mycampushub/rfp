import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft, ShieldCheck } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

export const metadata: Metadata = {
  title: "Privacy Policy | RFP Platform",
  description: "Understand how RFP Platform collects, uses, and protects your personal data. Our privacy policy covers data handling, cookies, and your rights.",
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-primary" />
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
          <h1 className="text-4xl font-bold tracking-tight mb-2">Privacy Policy</h1>
          <p className="text-muted-foreground mb-8">Last updated: July 2025</p>

          <Card>
            <CardContent className="pt-6 space-y-8">
              <section>
                <h2 className="text-xl font-semibold mb-3">1. Information Collection</h2>
                <p className="text-muted-foreground leading-relaxed">
                  We collect information you provide when creating an account, such as your name, email
                  address, organization name, and phone number. We also collect data generated through
                  your use of the platform, including RFP content, proposal submissions, evaluation
                  scores, and any files or documents you upload. Additionally, we automatically gather
                  log data such as IP address, browser type, and pages visited.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">2. Information Use</h2>
                <p className="text-muted-foreground leading-relaxed">
                  We use the information we collect to provide, maintain, and improve the RFP Platform,
                  to process transactions and send related notifications, and to respond to your
                  inquiries. We also use data to detect, prevent, and address technical issues or
                  security threats, and to communicate with you about products, services, and events
                  relevant to your account.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">3. Data Storage & Security</h2>
                <p className="text-muted-foreground leading-relaxed">
                  We implement industry-standard security measures including AES-256 encryption at rest,
                  TLS 1.3 encryption in transit, role-based access controls, and regular security audits.
                  Your data is stored in isolated tenant environments to prevent cross-tenant access. We
                  continuously monitor our systems for vulnerabilities and respond promptly to any
                  potential security incidents.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">4. Cookies</h2>
                <p className="text-muted-foreground leading-relaxed">
                  We use essential cookies to authenticate your session and maintain your preferences.
                  We may also use analytics cookies to understand how users interact with our platform
                  and improve the user experience. You can manage your cookie preferences through your
                  browser settings at any time; however, disabling essential cookies may affect the
                  functionality of the platform.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">5. Third-Party Services</h2>
                <p className="text-muted-foreground leading-relaxed">
                  We may engage third-party service providers for analytics, payment processing, email
                  delivery, and infrastructure hosting. These providers are bound by data processing
                  agreements and are only permitted to use your data as instructed by us. We do not
                  sell, rent, or trade your personal information to any third parties for their own
                  marketing purposes.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">6. Data Retention</h2>
                <p className="text-muted-foreground leading-relaxed">
                  We retain your personal information for as long as your account is active or as needed
                  to provide you with the service. When you delete your account, we will remove your
                  personal data within 30 days, except where retention is required by law or for
                  legitimate business purposes such as resolving disputes or enforcing our agreements.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">7. User Rights</h2>
                <p className="text-muted-foreground leading-relaxed">
                  You have the right to access, correct, or delete your personal information at any time
                  through your account settings. You may also request a copy of your data in a portable
                  format. To exercise any of these rights, you can contact us at privacy@rfpplatform.com,
                  and we will respond to all verified requests within 30 days.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">8. Children&apos;s Privacy</h2>
                <p className="text-muted-foreground leading-relaxed">
                  The RFP Platform is not intended for use by individuals under the age of 16. We do not
                  knowingly collect personal information from children. If we become aware that we have
                  collected data from a child under 16, we will take immediate steps to delete that
                  information. If you believe a child has provided us with personal data, please contact
                  us promptly.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">9. Changes to Policy</h2>
                <p className="text-muted-foreground leading-relaxed">
                  We may update this Privacy Policy from time to time to reflect changes in our practices
                  or for legal, operational, or regulatory reasons. We will notify registered users of
                  material changes by posting the revised policy on this page and, where appropriate,
                  sending an email notification. We encourage you to review this policy periodically.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">10. Contact</h2>
                <p className="text-muted-foreground leading-relaxed">
                  If you have any questions or concerns about this Privacy Policy or our data practices,
                  please contact us at:
                </p>
                <div className="text-muted-foreground mt-2">
                  <p>RFP Platform, Inc.</p>
                  <p>100 Market Street, Suite 400</p>
                  <p>San Francisco, CA 94105</p>
                  <p>Email: privacy@rfpplatform.com</p>
                </div>
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